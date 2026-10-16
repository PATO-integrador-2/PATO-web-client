import { Service, signal, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ContributionPovertyItem, NationalPovertyItem, PovertyByAgeItem, WidgetItemDash } from '../../../interfaces/ipm.interface';
import { environment } from '../../../../environments/environment.development';
import { isPlatformBrowser } from '@angular/common';
import { ContributionDeprivations } from '../../../pages/dashboard-viewer/latin-america-dash/widgets/contribution-deprivations/contribution-deprivations';
import { PopulationPoverty } from '../../../pages/dashboard-viewer/latin-america-dash/widgets/population-poverty/population-poverty';
import { PovertyByAge } from '../../../pages/dashboard-viewer/latin-america-dash/widgets/poverty-by-age/poverty-by-age';
@Service()
export class LatinAmericaService {
    private httpClient = inject(HttpClient);
    private platformId = inject(PLATFORM_ID);

    widgets = signal<WidgetItemDash[]>([
        {
            id: 1,
            label: 'Contribución relativa de las privaciones a la pobreza multidimensional',
            content: ContributionDeprivations,
            filterFields: ['year', 'country'],
            getYearsSignal: () => this.getContributionYears(),
            getCountriesByYear: (year?: number) => this.getContributionCountriesByYear(year),
            loadData: (f) => {
                const selectedYear = f?.year ?? 2023;
                const selectedCountry = f?.country ?? 'Colombia';
                this.loadDeprivationContributionData(selectedYear, selectedCountry);
            }


        },
        {
            id: 2,
            label: 'Población en situación de pobreza multidimensional (cifras nacionales)',
            content: PopulationPoverty,
            filterFields: ['year', 'area', 'country'],
            getYearsSignal: () => this.getNationalPovertyYears(),
            getCountriesByYear: (year?: number) => this.getNationalPovertyCountriesByYear(year),
            getAreasByYearAndCountry: (year?: number, country?: string) =>
                this.getNationalPovertyAreasByYearAndCountry(year, country),
            loadData: (f) => {
                const selectedYear = f?.year ?? 2024;
                const selectedArea = f?.area ?? 'Urban';
                const selectedCountry = f?.country ?? 'Colombia';
                this.loadNationalPovertyData(selectedYear, selectedArea, selectedCountry);
            }
        },
        {
            id: 3,
            label: 'Incidencia de la pobreza multidimensional por grupo de edad y área',
            content: PovertyByAge,
            filterFields: ['year', 'area', 'country'],
            getYearsSignal: () => this.getPovertyByAgeYears(),
            getCountriesByYear: (year?: number) => this.getPovertyByAgeCountriesByYear(year),
            getAreasByYearAndCountry: (year?: number, country?: string) =>
                this.getPovertyByAgeCountriesByYearAndArea(year, country),
            loadData: (f) => {
                const selectedYear = f?.year ?? 2024;
                const selectedArea = f?.area ?? 'Urban';
                const selectedCountry = f?.country ?? 'Colombia';
                this.loadPovertyByAgeData(selectedYear, selectedArea, selectedCountry);
            }

        },

    ]);

    private contribution_url = `${environment.apiAddr}/api/users/deprivations-contribution`;
    private rawContributionData = signal<ContributionPovertyItem[]>([]);
    contributionData = signal<ContributionPovertyItem[]>([]);

    fetchDeprivationContributionData(year?: number, country?: string) {
        if (!isPlatformBrowser(this.platformId)) return;

        this.httpClient.get<ContributionPovertyItem[]>(this.contribution_url).subscribe({
            next: (data) => {
                if (!data || data.length === 0) return;

                // Guardar todos los datos recibidos
                this.rawContributionData.set(data);

                // Determinar el año y el país a mostrar de forma segura
                const availableYears = this.getContributionYears();
                const targetYear = year && availableYears.includes(Number(year))
                    ? Number(year)
                    : availableYears[0];

                const availableCountries = this.getContributionCountriesByYear(targetYear);
                const targetCountry = country && availableCountries.some(c => c.toLowerCase() === country.toLowerCase())
                    ? country
                    : availableCountries[0];

                // Filtrar y emitir el resultado inicial
                this.loadDeprivationContributionData(targetYear, targetCountry);
            },
            error: (err) => console.error('Error al cargar datos IPM de la API:', err),
        });
    }

    getContributionYears(): number[] {
        const data = this.rawContributionData();
        return [...new Set(data.map((d) => Number(d.anio)))].sort((a, b) => b - a);
    }

