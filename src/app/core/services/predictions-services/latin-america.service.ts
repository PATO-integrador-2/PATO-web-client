import { Service, signal, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { WidgetItem } from '../../../interfaces/ipm.interface';
import { ContributionLatamItem, NationalPovertyItem, PovertyByAgeItem } from '../../../interfaces/predictions.interface';
import { environment } from '../../../../environments/environment.development';
import { isPlatformBrowser } from '@angular/common';
import { ContributionLatam } from '../../../pages/prediction-viewer/latin-america-predict/widgets/contribution-latam/contribution-latam';


@Service()
export class LatinAmericaService {
    private httpClient = inject(HttpClient);
    private platformId = inject(PLATFORM_ID);

    widgets = signal<WidgetItem[]>([
        { id: 1, label: 'INCIDENCIA IPM', content: ContributionLatam},

    ]);

    private contribution_latam_url = `${environment.apiAddr}/api/users/predictions/contribution_latam`;
    contributionLatamData = signal<ContributionLatamItem[]>([]);

    predictContributionLatam(privation: string, country: string, begin_year: number, years: number) {
        if (!isPlatformBrowser(this.platformId)) return;

        const payload = {
            privation: privation,
            country: country,
            begin_year: begin_year,
            years: years

        };

        this.httpClient.post<{ data: ContributionLatamItem[] }>(this.contribution_latam_url, payload).subscribe({
            next: (response) => {
                if (!response || !response.data || response.data.length === 0) return;

                this.contributionLatamData.set(response.data);
            },
            error: (err) => console.error('Error al cargar datos IPM:', err),
        });

    }


    private national_poverty_url = `${environment.apiAddr}/api/users/predictions/national_poverty`;
    nationalPovertyData = signal<NationalPovertyItem[]>([]);

    predictNationalPoverty(country: string, area: string, measure: string, begin_year: number, years: number) {
        if (!isPlatformBrowser(this.platformId)) return;

        const payload = {
            country: country,
            area: area,
            measure: measure,
            begin_year: begin_year,
            years: years

        };

        this.httpClient.post<{data: NationalPovertyItem[]}>(this.national_poverty_url, payload).subscribe({
            next: (response) => {
                if (!response || !response.data || response.data.length === 0) return;

                this.nationalPovertyData.set(response.data);

            },
            error: (err) => console.error('Error al cargar privaciones:', err),
        });
    }

    private poverty_by_age_url = `${environment.apiAddr}/api/users/predictions/poverty_by_age`;
    povertyByAgeData = signal<PovertyByAgeItem[]>([]);

    predictPovertyByAge(country: string, area: string, age_range: string, begin_year: string, years: number) {
        if (!isPlatformBrowser(this.platformId)) return;

        const payload = {
            country: country,
            area: area,
            age_range: age_range,
            begin_year: begin_year,
            years: years

        };

        this.httpClient.post<{data: PovertyByAgeItem[]}>(this.poverty_by_age_url, payload).subscribe({
            next: (response) => {
                if (!response || !response.data || response.data.length === 0) return;

                this.povertyByAgeData.set(response.data);
            },
            error: (err) => console.error('Error al cargar datos IPM:', err),
        });

    }

    private addWidget(type: string, data: string[]) {
        this.widgets

    }


}
