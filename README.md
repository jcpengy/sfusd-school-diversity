# SFUSD School Diversity

An interactive data project exploring how SFUSD elementary-school assignment scenarios could change racial and socioeconomic diversity across schools.

## Research question

How does the composition of current school enrollment compare with the composition we might expect under a neighborhood-based assignment system?

Until SFUSD publishes final boundaries, future results must be labeled as modeled scenarios—not predictions or official assignments.

## Data included

- `data/schools.geojson`: SFUSD elementary-school locations, reused from `sfusd-graphic`
- `data/neighborhoods.geojson`: San Francisco neighborhood polygons, reused from `sfusd-graphic`

## Recommended current-enrollment sources

Join state files to the schools layer with the 14-digit County-District-School (`CDS`) code.

1. **Race, ethnicity, and student groups:** California Department of Education Dashboard Census Enrollment files. These include state, district, school, and student-group records, including race/ethnicity and the Socioeconomically Disadvantaged group.
   - https://www.cde.ca.gov/ta/ac/cm/censenrolldatafiles.asp
2. **Student poverty:** California Department of Education Free or Reduced-Price Meal (FRPM) school-level files. Use the official Census Day FRPM counts rather than the LCFF-only FRPM fields in the UPC file.
   - https://www.cde.ca.gov/ds/ad/filessp.asp
3. **Definitions and validation:** CDE Annual Enrollment documentation and school-level DataQuest reports.
   - https://www.cde.ca.gov/ds/ad/edtop.asp

The 2025–26 files are the best match for the current schools layer. Preserve CDE suppression values rather than treating them as zero.

## Still needed for a future scenario

Current school demographics alone cannot estimate a neighborhood-assignment outcome. A defensible model also needs:

- official proposed attendance boundaries, or a published and reproducible boundary-generation method;
- the number and grade level of school-age children by small geography;
- race/ethnicity and socioeconomic measures for those geographies;
- school capacity, program placement, sibling rules, and other assignment constraints;
- privacy rules and minimum-cell suppression.

Do not infer an individual child's race or income from an address. Publish only aggregated scenario results with assumptions and uncertainty clearly labeled.
