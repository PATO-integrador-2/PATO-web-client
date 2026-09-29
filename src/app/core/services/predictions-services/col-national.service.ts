import { Service, signal, inject, PLATFORM_ID, Type } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../environments/environment.development';
import { isPlatformBrowser } from '@angular/common';
import { Mpi } from '../../../pages/prediction-viewer/col-national-predict/widgets/mpi/mpi';

import {
    MpiItem,
    DeprivationsItem,
    PercentageItem,
    MultiChartData,
    WidgetItemPredict,
    StoredWidget,
    DimensionItem,
    IncidenceBySexItem,
    IncidenceByHeadSexItem
} from '../../../interfaces/predictions.interface';
import { forkJoin } from 'rxjs';

const COMPONENT_MAP: Record<string, Type<unknown>> = {
    Mpi: Mpi,
    Deprivations: Mpi,
    Percentage: Mpi,
    Dimension: Mpi,
    IncidenceBySex: Mpi,
    IncidenceByHeadSex: Mpi,
};

const STORAGE_KEY = 'col_national_dashboard_widgets';

@Service()
export class ColNationalService {
    private httpClient = inject(HttpClient);
    private platformId = inject(PLATFORM_ID);
    private isBrowser = isPlatformBrowser(this.platformId);

    widgets = signal<WidgetItemPredict[]>([]);

    constructor() {
        if (this.isBrowser) {
            this.loadWidgetsFromStorage();
        }
    }

    // 1. PREDICCIÓN IPM 
    private mpi_url = `${environment.apiAddr}/api/users/predictions/ipm`;

    predictMpiMulti(domains: string[], begin_year: number, years: number) {
        if (!this.isBrowser || domains.length === 0) return;

        const requests = domains.map(domain => {
            const payload = { domain, begin_year, years };
            return this.httpClient.post<{ data: MpiItem[] }>(
                this.mpi_url,
                payload
            );
        });

        forkJoin(requests).subscribe({
            next: (responses) => {
                const validResponses = responses.filter(r => r && r.data && r.data.length > 0);
                if (validResponses.length === 0) return;

                // Extraer los años del primer llamado
                const labels = validResponses[0].data.map(item => String(item.año));

                // Mapear cada dominio a un dataset
                const datasets = validResponses.map((res, i) => ({
                    label: domains[i],
                    data: res.data.map(item => Number(item.ipm_predicho))
                }));

                const chartData: MultiChartData = { labels, datasets };

                const newWidget: WidgetItemPredict = {
                    id: Date.now(),
                    label: 'Mpi',
                    title: `IPM: ${domains.join(', ')} (${begin_year} - ${begin_year + years})`,
                    content: Mpi,
                    data: chartData
                };

                this.widgets.update(current => [...current, newWidget]);
                this.saveWidgetsToStorage();
            },
            error: (err) => console.error('Error al consultar IPM:', err)
        });
    }

    // 2. PREDICCIÓN PRIVACIONES
    private deprivations_url = `${environment.apiAddr}/api/users/predictions/privacion`;
    predictDeprivationsMulti(variables: string[], domain: string, begin_year: number, years: number) {
        if (!this.isBrowser || variables.length === 0) return;

        const requests = variables.map(variable => {
            const payload = { variable, domain, begin_year, years };
            return this.httpClient.post<{ data: DeprivationsItem[] }>(
                this.deprivations_url,
                payload
            );
        });

        forkJoin(requests).subscribe({
            next: (responses) => {
                const validResponses = responses.filter(r => r && r.data && r.data.length > 0);
                if (validResponses.length === 0) return;

                const labels = validResponses[0].data.map(item => String(item.year));

                const datasets = validResponses.map((res, i) => ({
                    label: `${variables[i]}`,
                    data: res.data.map(item => Number(item.ipm_foretold))
                }));

                const chartData: MultiChartData = { labels, datasets };

                const newWidget: WidgetItemPredict = {
                    id: Date.now(),
                    label: 'Deprivations',
                    title: `Privaciones (${domain}): ${variables.join(', ')}`,
                    content: Mpi,
                    data: chartData
                };

                this.widgets.update(current => [...current, newWidget]);
                this.saveWidgetsToStorage();
            },
            error: (err) => console.error('Error al consultar privaciones:', err)
        });
    }

    // 3. PREDICCIÓN PORCENTAJE
    private percentage_url = `${environment.apiAddr}/api/users/predictions/porcentaje`;
    predictPercentageMulti(domains: string[], begin_year: number, years: number) {
        if (!this.isBrowser || domains.length === 0) return;

        const requests = domains.map(domain => {
            const payload = { domain, begin_year, years };
            return this.httpClient.post<{ data: PercentageItem[] }>(
                this.percentage_url,
                payload
            );
        });

        forkJoin(requests).subscribe({
            next: (responses) => {
                const validResponses = responses.filter(r => r && r.data && r.data.length > 0);
                if (validResponses.length === 0) return;

                const labels = validResponses[0].data.map(item => String(item.año));

                const datasets = validResponses.map((res, i) => ({
                    label: `${domains[i]}`,
                    data: res.data.map(item => Number(item.porcentaje_privaciones))
                }));

                const chartData: MultiChartData = { labels, datasets };

                const newWidget: WidgetItemPredict = {
                    id: Date.now(),
                    label: 'Percentage',
                    title: `Porcentaje de privaciones (${domains.join(', ')} (${begin_year} - ${begin_year + years})`,
                    content: Mpi,
                    data: chartData
                }

                this.widgets.update(current => [...current, newWidget]);
                this.saveWidgetsToStorage();
            },

            error: (err) => console.error('Error al consultar privaciones:', err)
        })
    }

