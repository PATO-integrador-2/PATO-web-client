export interface MapLocation {
  pais: string | null;
  region: string | null;
  departamento: string | null;
}

export type LocationInfoLevel = 'country' | 'region' | 'department';

export interface LocationInfoMetrics {
  primaryLabel?: string;
  primaryValue?: number;
  national?: number;
  urban?: number;
  rural?: number;
  latestYear?: number;
  highestYear?: number;
  lowestYear?: number;
}