    getContributionCountriesByYear(year?: number | string): string[] {
        const data = this.rawContributionData();
        if (!year) return [];

        return [
            ...new Set(
                data
                    .filter((d) => Number(d.anio) === Number(year))
                    .map((d) => d.pais?.trim())
                    .filter(Boolean) as string[]
            ),
        ].sort();
    }

    loadDeprivationContributionData(year: number, country: string) {
        const data = this.rawContributionData();

        // Si no se han descargado los datos aún, llamar a la API
        if (data.length === 0) {
            this.fetchDeprivationContributionData(year, country);
            return;
        }


        let filteredData = data.filter(
            (d) =>
                Number(d.anio) === Number(year) &&
                d.pais?.toLowerCase().trim() === String(country).toLowerCase().trim()
        );

        // Fallback: si con el año y país solicitados no hay coincidencias, tomar el primer año y país disponibles
        if (filteredData.length === 0 && data.length > 0) {
            const fallbackYear = data[0].anio;
            const fallbackCountry = data[0].pais;
            filteredData = data.filter(
                (d) => Number(d.anio) === Number(fallbackYear) && d.pais === fallbackCountry
            );
        }

        this.contributionData.set(filteredData);
    }


    private national_poverty_url = `${environment.apiAddr}/api/users/national-poverty`;
    rawNationalPovertyData = signal<NationalPovertyItem[]>([]);
    nationalPovertyData = signal<NationalPovertyItem[]>([]);

    fetchNationalPovertyData(year?: number, area?: string, country?: string,) {
        if (!isPlatformBrowser(this.platformId)) return;

        this.httpClient.get<NationalPovertyItem[]>(this.national_poverty_url).subscribe({
            next: (data) => {
                if (!data || data.length === 0) return;

                // Guardar la data completa devuelta por el API
                this.rawNationalPovertyData.set(data);

                // Determinar el año y el país a mostrar de forma segura
                const availableYears = this.getNationalPovertyYears();
                const targetYear = year && availableYears.includes(Number(year))
                    ? Number(year)
                    : availableYears[0];

                const availableCountries = this.getNationalPovertyCountriesByYear(targetYear);
                const targetCountry = country && availableCountries.some(c => c.toLowerCase() === country.toLowerCase())
                    ? country
                    : availableCountries[0];

                const availableAreas = this.getNationalPovertyAreasByYearAndCountry(targetYear, targetCountry);
                const targetArea = area && availableAreas.some(a => a.toLowerCase() === area.toLowerCase())
                    ? area
                    : availableAreas[0];




                this.loadNationalPovertyData(targetYear, targetCountry, targetArea);
            },
            error: (err) => console.error('Error al cargar datos de pobreza nacional:', err),
        });
    }

    // 2. Funciones Auxiliares para los Selectores del Modal
    getNationalPovertyYears(): number[] {
        const data = this.rawNationalPovertyData();
        return [...new Set(data.map((d) => Number(d.anio)))].sort((a, b) => b - a);
    }

    getNationalPovertyCountriesByYear(year?: number): string[] {
        const data = this.rawNationalPovertyData();
        if (!year) return [];

        return [
            ...new Set(
                data
                    .filter((d) => Number(d.anio) === Number(year))
                    .map((d) => d.pais?.trim())
                    .filter(Boolean) as string[]
            ),
        ].sort();
    }

    getNationalPovertyAreasByYearAndCountry(year?: number, country?: string): string[] {
        const data = this.rawNationalPovertyData();
        if (!year || !country) return [];

        return [
            ...new Set(
                data
                    .filter(
                        (d) =>
                            Number(d.anio) === Number(year) &&
                            d.pais?.toLowerCase().trim() === country.toLowerCase().trim()
                    )
                    .map((d) => d.area_geografica?.trim())
                    .filter(Boolean) as string[]
            ),
        ].sort();
    }

    // 3. Método de filtrado síncrono (llamado por el modal y al inicio)
    loadNationalPovertyData(year?: number, country?: string, area?: string) {
        const data = this.rawNationalPovertyData();

        // Si no se han descargado los datos aún, llamar a la API
        if (!data || data.length === 0) {
            this.fetchNationalPovertyData(year, country, area);
            return;
        }

        // Filtrar según año área y país
        let filteredData = data.filter(
            (d) =>
                Number(d.anio) === Number(year) &&
                d.area_geografica?.toLowerCase().trim() === String(area).toLowerCase().trim() &&
                d.pais?.toLowerCase().trim() === String(country).toLowerCase().trim()
        );

        // Fallback: si con el año y país solicitados no hay coincidencias, tomar el primer año y país disponibles
        if (filteredData.length === 0 && data.length > 0) {
            const fallbackYear = data[0].anio;
            const fallbackCountry = data[0].pais;
            const fallbackArea = data[0].area_geografica;
            filteredData = data.filter(
                (d) =>
                    Number(d.anio) === Number(fallbackYear) &&
                    d.pais?.toLowerCase().trim() === fallbackArea.toLowerCase().trim() &&
                    d.area_geografica?.toLowerCase().trim() === fallbackCountry.toLowerCase().trim()
            );
        }

        this.nationalPovertyData.set(filteredData);
    }



