# All 13 charts: questions, data and encodings

The page follows four chapters: the airport network, disruption/recovery, regional context, then connections. Passenger movements count an arrival or departure at an airport; a passenger trip counts one flight stage. They are not unique-person counts.

| Reading order | Chart | What it explains | Data and main encoding | Classification |
| --- | --- | --- | --- | --- |
| 1 | Proportional-symbol airport map | Where is domestic passenger activity concentrated? | 58 selected airports, 2024–25/2025–26; geographic position locates airports and circle area shows movements. Year selector and tooltips. | Advanced map |
| 2 | Lollipop airport ranking | How large are the busiest airports relative to each other? | Top 12 selected airports in 2025–26; dot position and stems from zero show domestic movements. | Advanced |
| 3 | Airport treemap | How is traffic divided between airports within states? | Selected airports in 2025–26; nested rectangle area shows movements, with state grouping/colour. Shares refer to the selected subset. | Advanced |
| 4 | National multi-line time series | How did domestic and international travel change through the pandemic? | National passenger trips, 2014–15 to 2024–25; position over time and colour distinguish service types. Pandemic shading supplies context. | Basic |
| 5 | Recovery heatmap | Which airports recovered to their own pre-pandemic volume? | Eleven major airports, 2014–15 to 2024–25; colour luminance shows combined domestic/international movements divided by each airport's 2018–19 value. | Advanced |
| 6 | Connected-dot/dumbbell comparison | How large is the absolute gap between pre-pandemic and recent traffic? | Eleven major airports, 2018–19 versus 2024–25; paired point position shows combined movements, linked by a line. | Advanced |
| 7 | Bump chart | Did the disruption change the airport hierarchy? | Passenger ranks within eleven airports, 2018–19 to 2024–25; vertical position shows rank and connecting lines track airports. Highlight selector. | Advanced |
| 8 | Population-normalised choropleth | Which states have high airport activity relative to population? | Selected-airport domestic movements in 2025–26 divided by ABS December 2025 population; sequential colour luminance shows movements per resident. | Advanced map |
| 9 | Waterfall | Which states contributed to national domestic growth? | Changes from 2024–25 to 2025–26; floating rectangles accumulate state contributions. A residual for other airports reconciles the national total. | Advanced |
| 10 | Two-way route flow map | Which airports are connected, and how busy are those links? | 62 published competitive routes, 2025–26; geographic lines show connections and width shows combined two-way trips. Paired arrows mean connectivity, not directional passenger totals. Hub, route limit and arrow controls. | Advanced map |
| 11 | Route adjacency matrix | Which links are strongest without overlapping geographic lines? | Twelve hubs within the published route subset; row/column position identifies airport pairs and log-scaled luminance shows trips. Missing subset coverage is grey, not zero. | Advanced heatmap family |
| 12 | Aircraft/passenger scatterplot | How do passenger numbers relate to aircraft activity? | 62 routes, 2025–26; x-position shows aircraft trips, y-position passenger trips. Aircraft trips include scheduled cargo, so this is not an occupancy calculation. | Basic |
| 13 | Seat-utilisation stacked bars | How much seating capacity was used on the busiest routes? | Twelve busiest routes, 2025–26; stacked segment length shows occupied and unoccupied shares. | Basic |

Conservative count: **13 panels and nine distinct advanced idioms**, treating the two heatmap variants as one idiom family. Even treating those panels as a single chart would leave 12 charts. Three maps use genuinely different idioms. Numeric thresholds are only one part of assessment.

BITRE provides the aviation statistics, ABS provides population, and OurAirports/Natural Earth provide geography. Raw-source extracts and the ABS workbook are in `source/`; prepared chart data are in `data/`. See DATA_NOTES.md for dates, scope, source URLs, transformations and limitations.
