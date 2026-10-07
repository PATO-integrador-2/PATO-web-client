import { Component, inject, signal, effect } from '@angular/core';
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
  'Argentina', 'Bolivia', 'Brasil', 'Chile', 'Colombia', 
  'Costa Rica', 'Ecuador', 'El Salvador', 'Guatemala', 'Honduras', 
  'México', 'Nicaragua', 'Panamá', 'Paraguay', 'Perú', 
  'República Dominicana', 'Uruguay'
]);

  availableDeprivations = signal<string[]>([
    'Analfabetismo', 'Bajo logro educativo',
    'Barreras a servicios para cuidado de la primera infancia',
    'Barreras de acceso a servicios de salud', 'Desempleo de larga duración',
    'Hacinamiento crítico', 'Inadecuada eliminación de excretas',
    'Inasistencia escolar', 'Material inadecuado de pisos',
    'Material inadecuado de paredes exteriores', 'Rezago escolar',
    'Sin acceso a fuente de agua mejorada', 'Sin aseguramiento en salud',
    'Trabajo infantil', 'Trabajo informal'
  ]);

  availableMeasures = signal<string[]>([
    'Incidencia', 'Incidencia ajustada', 'Intensidad'
  ]);

  availableAreas = signal<string[]>([
    'Rural', 'Nacional', 'Urbana'
  ]);

  availableAgeRanges = signal<string[]>([
    '0-17','18-59', '60 años y más', 'Total'
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
    country: new FormControl<string>('Chile', { nonNullable: true }),
    yearStart: new FormControl<string>('2026', [Validators.required, Validators.pattern('^[0-9]{4}$'), Validators.min(2000), Validators.max(2100)]),
    yearEnd: new FormControl<string>('2030', [Validators.required, Validators.pattern('^[0-9]{4}$'), Validators.min(2000), Validators.max(2100)])
  });

  // Formulario Contribuciones con múltiples áres (Máx. 3)
  nationalPovertyForm = new FormGroup({
    country: new FormControl<string>('Chile', { nonNullable: true }),
    areas: new FormControl<string[]>(['Urbana'], {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(3)]
    }),
    measure: new FormControl<string>('Incidencia', { nonNullable: true }),
    yearStart: new FormControl<string>('2026', [Validators.required, Validators.pattern('^[0-9]{4}$'), Validators.min(2000), Validators.max(2100)]),
    yearEnd: new FormControl<string>('2030', [Validators.required, Validators.pattern('^[0-9]{4}$'), Validators.min(2000), Validators.max(2100)])
  });

  // Formulario Contribuciones con múltiples rangos (Máx. 3)
  povertyByAgeForm = new FormGroup({
    country: new FormControl<string>('Chile', { nonNullable: true }),
    area: new FormControl<string>('Nacional', { nonNullable: true }),
    age_ranges: new FormControl<string[]>(['0-17'], {
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

    this.dashboardService.predictNationalPovertyMulti( country, areas, measure, start, diffYears);
  }

  povertyByAgePrediction() {
    this.povertyByAgeError.set('');
    if (!this.validateForm(this.povertyByAgeForm, this.povertyByAgeError)) return;

    const { country, area, age_ranges, yearStart, yearEnd } = this.povertyByAgeForm.getRawValue();
    const start = Number(yearStart);
    const diffYears = Number(yearEnd) - start;

    this.dashboardService.predictPovertyByAgeMulti( country, area, age_ranges, start, diffYears);
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

  // Sidebar
  sidebarOpen = signal<boolean>(true);

  // Método para alternar el estado
  toggleSidebar() {
    this.sidebarOpen.update(open => !open);
  }


}
