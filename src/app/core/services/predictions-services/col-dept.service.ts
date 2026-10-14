import { Service, signal, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ContributionLatamItem, MultiChartData, NationalPovertyItem, PovertyByAgeItem, StoredWidget, WidgetItemPredict } from '../../../interfaces/predictions.interface';
import { environment } from '../../../../environments/environment.development';
import { isPlatformBrowser } from '@angular/common';
import { forkJoin } from 'rxjs';
import { PredictWidget } from '../../../pages/prediction-viewer/predict-widget/predict-widget';

const STORAGE_KEY = 'colombia_dept_prediction_widgets';

@Service()
export class ColDeptService {
    private httpClient = inject(HttpClient);
    private platformId = inject(PLATFORM_ID);
    private isBrowser = isPlatformBrowser(this.platformId);

    widgets = signal<WidgetItemPredict[]>([]);

    // 1. PREDICCIÓN POBREZA DEPARTAMENTAL
    private dept_poverty_url = `${environment.apiAddr}/api/users/predictions/department_poverty`;

    predictdeptartamentPovertyMulti(region: string, departamentos: string[], begin_year: number, years: number) {
        if (!this.isBrowser || departamentos.length === 0) {
            return;
        }

        const requests = departamentos.map(departamento => {
            const payload = { region, departamento, begin_year, years };
            return this.httpClient.post<{ data: ContributionLatamItem[] }>(
                this.dept_poverty_url,
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
                    label: departamentos[i],
                    data: res.data.map(item => Number(item.predicted_value))
                }));

                const chartData: MultiChartData = { labels, datasets };

                const newWidget: WidgetItemPredict = {
                    id: 1,
                    title: `IPM: ${departamentos.join(', ')} - ${region} (${begin_year} - ${begin_year + years})`,
                    content: PredictWidget,
                    data: chartData
                }

                this.widgets.update(current => [...current, newWidget]);
                this.saveWidgetsToStorage();

            },
            error: (err) => console.error('Error al consultar contribución:', err)
        });
    }

    // 1. PREDICCIÓN POBREZA POR HOGAR
    private household_poverty_url = `${environment.apiAddr}/api/users/predictions/household_poverty`;

    predictHouseholdPovertyMulti(region: string, departamentos: string[], begin_year: number, years: number) {
        if (!this.isBrowser || departamentos.length === 0) {
            return;
        }

        const requests = departamentos.map(departamento => {
            const payload = { region, departamento, begin_year, years };
            return this.httpClient.post<{ data: ContributionLatamItem[] }>(
                this.dept_poverty_url,
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
                    label: departamentos[i],
                    data: res.data.map(item => Number(item.predicted_value))
                }));

                const chartData: MultiChartData = { labels, datasets };

                const newWidget: WidgetItemPredict = {
                    id: Date.now(),
                    title: `IPM: ${departamentos.join(', ')} - ${region} (${begin_year} - ${begin_year + years})`,
                    content: PredictWidget,
                    data: chartData
                }

                this.widgets.update(current => [...current, newWidget]);
                this.saveWidgetsToStorage();

            },
            error: (err) => console.error('Error al consultar contribución:', err)
        });
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
                        content: PredictWidget,
                        data: item.data
                    }));
    
                this.widgets.set(restoredWidgets);
            } catch (e) {
                console.error('Error al restaurar widgets de localStorage:', e);
            }
        }

}
