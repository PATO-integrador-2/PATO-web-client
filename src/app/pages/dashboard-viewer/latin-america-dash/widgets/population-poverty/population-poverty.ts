import { Component, inject, computed, input, effect, PLATFORM_ID, viewChild, ElementRef } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Chart } from 'chart.js';
import { LatinAmericaService } from '../../../../../core/services/dashboard-services/latin-america.service';
import { NationalPovertyItem } from '../../../../../interfaces/ipm.interface';

@Component({
  selector: 'app-population-poverty',
  imports: [],
  templateUrl: './population-poverty.html',
  styleUrl: './population-poverty.css',
})
export class PopulationPoverty {
  private dashboardService = inject(LatinAmericaService);
  private platformId = inject(PLATFORM_ID);

  chartCanvas = viewChild<ElementRef<HTMLCanvasElement>>('Chart');
  private chartInstance?: Chart;

  data = computed(() => this.dashboardService.nationalPovertyData());

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
      this.dashboardService.loadNationalPovertyData(2025, 'National', 'Ecuador');
    }
  }

  ngOnDestroy() {
    // Destruir la gráfica si el componente se desmonta
    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = undefined;
    }
  }

  private renderOrUpdateChart(canvas: HTMLCanvasElement, items: NationalPovertyItem[]) {
    // Si la instancia ya existe pero el canvas cambió destruir la vieja
    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = undefined;
    }
  
    const labels = items.map((item) => item.tipo_medida_pm);
    const values: number[] = items.map((item) => Number(item.valor_porcentaje));
    const domainName = items[0]?.pais || 'Nacional';
    const areaName = items[0]?.area_geografica;
    const yearVal = items[0]?.anio || '';
    

    this.chartInstance = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: `${domainName} - ${areaName} (${yearVal})`,
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
            title: { display: true, text: 'Población en situación de pobreza (%)' },
          },
          x: { title: { display: true, text: 'Tipo de IPM' } }
        }
      }
    });

  }

}
  
