import { Component, ElementRef, afterEveryRender, inject, signal, effect } from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { Navbar } from '../../../components/navbar/navbar';
import { NavbarPredictions } from '../../../components/navbar-predictions/navbar-predictions';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ColNationalService } from '../../../core/services/predictions-services/col-national.service';
import { MatInputModule } from '@angular/material/input';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';

import { PredictionPdfExportService } from '../../../core/services/pdf-export/prediction-pdf-export.service';

@Component({
  selector: 'app-col-national',
  imports: [NavbarPredictions, MatIconModule, MatGridListModule, MatExpansionModule, MatSidenavModule, Navbar, MatDividerModule, NgComponentOutlet, MatSelectModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule, MatButtonModule],
  templateUrl: './col-national-predict.html',
  styleUrl: './col-national-predict.css',
})
export class ColNationalPredict {
  public dashboardService = inject(ColNationalService);
  readonly panelOpenState = signal(false);

  availableDomains = signal<string[]>([
    'Cabecera', 'Cabeceras', 'Caribe', 'Central',
    'Centros poblados y rural disperso', 'Bogotá (Cabecera)',
    'Nacional', 'Oriental', 'Orinoquía - Amazonia', 'Pacífica'
  ]);

  availableVariables = signal<string[]>([
    'Analfabetismo', 'Bajo logro educativo',
    'Barreras a servicios para cuidado de la primera infancia',
    'Barreras de acceso a servicios de salud', 'Desempleo de larga duración',
    'Hacinamiento crítico', 'Inadecuada eliminación de excretas',
    'Inasistencia escolar', 'Material inadecuado de pisos',
    'Material inadecuado de paredes exteriores', 'Rezago escolar',
    'Sin acceso a fuente de agua mejorada', 'Sin aseguramiento en salud',
    'Trabajo infantil', 'Trabajo informal'
  ]);

  availableDimensions = signal<string[]>([
    'Niñez y juventud', 'Salud', 'Trabajo',
    'Educación', 'Vivienda' 
  ]);

  availableSexes = signal<string[]>([
    'Hombre', 'Mujer'
  ]);

  mpiError = signal<string>('');
  deprivationError = signal<string>('');
  percentageError = signal<string>('');
  dimensionError = signal<string>('');
  incidenceBySexError = signal<string>('');
  incidenceByHeadSexError = signal<string>('');

