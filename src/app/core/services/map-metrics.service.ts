import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import type { IndicatorDeptItem, NationalPovertyItem } from '../../interfaces/ipm.interface';

type MetricMap = ReadonlyMap<string, number>;

export function normalizeMetric(value: number | string | undefined): number | undefined {
  const numericValue = typeof value === 'string'
    ? Number(value.replace(',', '.').replace('%', '').trim())
    : value;

  if (numericValue === undefined || !Number.isFinite(numericValue)) return undefined;
  return numericValue > 1 ? numericValue / 100 : numericValue;
}

export function normalizeName(value: string | undefined): string {
  return (value ?? '')
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
  return normalizeName(value).replace(/^region\s+/, '');
}

@Injectable({ providedIn: 'root' })
export class MapMetricsService {
  private readonly http = inject(HttpClient);
  private readonly nationalPovertyUrl = `${environment.apiAddr}/api/users/national-poverty`;
  private readonly departmentPovertyUrl = `${environment.apiAddr}/api/users/household-poverty-by-department`;

  private readonly _status = signal<'idle' | 'loading' | 'loaded' | 'error'>('idle');
  private readonly _year = signal<number | null>(null);
  private readonly _countryMetrics = signal<MetricMap>(new Map());
  private readonly _regionMetrics = signal<MetricMap>(new Map());

  readonly status = this._status.asReadonly();
  readonly year = this._year.asReadonly();
  readonly countryMetrics = this._countryMetrics.asReadonly();
  readonly regionMetrics = this._regionMetrics.asReadonly();
  readonly ready = computed(() => this._status() === 'loaded');

  load(): void {
    if (this._status() !== 'idle') return;
    this._status.set('loading');

    forkJoin({
      countries: this.http.get<NationalPovertyItem[]>(this.nationalPovertyUrl),
      departments: this.http.get<IndicatorDeptItem[]>(this.departmentPovertyUrl),
    }).subscribe({
      next: ({ countries, departments }) => {
        const countryItems = extractItems<NationalPovertyItem>(countries);
        const departmentItems = extractItems<IndicatorDeptItem>(departments);
        const countryYear = latestYear(countryItems);
        const departmentYear = latestYear(departmentItems);

        const countryMetrics = buildCountryMetrics(countryItems, countryYear);
        const regionMetrics = buildRegionMetrics(departmentItems, departmentYear);
        this._countryMetrics.set(countryMetrics);
        this._regionMetrics.set(regionMetrics);
        this._year.set(countryYear ?? departmentYear ?? null);
        this._status.set('loaded');
        console.info('[MapMetrics] métricas cargadas', {
          countryYear,
          departmentYear,
          countries: countryMetrics.size,
          regions: regionMetrics.size,
        });
      },
      error: (error) => {
        console.error('Error cargando métricas del mapa', error);
        this._status.set('error');
      },
    });
  }
}

function extractItems<T>(response: T[] | { data?: T[]; content?: T[] }): T[] {
  if (Array.isArray(response)) return response;
  return response.data ?? response.content ?? [];
}

function latestYear(items: Array<{ anio: number }>): number | undefined {
  const years = items
    .map(item => Number(item.anio))
    .filter(Number.isFinite);
  return years.length > 0
    ? years.reduce((latest, year) => Math.max(latest, year), years[0])
    : undefined;
}

function buildCountryMetrics(items: NationalPovertyItem[], year: number | undefined): MetricMap {
  if (year === undefined) return new Map();

  const metrics = new Map<string, number>();
  const yearItems = items.filter(item => Number(item.anio) === year);
  const preferredItems = yearItems.filter(item =>
    normalizeName(item.area_geografica).includes('nacional') &&
    normalizeName(item.tipo_medida_pm).includes('incidencia')
  );
  const candidateItems = preferredItems.length > 0 ? preferredItems : yearItems;

  for (const item of candidateItems) {
    const metric = normalizeMetric(item.valor_porcentaje);
    const country = normalizeCountryName(item.pais);
    if (metric !== undefined && country) metrics.set(country, metric);
  }
  return metrics;
}

function buildRegionMetrics(items: IndicatorDeptItem[], year: number | undefined): MetricMap {
  if (year === undefined) return new Map();

  const values = new Map<string, number[]>();
  for (const item of items) {
    if (Number(item.anio) !== year) continue;

    const metric = normalizeMetric(item.ipm);
    const region = normalizeRegionName(item.region);
    if (metric === undefined || !region) continue;

    const regionValues = values.get(region) ?? [];
    regionValues.push(metric);
    values.set(region, regionValues);
  }

  return new Map(
    [...values.entries()].map(([region, regionValues]) => [
      region,
      regionValues.reduce((sum, value) => sum + value, 0) / regionValues.length,
    ])
  );
}