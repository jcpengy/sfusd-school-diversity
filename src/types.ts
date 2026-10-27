import type { Feature, FeatureCollection, MultiPolygon, Point } from 'geojson';

export type RaceCategory = 'Asian' | 'Black' | 'Latino' | 'White' | 'Multiracial' | 'Other';
export type RaceDistribution = Record<RaceCategory, number>;

export interface SchoolProperties {
  name: string;
  cds_code: string;
  address: string;
  city: string;
  has_attendance_area_name_match: boolean;
}

export interface AreaProperties {
  school_cds_code: string;
  vintage: string;
}

export type School = Feature<Point, SchoolProperties>;
export type Area = Feature<MultiPolygon, AreaProperties>;

export interface SchoolComparison {
  name: string;
  address: string;
  currentEnrollment: number;
  currentRace: RaceDistribution;
  nearbyRace: RaceDistribution;
  currentSed: number | null;
  nearbyLowIncome: number | null;
  nearbyTracts: number;
  nearbyBlockGroups: number;
}

export interface ComparisonData {
  meta: {
    currentYear: string;
    nearbyYear: string;
    boundaryYear: string;
    comparisonCount: number;
  };
  schools: Record<string, SchoolComparison>;
}

export interface MapData {
  schools: FeatureCollection<Point, SchoolProperties>;
  areas: FeatureCollection<MultiPolygon, AreaProperties>;
}
