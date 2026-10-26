# Data notes

Prepared 14 October 2026. This document distinguishes the units and coverage of the datasets. Do not silently combine domestic-only and domestic-plus-international airport values.

## Primary sources

| Dataset | Source and location | Coverage used |
| --- | --- | --- |
| Domestic airport passenger activity | BITRE, Domestic Aviation Activity 2025–26, Tables 5 and 7, printed pages 11 and 23 | Financial years 2024–25 and 2025–26, 58 distinct airports |
| Domestic routes | Same report, Tables 1–4, printed pages 3–10 | 62 published competitive routes, two financial years |
| National domestic and international trips | BITRE, Australian Infrastructure and Transport Statistics Yearbook 2025, Tables 6.1–6.2, printed pages 138–139 | 2014–15 to 2024–25; domestic 2024–25 revised to the newer annual report |
| Historical major-airport passengers and aircraft movements | Same Yearbook, Tables 6.3a–6.3b, printed pages 140–141 | 11 airports, 2014–15 to 2024–25; domestic and international combined |
| Population | ABS, National, State and Territory Population, March 2026 release, Table 4, Data1 sheet | Persons in each state/territory, 31 December 2025 |
| Airport locations | OurAirports original airports.csv | IATA-code crosswalk for the selected airports |
| Boundaries | Natural Earth, 1:50 million Admin 1 states/provinces | Eight Australian states/territories, rounded coordinates |

Statistics are governmental. The two supporting geographic datasets are public-domain community/cartographic datasets, not government passenger statistics. ABS is a genuinely separate statistical source and is used in the choropleth calculation.

## Definitions

- **Passenger movement:** one passenger arrival or departure at an airport. A Melbourne–Sydney flight leg produces one airport movement at each end. The national domestic airport-movement total is therefore approximately twice the domestic passenger-trip total, with rounding differences.
- **Passenger trip:** one passenger travelling on one flight stage. Counts are not unique people. A person travelling repeatedly appears repeatedly.
- **Aircraft trip:** a flight stage. A return flight counts as two trips. The published route aircraft-trip counts include RPT cargo flights.
- **Aircraft movement:** an aircraft arrival or departure at an airport. Do not relabel route aircraft trips as airport movements.
- **RPT:** Regular Public Transport, scheduled services available to the public. It excludes charter and other non-scheduled operations.
- **Seat utilisation:** the published route load factor. BITRE defines load factor using revenue passenger kilometres divided by available seat kilometres. For an ordinary direct city pair with a common distance this closely matches passengers/seats.
- **Financial year:** 1 July to 30 June. The year field is the year in which the financial year ends. For example, `year: 2026` means 2025–26, not calendar 2026.

## Transformations

1. Extract published numerical tables; preserve source excerpts for traceability.
2. Convert tables labelled `(000s)` into counts by multiplying by 1,000. Thus one decimal place in a published source can imply precision only to the nearest 100, not an exact unrounded individual count.
3. Deduplicate the overlap between the top-ten and top-fifty-regional airport tables. Cairns and Hobart appear in both, leaving **58 distinct airports**, not 60.
4. Match airport names to verified OurAirports IATA entries. Extract airport latitude, longitude and state. Thursday Island uses Horn Island (HID), its serving airport; Burnie uses Wynyard (BWT). The crosswalk is saved in `source/airport_location_crosswalk.csv`.
5. Keep the same 58-airport subset in both recent years. Do not claim to cover every Australian airport or airfield.
6. Compute airport growth as `(2026 movements / 2025 movements) - 1`.
7. Compute national share as `airport movements / BITRE national domestic airport movements`, not as a share of the selected airports. The treemap is explicitly different: its shares use the selected-airport subtotal.
8. Sum the selected airports by state, then divide by the ABS December 2025 population. This approximates the midpoint population of the financial year 2025–26. The result is **airport activity relative to population**, not resident flying frequency.
9. For the historical heatmap, divide each airport's combined passenger movements by its own 2018–19 figure. Values above 100% mean more traffic than that baseline. The colour domain is capped at 130%; the actual values remain in tooltips.
10. Build route geometry from the actual airport coordinates. LineString connections illustrate geographic links, not tracked flight paths. `scripts/build_specs.mjs` derives paired arrow positions along great-circle links and projects their local tangents to orient the arrowheads. Both arrows indicate two-way connectivity only; passenger volumes combine both directions and are not split or duplicated in the totals. `data/route_arrows.json` preserves all published route values.
11. Build a symmetric adjacency matrix for 12 hubs. Blank/grey cells are genuinely unavailable in the published top-route subset. They are **not converted to zero** and do not imply the absence of airline service.
12. Reconcile the waterfall to the national change. “Other airports” is the difference between the national total change and the changes at the 58 selected airports.
13. For the bump chart, rank the eleven historical airports within each financial year by combined domestic and international passenger movements. Plot ranks for 2018–19 through 2024–25. The comparison is explicitly within those eleven airports, not an all-airport national rank; the values remain in the tooltips.

