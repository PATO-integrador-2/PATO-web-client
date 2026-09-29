import { Component, inject, computed, input, effect, PLATFORM_ID, viewChild, ElementRef, Input } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Chart } from 'chart.js';
import { ColNationalService } from '../../../../../core/services/predictions-services/col-national.service';
import { MpiItem, MultiChartData } from '../../../../../interfaces/predictions.interface';

@Component({
  selector: 'app-mpi',
  imports: [],
  templateUrl: './mpi.html',
  styleUrl: './mpi.css',
})
export class Mpi {
  private platformId = inject(PLATFORM_ID);
  private chartInstance?: Chart;
  private isBrowser = false;

  chartElement = viewChild<ElementRef<HTMLCanvasElement>>('Chart');
  data = input<MultiChartData>({ labels: [], datasets: [] });

  private palette = [
    'rgb(54, 162, 235)',  // Azul
    'rgb(255, 99, 132)',  // Rojo
    'rgb(255, 206, 86)',  // Amarillo
    'rgb(75, 192, 192)',  // Verde agua
    'rgb(153, 102, 255)'  // Morado
  ];

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);

    effect(() => {
      const currentData = this.data();
      if (this.isBrowser && currentData && currentData.labels?.length > 0) {
        this.updateOrCreateChart(currentData);
      }
    });
  }

  ngAfterViewInit() {
    if (!this.isBrowser) return;

    setTimeout(() => {
      const canvas = this.chartElement()?.nativeElement;
      const currentData = this.data();
      if (canvas && !this.chartInstance && currentData.labels?.length > 0) {
        this.initChart(canvas, currentData);
      }
    }, 150);
  }

  private initChart(canvas: HTMLCanvasElement, chartData: MultiChartData) {
    const formattedDatasets = chartData.datasets.map((ds, index) => ({
      label: ds.label,
      data: ds.data,
      backgroundColor: this.palette[index % this.palette.length],
      borderColor: this.palette[index % this.palette.length],
      borderWidth: 1,
      borderRadius: 4
    }));

    this.chartInstance = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: chartData.labels,
        datasets: formattedDatasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true, position: 'top' }
        },
        scales: {
          y: { beginAtZero: true, title: { display: true, text: 'Valor (%)' } },
          x: { title: { display: true, text: 'Años' } }
        }
      }
    });
  }

  private updateOrCreateChart(chartData: MultiChartData) {
    const canvas = this.chartElement()?.nativeElement;
    if (!canvas) return;

    if (this.chartInstance) {
      this.chartInstance.data.labels = chartData.labels;
      this.chartInstance.data.datasets = chartData.datasets.map((ds, index) => ({
        label: ds.label,
        data: ds.data,
        backgroundColor: this.palette[index % this.palette.length],
        borderColor: this.palette[index % this.palette.length],
        borderWidth: 1,
        borderRadius: 4
      }));
      this.chartInstance.update();
    } else {
      this.initChart(canvas, chartData);
    }
  }
}
