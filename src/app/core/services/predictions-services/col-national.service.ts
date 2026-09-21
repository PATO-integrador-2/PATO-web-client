import { Service, signal, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { WidgetItem } from '../../../interfaces/ipm.interface';
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

@Service()
export class ColNationalService {
    private httpClient = inject(HttpClient);
    private platformId = inject(PLATFORM_ID);

    widgets = signal<WidgetItem[]>([
        { id: 1, label: 'INCIDENCIA IPM', content: Mpi },
        { id: 2, label: 'Predicción de porcentaje de privaciones entre las personas en situación de Pobreza Multidimensional', content: Percentage },
        { id: 3, label: 'Predicción de privación por hogar según variable', content: Deprivations },
        { id: 4, label: 'Predicción de contribución a la incidencia Ajustada del IPM por dimensión', content: Dimension},
        { id: 5, label: 'Incidencia por sexo', content: IncidenceBySex},
        { id: 6, label: 'Incidencia por sexo del jefe del hogar', content: IncidenceByHeadSex},

    ]);

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

                this.mpiData.set(response.data);
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

                this.mpiData.set(response.data);

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

    private dimension_url= `${environment.apiAddr}/api/users/dimension-contribution`;
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
        
}

