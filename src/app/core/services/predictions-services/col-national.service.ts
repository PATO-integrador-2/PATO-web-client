import { Service, signal, inject, PLATFORM_ID, Type } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { WidgetItem, WidgetItemPredict } from '../../../interfaces/ipm.interface';
import { environment } from '../../../../environments/environment.development';
import { isPlatformBrowser } from '@angular/common';
import { DeprivationsItem, DimensionItem, MpiItem, PercentageItem } from '../../../interfaces/predictions.interface';
import { Mpi } from '../../../pages/prediction-viewer/col-national-predict/widgets/mpi/mpi';
import { IncidenceByHeadSexItem, IncidenceBySexItem } from '../../../interfaces/predictions.interface';
import { Percentage } from '../../../pages/prediction-viewer/col-national-predict/widgets/percentage/percentage';
import { Deprivations } from '../../../pages/prediction-viewer/col-national-predict/widgets/deprivations/deprivations';
import { Dimension } from '../../../pages/prediction-viewer/col-national-predict/widgets/dimension/dimension';
import { IncidenceBySex } from '../../../pages/prediction-viewer/col-national-predict/widgets/incidence-by-sex/incidence-by-sex';
import { IncidenceByHeadSex } from '../../../pages/prediction-viewer/col-national-predict/widgets/incidence-by-head-sex/incidence-by-head-sex';

const COMPONENT_MAP: Record<string, Type<unknown>> = {
    Mpi: Mpi,
    Deprivations: Deprivations
}

interface StoredWidget {
    id: number;
    type: string;
    title: string;
    data: any[];
}

const STORAGE_KEY = 'col_national_dashboard_widgets';

@Service()
export class ColNationalService {
    private httpClient = inject(HttpClient);
    private platformId = inject(PLATFORM_ID);
    private isBrowser = isPlatformBrowser(this.platformId);

    widgets = signal<WidgetItemPredict[]>([]);

    constructor() {
        // Al inicializar el servicio en el navegador, restaurar los widgets guardados
        if (this.isBrowser) {
            this.loadWidgetsFromStorage();
        }
    }

    private mpi_url = `${environment.apiAddr}/api/users/predictions/ipm`;
    mpiData = signal<MpiItem[]>([]);

    predictMpi(domain: string, begin_year: number, years: number) {
        if (!isPlatformBrowser(this.platformId)) return;

        const payload = {
            domain: domain,
            begin_year: begin_year,
            years: years

        };

        this.httpClient.post<{ data: MpiItem[] }>(this.mpi_url, payload).subscribe({
            next: (response) => {
                if (!response || !response.data || response.data.length === 0) return;

                const newWidget: WidgetItemPredict = {
                    id: Date.now(),
                    label: 'Mpi',
                    title: `Predicción IPM (${domain} - ${begin_year} a ${begin_year + years})`,
                    content: Mpi,
                    data: response.data
                };

                // Agregar widget a la lista
                this.widgets.update(current => [...current, newWidget]);

                // Guardar widgets en el localStorage
                this.saveWidgetsToStorage();
            },
            error: (err) => console.error('Error al cargar datos IPM:', err),
        });

    }


    private deprivations_url = `${environment.apiAddr}/api/users/predictions/privacion`;
    deprivationsData = signal<DeprivationsItem[]>([]);

    predictDeprivations(variable: string, domain: string, begin_year: number, years: number) {
        if (!isPlatformBrowser(this.platformId)) return;

        const payload = {
            variable: variable,
            domain: domain,
            begin_year: begin_year,
            years: years

        };

        this.httpClient.post<any>(this.deprivations_url, payload).subscribe({
            next: (response) => {
                if (!response || !response.data || response.data.length === 0) return;

                const newWidget: WidgetItemPredict = {
                    id: Date.now(),
                    label: 'Deprivations',
                    title: `Predicción privaciones (${domain} - ${begin_year} a ${begin_year + years})`,
                    content: Mpi,
                    data: response.data
                };

                // Agregar widget a la lista
                this.widgets.update(current => [...current, newWidget]);

                // Guardar widgets en el localStorage
                this.saveWidgetsToStorage();

            },
            error: (err) => console.error('Error al cargar privaciones:', err),
        });
    }

