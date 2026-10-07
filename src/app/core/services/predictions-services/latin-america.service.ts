import { Service, signal, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { WidgetItem } from '../../../interfaces/ipm.interface';
import { ContributionLatamItem, MultiChartData, NationalPovertyItem, PovertyByAgeItem, StoredWidget, WidgetItemPredict } from '../../../interfaces/predictions.interface';
import { environment } from '../../../../environments/environment.development';
import { isPlatformBrowser } from '@angular/common';
import { forkJoin } from 'rxjs';
import { Prediction } from '../../../pages/prediction-viewer/latin-america-predict/widgets/prediction/prediction';
import { request } from 'http';

const STORAGE_KEY = 'latam_prediction_widgets';

@Service()
export class LatinAmericaService {
    private httpClient = inject(HttpClient);
    private platformId = inject(PLATFORM_ID);
    private isBrowser = isPlatformBrowser(this.platformId);

    widgets = signal<WidgetItemPredict[]>([]);

    // 1. PREDICCIÓN CONTRIBUCIONES 
    private contribution_url = `${environment.apiAddr}/api/users/predictions/contribution_latam`;

    predictContributionMulti(deprivations: string[], country: string, begin_year: number, years: number) {
        if (!this.isBrowser || deprivations.length === 0) {
            return;
        }

        const requests = deprivations.map(privation => {
            const payload = { privation, country, begin_year, years };
            return this.httpClient.post<{ data: ContributionLatamItem[] }>(
                this.contribution_url,
                payload
            );
        });

        forkJoin(requests).subscribe({
            next: (responses) => {
                const validResponses = responses.filter(r => r && r.data && r.data.length > 0);
                if (validResponses.length === 0) {
                    return;
                }

                // Extraer los años del primer llamado
                const labels = validResponses[0].data.map(item => String(item.year));

                // Mapear cada dominio a un dataset
                const datasets = validResponses.map((res, i) => ({
                    label: deprivations[i],
                    data: res.data.map(item => Number(item.predicted_value))
                }));

                const chartData: MultiChartData = { labels, datasets };

                const newWidget: WidgetItemPredict = {
                    id: 1,
                    title: `IPM: ${deprivations.join(', ')} - ${country} (${begin_year} - ${begin_year + years})`,
                    content: Prediction,
                    data: chartData
                }

                this.widgets.update(current => [...current, newWidget]);
                this.saveWidgetsToStorage();

            },
            error: (err) => console.error('Error al consultar contribución:', err)
        });
    }

    private national_poverty_url = `${environment.apiAddr}/api/users/predictions/national_poverty`;

    predictNationalPovertyMulti(country: string, areas: string[], measure: string, begin_year: number, years: number) {
        if (!this.isBrowser || areas.length === 0) {
            return;
        }

        const requests = areas.map(area => {
            const payload = { country, area, measure, begin_year, years };

            return this.httpClient.post<{ data: NationalPovertyItem[] }>(
                this.national_poverty_url,
                payload
            );
        });

        forkJoin(requests).subscribe({
            next: (responses) => {
                const validResponses = responses.filter(r => r && r.data && r.data.length > 0);
                if (validResponses.length === 0) {
                    return;
                }

                // Extraer los años del primer llamado
                const labels = validResponses[0].data.map(item => String(item.year));

                // Mapear cada área a un dataset
                const datasets = validResponses.map((res, i) => ({
                    label: areas[i],
                    data: res.data.map(item => Number(item.predicted_value))
                }));

                const chartData: MultiChartData = { labels, datasets };

                const newWidget: WidgetItemPredict = {
                    id: 1,
                    title: `IPM: ${areas.join(', ')} - ${country} (${begin_year} - ${begin_year + years})`,
                    content: Prediction,
                    data: chartData
                }

                this.widgets.update(current => [...current, newWidget]);
                this.saveWidgetsToStorage();

            },
            error: (err) => console.error('Error al consultar pobreza nacional:', err)
        })
    }

    private poverty_by_age_url = `${environment.apiAddr}/api/users/predictions/poverty_by_age`;

    predictPovertyByAgeMulti(country: string, area: string, age_ranges: string[], begin_year: number, years: number) {
        if (!this.isBrowser || age_ranges.length === 0) {
            return;
        }

        const requests = age_ranges.map(age_range => {
            const payload = { country, area, age_range, begin_year, years };

            return this.httpClient.post<{ data: PovertyByAgeItem[] }>(
                this.poverty_by_age_url,
                payload
            );
        });

        forkJoin(requests).subscribe({
            next: (responses) => {
                const validResponses = responses.filter(r => r && r.data && r.data.length > 0);
                if (validResponses.length === 0) {
                    return;
                }

                // Extraer los años del primer llamado
                const labels = validResponses[0].data.map(item => String(item.year));

                // Mapear cada medida a un dataset
                const datasets = validResponses.map((res, i) => ({
                    label: age_ranges[i],
                    data: res.data.map(item => Number(item.predicted_value))
                }));

                const chartData: MultiChartData = { labels, datasets };

                const newWidget: WidgetItemPredict = {
                    id: 1,
                    title: `IPM: ${age_ranges.join(', ')} - ${country} (${begin_year} - ${begin_year + years})`,
                    content: Prediction,
                    data: chartData
                }

                this.widgets.update(current => [...current, newWidget]);
                this.saveWidgetsToStorage();

            },
            error: (err) => console.error('Error al consultar pobreza por edad:', err)
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
                .map(item => ({
                    id: item.id,
                    title: item.title,
                    content: Prediction,
                    data: item.data
                }));

            this.widgets.set(restoredWidgets);
        } catch (e) {
            console.error('Error al restaurar widgets de localStorage:', e);
        }
    }

}
