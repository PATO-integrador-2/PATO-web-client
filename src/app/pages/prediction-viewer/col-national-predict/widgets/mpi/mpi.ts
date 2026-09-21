import { Component, inject, computed, input, effect, PLATFORM_ID, viewChild, ElementRef } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Chart } from 'chart.js';
import { ColNationalService } from '../../../../../core/services/predictions-services/col-national.service';
import { MpiItem } from '../../../../../interfaces/predictions.interface';

@Component({
  selector: 'app-mpi',
  imports: [],
  templateUrl: './mpi.html',
  styleUrl: './mpi.css',
})
export class Mpi {
  private dashboardService = inject(ColNationalService);
  private platformId = inject(PLATFORM_ID);

  chartElement = viewChild<ElementRef<HTMLCanvasElement>>('Chart');
  private chartInstance?: Chart;

  data = computed(() => this.dashboardService.mpiData());

  constructor() {
    effect(() => {
      const items = this.data();
      if (this.chartInstance && items && items.length > 0) {
        this.updateChartData(items);
      }
    });
  }

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;

    setTimeout(() => {
      const canvas = this.chartElement()?.nativeElement;
      if (canvas && !this.chartInstance) {
        this.initChart(canvas);
      }
    }, 150);
  }

  private initChart(canvas: HTMLCanvasElement) {
    const items = this.data();
    const labels = items.map((item) => item.año);
    const values: number[] = items.map((item) => Number(item.ipm_predicho));

    this.chartInstance = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'IPM (%)',
            data: values,
            backgroundColor: [
              'rgb(255, 99, 133)',
              'rgb(255, 160, 64)',
              'rgb(255, 204, 86)',
              'rgb(75, 192, 192)',
              'rgb(54, 163, 235)',
              'rgb(153, 102, 255)',
              'rgb(201, 203, 207)'
            ],
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: 'IPM (%)' },
          },
          x: { title: { display: true, text: 'Años' } }
        }
      }
    });

  }

  private updateChartData(items: MpiItem[]) {
    if (!this.chartInstance) return;

    // Extraer nombres de dominios para los Labels
    const labels = items.map(item => item.año);

    // Extraer valores del IPM para las Barras
    const dataValues = items.map(item => Number(item.ipm_predicho));

    // Actualizar y renderizar la gráfica
    this.chartInstance.data.labels = labels;
    this.chartInstance.data.datasets[0].data = dataValues;
    this.chartInstance.update();
  }
}
