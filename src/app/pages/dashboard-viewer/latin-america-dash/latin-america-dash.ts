import { Component, inject, signal, effect } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgComponentOutlet } from '@angular/common';
import { Widget } from '../../../components/widget/widget';
import { Navbar } from '../../../components/navbar/navbar';
import { isPlatformBrowser } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { LatinAmericaService } from '../../../core/services/dashboard-services/latin-america.service';
import { NavbarDashboard } from '../../../components/navbar-dashboard/navbar-dashboard';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { DashboardFilterService } from '../../../core/services/dashboard-filter.service';
import { WidgetItem, WidgetItemDash } from '../../../interfaces/ipm.interface';

@Component({
  selector: 'app-latin-america-dash',
  imports: [NavbarDashboard, FormsModule, Navbar, NgComponentOutlet, MatSelectModule, MatFormFieldModule, MatIconModule],
  templateUrl: './latin-america-dash.html',
  styleUrl: './latin-america-dash.css',
})
export class LatinAmericaDash {
  public dashboardService = inject(LatinAmericaService);
  private filterModalService = inject(DashboardFilterService);

  // Estado local para recordar qué valores tiene seleccionados cada tarjeta
  private currentFilters: Record<string, { year?: number; country?: string; area?: string }> = {
    1: { year: 2023, country: 'Colombia' },
    2: { year: 2024, area: 'National', country: 'Ecuador' },
    3: { year: 2024, area: 'National', country: 'Ecuador' },
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