    private percentage_url = `${environment.apiAddr}/api/users/predictions/dimension`;
    percentageData = signal<PercentageItem[]>([]);

    predictPercentage(domain: string, begin_year: string, years: number) {
        if (!isPlatformBrowser(this.platformId)) return;

        const payload = {
            domain: domain,
            begin_year: begin_year,
            years: years

        };

        this.httpClient.post<any>(this.percentage_url, payload).subscribe({
            next: (response) => {
                if (!response || !response.data || response.data.length === 0) return;

                this.percentageData.set(response.data);
            },
            error: (err) => console.error('Error al cargar datos IPM:', err),
        });

    }

    private dimension_url = `${environment.apiAddr}/api/users/dimension-contribution`;
    dimensionData = signal<DimensionItem[]>([]);

    predictDimension(dimension: string, domain: string, begin_year: string, years: number) {
        if (!isPlatformBrowser(this.platformId)) return;

        const payload = {
            dimension: dimension,
            domain: domain,
            begin_year: begin_year,
            years: years

        };


        this.httpClient.post<any>(this.dimension_url, payload).subscribe({
            next: (response) => {
                if (!response || !response.data || response.data.length === 0) return;

                this.dimensionData.set(response.data);

            },

            error: (err) => console.error('Error al cargar contribuciones:', err),

        });
    }


    private incidence_by_sex_url = `${environment.apiAddr}/api/users/incidence_by_sex`;
    incidenceBySexData = signal<IncidenceBySexItem[]>([]);

    predictionIncidenceBySex(domain: string, sex: string, begin_year: string, years: string) {
        if (!isPlatformBrowser(this.platformId)) return;

        const payload = {
            domain: domain,
            sex: sex,
            begin_year: begin_year,
            years: years

        };

        this.httpClient.post<any>(this.incidence_by_sex_url, payload).subscribe({
            next: (response) => {
                if (!response || !response.data || response.data.length === 0) return;

                this.incidenceBySexData.set(response.data);

            },

            error: (err) => console.error('Error al cargar datos IPM:', err),
        });
    }

    private incidence_by_head_sex_url = `${environment.apiAddr}/api/users/incidence_by_head_sex`;
    incidenceByHeadSexData = signal<IncidenceByHeadSexItem[]>([]);

    predictionIncidenceByHeadSex(domain: string, sex: string, begin_year: string, years: string) {
        if (!isPlatformBrowser(this.platformId)) return;

        const payload = {
            domain: domain,
            sex: sex,
            begin_year: begin_year,
            years: years

        };

        this.httpClient.post<any>(this.incidence_by_head_sex_url, payload).subscribe({
            next: (response) => {
                if (!response || !response.data || response.data.length === 0) return;

                this.incidenceByHeadSexData.set(response.data);

            },

            error: (err) => console.error('Error al cargar datos IPM:', err),
        });
    }

    private addWidget(type: string, data: string[]) {
        if (type === 'mpi') {


        }

    }

    // Eliminar un widget específico
    removeWidget(id: number) {
        this.widgets.update(current => current.filter(w => w.id !== id));
        this.saveWidgetsToStorage();
    }

    // Limpiar todos los widgets
    clearAllWidgets() {
        this.widgets.set([]);
        if (this.isBrowser) {
            localStorage.removeItem(STORAGE_KEY);
        }
    }

    // Métodos de Persistencia en LocalStorage

    private saveWidgetsToStorage() {
        if (!this.isBrowser) return;

        // Convertir el arreglo de WidgetItemPredict a un formato serializable (sin referencias a clases Angular)
        const storedData: StoredWidget[] = this.widgets().map(w => ({
            id: w.id,
            type: w.label,
            title: w.title || '',
            data: w.data || []
        }));

        localStorage.setItem(STORAGE_KEY, JSON.stringify(storedData));
    }

    private loadWidgetsFromStorage() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (!saved) return;

            const parsed: StoredWidget[] = JSON.parse(saved);

            // Reconstruir la lista de componentes vinculando de nuevo la clase del componente (content)
            const restoredWidgets: WidgetItemPredict[] = parsed
                .filter(item => COMPONENT_MAP[item.type]) // Asegurar que el tipo existe
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

