export interface MapLocation {
  pais: string | null;
  region: string | null;
  departamento: string | null;
}

export type LocationInfoLevel = 'country' | 'region' | 'department';

export interface LocationInfoMetrics {
  national?: number;
  urban?: number;
  rural?: number;
  highestYear?: number;
  lowestYear?: number;
}