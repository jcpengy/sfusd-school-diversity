# Data notes

## Reused map files

- `schools.geojson` contains school points and 14-digit CDS codes.
- `neighborhoods.geojson` contains contextual neighborhood polygons; these are not SFUSD assignment boundaries.

## Planned derived file

Create `school_demographics.json` by filtering the latest California Department of Education school-level enrollment and FRPM files to SFUSD elementary schools, joining on CDS code, and retaining:

- total enrollment;
- race/ethnicity counts and percentages;
- socioeconomically disadvantaged count and percentage;
- FRPM-eligible count and percentage;
- English learner count and percentage;
- source year and suppression flags.

Keep downloaded source files out of the repository unless their redistribution terms and file sizes have been reviewed. Record source URLs, retrieval dates, and transformations in a reproducible script.
