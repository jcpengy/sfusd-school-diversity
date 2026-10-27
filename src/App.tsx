import { useCallback, useEffect, useMemo, useState } from 'react';
import { SchoolMap } from './SchoolMap';
import type { ComparisonData, MapData, RaceCategory, RaceDistribution } from './types';

const RACES: RaceCategory[] = ['Asian', 'Black', 'Latino', 'White', 'Multiracial', 'Other'];
const DEFAULT_SCHOOL = '38684786041578';

async function loadJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not load ${url}`);
  return response.json() as Promise<T>;
}

function RaceBar({ label, values }: { label: string; values: RaceDistribution }) {
  return (
    <div className="race-row">
      <div className="bar-label">{label}</div>
      <div className="stacked-bar" aria-label={`${label} racial and ethnic distribution`}>
        {RACES.map((race) => values[race] > 0 && (
          <div key={race} className={`segment race-${race.toLowerCase()}`} style={{ width: `${values[race]}%` }} title={`${race}: ${values[race]}%`} />
        ))}
      </div>
    </div>
  );
}

function RaceChart({ current, nearby }: { current: RaceDistribution; nearby: RaceDistribution }) {
  return (
    <section className="chart-section">
      <div className="section-heading"><div><span className="section-number">01</span><h2>Race and ethnicity</h2></div><span className="unit">Share of population</span></div>
      <RaceBar label="Current enrollment" values={current} />
      <RaceBar label="Nearby residents" values={nearby} />
      <div className="race-legend">
        {RACES.map((race) => <span key={race}><i className={`race-${race.toLowerCase()}`} />{race}</span>)}
      </div>
      <div className="value-grid">
        {RACES.map((race) => (
          <div key={race}><span>{race}</span><strong>{current[race]}%</strong><strong>{nearby[race]}%</strong></div>
        ))}
      </div>
      <div className="column-key"><span /><span>Current</span><span>Nearby</span></div>
    </section>
  );
}

function Metric({ label, value, tone }: { label: string; value: number | null; tone: 'blue' | 'yellow' }) {
  const safe = value ?? 0;
  return (
    <div className="metric">
      <div className="metric-label"><span>{label}</span><strong>{value === null ? 'N/A' : `${value}%`}</strong></div>
      <div className="metric-track"><div className={tone} style={{ width: `${safe}%` }} /></div>
    </div>
  );
}

function biggestShift(current: RaceDistribution, nearby: RaceDistribution) {
  const shifts = RACES.map((race) => ({ race, change: +(nearby[race] - current[race]).toFixed(1) })).sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
  const { race, change } = shifts[0];
  return `${race} residents are the largest difference: ${Math.abs(change)} points ${change >= 0 ? 'higher' : 'lower'} nearby than in current enrollment.`;
}

export default function App() {
  const [mapData, setMapData] = useState<MapData>();
  const [comparisons, setComparisons] = useState<ComparisonData>();
  const [selectedCode, setSelectedCode] = useState(DEFAULT_SCHOOL);
  const [error, setError] = useState<string>();

  useEffect(() => {
    Promise.all([
      loadJson<MapData['schools']>('/data/schools.geojson'),
      loadJson<MapData['areas']>('/data/attendance_areas.geojson'),
      loadJson<ComparisonData>('/data/school-comparisons.json'),
    ]).then(([schools, areas, comparisonData]) => {
      setMapData({ schools, areas });
      setComparisons(comparisonData);
      if (!comparisonData.schools[DEFAULT_SCHOOL]) setSelectedCode(Object.keys(comparisonData.schools)[0]);
    }).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Data unavailable.'));
  }, []);

  const selectSchool = useCallback((code: string) => setSelectedCode(code), []);
  const options = useMemo(() => {
    if (!comparisons) return [];
    return Object.entries(comparisons.schools).sort((a, b) => a[1].name.localeCompare(b[1].name));
  }, [comparisons]);

  if (error) return <main className="message"><h1>Graphic unavailable</h1><p>{error}</p></main>;
  if (!mapData || !comparisons) return <main className="message"><div className="loader" /><p>Loading school data…</p></main>;
  const school = comparisons.schools[selectedCode];
  const comparisonCodes = Object.keys(comparisons.schools);

  return (
    <main>
      <header className="masthead">
        <div><p className="eyebrow">SFUSD assignment</p><h1>Who attends—and who lives nearby?</h1></div>
        <p>Compare each elementary school’s current enrollment with the population living inside its attendance area.</p>
      </header>

      <div className="graphic-shell">
        <section className="map-panel">
          <SchoolMap data={mapData} selectedCode={selectedCode} availableCodes={comparisonCodes} onSelect={selectSchool} />
          <div className="map-key"><span><i className="available" />Comparison available</span><span><i />Citywide program or no area</span></div>
        </section>

        <aside className="detail-panel" aria-live="polite">
          <div className="school-picker">
            <label htmlFor="school-select">Selected school</label>
            <select id="school-select" value={selectedCode} onChange={(event) => setSelectedCode(event.target.value)}>
              {options.map(([code, item]) => <option key={code} value={code}>{item.name}</option>)}
            </select>
          </div>

          <div className="school-heading">
            <h2>{school.name}</h2>
            <p>{school.address} · {school.currentEnrollment} enrolled students</p>
          </div>

          <div className="scenario-note"><strong>A provisional comparison</strong><span>“Nearby” uses the current {comparisons.meta.boundaryYear} attendance area—not SFUSD’s future boundary.</span></div>

          <p className="takeaway">{biggestShift(school.currentRace, school.nearbyRace)}</p>
          <RaceChart current={school.currentRace} nearby={school.nearbyRace} />

          <section className="chart-section socioeconomic">
            <div className="section-heading"><div><span className="section-number">02</span><h2>Economic indicators</h2></div><span className="unit">Different measures</span></div>
            <Metric label="Current enrollment: socioeconomically disadvantaged" value={school.currentSed} tone="blue" />
            <Metric label="Nearby area: median block-group low-income share" value={school.nearbyLowIncome} tone="yellow" />
            <p className="chart-note">These measures are related, not equivalent. CDE’s classification also includes English learner and foster-youth criteria.</p>
          </section>

          <footer>
            <strong>How to read this</strong>
            <p>This is a scenario, not a forecast. Nearby estimates summarize {school.nearbyTracts} Census tracts and {school.nearbyBlockGroups} block groups assigned by internal point. Current: CDE {comparisons.meta.currentYear}. Nearby: {comparisons.meta.nearbyYear}.</p>
          </footer>
        </aside>
      </div>
    </main>
  );
}
