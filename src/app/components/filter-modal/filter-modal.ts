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
  filterFields: Array<'year' | 'domain' | 'country' | 'area'>;
  widget: WidgetItemDash;
  currentFilters?: {
    year?: number;
    domain?: string;
    country?: string;
    area?: string;
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
  public data = inject<any>(MAT_DIALOG_DATA);

  selectedFilters!: {
    year?: number;
    domain?: string;
    country?: string;
    area?: string;
  };

  availableYears: number[] = [];
  availableCountries: string[] = [];
  availableAreas: string[] = [];
  availableDomains: string[] = [];

  ngOnInit() {
    this.selectedFilters = {
      year: this.data.currentFilters?.year,
      domain: this.data.currentFilters?.domain,
      country: this.data.currentFilters?.country,
      area: this.data.currentFilters?.area,
    };

    if (this.data.widget?.getYearsSignal) {
      this.availableYears = this.data.widget.getYearsSignal();
    }

    if (!this.selectedFilters.year && this.availableYears.length > 0) {
      this.selectedFilters.year = this.availableYears[0];
    }

    // Cargar Áreas y Países en cascada al iniciar
    this.updateAreasAndCountries();
  }

  onYearChange() {
    this.updateAreasAndCountries();
  }

  onAreaChange() {
    this.updateCountries();
  }

  private updateAreasAndCountries() {
    // 1. Cargar Áreas
    if (this.data.widget?.getAreasByYear && this.selectedFilters.year) {
      this.availableAreas = this.data.widget.getAreasByYear(this.selectedFilters.year);
      if (!this.availableAreas.includes(this.selectedFilters.area || '')) {
        this.selectedFilters.area = this.availableAreas[0] || '';
      }
    }

    // 2. Cargar Países según el Año y Área seleccionados
    this.updateCountries();
  }

  private updateCountries() {
    if (!this.selectedFilters.year) return;

    if (this.data.widget?.getCountriesByYearAndArea && this.selectedFilters.area) {
      this.availableCountries = this.data.widget.getCountriesByYearAndArea(
        this.selectedFilters.year,
        this.selectedFilters.area
      );
    } else if (this.data.widget?.getCountriesByYear) {
      this.availableCountries = this.data.widget.getCountriesByYear(this.selectedFilters.year);
    }

    if (!this.availableCountries.includes(this.selectedFilters.country || '')) {
      this.selectedFilters.country = this.availableCountries[0] || '';
    }
  }

  apply() {
    this.dialogRef.close(this.selectedFilters);
  }

  cancel() {
    this.dialogRef.close();
  }

}
