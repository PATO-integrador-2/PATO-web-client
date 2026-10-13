import { Component, inject, computed, input, effect, PLATFORM_ID, viewChild, ElementRef } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Chart } from 'chart.js';
import { ColNationalService } from '../../../../../core/services/dashboard-services/col-national.service';
import { ContributionImpactItem, IntensityPovertyItem } from '../../../../../interfaces/ipm.interface';

@Component({
  selector: 'app-contributions-impact',
  imports: [],
  templateUrl: './contributions-impact.html',
  styleUrl: './contributions-impact.css',
})
export class ContributionsImpact {
  private dashboardService = inject(ColNationalService);
  private platformId = inject(PLATFORM_ID);

  chartCanvas = viewChild<ElementRef<HTMLCanvasElement>>('Chart');
  private chartInstance?: Chart;

  data = computed(() => this.dashboardService.contributionImpactData());

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
      this.dashboardService.loadContributionImpactData(2024, 'Oriental');
    }
  }

  ngOnDestroy() {
    // Destruir la gráfica si el componente se desmonta
    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = undefined;
    }
  }

  private renderOrUpdateChart(canvas: HTMLCanvasElement, items: ContributionImpactItem[]) {
    // Si la instancia ya existe pero el canvas cambió destruir la vieja
    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = undefined;
    }

    const labels = items.map((item) => item.dimension);
    const values: number[] = items.map((item) => Number(item.porcentaje));
    const domainName = items[0]?.dominio || 'Nacional';
    const yearVal = items[0]?.anio || '';

    this.chartInstance = new Chart(canvas, {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{
          label: `IPM (%) - ${domainName} (${yearVal})`,
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
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,

      }
    });

  }


}
