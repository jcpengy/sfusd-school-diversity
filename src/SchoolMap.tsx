import { useEffect, useRef } from 'react';
import { Map, NavigationControl, setWorkerUrl, type MapLayerMouseEvent } from 'maplibre-gl';
import mapWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import type { MapData, School } from './types';

setWorkerUrl(mapWorkerUrl);
const BASEMAP = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

export function SchoolMap({ data, selectedCode, availableCodes, onSelect }: {
  data: MapData;
  selectedCode: string;
  availableCodes: string[];
  onSelect: (code: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const selectionRef = useRef({ selectedCode, availableCodes });
  selectionRef.current = { selectedCode, availableCodes };

  useEffect(() => {
    if (!containerRef.current) return;
    const map = new Map({
      container: containerRef.current,
      style: BASEMAP,
      center: [-122.447, 37.756],
      zoom: 11.35,
      minZoom: 10.4,
      maxBounds: [[-122.58, 37.68], [-122.32, 37.84]],
    });
    mapRef.current = map;
    map.addControl(new NavigationControl({ showCompass: false }), 'top-right');

    map.on('load', () => {
      map.addSource('areas', { type: 'geojson', data: data.areas });
      map.addSource('schools', { type: 'geojson', data: data.schools });
      map.addLayer({
        id: 'selected-area-fill', type: 'fill', source: 'areas',
        paint: { 'fill-color': '#f6e652', 'fill-opacity': 0.36 },
        filter: ['==', ['get', 'school_cds_code'], selectionRef.current.selectedCode],
      });
      map.addLayer({
        id: 'selected-area-line', type: 'line', source: 'areas',
        paint: { 'line-color': '#09090b', 'line-width': 2.5 },
        filter: ['==', ['get', 'school_cds_code'], selectionRef.current.selectedCode],
      });
      map.addLayer({
        id: 'school-points', type: 'circle', source: 'schools',
        paint: {
          'circle-radius': ['case', ['==', ['get', 'cds_code'], selectionRef.current.selectedCode], 9, 5.5],
          'circle-color': ['case', ['in', ['get', 'cds_code'], ['literal', selectionRef.current.availableCodes]], '#1a6ef4', '#ffffff'],
          'circle-stroke-color': '#09090b',
          'circle-stroke-width': ['case', ['==', ['get', 'cds_code'], selectionRef.current.selectedCode], 3, 1.8],
        },
      });
      map.addLayer({ id: 'school-hits', type: 'circle', source: 'schools', paint: { 'circle-radius': 14, 'circle-opacity': 0 } });
      const school = (event: MapLayerMouseEvent) => event.features?.[0] as School | undefined;
      map.on('mouseenter', 'school-hits', () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'school-hits', () => { map.getCanvas().style.cursor = ''; });
      map.on('click', 'school-hits', (event) => {
        const code = school(event)?.properties.cds_code;
        if (code && selectionRef.current.availableCodes.includes(code)) onSelect(code);
      });
    });
    return () => { map.remove(); mapRef.current = null; };
  }, [data, onSelect]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded() || !map.getLayer('school-points')) return;
    ['selected-area-fill', 'selected-area-line'].forEach((layer) =>
      map.setFilter(layer, ['==', ['get', 'school_cds_code'], selectedCode]),
    );
    map.setPaintProperty('school-points', 'circle-radius', ['case', ['==', ['get', 'cds_code'], selectedCode], 9, 5.5]);
    map.setPaintProperty('school-points', 'circle-stroke-width', ['case', ['==', ['get', 'cds_code'], selectedCode], 3, 1.8]);
  }, [selectedCode]);

  return <div className="map" ref={containerRef} aria-label="Map of SFUSD elementary schools" />;
}
