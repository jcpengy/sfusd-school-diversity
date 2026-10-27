import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';

const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'));
const number = (value) => Number(value) || 0;

function parseTsv(text) {
  const [header, ...lines] = text.trim().split(/\r?\n/).map((line) => line.split('\t'));
  return lines.map((values) => Object.fromEntries(header.map((key, index) => [key, values[index]])));
}

function inRing([x, y], ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function contains(area, point) {
  return area.geometry.coordinates.some(([outer, ...holes]) =>
    inRing(point, outer) && !holes.some((hole) => inRing(point, hole)),
  );
}

function groupBy(rows, key) {
  const grouped = new Map();
  rows.forEach((row) => {
    const value = row[key];
    if (!grouped.has(value)) grouped.set(value, []);
    grouped.get(value).push(row);
  });
  return grouped;
}

function raceFromCde(rows) {
  const counts = Object.fromEntries(rows.map((row) => [row.studentgroup, number(row.subgrouptotal)]));
  const total = number(rows[0]?.totalenrollment);
  const values = {
    Asian: (counts.AS || 0) + (counts.FI || 0),
    Black: counts.AA || 0,
    Latino: counts.HI || 0,
    White: counts.WH || 0,
    Multiracial: counts.MR || 0,
  };
  values.Other = Math.max(0, total - Object.values(values).reduce((sum, value) => sum + value, 0));
  return { total, values };
}

function raceFromTracts(rows) {
  const byCode = {};
  rows.forEach((row) => { byCode[row.acs_code] = (byCode[row.acs_code] || 0) + number(row.estimate); });
  const total = Object.values(byCode).reduce((sum, value) => sum + value, 0);
  const values = {
    Asian: byCode['006'] || 0,
    Black: byCode['004'] || 0,
    Latino: byCode['012'] || 0,
    White: byCode['003'] || 0,
    Multiracial: byCode['009'] || 0,
  };
  values.Other = Math.max(0, total - Object.values(values).reduce((sum, value) => sum + value, 0));
  return { total, values };
}

function percent(values, total) {
  return Object.fromEntries(Object.entries(values).map(([key, value]) => [key, total ? +(value * 100 / total).toFixed(1) : 0]));
}

function median(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return +(sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2).toFixed(1);
}

const [schools, areas, tracts, blockGroups, tractRace, poverty, cdeText] = await Promise.all([
  readJson('data/schools.geojson'),
  readJson('data/attendance_areas.geojson'),
  readJson('data/raw/sf-tracts.geojson'),
  readJson('data/raw/sf-block-groups.geojson'),
  readJson('data/raw/datasf-tract-race-2023.json'),
  readJson('data/raw/sf-block-group-poverty.json'),
  readFile('data/raw/cde-enrollment-2025-26.txt', 'utf8'),
]);

const cde = parseTsv(cdeText);
const cdeBySchool = groupBy(cde.filter((row) => row.rtype === 'S'), 'cds');
const raceByTract = groupBy(tractRace, 'geography_id');
const povertyByBlockGroup = new Map(poverty.map((row) => [row.census_blockgroup, number(row.poverty) * 100]));
const schoolByCode = new Map(schools.features.map((school) => [school.properties.cds_code, school]));

const tractAssignments = new Map();
tracts.features.forEach((tract) => {
  const point = [number(tract.properties.intptlon), number(tract.properties.intptlat)];
  const area = areas.features.find((candidate) => contains(candidate, point));
  if (!area) return;
  const code = area.properties.school_cds_code;
  if (!tractAssignments.has(code)) tractAssignments.set(code, []);
  tractAssignments.get(code).push(String(tract.properties.geoid).padStart(11, '0'));
});

const povertyAssignments = new Map();
blockGroups.features.forEach((blockGroup) => {
  const point = [number(blockGroup.properties.intptlon), number(blockGroup.properties.intptlat)];
  const area = areas.features.find((candidate) => contains(candidate, point));
  const geoid = String(blockGroup.properties.geoid).padStart(12, '0');
  const value = povertyByBlockGroup.get(geoid);
  if (!area || !Number.isFinite(value)) return;
  const code = area.properties.school_cds_code;
  if (!povertyAssignments.has(code)) povertyAssignments.set(code, []);
  povertyAssignments.get(code).push(value);
});

const comparisons = {};
areas.features.forEach((area) => {
  const code = area.properties.school_cds_code;
  const school = schoolByCode.get(code);
  const currentRows = cdeBySchool.get(code);
  if (!school || !currentRows) return;

  const currentRace = raceFromCde(currentRows);
  const nearbyRows = (tractAssignments.get(code) || []).flatMap((geoid) => raceByTract.get(geoid) || []);
  const nearbyRace = raceFromTracts(nearbyRows);
  const sed = currentRows.find((row) => row.studentgroup === 'SED');
  comparisons[code] = {
    name: school.properties.name,
    address: school.properties.address,
    currentEnrollment: currentRace.total,
    currentRace: percent(currentRace.values, currentRace.total),
    nearbyRace: percent(nearbyRace.values, nearbyRace.total),
    currentSed: sed ? number(sed.rate) : null,
    nearbyLowIncome: median(povertyAssignments.get(code) || []),
    nearbyTracts: (tractAssignments.get(code) || []).length,
    nearbyBlockGroups: (povertyAssignments.get(code) || []).length,
  };
});

const output = {
  meta: {
    currentYear: '2025–26',
    nearbyYear: '2019–23 ACS',
    boundaryYear: '2024–25',
    comparisonCount: Object.keys(comparisons).length,
  },
  schools: comparisons,
};

await mkdir('public/data', { recursive: true });
await Promise.all([
  writeFile('public/data/school-comparisons.json', `${JSON.stringify(output)}\n`),
  copyFile('data/schools.geojson', 'public/data/schools.geojson'),
  copyFile('data/attendance_areas.geojson', 'public/data/attendance_areas.geojson'),
]);
console.log(`Built comparisons for ${output.meta.comparisonCount} schools.`);