  // Formulario IPM con múltiples dominios (Máx. 5)
  mpiForm = new FormGroup({
    domains: new FormControl<string[]>(['Nacional'], {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(5)]
    }),
    yearStart: new FormControl<string>('2026', [Validators.required, Validators.pattern('^[0-9]{4}$'), Validators.min(2000), Validators.max(2100)]),
    yearEnd: new FormControl<string>('2030', [Validators.required, Validators.pattern('^[0-9]{4}$'), Validators.min(2000), Validators.max(2100)])
  });

  // Formulario Privaciones con múltiples variables (Máx. 5)
  deprivationForm = new FormGroup({
    variables: new FormControl<string[]>(['Trabajo informal'], {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(5)]
    }),
    domain: new FormControl<string>('Nacional', { nonNullable: true }),
    yearStart: new FormControl<string>('2026', [Validators.required, Validators.pattern('^[0-9]{4}$'), Validators.min(2000), Validators.max(2100)]),
    yearEnd: new FormControl<string>('2030', [Validators.required, Validators.pattern('^[0-9]{4}$'), Validators.min(2000), Validators.max(2100)])
  });

  // Formulario Privaciones con múltiples variables (Máx. 5)
  percentageForm = new FormGroup({
    domains: new FormControl<string[]>(['Cabecera'], {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(5)]
    }),
    yearStart: new FormControl<string>('2026', [Validators.required, Validators.pattern('^[0-9]{4}$'), Validators.min(2000), Validators.max(2100)]),
    yearEnd: new FormControl<string>('2030', [Validators.required, Validators.pattern('^[0-9]{4}$'), Validators.min(2000), Validators.max(2100)])
  });

  // Formulario Dimensiones con múltiples variables (Máx. 5)
  dimensionForm = new FormGroup({
    dimensions: new FormControl<string[]>(['Salud'], {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(5)]
    }),
    domain: new FormControl<string>('Nacional', { nonNullable: true }),
    yearStart: new FormControl<string>('2026', [Validators.required, Validators.pattern('^[0-9]{4}$'), Validators.min(2000), Validators.max(2100)]),
    yearEnd: new FormControl<string>('2030', [Validators.required, Validators.pattern('^[0-9]{4}$'), Validators.min(2000), Validators.max(2100)])
  });

  // Formulario de incidencia por sexo 
  incidenceBySexForm = new FormGroup({
    domains: new FormControl<string[]>(['Central'], {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(5)]
    }),
    sex: new FormControl<string>('Mujer', { nonNullable: true }),
    yearStart: new FormControl<string>('2026', [Validators.required, Validators.pattern('^[0-9]{4}$'), Validators.min(2000), Validators.max(2100)]),
    yearEnd: new FormControl<string>('2030', [Validators.required, Validators.pattern('^[0-9]{4}$'), Validators.min(2000), Validators.max(2100)])
  });

  // Formulario de incidencia por sexo de jefe del hogar
  incidenceByHeadSexForm = new FormGroup({
    domains: new FormControl<string[]>(['Caribe'], {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(5)]
    }),
    sex: new FormControl<string>('Hombre', { nonNullable: true }),
    yearStart: new FormControl<string>('2026', [Validators.required, Validators.pattern('^[0-9]{4}$'), Validators.min(2000), Validators.max(2100)]),
    yearEnd: new FormControl<string>('2030', [Validators.required, Validators.pattern('^[0-9]{4}$'), Validators.min(2000), Validators.max(2100)])
  });

  mpiPrediction() {
    this.mpiError.set('');
    if (!this.validateForm(this.mpiForm, this.mpiError)) return;

    const { domains, yearStart, yearEnd } = this.mpiForm.getRawValue();
    const start = Number(yearStart);
    const diffYears = Number(yearEnd) - start;

    this.dashboardService.predictMpiMulti(domains, start, diffYears);
  }

  deprivationsPrediction() {
    this.deprivationError.set('');
    if (!this.validateForm(this.deprivationForm, this.deprivationError)) return;

    const { variables, domain, yearStart, yearEnd } = this.deprivationForm.getRawValue();
    const start = Number(yearStart);
    const diffYears = Number(yearEnd) - start;

    this.dashboardService.predictDeprivationsMulti(variables, domain, start, diffYears);
  }

  percentagePrediction() {
    this.percentageError.set('');
    if (!this.validateForm(this.percentageForm, this.percentageError)) return;

    const { domains, yearStart, yearEnd } = this.percentageForm.getRawValue();
    const start = Number(yearStart);
    const diffYears = Number(yearEnd) - start;

    this.dashboardService.predictPercentageMulti(domains, start, diffYears);
  }

  dimensionsPrediction() {
    this.dimensionError.set('');
    if (!this.validateForm(this.dimensionForm, this.dimensionError)) return;

    const { dimensions, domain, yearStart, yearEnd } = this.dimensionForm.getRawValue();
    const start = Number(yearStart);
    const diffYears = Number(yearEnd) - start;

    this.dashboardService.predictDimensionsMulti(dimensions, domain, start, diffYears);
  }

  incidenceBySexPrediction() {
    this.incidenceBySexError.set('');
    if (!this.validateForm(this.incidenceBySexForm, this.incidenceBySexError)) return;

    const { domains, sex, yearStart, yearEnd } = this.incidenceBySexForm.getRawValue();
    const start = Number(yearStart);
    const diffYears = Number(yearEnd) - start;

    this.dashboardService.predictIncidenceBySexMulti(domains, sex, start, diffYears);
  }

  incidenceByHeadSexPrediction() {
    this.incidenceByHeadSexError.set('');
    if (!this.validateForm(this.incidenceByHeadSexForm, this.incidenceByHeadSexError)) return;

    const { domains, sex, yearStart, yearEnd } = this.incidenceByHeadSexForm.getRawValue();
    const start = Number(yearStart);
    const diffYears = Number(yearEnd) - start;

    this.dashboardService.predictIncidenceByHeadSexMulti(domains, sex, start, diffYears);
  }

  private validateForm(form: FormGroup, errorSignal: ReturnType<typeof signal<string>>): boolean {
    if (form.invalid) {
      form.markAllAsTouched();
      if (form.get('domains')?.hasError('maxlength') || form.get('variables')?.hasError('maxlength')) {
        errorSignal.set('Puedes seleccionar máximo 5 elementos para comparar');
      } else {
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
      title: 'Predicciones nacionales de Colombia',
      slug: 'colombia',
    });
  }

  // Sidebar
  sidebarOpen = signal<boolean>(true);

  // Método para alternar el estado
  toggleSidebar() {
    this.sidebarOpen.update(open => !open);
  }

}