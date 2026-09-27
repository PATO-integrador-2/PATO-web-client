import { Component, inject, computed, input, effect, PLATFORM_ID, viewChild, ElementRef } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Chart } from 'chart.js';
import { ColNationalService } from '../../../../../core/services/predictions-services/col-national.service';
import { DeprivationsItem } from '../../../../../interfaces/predictions.interface';

@Component({
  selector: 'app-deprivations',
  imports: [],
  templateUrl: './deprivations.html',
  styleUrl: './deprivations.css',
})
export class Deprivations {
  private platformId = inject(PLATFORM_ID);
  private chartInstance?: Chart;
  private isBrowser = false;
  chartElement = viewChild<ElementRef<HTMLCanvasElement>>('Chart');
  data = input<DeprivationsItem[]>([]);

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);

    // Reactiva automáticamente cuando los datos son inyectados o restaurados desde localStorage
    effect(() => {
      const currentData = this.data();
      if (this.isBrowser && currentData && currentData.length > 0) {
        this.updateOrCreateChart(currentData);
      }
    });
  }

  ngAfterViewInit() {
    if (!this.isBrowser) return;

    setTimeout(() => {
      const canvas = this.chartElement()?.nativeElement;
      const currentData = this.data();
      if (canvas && !this.chartInstance && currentData.length > 0) {
        this.initChart(canvas, currentData);
      }
    }, 150);
  }
  
  private initChart(canvas: HTMLCanvasElement, items: DeprivationsItem[]) {
      const labels = items.map((item) => item.year);
      const values: number[] = items.map((item) => Number(item.ipm_foretold));

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

  private updateOrCreateChart(items: DeprivationsItem[]) {
      const canvas = this.chartElement()?.nativeElement;
      if (!canvas) return;
  
      const labels = items.map(item => String(item.year));
      const dataValues = items.map(item => Number(item.ipm_foretold));
  
      // Si la gráfica ya existe se actualizan los datos
      if (this.chartInstance) {
        this.chartInstance.data.labels = labels;
        this.chartInstance.data.datasets[0].data = dataValues;
        this.chartInstance.update();
      } else {
        // Si no existe se crea desde cero
        this.initChart(canvas, items);
      }
    }
}