    private poverty_by_age_url = `${environment.apiAddr}/api/users/poverty-by-age`;
    rawpovertyByAgeData = signal<PovertyByAgeItem[]>([]);
    povertyByAgeData = signal<PovertyByAgeItem[]>([]);

    fetchPovertyByAgeData(year?: number, area?: string, country?: string,) {
        if (!isPlatformBrowser(this.platformId)) return;

        this.httpClient.get<PovertyByAgeItem[]>(this.poverty_by_age_url).subscribe({
            next: (data) => {
                if (!data || data.length === 0) return;

                // Guardar la data completa devuelta por el API
                this.rawpovertyByAgeData.set(data);

                // Determinar el año y el país a mostrar de forma segura
                const availableYears = this.getPovertyByAgeYears();
                const targetYear = year && availableYears.includes(Number(year))
                    ? Number(year)
                    : availableYears[0];

                const availableCountries = this.getPovertyByAgeCountriesByYear(targetYear);
                const targetCountry = country && availableCountries.some(a => a.toLowerCase() === country.toLowerCase())
                    ? country
                    : availableCountries[0];

                const availableAreas = this.getPovertyByAgeCountriesByYearAndArea(targetYear, targetCountry);
                const targetArea = area && availableAreas.some(c => c.toLowerCase() === area.toLowerCase())
                    ? area
                    : availableAreas[0];


                this.loadPovertyByAgeData(targetYear, targetCountry, targetArea);
            },
            error: (err) => console.error('Error al cargar datos de pobreza nacional:', err),
        });
    }

    getPovertyByAgeYears(): number[] {
        const data = this.rawpovertyByAgeData();
        return [...new Set(data.map((d) => Number(d.anio)))].sort((a, b) => b - a);
    }

    getPovertyByAgeCountriesByYear(year?: number): string[] {
        const data = this.rawpovertyByAgeData();
        if (!year) return [];

        return [
            ...new Set(
                data
                    .filter((d) => Number(d.anio) === Number(year))
                    .map((d) => d.pais?.trim())
                    .filter(Boolean) as string[]
            ),
        ].sort();
    }

    getPovertyByAgeCountriesByYearAndArea(year?: number, country?: string): string[] {
        const data = this.rawpovertyByAgeData();
        if (!year || !country) return [];

        return [
            ...new Set(
                data
                    .filter(
                        (d) =>
                            Number(d.anio) === Number(year) &&
                            d.pais?.toLowerCase().trim() === country.toLowerCase().trim()
                    )
                    .map((d) => d.area_geografica?.trim())
                    .filter(Boolean) as string[]
            ),
        ].sort();
    }

    loadPovertyByAgeData(year?: number, country?: string, area?: string) {
        const data = this.rawpovertyByAgeData();
        // Si no se han descargado los datos aún, llamar a la API
        if (!data || data.length === 0) {
            this.fetchPovertyByAgeData(year, country, area);
            return;
        }

        // Filtrar según año área y país
        let filteredData = data.filter(
            (d) =>
                Number(d.anio) === Number(year) &&
                d.pais?.toLowerCase().trim() === String(country).toLowerCase().trim() &&
                d.area_geografica?.toLowerCase().trim() === String(area).toLowerCase().trim()
        );

        // Fallback: si con el año y país solicitados no hay coincidencias, tomar el primer año y país disponibles
        if (filteredData.length === 0 && data.length > 0) {
            const fallbackYear = data[0].anio;
            const fallbackCountry = data[0].pais;
            const fallbackArea = data[0].area_geografica;
            filteredData = data.filter(
                (d) =>
                    Number(d.anio) === Number(fallbackYear) &&
                    d.pais?.toLowerCase().trim() === fallbackArea.toLowerCase().trim() &&
                    d.area_geografica?.toLowerCase().trim() === fallbackCountry.toLowerCase().trim()
            );
        }

        this.povertyByAgeData.set(filteredData);
    }


}