    // 4. PREDICCIÓN DIMENSIÓN
    private dimension_url = `${environment.apiAddr}/api/users/predictions/dimension`;

    predictDimensionsMulti(dimensions: string[], domain: string, begin_year: number, years: number) {
        if (!this.isBrowser || dimensions.length === 0) return;

        const requests = dimensions.map(dimension => {
            const payload = { dimension, domain, begin_year, years };
            return this.httpClient.post<{ data: DimensionItem[] }>(
                this.dimension_url,
                payload
            );
        });

        forkJoin(requests).subscribe({
            next: (responses) => {
                const validResponses = responses.filter(r => r && r.data && r.data.length > 0);
                if (validResponses.length === 0) return;

                const labels = validResponses[0].data.map(item => String(item.year));

                const datasets = validResponses.map((res, i) => ({
                    label: `${dimensions[i]} (${domain})`,
                    data: res.data.map(item => Number(item.percentage_contribution))
                }));

                const chartData: MultiChartData = { labels, datasets };

                const newWidget: WidgetItemPredict = {
                    id: Date.now(),
                    label: 'Dimension',
                    title: `Predicción de contribución a la incidencia Ajustada del IPM por dimensión (${domain}): ${dimensions.join(', ')}`,
                    content: Mpi,
                    data: chartData
                };

                this.widgets.update(current => [...current, newWidget]);
                this.saveWidgetsToStorage();
            },
            error: (err) => console.error('Error al consultar privaciones:', err)
        });
    }

    // 5. PREDICCIÓN INCIDENCIA POR SEXO
    private incidence_by_sex_url = `${environment.apiAddr}/api/users/predictions/incidence_by_sex`;
    predictIncidenceBySexMulti(domains: string[], sex: string, begin_year: number, years: number) {
        if (!this.isBrowser || domains.length === 0) return;

        const requests = domains.map(domain => {
            const payload = { domain, sex, begin_year, years };
            return this.httpClient.post<{ data: IncidenceBySexItem[] }>(
                this.incidence_by_sex_url,
                payload
            );
        });

        forkJoin(requests).subscribe({
            next: (responses) => {
                const validResponses = responses.filter(r => r && r.data && r.data.length > 0);
                if (validResponses.length === 0) return;

                const labels = validResponses[0].data.map(item => String(item.year));

                const datasets = validResponses.map((res, i) => ({
                    label: `${domains[i]} (${sex})`,
                    data: res.data.map(item => Number(item.predicted_percentage))
                }));

                const chartData: MultiChartData = { labels, datasets };

                const newWidget: WidgetItemPredict = {
                    id: Date.now(),
                    label: 'IncidenceBySex',
                    title: `Incidencia de Pobreza Multidimensioanl según sexo de la persona (${domains.join(', ')} (${begin_year} - ${begin_year + years})`,
                    content: Mpi,
                    data: chartData
                }

                this.widgets.update(current => [...current, newWidget]);
                this.saveWidgetsToStorage();
            },

            error: (err) => console.error('Error al consultar privaciones:', err)
        })
    }

    // 6. PREDICCIÓN INCIDENCIA POR SEXO JEFE DE HOGAR
    private incidence_by_head_sex_url = `${environment.apiAddr}/api/users/predictions/incidence_by_head_sex`;
    predictIncidenceByHeadSexMulti(domains: string[], sex: string, begin_year: number, years: number) {
        if (!this.isBrowser || domains.length === 0) return;

        const requests = domains.map(domain => {
            const payload = { domain, sex, begin_year, years };
            return this.httpClient.post<{ data: IncidenceByHeadSexItem[] }>(
                this.incidence_by_head_sex_url,
                payload
            );
        });

        forkJoin(requests).subscribe({
            next: (responses) => {
                const validResponses = responses.filter(r => r && r.data && r.data.length > 0);
                if (validResponses.length === 0) return;

                const labels = validResponses[0].data.map(item => String(item.year));

                const datasets = validResponses.map((res, i) => ({
                    label: `${domains[i]} (${sex})`,
                    data: res.data.map(item => Number(item.predicted_percentage))
                }));

                const chartData: MultiChartData = { labels, datasets };

                const newWidget: WidgetItemPredict = {
                    id: Date.now(),
                    label: 'IncidenceByHeadSex',
                    title: `Incidencia de Pobreza Multidimensioanl según sexo del jefe del hogar (${domains.join(', ')} (${begin_year} - ${begin_year + years})`,
                    content: Mpi,
                    data: chartData
                }

                this.widgets.update(current => [...current, newWidget]);
                this.saveWidgetsToStorage();
            },

            error: (err) => console.error('Error al consultar privaciones:', err)
        })
    }


    // ELIMINAR WIDGET
    removeWidget(id: number) {
        this.widgets.update(current => current.filter(w => w.id !== id));
        this.saveWidgetsToStorage();
    }

    // PERSISTENCIA EN LOCALSTORAGE
    private saveWidgetsToStorage() {
        if (!this.isBrowser) return;

        const storedData: StoredWidget[] = this.widgets().map(w => ({
            id: w.id,
            type: w.label,
            title: w.title,
            data: w.data
        }));

        localStorage.setItem(STORAGE_KEY, JSON.stringify(storedData));
    }

    private loadWidgetsFromStorage() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (!saved) return;

            const parsed: StoredWidget[] = JSON.parse(saved);

            const restoredWidgets: WidgetItemPredict[] = parsed
                .filter(item => COMPONENT_MAP[item.type])
                .map(item => ({
                    id: item.id,
                    label: item.type,
                    title: item.title,
                    content: COMPONENT_MAP[item.type],
                    data: item.data
                }));

            this.widgets.set(restoredWidgets);
        } catch (e) {
            console.error('Error al restaurar widgets de localStorage:', e);
        }
    }

}