## Coverage and checks

- 116 recent airport rows = 58 airports × 2 years.
- 124 route rows = 62 routes × 2 years.
- 121 historical airport rows = 11 airports × 11 years.
- Eight valid state/territory population joins. All charted airport coordinates are within Australia.
- Selected 2025–26 airport movements sum to **119,231,300**. The national domestic total is **121,506,300**. Selected-airport coverage is **98.1277%**.
- Sydney + Melbourne + Brisbane = **67,860,700** domestic movements in 2025–26, or **55.8495%** of the national total.
- The waterfall totals **2,593,700** additional airport movements. The selected-airport changes account for **2,591,500**; the residual is **2,200**.
- ABS December 2025 population is taken from the more recent March 2026 release, not the earlier December release, to preserve available revisions.
- The latest annual report revises domestic 2024–25 passenger trips from the Yearbook's 59,504,545 to **59,456,300** (published in thousands). The national time series uses this newer figure. Historical airport tables retain their published Yearbook values and rounding, rather than inventing revisions.
- One published source inconsistency is retained: Brisbane–Emerald, 2025–26, has published passenger/seat totals implying about **64.7%**, while Table 3 gives **65.1%**. The draft retains the published load factor, documents the difference, and does not include this route in the top-12 seating chart. Do not silently alter source data to make it fit.

## Limits to interpretation

The maps cover selected scheduled passenger airports, not the complete physical-airport network. They do not show land area, runway capacity or terminal size. Passenger volume is used as the measure of activity/size.

The state rates include incoming visitors, returning residents and connections. Airports serve catchments that can cross state boundaries. The ACT example is particularly sensitive to its small population and broader regional catchment.

Airport volume and route volume use different counting units. International comparisons are available through 2024–25 in the Yearbook data used here, while the recent domestic map and routes extend through 2025–26. These periods are explicitly labelled rather than silently blended.

The BITRE annual source index was rechecked on 24 October 2026: the latest financial-year airport workbook is listed through 2024–25, while the newer domestic annual report covers 2025–26. Downloading the complete airport workbook returned HTTP 503 in this environment. Historical comparisons therefore retain the public Yearbook 2025 tables through 2024–25; current domestic charts use the newer 2025–26 report. No missing values are estimated. Cross-check the complete workbook if it becomes accessible; the data periods are stated explicitly on the page.

## Reproducing preparation

`scripts/prepare_data.py` requires Python with pandas and an Excel-reading engine, plus the original OurAirports airports.csv and Natural Earth states/provinces GeoJSON. The small source report extracts and ABS workbook are included.

Run from the project directory:

```bash
python scripts/prepare_data.py --locations /path/to/airports.csv --boundaries /path/to/ne_50m_admin_1_states_provinces.geojson
node scripts/build_specs.mjs
node scripts/build_preview.mjs
```

You do not need these commands to view, edit narrative text or publish the supplied site.

Primary URLs:

- https://www.bitre.gov.au/sites/default/files/documents/Domestic%20Aviation%20Activity%202025-26.pdf
- https://www.bitre.gov.au/sites/default/files/documents/bitre-yearbook-2025.pdf
- https://www.abs.gov.au/statistics/people/population/national-state-and-territory-population/mar-2026/310104.xlsx
- https://raw.githubusercontent.com/davidmegginson/ourairports-data/main/airports.csv
- https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_1_states_provinces.geojson
