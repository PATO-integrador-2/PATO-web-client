import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment.development';
import type { NationalPovertyItem } from '../../interfaces/ipm.interface';
import type { LocationInfoMetrics } from '../../interfaces/map-location';

type MetricMap = ReadonlyMap<string, number>;

export interface DepartmentMetricItem {
  anio: number;
  region: string;
  departamento: string;
  ipm: number | string;
}

type MapMetricRecord = Record<string, unknown>;

export interface MapMetricsResponse {
  data?: MapMetricsPayload;
  content?: MapMetricsPayload;
  countries?: MapMetricRecord[] | Record<string, MapMetricRecord>;
  regions?: MapMetricRecord[] | Record<string, MapMetricRecord>;
  departments?: MapMetricRecord[] | Record<string, MapMetricRecord>;
  countryMetrics?: MapMetricRecord[] | Record<string, MapMetricRecord>;
  regionMetrics?: MapMetricRecord[] | Record<string, MapMetricRecord>;
  departmentMetrics?: MapMetricRecord[] | Record<string, MapMetricRecord>;
}

interface MapMetricsPayload {
  countries?: MapMetricRecord[] | Record<string, MapMetricRecord>;
  regions?: MapMetricRecord[] | Record<string, MapMetricRecord>;
  departments?: MapMetricRecord[] | Record<string, MapMetricRecord>;
  countryMetrics?: MapMetricRecord[] | Record<string, MapMetricRecord>;
  regionMetrics?: MapMetricRecord[] | Record<string, MapMetricRecord>;
  departmentMetrics?: MapMetricRecord[] | Record<string, MapMetricRecord>;
}

export interface GeographicMetricMaps {
  departments: MetricMap;
  regions: MetricMap;
  departmentYears: ReadonlyMap<string, YearRange>;
  regionYears: ReadonlyMap<string, YearRange>;
}

export interface YearRange {
  highestYear?: number;
  lowestYear?: number;
}

export function normalizeMetric(value: number | string | undefined): number | undefined {
  const numericValue = typeof value === 'string'
    ? Number(value.replace(',', '.').replace('%', '').trim())
    : value;

  if (numericValue === undefined || !Number.isFinite(numericValue)) return undefined;
  return numericValue > 1 ? numericValue / 100 : numericValue;
}

