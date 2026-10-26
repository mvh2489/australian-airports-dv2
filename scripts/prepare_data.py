"""Prepare the small, traceable datasets used by this static website.

The published BITRE tables are retained in source/ as retrieved text extracts.
Pass --locations and --boundaries for the original downloaded geography files.
This is preparation code only; no Python runs on GitHub Pages.
"""
import argparse
import csv
import json
import re
from collections import defaultdict
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'data'

AIRPORT_CODES = {
    'Sydney': 'SYD', 'Melbourne': 'MEL', 'Brisbane': 'BNE', 'Perth': 'PER',
    'Adelaide': 'ADL', 'Gold Coast': 'OOL', 'Cairns': 'CNS', 'Hobart': 'HBA',
    'Canberra': 'CBR', 'Sunshine Coast': 'MCY', 'Townsville': 'TSV',
    'Darwin': 'DRW', 'Launceston': 'LST', 'Newcastle': 'NTL', 'Mackay': 'MKY',
    'Karratha': 'KTA', 'Rockhampton': 'ROK', 'Ballina': 'BNK', 'Proserpine': 'PPP',
    'Port Hedland': 'PHE', 'Hamilton Island': 'HTI', 'Broome': 'BME', 'Newman': 'ZNE',
    'Kalgoorlie': 'KGI', 'Alice Springs': 'ASP', 'Ayers Rock': 'AYQ',
    'Coffs Harbour': 'CFS', 'Mount Isa': 'ISA', 'Hervey Bay': 'HVB',
    'Paraburdoo': 'PBO', 'Albury': 'ABX', 'Wagga Wagga': 'WGA', 'Dubbo': 'DBO',
    'Gladstone': 'GLT', 'Port Macquarie': 'PQQ', 'Emerald': 'EMD', 'Mildura': 'MQL',
    'Port Lincoln': 'PLO', 'Tamworth': 'TMW', 'Devonport': 'DPO', 'Bundaberg': 'BDB',
    'Kununurra': 'KNX', 'Orange': 'OAG', 'Geraldton': 'GET',
    'Thursday Island': 'HID', 'Armidale': 'ARM', 'Olympic Dam': 'OLP',
    'Weipa': 'WEI', 'Learmonth': 'LEA', 'Busselton': 'BQB', 'Moranbah': 'MOV',
    'Gove': 'GOV', 'Burnie': 'BWT', 'Merimbula': 'MIM', 'Griffith': 'GFF',
    'Mount Gambier': 'MGB', 'Albany': 'ALH', 'Roma': 'RMA',
}
STATES = ['NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'NT', 'ACT']
STATE_NAMES = dict(zip(STATES, ['New South Wales', 'Victoria', 'Queensland',
    'South Australia', 'Western Australia', 'Tasmania', 'Northern Territory',
    'Australian Capital Territory']))
MAJOR = ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Gold Coast',
         'Cairns', 'Canberra', 'Darwin', 'Hobart', 'Townsville']
REPORT_URL = 'https://www.bitre.gov.au/sites/default/files/documents/Domestic%20Aviation%20Activity%202025-26.pdf'
YEARBOOK_URL = 'https://www.bitre.gov.au/sites/default/files/documents/bitre-yearbook-2025.pdf'


def write_json(name, value):
    (DATA / name).write_text(json.dumps(value, ensure_ascii=False, separators=(',', ':')) + '\n')


def lines(pattern):
    found = {}
    for path in sorted((ROOT / 'source').glob(pattern)):
        for line in path.read_text().splitlines():
            match = re.match(r'L(\d+)@P[\d-]+: (.*)', line)
            if match:
                number, value = int(match[1]), match[2]
                if number in found:
                    assert found[number] == value, (number, found[number], value)
                found[number] = value
    return found


def parse_port(line):
    # The regional table uses spaces within thousands, not commas.
    match = re.match(r'^\d+ (.+?) ([\d ,]+\.\d) ([\d ,]+\.\d) (-?[\d.]+)', line)
    if not match:
        return None
    clean = lambda x: float(x.replace(',', '').replace(' ', ''))
    return match[1], int(round(clean(match[2]) * 1000)), int(round(clean(match[3]) * 1000))


