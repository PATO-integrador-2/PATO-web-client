import { Service, signal, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ContributionPovertyItem, IndicatorDeptItem, NationalPovertyItem, PovertyByAgeItem, WidgetItemDash } from '../../../interfaces/ipm.interface';
import { environment } from '../../../../environments/environment.development';
import { isPlatformBrowser } from '@angular/common';
import { ContributionDeprivations } from '../../../pages/dashboard-viewer/latin-america-dash/widgets/contribution-deprivations/contribution-deprivations';
import { PopulationPoverty } from '../../../pages/dashboard-viewer/latin-america-dash/widgets/population-poverty/population-poverty';
import { PovertyByAge } from '../../../pages/dashboard-viewer/latin-america-dash/widgets/poverty-by-age/poverty-by-age';
import { MPHouseholdsDep } from '../../../pages/dashboard-viewer/col-dept-dash/widgets/mp-households-dep/mp-households-dep';

@Service()
export class ColDeptService {
    private httpClient = inject(HttpClient);
    private platformId = inject(PLATFORM_ID);
    
        widgets = signal<WidgetItemDash[]>([

            {
                id: 1,
                label: 'Indicadores Colombia Nivel Departamental',
                content: MPHouseholdsDep,
                filterFields: ['year', 'region', 'dept'],
                getYearsSignal: () => this.getIndicatorsYears(),
                getRegionsByYear: (year?: number) => this.getIndicatorsRegionsByYear(year),
                getDeptsByYearAndRegion: (year?: number, region?: string) =>
                    this.getIndicatorsDeptByYearAndRegion(year, region),
                loadData: (f) => {
                    const selectedYear = f?.year ?? 2024;
                    const selectedRegion = f?.region ?? 'Pacífica';
                    const selectedDept = f?.dept ?? 'Cauca';
                    this.loadIndicatorsData(selectedYear, selectedRegion, selectedDept );
                }
    
            }
    
        ]);
    
        private indicators_url = `${environment.apiAddr}/api/users/household-poverty-by-department`;
        private rawIndicatorsData = signal<IndicatorDeptItem[]>([]);
        indicatorsData = signal<IndicatorDeptItem[]>([]);
    
        fetchIndicatorData(year?: number, region?: string, dept?: string, ) {
            if (!isPlatformBrowser(this.platformId)) return;
    
            this.httpClient.get<IndicatorDeptItem[]>(this.indicators_url).subscribe({
                next: (data) => {
                    if (!data || data.length === 0) return;
    
                    // Guardar la data completa devuelta por el API
                    this.rawIndicatorsData.set(data);
    
                    // Determinar el año y el país a mostrar de forma segura
                    const availableYears = this.getIndicatorsYears();
                    const targetYear = year && availableYears.includes(Number(year))
                        ? Number(year)
                        : availableYears[0];
    
                    const availableRegions = this.getIndicatorsRegionsByYear(targetYear);
                    const targetRegion = region && availableRegions.some(a => a.toLowerCase() === region.toLowerCase())
                        ? region
                        : availableRegions[0];
    
                    const availableDepts = this.getIndicatorsDeptByYearAndRegion(targetYear, targetRegion);
                    const targetDept = dept && availableDepts.some(c => c.toLowerCase() === dept.toLowerCase())
                        ? dept
                        : availableDepts[0];
    
    
                    this.loadIndicatorsData(targetYear, targetRegion, targetDept);
                },
                error: (err) => console.error('Error al cargar datos de pobreza nacional:', err),
            });
        }
    
        getIndicatorsYears(): number[] {
            const data = this.rawIndicatorsData();
            return [...new Set(data.map((d) => Number(d.anio)))].sort((a, b) => b - a);
        }
    
        getIndicatorsRegionsByYear(year?: number): string[] {
            const data = this.rawIndicatorsData();
            if (!year) return [];
    
            return [
                ...new Set(
                    data
                        .filter((d) => Number(d.anio) === Number(year))
                        .map((d) => d.region?.trim())
                        .filter(Boolean) as string[]
                ),
            ].sort();
        }
    
        getIndicatorsDeptByYearAndRegion(year?: number, region?: string): string[] {
            const data = this.rawIndicatorsData();
            if (!year || !region) return [];
    
            return [
                ...new Set(
                    data
                        .filter(
                            (d) =>
                                Number(d.anio) === Number(year) &&
                                d.region?.toLowerCase().trim() === region.toLowerCase().trim()
                        )
                        .map((d) => d.departamento?.trim())
                        .filter(Boolean) as string[]
                ),
            ].sort();
        }
    
        loadIndicatorsData(year?: number, region?: string, dept?: string) {
            const data = this.rawIndicatorsData();
            // Si no se han descargado los datos aún, llamar a la API
            if (!data || data.length === 0) {
                this.fetchIndicatorData(year, region, dept);
                return;
            }
    
            // Filtrar según año área y país
            let filteredData = data.filter(
                (d) =>
                    Number(d.anio) === Number(year) &&
                    d.region?.toLowerCase().trim() === String(region).toLowerCase().trim() &&
                    d.departamento?.toLowerCase().trim() === String(dept).toLowerCase().trim()
            );
    
            // Fallback: si con el año y país solicitados no hay coincidencias, tomar el primer año y país disponibles
            if (filteredData.length === 0 && data.length > 0) {
                const fallbackYear = data[0].anio;
                const fallbackArea = data[0].region;
                const fallbackCountry = data[0].departamento;
                filteredData = data.filter(
                    (d) =>
                        Number(d.anio) === Number(fallbackYear) &&
                        d.region?.toLowerCase().trim() === fallbackArea.toLowerCase().trim() && 
                        d.departamento?.toLowerCase().trim() === fallbackCountry.toLowerCase().trim()
                );
            }
    
            this.indicatorsData.set(filteredData);
        }

    }