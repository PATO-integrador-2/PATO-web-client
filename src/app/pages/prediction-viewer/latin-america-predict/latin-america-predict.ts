import { Component, ElementRef, afterEveryRender, inject, signal, effect } from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { Navbar } from '../../../components/navbar/navbar';
import { NavbarPredictions } from '../../../components/navbar-predictions/navbar-predictions';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { LatinAmericaService } from '../../../core/services/predictions-services/latin-america.service';

import { PredictionPdfExportService } from '../../../core/services/pdf-export/prediction-pdf-export.service';

@Component({
  selector: 'app-latin-america',
  imports: [
    NavbarPredictions,
    NgComponentOutlet,
    MatIconModule,
    MatGridListModule,
    MatExpansionModule,
    MatSidenavModule,
    Navbar,
    MatDividerModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatButtonModule],
  templateUrl: './latin-america-predict.html',
  styleUrl: './latin-america-predict.css',
})
export class LatinAmericaPredict {
  public dashboardService = inject(LatinAmericaService);
  readonly panelOpenState = signal(false);

  availableCountries = signal<string[]>([
    'Bolivia (Plurinational State of)', 'Colombia',
    'Costa Rica', 'Dominican Republic', 'Ecuador', 
    'El Salvador', 'Latin America (simple average)',
    'Latin America (weighted average)', 'Paraguay', 
    'Peru', 'Uruguay'
  ]);

  availableDeprivations = signal<string[]>([
    'Agua', 'Analfabetismo', 
    'Aseguramiento en salud', 'Calidad del empleo',
    'Condiciones de la vivienda', 'Hacinamiento',
    'Inasistencia o rezago escolar', 'Inserción laboral',
    'Logro educativo', 'Pensiones', 'Saneamiento'
  ]);

  availableMeasures = signal<string[]>([
    'Incidencia ajustada (M0)', 'Incidencia (H)', 'Intensidad (A)'
  ]);

  availableAreas = signal<string[]>([
    'Rural', 'Nacional', 'Urbana'
  ]);

  availableAgeRanges = signal<string[]>([
    '0 a 17 años', '18 a 59 años', '60 años y más', 'Total'
  ]);


  contributionLatamError = signal<string>('');
  nationalPovertyError = signal<string>('');
  povertyByAgeError = signal<string>('');

  // Formulario Contribuciones con múltiples dominios (Máx. 5)
  contributionLatamForm = new FormGroup({
    deprivations: new FormControl<string[]>(['Analfabetismo'], {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(5)]
    }),
    country: new FormControl<string>('Ecuador', { nonNullable: true }),
    yearStart: new FormControl<string>('2026', [Validators.required, Validators.pattern('^[0-9]{4}$'), Validators.min(2000), Validators.max(2100)]),
    yearEnd: new FormControl<string>('2030', [Validators.required, Validators.pattern('^[0-9]{4}$'), Validators.min(2000), Validators.max(2100)])
  });

  // Formulario Contribuciones con múltiples áres (Máx. 3)
  nationalPovertyForm = new FormGroup({
    country: new FormControl<string>('Ecuador', { nonNullable: true }),
    areas: new FormControl<string[]>(['Urbana'], {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(3)]
    }),
    measure: new FormControl<string>('Incidencia (H)', { nonNullable: true }),
    yearStart: new FormControl<string>('2026', [Validators.required, Validators.pattern('^[0-9]{4}$'), Validators.min(2000), Validators.max(2100)]),
    yearEnd: new FormControl<string>('2030', [Validators.required, Validators.pattern('^[0-9]{4}$'), Validators.min(2000), Validators.max(2100)])
  });

  // Formulario Contribuciones con múltiples rangos (Máx. 3)
  povertyByAgeForm = new FormGroup({
    country: new FormControl<string>('Ecuador', { nonNullable: true }),
    area: new FormControl<string>('Nacional', { nonNullable: true }),
    age_ranges: new FormControl<string[]>(['0 a 17 años'], {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(4)]
    }),
    yearStart: new FormControl<string>('2026', [Validators.required, Validators.pattern('^[0-9]{4}$'), Validators.min(2000), Validators.max(2100)]),
    yearEnd: new FormControl<string>('2030', [Validators.required, Validators.pattern('^[0-9]{4}$'), Validators.min(2000), Validators.max(2100)])
  });

  contributionLatamPrediction() {
    this.contributionLatamError.set('');
    if (!this.validateForm(this.contributionLatamForm, this.contributionLatamError)) return;

    const { deprivations, country, yearStart, yearEnd } = this.contributionLatamForm.getRawValue();
    const start = Number(yearStart);
    const diffYears = Number(yearEnd) - start;

    this.dashboardService.predictContributionMulti(deprivations, country, start, diffYears);
  }

  nationalPovertyPrediction() {
    this.nationalPovertyError.set('');
    if (!this.validateForm(this.nationalPovertyForm, this.nationalPovertyError)) return;

    const { country, areas, measure, yearStart, yearEnd } = this.nationalPovertyForm.getRawValue();
    const start = Number(yearStart);
    const diffYears = Number(yearEnd) - start;

    this.dashboardService.predictNationalPovertyMulti(country, areas, measure, start, diffYears);
  }

  povertyByAgePrediction() {
    this.povertyByAgeError.set('');
    if (!this.validateForm(this.povertyByAgeForm, this.povertyByAgeError)) return;

    const { country, area, age_ranges, yearStart, yearEnd } = this.povertyByAgeForm.getRawValue();
    const start = Number(yearStart);
    const diffYears = Number(yearEnd) - start;

    this.dashboardService.predictPovertyByAgeMulti(country, area, age_ranges, start, diffYears);
  }

  private validateForm(form: FormGroup, errorSignal: ReturnType<typeof signal<string>>): boolean {
    if (form.invalid) {
      form.markAllAsTouched();
      if (form.get('countries')?.hasError('maxlength')) {
        errorSignal.set('Puedes seleccionar máximo 5 elementos para comparar');
      }
      else {
        errorSignal.set('Ingresa datos válidos en todos los campos');
      }
      return false;
    }

    const start = Number(form.get('yearStart')?.value);
    const end = Number(form.get('yearEnd')?.value);

    if (start >= end) {
      errorSignal.set('El año de inicio debe ser menor al de fin');
      return false;
    }

    return true;
  }

  // Exportar a PDF
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  protected readonly exporter = inject(PredictionPdfExportService);
  protected readonly exportableCount = signal(0);

  private readonly watchExportable = afterEveryRender(() =>
    this.exportableCount.set(this.exporter.countExportable(this.host.nativeElement)),
  );

  protected exportPdf(): void {
    void this.exporter.run(this.host.nativeElement, {
      title: 'Predicciones de Latinoamérica',
      slug: 'latinoamerica',
    });
  }

  // Sidebar
  sidebarOpen = signal<boolean>(true);

  // Método para alternar el estado
  toggleSidebar() {
    this.sidebarOpen.update(open => !open);
  }

}