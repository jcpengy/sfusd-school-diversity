# Data notes

## Reused map files

- `schools.geojson` contains school points and 14-digit CDS codes.
- `neighborhoods.geojson` contains contextual neighborhood polygons; these are not SFUSD assignment boundaries.

## Planned derived file

`npm run data` creates `public/data/school-comparisons.json` by joining CDE school records on CDS code and assigning Census geographies to attendance areas by their internal points. It retains:

- total enrollment;
- race/ethnicity counts and percentages;
- socioeconomically disadvantaged count and percentage;
- a nearby resident race/ethnicity scenario;
- current socioeconomically disadvantaged enrollment;
- a nearby block-group low-income indicator;
- source year and suppression flags.

Downloaded source files stay in ignored `data/raw/`; the processed comparison file is committed. Sources include CDE Dashboard enrollment, DataSF's ACS demographic estimates, and SFDPH's Flood Health Vulnerability indicators.
