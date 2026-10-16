import { buildCountryInfo, buildGeographicMetrics, normalizeDepartmentName, normalizeMapMetrics, normalizeRegionName } from './map-metrics.service';
import type { NationalPovertyItem } from '../../interfaces/ipm.interface';
import type { DepartmentMetricItem } from './map-metrics.service';

describe('buildCountryInfo', () => {
  it('averages national, urban and rural values independently', () => {
    const items: NationalPovertyItem[] = [
      { anio: 2021, area_geografica: 'Nacional', pais: 'Colombia', tipo_medida_pm: 'Incidencia', valor_porcentaje: 40 },
      { anio: 2022, area_geografica: 'Nacional', pais: 'Colombia', tipo_medida_pm: 'Incidencia', valor_porcentaje: 30 },
      { anio: 2021, area_geografica: 'Urbano', pais: 'Colombia', tipo_medida_pm: 'Incidencia', valor_porcentaje: 20 },
      { anio: 2022, area_geografica: 'Urbano', pais: 'Colombia', tipo_medida_pm: 'Incidencia', valor_porcentaje: 10 },
      { anio: 2021, area_geografica: 'Rural', pais: 'Colombia', tipo_medida_pm: 'Incidencia', valor_porcentaje: 60 },
      { anio: 2022, area_geografica: 'Rural', pais: 'Colombia', tipo_medida_pm: 'Incidencia', valor_porcentaje: 50 },
    ];

    const metrics = buildCountryInfo(items).get('colombia');

    expect(metrics).toEqual({
      national: 0.35,
      urban: 0.15,
      rural: 0.55,
      highestYear: 2021,
      lowestYear: 2022,
    });
  });

  it('keeps available areas when another area has no valid data', () => {
    const items: NationalPovertyItem[] = [
      { anio: 2022, area_geografica: 'Nacional', pais: 'Colombia', tipo_medida_pm: 'Incidencia', valor_porcentaje: 25 },
      { anio: 2022, area_geografica: 'Rural', pais: 'Colombia', tipo_medida_pm: 'Incidencia', valor_porcentaje: 50 },
      { anio: 2022, area_geografica: 'Urbano', pais: 'Colombia', tipo_medida_pm: 'Incidencia', valor_porcentaje: Number.NaN },
    ];

    const metrics = buildCountryInfo(items).get('colombia');

    expect(metrics?.national).toBe(0.25);
    expect(metrics?.rural).toBe(0.5);
    expect(metrics?.urban).toBeUndefined();
    expect(metrics?.highestYear).toBe(2022);
    expect(metrics?.lowestYear).toBe(2022);
  });

  it('treats a total area as the national metric', () => {
    const items: NationalPovertyItem[] = [
      { anio: 2022, area_geografica: 'Total', pais: 'Colombia', tipo_medida_pm: 'Incidencia', valor_porcentaje: 25 },
    ];

    const metrics = buildCountryInfo(items).get('colombia');

    expect(metrics?.national).toBe(0.25);
    expect(metrics?.highestYear).toBe(2022);
    expect(metrics?.lowestYear).toBe(2022);
  });

  it('uses the measure label when it contains the geographic area', () => {
    const items: NationalPovertyItem[] = [
      { anio: 2022, area_geografica: 'Total', pais: 'Colombia', tipo_medida_pm: 'IPM Nacional', valor_porcentaje: 25 },
    ];

    const metrics = buildCountryInfo(items).get('colombia');

    expect(metrics?.national).toBe(0.25);
  });

  it('uses the validated national fallback when the area label is unexpected', () => {
    const items: NationalPovertyItem[] = [
      { anio: 2022, area_geografica: 'Unknown', pais: 'Colombia', tipo_medida_pm: 'Incidencia (H)', valor_porcentaje: 25 },
    ];

    const metrics = buildCountryInfo(items, new Map([['colombia', 0.25]])).get('colombia');

    expect(metrics?.national).toBe(0.25);
  });
});

describe('buildGeographicMetrics', () => {
  it('colors departments by their own average and regions by department averages', () => {
    const items: DepartmentMetricItem[] = [
      { anio: 2021, region: 'Andina', departamento: 'Antioquia', ipm: 20 },
      { anio: 2022, region: 'Andina', departamento: 'Antioquia', ipm: 40 },
      { anio: 2021, region: 'Andina', departamento: 'Boyacá', ipm: 60 },
      { anio: 2022, region: 'Andina', departamento: 'Boyacá', ipm: 80 },
      { anio: 2021, region: 'Caribe', departamento: 'Atlántico', ipm: 10 },
    ];

    const metrics = buildGeographicMetrics(items);

    expect(metrics.departments.get('antioquia')).toBe(0.3);
    expect(metrics.departments.get('boyaca')).toBe(0.7);
    expect(metrics.regions.get('andina')).toBe(0.5);
    expect(metrics.regions.get('caribe')).toBe(0.1);
    expect(metrics.departmentYears.get('antioquia')).toEqual({ highestYear: 2022, lowestYear: 2021 });
    expect(metrics.regionYears.get('andina')).toEqual({ highestYear: 2022, lowestYear: 2021 });
  });

  it('normalizes department names used by the GeoJSON', () => {
    expect(normalizeDepartmentName('Bogotá D.C.')).toBe('santafe de bogota dc');
    expect(normalizeDepartmentName('SANTAFE DE BOGOTA D.C')).toBe('santafe de bogota dc');
    expect(normalizeRegionName('Orinoquía - Amazonía')).toBe('orinoquia-amazonia');
    expect(normalizeDepartmentName('NARIÃ‘O')).toBe('narino');
  });
});

describe('normalizeMapMetrics', () => {
  it('uses the national value from country payload records', () => {
    const metrics = normalizeMapMetrics({
      countries: [
        {
          country: 'Colombia',
          national: 0.190267,
          urban: 0.148462,
          rural: 0.401167,
        },
      ],
    });

    expect(metrics.countries.get('colombia')).toBe(0.190267);
    expect(metrics.countryInfo.get('colombia')?.national).toBe(0.190267);
  });
});
