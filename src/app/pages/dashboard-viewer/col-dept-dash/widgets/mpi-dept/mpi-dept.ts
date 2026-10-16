import { Component, inject, computed, input, effect, PLATFORM_ID, viewChild, ElementRef } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Chart } from 'chart.js';
import { MpiDeptItem, MpiItem } from '../../../../../interfaces/ipm.interface';
import { ColDeptService } from '../../../../../core/services/dashboard-services/col-dept.service';

@Component({
  selector: 'app-mpi-dept',
  imports: [],
  templateUrl: './mpi-dept.html',
  styleUrl: './mpi-dept.css',
})
export class MpiDept {
  private dashboardService = inject(ColDeptService);
  private platformId = inject(PLATFORM_ID);

  chartCanvas = viewChild<ElementRef<HTMLCanvasElement>>('Chart');
  private chartInstance?: Chart;

  data = computed(() => this.dashboardService.mpiDeptData());

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
      this.dashboardService.loadMpiDeptData(2024, "Arauca");
    }
  }

  ngOnDestroy() {
    // Destruir la gráfica si el componente se desmonta
    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = undefined;
    }
  }

  private renderOrUpdateChart(canvas: HTMLCanvasElement, items: MpiDeptItem[]) {
    // Si la instancia ya existe pero el canvas cambió destruir la vieja
    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = undefined;
    }

    const labels = items.map((item) => item.area);
    const values: number[] = items.map((item) => Number(item.ipm));
    const yearVal = items[0]?.anio || '';
    const deptName = items[0]?.departamento || '';

    this.chartInstance = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: `IPM (%) (${yearVal}) - (${deptName})`,
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
          x: { title: { display: true, text: 'Dominios' } }
        }
      }
    });

  }
}
