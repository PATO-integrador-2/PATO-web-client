import { Component, inject, signal, effect } from '@angular/core';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ColNationalService } from '../../core/services/dashboard-services/col-national.service';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import { MatListModule } from '@angular/material/list';

type ViewMode = 'mpi' | 'proportion-deprivations' | 'household-deprivation' | 'mpi-contributions' |
  'incidence-by-sex' | 'incidence-by-sex-head-household';

export interface FilterModalData {
  title: string;
  filterFields: Array<'year' | 'domain'>;
  availableYears: number[];
  availableDomains: string[];
  currentFilters: { year?: number; domain?: string };
}

@Component({
  selector: 'app-filter-modal',
  imports: [MatButtonModule, FormsModule, MatSelectModule, MatFormFieldModule, MatDialogModule, MatIconModule, MatListModule],
  templateUrl: './filter-modal.html',
  styleUrl: './filter-modal.css',
})
export class FilterModal {
  private dialogRef = inject(MatDialogRef<FilterModal>);
  public data: FilterModalData = inject(MAT_DIALOG_DATA);

  // Mantiene los valores seleccionados para el formulario
  selectedFilters = {
    year: this.data.currentFilters?.year ?? this.data.availableYears[0],
    domain: this.data.currentFilters?.domain ?? this.data.availableDomains[0]
  };

  apply() {
    this.dialogRef.close(this.selectedFilters);
  }

  cancel() {
    this.dialogRef.close();
  }

}
