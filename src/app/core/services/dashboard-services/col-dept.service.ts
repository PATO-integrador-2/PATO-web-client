import { Service, signal, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ContributionPovertyItem, IndicatorDeptItem, MpiDeptIndicatorItem, MpiDeptItem, NationalPovertyItem, PovertyByAgeItem, WidgetItemDash } from '../../../interfaces/ipm.interface';
import { environment } from '../../../../environments/environment.development';
import { isPlatformBrowser } from '@angular/common';
import { ContributionDeprivations } from '../../../pages/dashboard-viewer/latin-america-dash/widgets/contribution-deprivations/contribution-deprivations';
import { PopulationPoverty } from '../../../pages/dashboard-viewer/latin-america-dash/widgets/population-poverty/population-poverty';
import { PovertyByAge } from '../../../pages/dashboard-viewer/latin-america-dash/widgets/poverty-by-age/poverty-by-age';
import { MPHouseholdsDep } from '../../../pages/dashboard-viewer/col-dept-dash/widgets/mp-households-dep/mp-households-dep';
import { MpiDept } from '../../../pages/dashboard-viewer/col-dept-dash/widgets/mpi-dept/mpi-dept';

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

            },

            {
                id: 2,
                label: 'IPM Colombia Departamental',
                content: MpiDept,
                filterFields: ['year', 'area'],
                getYearsSignal: () => this.getMpiDeptYears(),
                getAreasByYear: (year?: number) => this.getMpiDeptAreasByYear(year),
                loadData: (f) => {
                    const selectedYear = f?.year ?? 2024;
                    const selectedArea = f?.area ?? 'Cabeceras';
                    this.loadMpiDeptData(selectedYear, selectedArea );
                }
            },

            {
                id: 3,
                label: 'Indicadores Variables Colombia Nivel Departamental',
                content: MPHouseholdsDep,
                filterFields: ['year', 'region', 'dept'],
                getYearsSignal: () => this.getMpiDeptIndicatorsYears(),
                getRegionsByYear: (year?: number) => this.getMpiDeptIndicatorsAreasByYear(year),
                getDeptsByYearAndArea: (year?: number, area?: string) =>
                    this.getMpiDeptIndicatorsDeptByYearAndArea(year, area),
                loadData: (f) => {
                    const selectedYear = f?.year ?? 2024;
                    const selectedArea = f?.area ?? 'Cabeceras';
                    const selectedDept = f?.dept ?? 'Cauca';
                    this.loadMpiDeptIndicatorsData(selectedYear, selectedArea, selectedDept );
                }

            },
    
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
                const fallbackRegion = data[0].region;
                const fallbackCountry = data[0].departamento;
                filteredData = data.filter(
                    (d) =>
                        Number(d.anio) === Number(fallbackYear) &&
                        d.region?.toLowerCase().trim() === fallbackRegion.toLowerCase().trim() && 
                        d.departamento?.toLowerCase().trim() === fallbackCountry.toLowerCase().trim()
                );
            }
    
            this.indicatorsData.set(filteredData);
        }

        private mpi_dept_url = `${environment.apiAddr}/api/users/ipm-departments`;
        private rawMpiDeptData = signal<MpiDeptItem[]>([]);
        mpiDeptData = signal<MpiDeptItem[]>([]);
    
        fetchMpiDeptData(year?: number, area?: string) {
            if (!isPlatformBrowser(this.platformId)) return;
    
            this.httpClient.get<MpiDeptItem[]>(this.mpi_dept_url).subscribe({
                next: (data) => {
                    if (!data || data.length === 0) return;
    
                    // Guardar la data completa devuelta por el API
                    this.rawMpiDeptData.set(data);
    
                    // Determinar el año y el país a mostrar de forma segura
                    const availableYears = this.getMpiDeptYears();
                    const targetYear = year && availableYears.includes(Number(year))
                        ? Number(year)
                        : availableYears[0];
    
                    const availableAreas = this.getMpiDeptAreasByYear(targetYear);
                    const targetArea = area && availableAreas.some(a => a.toLowerCase() === area.toLowerCase())
                        ? area
                        : availableAreas[0];
    
                    this.loadMpiDeptData(targetYear, targetArea);
                },
                error: (err) => console.error('Error al cargar datos de ipm departamental:', err),
            });
        }
    
        getMpiDeptYears(): number[] {
            const data = this.rawMpiDeptData();
            return [...new Set(data.map((d) => Number(d.anio)))].sort((a, b) => b - a);
        }
    
        getMpiDeptAreasByYear(year?: number): string[] {
            const data = this.rawMpiDeptData();
            if (!year) return [];
    
            return [
                ...new Set(
                    data
                        .filter((d) => Number(d.anio) === Number(year))
                        .map((d) => d.area?.trim())
                        .filter(Boolean) as string[]
                ),
            ].sort();
        }
    
        loadMpiDeptData(year?: number, area?: string) {
            const data = this.rawMpiDeptData();
            // Si no se han descargado los datos aún, llamar a la API
            if (!data || data.length === 0) {
                this.fetchMpiDeptData(year, area);
                return;
            }
    
            // Filtrar según año y área 
            let filteredData = data.filter(
                (d) =>
                    Number(d.anio) === Number(year) &&
                    d.area?.toLowerCase().trim() === String(area).toLowerCase().trim()
            );
    
            // Fallback: si con el año y país solicitados no hay coincidencias, tomar el primer año y área disponibles
            if (filteredData.length === 0 && data.length > 0) {
                const fallbackYear = data[0].anio;
                const fallbackArea = data[0].area;
                filteredData = data.filter(
                    (d) =>
                        Number(d.anio) === Number(fallbackYear) &&
                        d.area?.toLowerCase().trim() === fallbackArea.toLowerCase().trim()
                );
            }
    
            this.mpiDeptData.set(filteredData);
        }

        private mpi_dept_indicators_url = `${environment.apiAddr}/api/users/ipm-department-indicators`;
        private rawMpiDeptIndicatorsData = signal<MpiDeptIndicatorItem[]>([]);
        mpiDeptIndicatorsData = signal<MpiDeptIndicatorItem[]>([]);
    
        fetchMpiDeptIndicatorsData(year?: number, area?: string, dept?: string, ) {
            if (!isPlatformBrowser(this.platformId)) return;
    
            this.httpClient.get<MpiDeptIndicatorItem[]>(this.mpi_dept_indicators_url).subscribe({
                next: (data) => {
                    if (!data || data.length === 0) return;
    
                    // Guardar la data completa devuelta por el API
                    this.rawMpiDeptIndicatorsData.set(data);
    
                    // Determinar el año y el país a mostrar de forma segura
                    const availableYears = this.getMpiDeptIndicatorsYears();
                    const targetYear = year && availableYears.includes(Number(year))
                        ? Number(year)
                        : availableYears[0];
    
                    const availableAreas = this.getMpiDeptIndicatorsAreasByYear(targetYear);
                    const targetArea = area && availableAreas.some(a => a.toLowerCase() === area.toLowerCase())
                        ? area
                        : availableAreas[0];
    
                    const availableDepts = this.getMpiDeptIndicatorsDeptByYearAndArea(targetYear, targetArea);
                    const targetDept = dept && availableDepts.some(c => c.toLowerCase() === dept.toLowerCase())
                        ? dept
                        : availableDepts[0];
    
    
                    this.loadMpiDeptIndicatorsData(targetYear, targetArea, targetDept);
                },
                error: (err) => console.error('Error al cargar datos de pobreza nacional:', err),
            });
        }
    
        getMpiDeptIndicatorsYears(): number[] {
            const data = this.rawMpiDeptIndicatorsData();
            return [...new Set(data.map((d) => Number(d.anio)))].sort((a, b) => b - a);
        }
    
        getMpiDeptIndicatorsAreasByYear(year?: number): string[] {
            const data = this.rawMpiDeptIndicatorsData();
            if (!year) return [];
    
            return [
                ...new Set(
                    data
                        .filter((d) => Number(d.anio) === Number(year))
                        .map((d) => d.area?.trim())
                        .filter(Boolean) as string[]
                ),
            ].sort();
        }
    
        getMpiDeptIndicatorsDeptByYearAndArea(year?: number, area?: string): string[] {
            const data = this.rawIndicatorsData();
            if (!year || !area) return [];
    
            return [
                ...new Set(
                    data
                        .filter(
                            (d) =>
                                Number(d.anio) === Number(year) &&
                                d.region?.toLowerCase().trim() === area.toLowerCase().trim()
                        )
                        .map((d) => d.departamento?.trim())
                        .filter(Boolean) as string[]
                ),
            ].sort();
        }
    
        loadMpiDeptIndicatorsData(year?: number, area?: string, dept?: string) {
            const data = this.rawMpiDeptIndicatorsData();
            // Si no se han descargado los datos aún, llamar a la API
            if (!data || data.length === 0) {
                this.fetchMpiDeptIndicatorsData(year, area, dept);
                return;
            }
    
            // Filtrar según año área y país
            let filteredData = data.filter(
                (d) =>
                    Number(d.anio) === Number(year) &&
                    d.area?.toLowerCase().trim() === String(area).toLowerCase().trim() &&
                    d.departamento?.toLowerCase().trim() === String(dept).toLowerCase().trim()
            );
    
            // Fallback: si con el año y país solicitados no hay coincidencias, tomar el primer año y país disponibles
            if (filteredData.length === 0 && data.length > 0) {
                const fallbackYear = data[0].anio;
                const fallbackArea = data[0].area;
                const fallbackCountry = data[0].departamento;
                filteredData = data.filter(
                    (d) =>
                        Number(d.anio) === Number(fallbackYear) &&
                        d.area?.toLowerCase().trim() === fallbackArea.toLowerCase().trim() && 
                        d.departamento?.toLowerCase().trim() === fallbackCountry.toLowerCase().trim()
                );
            }
    
            this.mpiDeptIndicatorsData.set(filteredData);
        }

    }