import { Service, signal, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { DeprivationsItem, WidgetItem, IntensityPovertyItem, ContributionImpactItem, MpiSexItem, MpiBossSexItem, WidgetItemDash, MpiItem } from '../../../interfaces/ipm.interface';
import { environment } from '../../../../environments/environment.development';
import { RadarDeprivations } from '../../../pages/dashboard-viewer/col-national-dash/widgets/radar-deprivations/radar-deprivations';
import { MpiSex } from '../../../pages/dashboard-viewer/col-national-dash/widgets/mpi-sex/mpi-sex';
import { IntensityPoverty } from '../../../pages/dashboard-viewer/col-national-dash/widgets/intensity-poverty/intensity-poverty';
import { MpiBossSex } from '../../../pages/dashboard-viewer/col-national-dash/widgets/mpi-boss-sex/mpi-boss-sex';
import { isPlatformBrowser } from '@angular/common';
import { Mpi } from '../../../pages/dashboard-viewer/col-national-dash/widgets/mpi/mpi';
import { ContributionsImpact } from '../../../pages/dashboard-viewer/col-national-dash/widgets/contributions-impact/contributions-impact';
import { signalGetFn } from '@angular/core/primitives/signals';

@Service()
export class ColNationalService {
    private httpClient = inject(HttpClient);
    private platformId = inject(PLATFORM_ID);

    widgets = signal<WidgetItemDash[]>([
        {
            id: 1,
            label: 'Incidencia de Pobreza Multidimensional',
            content: Mpi,
            filterFields: ['year'],
            getYearsSignal: () => this.getMpiYears(),
            loadData: (f) => {
                const selectedYear = f?.year ?? 2025;
                this.loadMpiData(selectedYear);
            }
        },
        {
            id: 2,
            label: 'Privaciones por hogar',
            content: RadarDeprivations,
            filterFields: ['year', 'domain'],
            getYearsSignal: () => this.getDeprivationsYears(),
            getDomainsByYear: (year?: number) => this.getDeprivationsDomainsByYear(year),
            loadData: (f) => {
                const selectedYear = f?.year ?? 2024;
                const selectedDomain = f?.domain ?? 'Cabeceras';
                this.loadDeprivationsData(selectedYear, selectedDomain);
            }
        },
        {
            id: 3,
            label: 'Incidencia de Pobreza Multidimensioanl según sexo de la persona ',
            content: MpiSex,
            filterFields: ['domain'],
            getDomainsSignal: () => this.getMpiSexDomains(),
            loadData: (f) => {
                const selectedDomain = f?.domain ?? 'Antioquia';
                this.loadMpiSexData(selectedDomain);
            }

        },
        {
            id: 4,
            label: 'Contribuciones a la incidencia Ajustada del IPM',
            content: ContributionsImpact,
            filterFields: ['year', 'domain'],
            getYearsSignal: () => this.getContributionImpactYears(),
            getDomainsByYear: (year?: number) => this.getContributionImpactDomainsByYear(year),
            loadData: (f) => {
                const selectedYear = f?.year ?? 2025;
                const selectedDomain = f?.domain ?? 'Nacional';
                this.loadContributionImpactData(selectedYear, selectedDomain);
            }
        },
        {
            id: 5,
            label: 'Proporción de privaciones entre las personas en situación de Pobreza Multidimensional',
            content: IntensityPoverty,
            filterFields: ['year'],
            getYearsSignal: () => this.getIntensityPovertyYears(),
            loadData: (f) => {
                const selectedYear = f?.year ?? 2025;
                this.loadIntensityPovertyData(selectedYear);
            }
        },

        {
            id: 6,
            label: 'Incidencia de Pobreza Multidimensioanl según sexo del jefe del hogar',
            content: MpiBossSex,
            filterFields: ['domain'],
            getDomainsSignal: () => this.getMpiBossSexDomains(),
            loadData: (f) => {
                const selectedDomain = f?.domain ?? 'Antioquia';
                this.loadMpiBossSexData(selectedDomain);
            }

        },

    ]);

    private mpi_url = `${environment.apiAddr}/api/users/ipm-by-domain`;
    private rawMpiData = signal<MpiItem[]>([]);
    mpiData = signal<MpiItem[]>([]);

    fetchMpiData(year?: number) {
        if (!isPlatformBrowser(this.platformId)) return;

        this.httpClient.get<MpiItem[]>(this.mpi_url).subscribe({
            next: (data) => {
                if (!data || data.length === 0) return;

                // Guardar todos los datos recibidos
                this.rawMpiData.set(data);

                // Determinar el año 
                const availableYears = this.getMpiYears();
                const targetYear = year && availableYears.includes(Number(year))
                    ? Number(year)
                    : availableYears[0];

                // Filtrar y emitir el resultado inicial
                this.loadMpiData(targetYear,);
            },
            error: (err) => console.error('Error al cargar datos IPM de la API:', err),
        });
    }

    getMpiYears(): number[] {
        const data = this.rawMpiData();
        return [...new Set(data.map((d) => Number(d.anio)))].sort((a, b) => b - a);
    }

    loadMpiData(year: number) {
        const data = this.rawMpiData();

        // Si no se han descargado los datos aún, llamar a la API
        if (data.length === 0) {
            this.fetchMpiData(year);
            return;
        }


        let filteredData = data.filter(
            (d) =>
                Number(d.anio) === Number(year)
        );

        // Fallback: si con el año y país solicitados no hay coincidencias, tomar el primer año y país disponibles
        if (filteredData.length === 0 && data.length > 0) {
            const fallbackYear = data[0].anio;
            filteredData = data.filter(
                (d) => Number(d.anio) === Number(fallbackYear)
            );
        }

        this.mpiData.set(filteredData);
    }

    private deprivations_url = `${environment.apiAddr}/api/users/deprivations-by-variable`;
    rawDeprivationsData = signal<DeprivationsItem[]>([]);
    deprivationsData = signal<DeprivationsItem[]>([]);

    fetchDeprivationsData(year?: number, domain?: string) {
        if (!isPlatformBrowser(this.platformId)) return;

        this.httpClient.get<DeprivationsItem[]>(this.deprivations_url).subscribe({
            next: (data) => {
                if (!data || data.length === 0) return;

                // Guardar todos los datos recibidos
                this.rawDeprivationsData.set(data);

                // Determinar el año y el dominio a mostrar de forma segura
                const availableYears = this.getDeprivationsYears();
                const targetYear = year && availableYears.includes(Number(year))
                    ? Number(year)
                    : availableYears[0];

                const availableDomains = this.getDeprivationsDomainsByYear(targetYear);
                const targetDomain = domain && availableDomains.some(c => c.toLowerCase() === domain.toLowerCase())
                    ? domain
                    : availableDomains[0];

                // Filtrar y emitir el resultado inicial
                this.loadDeprivationsData(targetYear, targetDomain);
            },
            error: (err) => console.error('Error al cargar datos IPM de la API:', err),
        });
    }

    getDeprivationsYears(): number[] {
        const data = this.rawDeprivationsData();
        return [...new Set(data.map((d) => Number(d.anio)))].sort((a, b) => b - a);
    }

    getDeprivationsDomainsByYear(year?: number | string): string[] {
        const data = this.rawDeprivationsData();
        if (!year) return [];

        return [
            ...new Set(
                data
                    .filter((d) => Number(d.anio) === Number(year))
                    .map((d) => d.dominio?.trim())
                    .filter(Boolean) as string[]
            ),
        ].sort();
    }

    loadDeprivationsData(year: number, domain: string) {
        const data = this.rawDeprivationsData();

        // Si no se han descargado los datos aún, llamar a la API
        if (data.length === 0) {
            this.fetchDeprivationsData(year, domain);
            return;
        }

        let filteredData = data.filter(
            (d) =>
                Number(d.anio) === Number(year) &&
                d.dominio?.toLowerCase().trim() === String(domain).toLowerCase().trim()
        );

        // Fallback: si con el año y país solicitados no hay coincidencias, tomar el primer año y país disponibles
        if (filteredData.length === 0 && data.length > 0) {
            const fallbackYear = data[0].anio;
            const fallbackCountry = data[0].dominio;
            filteredData = data.filter(
                (d) => Number(d.anio) === Number(fallbackYear) && d.dominio === fallbackCountry
            );
        }

        this.deprivationsData.set(filteredData);
    }

    private intensity_poverty_url = `${environment.apiAddr}/api/users/average-deprivations`;
    private rawIntensityPovertyData = signal<IntensityPovertyItem[]>([]);
    intensityPovertyData = signal<IntensityPovertyItem[]>([]);

    fetchIntensityPovertyData(year?: number) {
        if (!isPlatformBrowser(this.platformId)) return;

        this.httpClient.get<IntensityPovertyItem[]>(this.intensity_poverty_url).subscribe({
            next: (data) => {
                if (!data || data.length === 0) return;

                // Guardar todos los datos recibidos
                this.rawIntensityPovertyData.set(data);

                // Determinar el año 
                const availableYears = this.getMpiYears();
                const targetYear = year && availableYears.includes(Number(year))
                    ? Number(year)
                    : availableYears[0];

                // Filtrar y emitir el resultado inicial
                this.loadIntensityPovertyData(targetYear,);
            },
            error: (err) => console.error('Error al cargar datos intensidad de pobreza de la API:', err),
        });
    }

    getIntensityPovertyYears(): number[] {
        const data = this.rawIntensityPovertyData();
        return [...new Set(data.map((d) => Number(d.anio)))].sort((a, b) => b - a);
    }

    loadIntensityPovertyData(year: number) {
        const data = this.rawIntensityPovertyData();

        // Si no se han descargado los datos aún, llamar a la API
        if (data.length === 0) {
            this.fetchIntensityPovertyData(year);
            return;
        }


        let filteredData = data.filter(
            (d) =>
                Number(d.anio) === Number(year)
        );

        // Fallback: si con el año y país solicitados no hay coincidencias, tomar el primer año y país disponibles
        if (filteredData.length === 0 && data.length > 0) {
            const fallbackYear = data[0].anio;
            filteredData = data.filter(
                (d) => Number(d.anio) === Number(fallbackYear)
            );
        }

        this.intensityPovertyData.set(filteredData);
    }

    private contribution_impact_url = `${environment.apiAddr}/api/users/dimension-contribution`;
    rawContributionImpactData = signal<ContributionImpactItem[]>([]);
    contributionImpactData = signal<ContributionImpactItem[]>([]);

    fetchContributionImpactData(year?: number, domain?: string) {
        if (!isPlatformBrowser(this.platformId)) return;

        this.httpClient.get<ContributionImpactItem[]>(this.contribution_impact_url).subscribe({
            next: (data) => {
                if (!data || data.length === 0) return;

                // Guardar todos los datos recibidos
                this.rawContributionImpactData.set(data);

                // Determinar el año y el dominio a mostrar de forma segura
                const availableYears = this.getContributionImpactYears();
                const targetYear = year && availableYears.includes(Number(year))
                    ? Number(year)
                    : availableYears[0];

                const availableDomains = this.getContributionImpactDomainsByYear(targetYear);
                const targetDomain = domain && availableDomains.some(c => c.toLowerCase() === domain.toLowerCase())
                    ? domain
                    : availableDomains[0];

                // Filtrar y emitir el resultado inicial
                this.loadContributionImpactData(targetYear, targetDomain);
            },
            error: (err) => console.error('Error al cargar datos IPM de la API:', err),
        });
    }

    getContributionImpactYears(): number[] {
        const data = this.rawContributionImpactData();
        return [...new Set(data.map((d) => Number(d.anio)))].sort((a, b) => b - a);
    }

    getContributionImpactDomainsByYear(year?: number | string): string[] {
        const data = this.rawContributionImpactData();
        if (!year) return [];

        return [
            ...new Set(
                data
                    .filter((d) => Number(d.anio) === Number(year))
                    .map((d) => d.dominio?.trim())
                    .filter(Boolean) as string[]
            ),
        ].sort();
    }

    loadContributionImpactData(year: number, domain: string) {
        const data = this.rawContributionImpactData();

        // Si no se han descargado los datos aún, llamar a la API
        if (data.length === 0) {
            this.fetchContributionImpactData(year, domain);
            return;
        }

        let filteredData = data.filter(
            (d) =>
                Number(d.anio) === Number(year) &&
                d.dominio?.toLowerCase().trim() === String(domain).toLowerCase().trim()
        );

        // Fallback: si con el año y país solicitados no hay coincidencias, tomar el primer año y país disponibles
        if (filteredData.length === 0 && data.length > 0) {
            const fallbackYear = data[0].anio;
            const fallbackCountry = data[0].dominio;
            filteredData = data.filter(
                (d) => Number(d.anio) === Number(fallbackYear) && d.dominio === fallbackCountry
            );
        }

        this.contributionImpactData.set(filteredData);
    }

    private mpi_sex_url = `${environment.apiAddr}/api/users/incidence-by-person-sex`;
    rawMpiSexData = signal<MpiSexItem[]>([]);
    mpiSexData = signal<MpiSexItem[]>([]);

    fetchMpiSexData(domain?: string) {
        if (!isPlatformBrowser(this.platformId)) return;

        this.httpClient.get<MpiSexItem[]>(this.mpi_sex_url).subscribe({
            next: (data) => {
                if (!data || data.length === 0) return;

                // Guardar todos los datos recibidos
                this.rawMpiSexData.set(data);

                // Determinar el dominio a mostrar
                const availableDomains = this.getMpiSexDomains();
                const targetDomain = domain && availableDomains.some(c => c.toLowerCase() === domain.toLowerCase())
                    ? domain
                    : availableDomains[0];

                // Filtrar y emitir el resultado inicial
                this.loadMpiSexData(targetDomain);
            },
            error: (err) => console.error('Error al cargar datos de ipm por sexo de la API:', err),
        });
    }

    getMpiSexDomains(): string[] {
        const data = this.rawMpiSexData();
        return [
            ...new Set(
                data
                    .map((d) => d.dominio?.trim())
                    .filter(Boolean) as string[]
            ),
        ].sort();
    }

    loadMpiSexData(domain: string) {
        const data = this.rawMpiSexData();

        // Si no se han descargado los datos aún, llamar a la API
        if (data.length === 0) {
            this.fetchMpiSexData(domain);
            return;
        }

        let filteredData = data.filter(
            (d) =>
                d.dominio?.toLowerCase().trim() === String(domain).toLowerCase().trim()
        );

        // Fallback: si con el año y país solicitados no hay coincidencias, tomar el primer año y país disponibles
        if (filteredData.length === 0 && data.length > 0) {
            const fallbackDomain = data[0].dominio;
            filteredData = data.filter(
                (d) => d.dominio === fallbackDomain
            );
        }

        this.mpiSexData.set(filteredData);
    }

    private mpi_boss_sex_url = `${environment.apiAddr}/api/users/incidence-by-household-head-sex`;
    rawMpiBossSexData = signal<MpiBossSexItem[]>([]);
    mpiBossSexData = signal<MpiBossSexItem[]>([]);

    fetchMpiBossSexData(domain?: string) {
        if (!isPlatformBrowser(this.platformId)) return;

        this.httpClient.get<MpiBossSexItem[]>(this.mpi_boss_sex_url).subscribe({
            next: (data) => {
                if (!data || data.length === 0) return;

                // Guardar todos los datos recibidos
                this.rawMpiBossSexData.set(data);

                // Determinar el dominio a mostrar
                const availableDomains = this.getMpiBossSexDomains();
                const targetDomain = domain && availableDomains.some(c => c.toLowerCase() === domain.toLowerCase())
                    ? domain
                    : availableDomains[0];

                // Filtrar y emitir el resultado inicial
                this.loadMpiBossSexData(targetDomain);
            },
            error: (err) => console.error('Error al cargar datos de ipm por sexo de jefe del hogar la API:', err),
        });
    }

    getMpiBossSexDomains(): string[] {
        const data = this.rawMpiBossSexData();
        return [
            ...new Set(
                data
                    .map((d) => d.dominio?.trim())
                    .filter(Boolean) as string[]
            ),
        ].sort();
    }

    loadMpiBossSexData(domain: string) {
        const data = this.rawMpiBossSexData();

        // Si no se han descargado los datos aún, llamar a la API
        if (data.length === 0) {
            this.fetchMpiBossSexData(domain);
            return;
        }

        let filteredData = data.filter(
            (d) =>
                d.dominio?.toLowerCase().trim() === String(domain).toLowerCase().trim()
        );

        // Fallback: si con el año y país solicitados no hay coincidencias, tomar el primer año y país disponibles
        if (filteredData.length === 0 && data.length > 0) {
            const fallbackDomain = data[0].dominio;
            filteredData = data.filter(
                (d) => d.dominio === fallbackDomain
            );
        }

        this.mpiBossSexData.set(filteredData);
    }

}
