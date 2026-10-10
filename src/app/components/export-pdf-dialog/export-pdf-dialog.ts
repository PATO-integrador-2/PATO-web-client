import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AbstractControl, FormControl, ReactiveFormsModule, ValidationErrors } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { normalizePdfFileName } from '../../core/services/pdf-export/pdf-export.service';

export interface ExportPdfDialogData {
  suggestedName: string;
}

function validFileName(control: AbstractControl<string>): ValidationErrors | null {
  try {
    normalizePdfFileName(control.value ?? '');
    return null;
  } catch {
    return { invalidName: true };
  }
}

@Component({
  selector: 'app-export-pdf-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  templateUrl: './export-pdf-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExportPdfDialog {
  private readonly dialogRef = inject<MatDialogRef<ExportPdfDialog, string>>(MatDialogRef);
  private readonly data = inject<ExportPdfDialogData>(MAT_DIALOG_DATA);

  protected readonly name = new FormControl(this.data.suggestedName.replace(/\.pdf$/i, ''), {
    nonNullable: true,
    validators: [validFileName],
  });

  protected confirm(): void {
    if (this.name.invalid) {
      this.name.markAsTouched();
      return;
    }
    this.dialogRef.close(this.name.value);
  }
}