def route_table(raw, start, end, multiplier):
    results = {}
    for line_number in range(start, end + 1):
        line = raw.get(line_number, '')
        match = re.match(r'^\d+ (.+?) - (.+?) ([\d,.]+) ([\d,.]+) (-?[\d.]+)', line)
        if match:
            key = (match[1], match[2])
            results[key] = [float(match[3].replace(',', '')) * multiplier,
                            float(match[4].replace(',', '')) * multiplier]
    assert len(results) == 62, (start, len(results))
    return results


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--locations', required=True)
    parser.add_argument('--boundaries', required=True)
    args = parser.parse_args()
    DATA.mkdir(exist_ok=True)
    raw = lines('report-*-extract.txt')
    yearbook = lines('yearbook-*-extract.txt')
    ports = {}
    for n in list(range(494, 504)) + list(range(1121, 1171)):
        port = parse_port(raw[n])
        assert port, (n, raw[n])
        name, p25, p26 = port
        if name in ports:
            assert ports[name] == (p25, p26)
        ports[name] = (p25, p26)
    assert len(ports) == 58

    location_rows = list(csv.DictReader(Path(args.locations).open()))
    australian = {x['iata_code']: x for x in location_rows
                  if x['iso_country'] == 'AU' and x['iata_code']}
    locations = {}
    for name in ports:
        item = australian[AIRPORT_CODES[name]]
        state = item['iso_region'].split('-')[-1]
        assert state in STATES, (name, state)
        locations[name] = {'airport': name, 'iata': AIRPORT_CODES[name],
            'state': state, 'lat': round(float(item['latitude_deg']), 5),
            'lon': round(float(item['longitude_deg']), 5),
            'location_name': item['name'], 'ident': item['ident']}
    # BITRE's Thursday Island port is plotted at its serving airport on Horn Island.
    # Burnie is plotted at Wynyard Airport, not the disused Burnie airstrip.
    write_json('locations.json', list(locations.values()))

    airports = []
    totals = {2025: 118912600, 2026: 121506300}
    for name, pair in ports.items():
        change = pair[1] / pair[0] - 1
        for year, passengers in zip([2025, 2026], pair):
            airports.append({**locations[name], 'year': year, 'fy': f'{year-1}-{str(year)[-2:]}',
                'passengers': passengers, 'change': change,
                'national_share': passengers / totals[year]})
    for year in [2025, 2026]:
        ranked = sorted([x for x in airports if x['year'] == year], key=lambda x: -x['passengers'])
        for rank, item in enumerate(ranked, 1):
            item['rank'] = rank
    write_json('airports.json', airports)

    population_file = ROOT / 'source' / 'ABS_population_March2026.xlsx'
    population = pd.read_excel(population_file, sheet_name='Data1', header=None)
    population_row = population[population[0] == pd.Timestamp('2025-12-01')].iloc[0]
    state_traffic = []
    waterfall = []
    running = 0
    for order, (state, col) in enumerate(zip(STATES, range(19, 27))):
        p25 = sum(x['passengers'] for x in airports if x['year'] == 2025 and x['state'] == state)
        p26 = sum(x['passengers'] for x in airports if x['year'] == 2026 and x['state'] == state)
        resident_population = int(population_row[col])
        delta = p26 - p25
        state_traffic.append({'state': state, 'state_name': STATE_NAMES[state],
            'passengers_2025': p25, 'passengers': p26, 'population': resident_population,
            'per_resident': p26 / resident_population, 'change': p26 / p25 - 1,
            'airport_count': sum(x['state'] == state for x in locations.values())})
        waterfall.append({'state': state, 'order': order, 'start': running,
            'end': running + delta, 'change': delta, 'kind': 'Increase' if delta >= 0 else 'Decrease'})
        running += delta
    other_change = totals[2026] - totals[2025] - running
    waterfall.append({'state': 'Other airports', 'order': 8, 'start': running,
        'end': running + other_change, 'change': other_change,
        'kind': 'Increase' if other_change >= 0 else 'Decrease'})
    waterfall.append({'state': 'Total change', 'order': 9, 'start': 0,
        'end': totals[2026] - totals[2025], 'change': totals[2026] - totals[2025], 'kind': 'Total'})
    write_json('state_traffic.json', state_traffic)
    write_json('waterfall.json', waterfall)

    passengers = route_table(raw, 208, 273, 1000)
    seats = route_table(raw, 279, 344, 1000)
    flights = route_table(raw, 421, 486, 1)
    load_factors = route_table(raw, 350, 415, 0.01)
    routes = []
    for (origin, destination), values in passengers.items():
        a, b = locations[origin], locations[destination]
        for i, year in enumerate([2025, 2026]):
            routes.append({'origin': origin, 'destination': destination,
                'route': f'{origin} - {destination}', 'origin_iata': a['iata'], 'destination_iata': b['iata'],
                'year': year, 'fy': f'{year-1}-{str(year)[-2:]}',
                'passengers': int(round(values[i])), 'seats': int(round(seats[(origin, destination)][i])),
                'flights': int(flights[(origin, destination)][i]), 'load_factor': load_factors[(origin, destination)][i],
                'change': values[1] / values[0] - 1,
                'geometry': {'type': 'LineString', 'coordinates': [[a['lon'], a['lat']], [b['lon'], b['lat']]]}})
    for year in [2025, 2026]:
        for rank, route in enumerate(sorted([x for x in routes if x['year'] == year], key=lambda x: -x['passengers']), 1):
            route['rank'] = rank
    write_json('routes.json', routes)

    hubs = ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Gold Coast',
            'Cairns', 'Canberra', 'Hobart', 'Darwin', 'Launceston', 'Townsville']
    matrix = []
    lookup = {frozenset([x['origin'], x['destination']]): x for x in routes if x['year'] == 2026}
    for a in hubs:
        for b in hubs:
            entry = lookup.get(frozenset([a, b])) if a != b else None
            matrix.append({'origin': a, 'destination': b, 'origin_iata': locations[a]['iata'],
                'destination_iata': locations[b]['iata'], 'passengers': entry['passengers'] if entry else None,
                'status': 'Same airport' if a == b else 'Published route' if entry else 'Not in the published top-route subset'})
    write_json('matrix.json', matrix)

    hist = []
    for n in range(6636, 6647):
        match = re.match(r'(\d{4})–(\d{2}) (.*)', yearbook[n])
        assert match
        year = int(match[1]) + 1
        values = re.findall(r'\d{1,3}(?: \d{3})*', match[3])
        if year == 2021:
            # The extracted text loses column boundaries beside three-digit cells.
            # These 11 values are transcribed from Table 6.3a, printed page 140.
            values = ['7804', '6106', '7535', '3262', '2751', '2002',
                      '2083', '1045', '909', '1040', '982']
        assert len(values) == 11, (n, values)
        for airport, value in zip(MAJOR, values):
            hist.append({'airport': airport, 'year': year, 'fy': f'{year-1}-{str(year)[-2:]}',
                'passengers': int(value.replace(' ', '')) * 1000})
    history_lookup = {(x['airport'], x['year']): x for x in hist}
    for n in range(6684, 6695):
        match = re.match(r'(\d{4})–(\d{2}) (.*)', yearbook[n])
        year = int(match[1]) + 1
        # All eleven movement counts in these rows have one thousands group.
        values = re.findall(r'\d{1,3} \d{3}', match[3])
        assert len(values) == 11, (n, values)
        for airport, value in zip(MAJOR, values):
            item = history_lookup[(airport, year)]
            item['movements'] = int(value.replace(' ', ''))
            item['index'] = item['passengers'] / history_lookup[(airport, 2019)]['passengers']
    write_json('airport_history.json', hist)
    recovery = []
    for airport in MAJOR:
        old, new = history_lookup[(airport, 2019)], history_lookup[(airport, 2025)]
        recovery.append({'airport': airport, 'passengers_2019': old['passengers'],
            'passengers_2025': new['passengers'], 'change': new['passengers'] / old['passengers'] - 1,
            'movements_2019': old['movements'], 'movements_2025': new['movements']})
    write_json('recovery.json', recovery)

    # A national trip is counted once, unlike the two airport movements it produces.
    national = []
    for kind, start, end in [('Domestic', 6587, 6597), ('International', 6519, 6529)]:
        for n in range(start, end + 1):
            match = re.match(r'(\d{4})–(\d{2}) (.*)', yearbook[n])
            year = int(match[1]) + 1
            values = re.findall(r'\d{1,3}(?: \d{3})*(?:\.\d+)?', match[3])
            flights_value, passengers_value = [int(v.replace(' ', '')) for v in values[:2]]
            national.append({'type': kind, 'year': year, 'fy': f'{year-1}-{str(year)[-2:]}',
                'passengers': passengers_value, 'flights': flights_value})
    # FY2025 domestic totals were revised in the FY2026 report.
    next(x for x in national if x['type'] == 'Domestic' and x['year'] == 2025)['passengers'] = 59456300
    next(x for x in national if x['type'] == 'Domestic' and x['year'] == 2025)['flights'] = 601016
    national.append({'type': 'Domestic', 'year': 2026, 'fy': '2025-26',
        'passengers': 60753200, 'flights': 602870})
    write_json('national.json', national)

    tree = [{'id': 'root', 'parent': None, 'name': 'Selected airports', 'passengers': 0}]
    for state in STATES:
        tree.append({'id': state, 'parent': 'root', 'name': state, 'passengers': 0, 'state': state})
    for item in airports:
        if item['year'] == 2026:
            tree.append({'id': item['iata'], 'parent': item['state'], 'name': item['airport'],
                'passengers': item['passengers'], 'state': item['state'],
                'share': item['passengers'] / sum(x['passengers'] for x in airports if x['year'] == 2026)})
    write_json('treemap.json', tree)

    boundaries = json.loads(Path(args.boundaries).read_text())
    features = []
    def compact_coords(item):
        if isinstance(item, (float, int)):
            return round(item, 4)
        return [compact_coords(x) for x in item]
    for feature in boundaries['features']:
        props = feature['properties']
        if props.get('admin') == 'Australia' and props.get('name') in STATE_NAMES.values():
            state = next(k for k, v in STATE_NAMES.items() if v == props['name'])
            features.append({'type': 'Feature', 'properties': {'state': state, 'name': props['name']},
                'geometry': {'type': feature['geometry']['type'], 'coordinates': compact_coords(feature['geometry']['coordinates'])}})
    assert len(features) == 8
    write_json('australia.geojson', {'type': 'FeatureCollection', 'features': features})

    # Retain small raw crosswalks. Do not include the global 12 MB airport file.
    with (ROOT / 'source' / 'airport_location_crosswalk.csv').open('w') as out:
        writer = csv.DictWriter(out, fieldnames=list(next(iter(locations.values())).keys()))
        writer.writeheader()
        writer.writerows(locations.values())
    summary = {'airports': len(ports), 'routes': len(passengers),
        'coverage_2026': sum(x['passengers'] for x in airports if x['year'] == 2026) / totals[2026],
        'national_airport_movements_2026': totals[2026],
        'top_three_share': sum(x['passengers'] for x in airports if x['year'] == 2026 and x['rank'] <= 3) / totals[2026],
        'map_data_bytes': sum(p.stat().st_size for p in DATA.iterdir()),
        'population_date': '31 December 2025', 'date_prepared': '14 October 2026'}
    write_json('summary.json', summary)
    print(json.dumps(summary, indent=2))
    print('Per-resident figures:', [(x['state'], round(x['per_resident'], 2)) for x in state_traffic])
    print('Waterfall:', [(x['state'], x['change']) for x in waterfall])


if __name__ == '__main__':
    main()
