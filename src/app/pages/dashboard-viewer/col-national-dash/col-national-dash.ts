import { Component, inject, signal, effect } from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { Widget } from '../../../components/widget/widget';
import { Navbar } from '../../../components/navbar/navbar';
import { isPlatformBrowser } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ColNationalService } from '../../../core/services/dashboard-services/col-national.service';
import { NavbarDashboard } from '../../../components/navbar-dashboard/navbar-dashboard';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { DashboardFilterService } from '../../../core/services/dashboard-filter.service';
import { WidgetItem, WidgetItemDash } from '../../../interfaces/ipm.interface';


@Component({
  selector: 'app-col-national-dash',
  imports: [NavbarDashboard, FormsModule, Navbar, NgComponentOutlet, MatSelectModule, MatFormFieldModule, MatIconModule],
  templateUrl: './col-national-dash.html',
  styleUrl: './col-national-dash.css',
})
export class ColNationalDash {
  public dashboardService = inject(ColNationalService);
  private filterModalService = inject(DashboardFilterService);

  // Estado local para recordar qué valores tiene seleccionados cada tarjeta
  private currentFilters: Record<string, { year?: number; domain?: string }> = {
    1: { year: 2024 },
    2: { year: 2024, domain: 'Cabeceras' },
    3: { domain: 'Antioquia' },
    4: { year: 2024, domain: 'Oriental' },
    5: { year: 2024},
    6: { domain: 'Caribe'},

  };

  ngOnInit() {
    // Carga los datos iniciales ejecutando la función de cada widget
    this.dashboardService.widgets().forEach((widget) => {
      widget.loadData(this.currentFilters[widget.id]);
    });
  }

  onClickFilter(widget: WidgetItemDash) {
    const filters = this.currentFilters[widget.id];

    this.filterModalService.openCardFilter(widget, filters, )
      .subscribe((newFilters) => {
        if (newFilters) {
          // Guarda el estado actualizado
          this.currentFilters[widget.id] = newFilters;
          // Ejecuta la recarga de datos llamando a la función del propio widget
          widget.loadData(newFilters);
        }
      });
  }

}
