import { Component, inject, computed, input, effect, PLATFORM_ID, viewChild, ElementRef } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Chart } from 'chart.js';
import { ColNationalService } from '../../../../../core/services/dashboard-services/col-national.service';
import { MpiSexItem } from '../../../../../interfaces/ipm.interface';

@Component({
  selector: 'app-mpi-sex',
  imports: [],
  templateUrl: './mpi-sex.html',
  styleUrl: './mpi-sex.css',
})
export class MpiSex {
  private dashboardService = inject(ColNationalService);
  private platformId = inject(PLATFORM_ID);

  chartCanvas = viewChild<ElementRef<HTMLCanvasElement>>('Chart');
  private chartInstance?: Chart;

  data = computed(() => this.dashboardService.mpiSexData());

  constructor() {
    // Escuchar activamente cuando el Canvas o los Datos cambian
    effect(() => {
      const canvasRef = this.chartCanvas();
      const items = this.data();

      if (!isPlatformBrowser(this.platformId) || !canvasRef || !items || items.length === 0) {
        return;
      }

      const canvasEl = canvasRef.nativeElement;

      setTimeout(() => {
        this.renderOrUpdateChart(canvasEl, items);
      }, 0);
    });
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      // Disparar la carga inicial de datos desde el backend
      this.dashboardService.loadMpiSexData('Antioquia');
    }
  }

  ngOnDestroy() {
    // Destruir la gráfica si el componente se desmonta
    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = undefined;
    }
  }


  private renderOrUpdateChart(canvas: HTMLCanvasElement, items: MpiSexItem[]) {
    // Si la instancia ya existe pero el canvas cambió destruir la vieja
    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = undefined;
    }

    // Filtrar puntos para hombres y mujeres
    const menData = this.extractMenData(items);
    const womenData = this.extractWomenData(items);

    this.chartInstance = new Chart(canvas, {
      type: 'scatter',
      data: {
        datasets: [
          {
            label: 'Hombres',
            data: menData,
            backgroundColor: 'rgba(54, 162, 235, 1)',
            pointRadius: 7
          },
          {
            label: 'Mujeres',
            data: womenData,
            backgroundColor: 'rgba(255, 99, 132, 1)',
            pointRadius: 7
          }
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            type: 'linear',
            position: 'bottom',
            title: { display: true, text: 'Año' },
            ticks: { stepSize: 1 }
          },
          y: {
            beginAtZero: true,
            title: { display: true, text: 'Incidencia IPM (%)' }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const raw = ctx.raw as { x: number; y: number };
                return `${ctx.dataset.label}: ${raw.y}%`;
              }
            }
          }
        }
      }
    });

  }

  private extractMenData(items: any[]) {
    const menData = items
      .filter((item) => item.sexo === 'Hombre')
      .map((item) => ({
        x: Number(item.anio),
        y: Number(item.porcentaje)
      }));

    return menData;
  };

  private extractWomenData(items: any[]) {
    const womenData = items
      .filter((item) => item.sexo === 'Mujer')
      .map((item) => ({
        x: Number(item.anio),
        y: Number(item.porcentaje)
      }));

    return womenData;
  };
}