export function normalizeName(value: string | undefined): string {
  return (value ?? '')
    .replace(/Ã‘/g, 'Ñ')
    .replace(/Ã±/g, 'ñ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

const COUNTRY_ALIASES: Record<string, string> = {
  arg: 'argentina',
    argentina: 'argentina',
  bol: 'bolivia',
    bolivia: 'bolivia',
    'bolivia estado plurinacional de': 'bolivia',
    brasil: 'brazil',
    brazil: 'brazil',
    bra: 'brazil',
    chl: 'chile',
    chile: 'chile',
    col: 'colombia',
    colombia: 'colombia',
    'costa rica': 'costa rica',
    cuba: 'cuba',
    ecuador: 'ecuador',
    ecu: 'ecuador',
    'el salvador': 'el salvador',
    guatemala: 'guatemala',
    guyana: 'guyana',
    haiti: 'haiti',
    honduras: 'honduras',
    jamaica: 'jamaica',
    mexico: 'mexico',
    mex: 'mexico',
    nicaragua: 'nicaragua',
    panama: 'panama',
    paraguay: 'paraguay',
    peru: 'peru',
    per: 'peru',
    suriname: 'suriname',
    'republica dominicana': 'dominican republic',
    'trinidad y tobago': 'trinidad and tobago',
    uruguay: 'uruguay',
    ury: 'uruguay',
    venezuela: 'venezuela',
    ven: 'venezuela',
};

export function normalizeCountryName(value: string | undefined): string {
  const name = normalizeName(value);
  return COUNTRY_ALIASES[name] ?? name;
}

export function normalizeRegionName(value: string | undefined): string {
  const normalized = normalizeName(value)
    .replace(/^region\s+/, '')
    .replace(/\s+-\s+/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
  if (normalized === 'amazonia' || normalized === 'orinoquia') return 'orinoquia-amazonia';
  return normalized;
}

const DEPARTMENT_ALIASES: Record<string, string> = {
  bogota: 'santafe de bogota dc',
  'bogota dc': 'santafe de bogota dc',
  'bogota d c': 'santafe de bogota dc',
  'santafe de bogota d c': 'santafe de bogota dc',
  'san andres': 'archipielago de san andres providencia y santa catalina',
  'san andres y providencia': 'archipielago de san andres providencia y santa catalina',
  'archipielago de san andres providencia y santa catalina': 'archipielago de san andres providencia y santa catalina',
};

export function normalizeDepartmentName(value: string | undefined): string {
  const normalized = normalizeName(value)
    .replace(/[.,]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return DEPARTMENT_ALIASES[normalized] ?? normalized;
}

function buildYearRange(valuesByYear: Map<number, number[]>): YearRange {
  const yearlyValues = [...valuesByYear.entries()]
    .map(([year, values]) => ({ year, value: average(values)! }))
    .filter(item => item.value !== undefined);
  const highest = yearlyValues.reduce((best, current) => current.value > best.value ? current : best, yearlyValues[0]);
  const lowest = yearlyValues.reduce((best, current) => current.value < best.value ? current : best, yearlyValues[0]);
  return { highestYear: highest?.year, lowestYear: lowest?.year };
}

@Injectable({ providedIn: 'root' })
export class MapMetricsService {
  private readonly http = inject(HttpClient);
  private readonly mapMetricsUrl = `${environment.apiAddr}/api/users/map-metrics`;

  private readonly _status = signal<'idle' | 'loading' | 'loaded' | 'error'>('idle');
  private readonly _year = signal<number | null>(null);
  private readonly _countryMetrics = signal<MetricMap>(new Map());
  private readonly _countryInfo = signal<ReadonlyMap<string, LocationInfoMetrics>>(new Map());
  private readonly _departmentMetrics = signal<MetricMap>(new Map());
  private readonly _regionMetrics = signal<MetricMap>(new Map());
  private readonly _departmentYears = signal<ReadonlyMap<string, YearRange>>(new Map());
  private readonly _regionYears = signal<ReadonlyMap<string, YearRange>>(new Map());

  readonly status = this._status.asReadonly();
  readonly year = this._year.asReadonly();
  readonly countryMetrics = this._countryMetrics.asReadonly();
  readonly countryInfo = this._countryInfo.asReadonly();
  readonly departmentMetrics = this._departmentMetrics.asReadonly();
  readonly regionMetrics = this._regionMetrics.asReadonly();
  readonly departmentYears = this._departmentYears.asReadonly();
  readonly regionYears = this._regionYears.asReadonly();
  readonly ready = computed(() => this._status() === 'loaded');

  load(): void {
    if (this._status() !== 'idle') return;
    this._status.set('loading');

    this.http.get<MapMetricsResponse>(this.mapMetricsUrl).subscribe({
      next: (response) => {
        const metrics = normalizeMapMetrics(response);
        this._countryMetrics.set(metrics.countries);
        this._countryInfo.set(metrics.countryInfo);
        this._departmentMetrics.set(metrics.departments);
        this._regionMetrics.set(metrics.regions);
        this._departmentYears.set(metrics.departmentYears);
        this._regionYears.set(metrics.regionYears);
        this._year.set(metrics.year);
        this._status.set('loaded');
        console.info('[MapMetrics] métricas cargadas', {
          period: 'all-years-average',
          countries: metrics.countries.size,
          regions: metrics.regions.size,
          departments: metrics.departments.size,
        });
      },
      error: (error) => {
        console.error('Error cargando métricas del mapa', error);
        this._status.set('error');
      },
    });
  }
}

interface NormalizedMapMetrics {
  countries: MetricMap;
  countryInfo: ReadonlyMap<string, LocationInfoMetrics>;
  departments: MetricMap;
  regions: MetricMap;
  departmentYears: ReadonlyMap<string, YearRange>;
  regionYears: ReadonlyMap<string, YearRange>;
  year: number | null;
}

export function normalizeMapMetrics(response: MapMetricsResponse): NormalizedMapMetrics {
  const payload = (response.data ?? response.content ?? response) as MapMetricsPayload;
  const countryRecords = getMetricRecords(payload.countries ?? payload.countryMetrics);
  const regionRecords = getMetricRecords(payload.regions ?? payload.regionMetrics);
  const departmentRecords = getMetricRecords(payload.departments ?? payload.departmentMetrics);

  const countries = recordsToMetricMap(countryRecords, record => normalizeCountryName(readText(record, 'pais', 'country', 'name')));
  const regions = recordsToMetricMap(regionRecords, record => normalizeRegionName(readText(record, 'region', 'name')));
  const departments = recordsToMetricMap(departmentRecords, record => normalizeDepartmentName(readText(record, 'departamento', 'department', 'name')));

  return {
    countries,
    countryInfo: recordsToCountryInfo(countryRecords, countries),
    departments,
    regions,
    departmentYears: recordsToYearMap(departmentRecords, record => normalizeDepartmentName(readText(record, 'departamento', 'department', 'name'))),
    regionYears: recordsToYearMap(regionRecords, record => normalizeRegionName(readText(record, 'region', 'name'))),
    year: [...countryRecords, ...regionRecords, ...departmentRecords]
      .map(record => readNumber(record, 'latestYear', 'latest_year', 'anio', 'year'))
      .filter((year): year is number => year !== undefined)
      .reduce((latest, year) => Math.max(latest, year), 0) || null,
  };
}

function getMetricRecords(section: MapMetricRecord[] | Record<string, MapMetricRecord> | undefined): MapMetricRecord[] {
  if (!section) return [];
  return Array.isArray(section)
    ? section
    : Object.entries(section).map(([key, value]) => ({ key, ...value }));
}

function recordsToMetricMap(records: MapMetricRecord[], getKey: (record: MapMetricRecord) => string): MetricMap {
  return new Map(records.map(record => [getKey(record), readMetric(record)]).filter(([key, value]) => !!key && value !== undefined) as [string, number][]);
}

function recordsToYearMap(records: MapMetricRecord[], getKey: (record: MapMetricRecord) => string): ReadonlyMap<string, YearRange> {
  return new Map(records.map(record => [
    getKey(record),
    {
      highestYear: readNumber(record, 'highestYear', 'highest_year', 'maxYear'),
      lowestYear: readNumber(record, 'lowestYear', 'lowest_year', 'minYear'),
    },
  ]).filter(([key]) => !!key) as [string, YearRange][]);
}

function recordsToCountryInfo(records: MapMetricRecord[], countryMetrics: MetricMap): ReadonlyMap<string, LocationInfoMetrics> {
  return new Map(records.map(record => {
    const country = normalizeCountryName(readText(record, 'pais', 'country', 'name'));
    return [country, {
      national: readMetric(record) ?? countryMetrics.get(country),
      urban: readMetric(record, 'urban', 'urbano'),
      rural: readMetric(record, 'rural'),
      latestYear: readNumber(record, 'latestYear', 'latest_year', 'anio', 'year'),
      highestYear: readNumber(record, 'highestYear', 'highest_year', 'maxYear'),
      lowestYear: readNumber(record, 'lowestYear', 'lowest_year', 'minYear'),
    }];
  }).filter(([country]) => !!country) as [string, LocationInfoMetrics][]);
}

function readMetric(record: MapMetricRecord, ...keys: string[]): number | undefined {
  const key = keys.length > 0
    ? keys.find(candidate => record[candidate] !== undefined)
    : ['national', 'average', 'promedio', 'metric', 'value', 'ipm', 'valor', 'valor_porcentaje']
      .find(candidate => record[candidate] !== undefined);
  return normalizeMetric(record[key ?? ''] as number | string | undefined);
}

function readText(record: MapMetricRecord, ...keys: string[]): string {
  const key = keys.find(candidate => record[candidate] !== undefined) ?? 'key';
  return String(record[key] ?? '');
}

function readNumber(record: MapMetricRecord, ...keys: string[]): number | undefined {
  const key = keys.find(candidate => record[candidate] !== undefined);
  const value = key ? Number(record[key]) : Number.NaN;
  return Number.isFinite(value) ? value : undefined;
}

function extractItems<T>(response: T[] | { data?: T[]; content?: T[] }): T[] {
  if (Array.isArray(response)) return response;
  return response.data ?? response.content ?? [];
}

function buildCountryMetrics(items: NationalPovertyItem[]): MetricMap {
  const preferredItems = items.filter(item =>
    normalizeName(item.area_geografica).includes('nacional') &&
    normalizeName(item.tipo_medida_pm).includes('incidencia')
  );
  const candidateItems = preferredItems.length > 0 ? preferredItems : items;
  const valuesByCountry = new Map<string, number[]>();

  for (const item of candidateItems) {
    const metric = normalizeMetric(item.valor_porcentaje);
    const country = normalizeCountryName(item.pais);
    if (metric === undefined || !country) continue;

    const values = valuesByCountry.get(country) ?? [];
    values.push(metric);
    valuesByCountry.set(country, values);
  }

  return averageMetrics(valuesByCountry);
}

export function buildGeographicMetrics(items: DepartmentMetricItem[]): GeographicMetricMaps {
  const departmentValues = new Map<string, { region: string; values: number[]; valuesByYear: Map<number, number[]> }>();
  for (const item of items) {
    const metric = normalizeMetric(item.ipm);
    const department = normalizeDepartmentName(item.departamento);
    const region = normalizeRegionName(item.region);
    const year = Number(item.anio);
    if (metric === undefined || !department || !region || !Number.isFinite(year)) continue;

    const departmentEntry: { region: string; values: number[]; valuesByYear: Map<number, number[]> } = departmentValues.get(department) ?? {
      region,
      values: [],
      valuesByYear: new Map(),
    };
    departmentEntry.values.push(metric);
    const yearValues = departmentEntry.valuesByYear.get(year) ?? [];
    yearValues.push(metric);
    departmentEntry.valuesByYear.set(year, yearValues);
    departmentValues.set(department, departmentEntry);
  }

  const departmentMetrics = new Map(
    [...departmentValues.entries()].map(([department, entry]) => [
      department,
      average(entry.values)!,
    ])
  );
  const regionValues = new Map<string, number[]>();
  const departmentYears = new Map<string, YearRange>();
  for (const [department, { region, values, valuesByYear }] of departmentValues.entries()) {
    const regionDepartments = regionValues.get(region) ?? [];
    regionDepartments.push(average(values)!);
    regionValues.set(region, regionDepartments);
    departmentYears.set(department, buildYearRange(valuesByYear));
  }

  const regionYearValues = new Map<string, Map<number, number[]>>();
  for (const { region, valuesByYear } of departmentValues.values()) {
    const years = regionYearValues.get(region) ?? new Map<number, number[]>();
    for (const [year, values] of valuesByYear.entries()) {
      const yearValues = years.get(year) ?? [];
      yearValues.push(average(values)!);
      years.set(year, yearValues);
    }
    regionYearValues.set(region, years);
  }

  return {
    departments: departmentMetrics,
    regions: averageMetrics(regionValues),
    departmentYears,
    regionYears: new Map([...regionYearValues.entries()].map(([region, valuesByYear]) => [
      region,
      buildYearRange(valuesByYear),
    ])),
  };
}

function averageMetrics(valuesByKey: Map<string, number[]>): MetricMap {
  return new Map(
    [...valuesByKey.entries()].map(([key, values]) => [
      key,
      values.reduce((sum, value) => sum + value, 0) / values.length,
    ])
  );
}

export function buildCountryInfo(
  items: NationalPovertyItem[],
  nationalFallback: MetricMap = new Map(),
): ReadonlyMap<string, LocationInfoMetrics> {
  const valuesByCountry = new Map<string, {
    national: Array<{ year: number; value: number }>;
    urban: number[];
    rural: number[];
  }>();

  for (const item of items) {
    const country = normalizeCountryName(item.pais);
    const metric = normalizeMetric(item.valor_porcentaje);
    const year = Number(item.anio);
    if (!country || metric === undefined || !Number.isFinite(year)) continue;

    const values = valuesByCountry.get(country) ?? {
      national: [],
      urban: [],
      rural: [],
    };
    const geographicArea = normalizeName(item.area_geografica);
    const measure = normalizeName(item.tipo_medida_pm);
    const area = `${geographicArea} ${measure}`;
    const isUrban = area.includes('urban');
    const isRural = area.includes('rural');
    const isNational = geographicArea.includes('nacional') || geographicArea === 'total' || measure.includes('nacional');

    if (isNational || (!isUrban && !isRural)) {
      values.national.push({ year, value: metric });
    } else if (isUrban) {
      values.urban.push(metric);
    } else if (isRural) {
      values.rural.push(metric);
    }
    valuesByCountry.set(country, values);
  }

  return new Map([...valuesByCountry.entries()].map(([country, values]) => {
    const highest = values.national.reduce((best, current) => current.value > best.value ? current : best, values.national[0]);
    const lowest = values.national.reduce((best, current) => current.value < best.value ? current : best, values.national[0]);
    return [country, {
      national: average(values.national.map(item => item.value)) ?? nationalFallback.get(country),
      urban: average(values.urban),
      rural: average(values.rural),
      highestYear: highest?.year,
      lowestYear: lowest?.year,
    }];
  }));
}

function average(values: number[]): number | undefined {
  return values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : undefined;
}