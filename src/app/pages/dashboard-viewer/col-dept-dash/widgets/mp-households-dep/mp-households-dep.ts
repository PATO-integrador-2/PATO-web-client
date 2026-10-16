import { Component, inject, computed, input, effect, PLATFORM_ID, viewChild, ElementRef } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Chart } from 'chart.js';
import { ColDeptService } from '../../../../../core/services/dashboard-services/col-dept.service';
import { IndicatorDeptItem } from '../../../../../interfaces/ipm.interface';

@Component({
  selector: 'app-mp-households-dep',
  imports: [],
  templateUrl: './mp-households-dep.html',
  styleUrl: './mp-households-dep.css',
})
export class MPHouseholdsDep {
  private dashboardService = inject(ColDeptService);
  private platformId = inject(PLATFORM_ID);

  chartCanvas = viewChild<ElementRef<HTMLCanvasElement>>('Chart');
  private chartInstance?: Chart;

  data = computed(() => this.dashboardService.indicatorsData());

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
      this.dashboardService.loadIndicatorsData(2024, 'Orinoquía - Amazonía', 'Arauca');
    }
  }

  ngOnDestroy() {
    // Destruir la gráfica si el componente se desmonta
    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = undefined;
    }
  }


  // Método auxiliar para evitar duplicar el mapeo de los 14 indicadores
  private getPrivationsMap(item: IndicatorDeptItem) {
    return [
      { label: 'Bajo logro educativo', value: item.privacion_bajo_logro_educativo },
      { label: 'Analfabetismo', value: item.privacion_analfabetismo },
      { label: 'Inasistencia escolar', value: item.privacion_inasistencia_escolar },
      { label: 'Rezago escolar', value: item.privacion_rezago_escolar },
      { label: 'Atención primera infancia', value: item.privacion_atencion_integral_primera_infancia },
      { label: 'Trabajo infantil', value: item.privacion_trabajo_infantil },
      { label: 'Sin aseguramiento en salud', value: item.pprivacion_no_aseguramiento_salud },
      { label: 'Barreras de acceso a salud', value: item.privacion_barreras_acceso_salud },
      { label: 'Desempleo de larga duración', value: item.privacion_desempleo_larga_duracion },
      { label: 'Empleo informal', value: item.privacion_tasa_empleo_formal },
      { label: 'Sin acceso a agua mejorada', value: item.privacion_no_acceso_agua_mejorada },
      { label: 'Pisos inadecuados', value: item.privacion_inadecuado_material_piso },
      { label: 'Paredes inadecuadas', value: item.privacion_inadecuado_material_paredes },
      { label: 'Hacinamiento crítico', value: item.privacion_hacinamiento_critico }
    ];
  }

  private renderOrUpdateChart(canvas: HTMLCanvasElement, items: IndicatorDeptItem[]) {
    // Si la instancia ya existe pero el canvas cambió destruir la vieja
    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = undefined;
    }

    const privationsMap = this.getPrivationsMap(items[0]);

    this.chartInstance = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: privationsMap.map(p => p.label),
        datasets: [
          {
            label: `IPM: ${items[0].ipm}% - Personas en el hogar: ${items[0].personas_que_habitan_ese_hogar} - Región: [${items[0].region}] - Departamento: ${items[0].departamento} (${items[0].anio})`,
            data: privationsMap.map(p => p.value),
            backgroundColor: [
              'rgb(255, 99, 133)',
              'rgb(255, 160, 64)',
              'rgb(255, 204, 86)',
              'rgb(75, 192, 192)',
              'rgb(54, 163, 235)',
              'rgb(153, 102, 255)',
              'rgb(201, 203, 207)'
            ],
            borderWidth: 1,
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
          legend: { display: true, position: 'top' },
          tooltip: {
            callbacks: {
              label: (context) => ` ${context.raw}`
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            title: { display: true, text: 'Índice de posesión' },
            ticks: { callback: (val) => `${val}` }
          },
          y: {
            ticks: { font: { size: 11 } }
          }
        }
      }
    });
  }


}
