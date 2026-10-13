import { Component, inject, signal, effect } from '@angular/core';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ColNationalService } from '../../core/services/dashboard-services/col-national.service';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { WidgetItemDash } from '../../interfaces/ipm.interface';

export interface FilterModalData {
  title: string;
  filterFields: Array<'year' | 'domain' | 'country' | 'area' | 'region' | 'dept'>;
  widget: WidgetItemDash;
  currentFilters?: {
    year?: number;
    domain?: string;
    country?: string;
    area?: string;
    region?: string;
    dept?: string;
  };
}

@Component({
  selector: 'app-filter-modal',
  imports: [MatButtonModule, FormsModule, MatSelectModule, MatFormFieldModule, MatDialogModule, MatIconModule, MatListModule],
  templateUrl: './filter-modal.html',
  styleUrl: './filter-modal.css',
})
export class FilterModal {
  private dialogRef = inject(MatDialogRef<FilterModal>);
  public data = inject<FilterModalData>(MAT_DIALOG_DATA);

  selectedFilters: NonNullable<FilterModalData['currentFilters']> = {};

  availableYears: number[] = [];
  availableDomains: string[] = [];
  availableAreas: string[] = [];
  availableCountries: string[] = [];
  availableRegions: string[] = [];
  availableDepts: string[] = [];

  ngOnInit() {
  const current = this.data.currentFilters || {};

  // Cargar años disponibles
  if (this.data.widget?.getYearsSignal) {
    this.availableYears = this.data.widget.getYearsSignal();
  }

  // Cargar dominios disponibles
  if (this.data.widget?.getDomainsSignal) {
    this.availableDomains = this.data.widget.getDomainsSignal();
  }

  // Establecer el año inicial
  const initialYear = current.year && this.availableYears.includes(Number(current.year))
    ? Number(current.year)
    : (this.availableYears.length > 0 ? this.availableYears[0] : undefined);

  this.selectedFilters = {
    year: initialYear,
    domain: current.domain,
    country: current.country,
    area: current.area,
    region: current.region,
    dept: current.dept,
  };

  // Refrescar todos los filtros
  this.refreshAllFilters();

  if (current.country && this.availableCountries.length > 0) {
    const matchedCountry = this.availableCountries.find(
      c => c.toLowerCase().trim() === String(current.country).toLowerCase().trim()
    );
    if (matchedCountry) this.selectedFilters.country = matchedCountry;
  }

  if (current.area && this.availableAreas.length > 0) {
    const matchedArea = this.availableAreas.find(
      a => a.toLowerCase().trim() === String(current.area).toLowerCase().trim()
    );
    if (matchedArea) this.selectedFilters.area = matchedArea;
  }
}

  // Eventos de Interfaz 

  onYearChange() {
    this.refreshAllFilters();
  }

  onAreaChange() {
    this.updateCountries();
  }

  onRegionChange() {
    this.updateDepts();
  }

  // Lógica 

  private refreshAllFilters() {
    const year = this.selectedFilters.year;
    if (!year) return;

    const widget = this.data.widget;

    // Dominios
    if (widget?.getDomainsByYear) {
      this.availableDomains = widget.getDomainsByYear(year);
    }

    // Áreas
    if (widget?.getAreasByYear) {
      this.availableAreas = widget.getAreasByYear(year);
    }

    // Regiones
    if (widget?.getRegionsByYear) {
      this.availableRegions = widget.getRegionsByYear(year);
    }

    // Países y departamentos
    this.updateCountries();
    this.updateDepts();
  }

  private updateCountries() {
    const { year, area } = this.selectedFilters;
    if (!year) return;

    const widget = this.data.widget;
    if (widget?.getCountriesByYearAndArea && area) {
      this.availableCountries = widget.getCountriesByYearAndArea(year, area as string);
    } else if (widget?.getCountriesByYear) {
      this.availableCountries = widget.getCountriesByYear(year as number);
    } else {
      this.availableCountries = [];
    }

  }

  private updateDepts() {
    const { year, region } = this.selectedFilters;
    if (!year) return;

    const widget = this.data.widget;
    
    if (widget?.getDeptsByYearAndRegion && region) {
      this.availableDepts = widget.getDeptsByYearAndRegion(year as number, region as string);
    } else {
      this.availableDepts = [];
    }

  }


  apply() {
    this.dialogRef.close(this.selectedFilters);
  }

  cancel() {
    this.dialogRef.close();
  }

}
