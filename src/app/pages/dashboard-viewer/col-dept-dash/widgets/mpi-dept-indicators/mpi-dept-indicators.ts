import { isPlatformBrowser } from '@angular/common';
import { Component, ElementRef, viewChild, inject, PLATFORM_ID, computed, effect } from '@angular/core';
import Chart from 'chart.js/auto';
import { DeprivationsItem, MpiDeptIndicatorItem } from '../../../../../interfaces/ipm.interface';
import { ColDeptService } from '../../../../../core/services/dashboard-services/col-dept.service';

@Component({
  selector: 'app-mpi-dept-indicators',
  imports: [],
  templateUrl: './mpi-dept-indicators.html',
  styleUrl: './mpi-dept-indicators.css',
})
export class MpiDeptIndicators {
  private dashboardService = inject(ColDeptService);
  private platformId = inject(PLATFORM_ID);

  chartCanvas = viewChild<ElementRef<HTMLCanvasElement>>('Chart');
  private chartInstance?: Chart;

  data = computed(() => this.dashboardService.mpiDeptIndicatorsData());

  constructor() {
    // Escuchar activamente cuando el Canvas o los Datos cambian
    effect(() => {
      const canvasRef = this.chartCanvas();
      const items = this.data();

      if (!isPlatformBrowser(this.platformId) || !canvasRef || !items || items.length === 0) {
        return;
      }

      const canvasEl = canvasRef.nativeElement;

      // Usar setTimeout para asegurar que el navegador ya aplicó las dimensiones al DOM
      setTimeout(() => {
        this.renderOrUpdateChart(canvasEl, items);
      }, 0);
    });
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      // Disparar la carga inicial de datos desde el backend
      this.dashboardService.loadMpiDeptIndicatorsData(2024, 'Cabeceras');
    }
  }

  ngOnDestroy() {
    // Destruir la gráfica si el componente se desmonta
    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = undefined;
    }
  }

  private renderOrUpdateChart(canvas: HTMLCanvasElement, items: MpiDeptIndicatorItem[]) {
    // Si la instancia ya existe pero el canvas cambió destruir la vieja
    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = undefined;
    }
    
    const labels = items.map((item) => item.variable);
    const values = items.map((item) => Number(item.porcentaje));
    const domainName = items[0]?.departamento || 'Nacional';
    const yearVal = items[0]?.anio || '';

    this.chartInstance = new Chart(canvas, {
      type: 'radar',
      data: {
        labels: labels,
        datasets: [
          {
            label: `Privaciones - ${domainName} (${yearVal})`,
            data: values,
            fill: true,
            backgroundColor: 'rgba(212, 111, 162, 0.25)',
            borderColor: '#d14b99',
            borderWidth: 2,
            pointBackgroundColor: '#bb458a',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: {
            left: 60,
            right: 60,
            top: 20,
            bottom: 20
          }
        },
        scales: {
          r: {
            beginAtZero: true,
            ticks: { display: false },
            pointLabels: {
              font: { size: 10 },
              color: '#475569',
              callback: (label: string) => {
                if (label.length > 12) {
                  const words = label.split(' ');
                  const mid = Math.ceil(words.length / 2);
                  return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
                }
                return label;
              }
            },
            suggestedMin: 0,
            suggestedMax: 10
          }
        }
      },
    });
  }
}
