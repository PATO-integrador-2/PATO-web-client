import { Component, inject, signal, effect } from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { Widget } from '../../../components/widget/widget';
import { Navbar } from '../../../components/navbar/navbar';
import { isPlatformBrowser } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ColNationalService } from '../../../core/services/predictions-services/col-national.service';
import { MatInputModule } from '@angular/material/input';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {MatSidenavModule} from '@angular/material/sidenav';
import { MatDividerModule } from '@angular/material/divider';
import {MatExpansionModule} from '@angular/material/expansion';
import {MatGridListModule} from '@angular/material/grid-list';

@Component({
  selector: 'app-col-national',
  imports: [MatGridListModule, MatExpansionModule, MatSidenavModule, Navbar, MatDividerModule, NgComponentOutlet, MatSelectModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule, MatButtonModule ],
  templateUrl: './col-national-predict.html',
  styleUrl: './col-national-predict.css',
})
export class ColNationalPredict {
  public dashboardService = inject(ColNationalService);
  // Panel de sidebar
  readonly panelOpenState = signal(false);
  errorMessage = signal('');

  yearStartControl = new FormControl<number | string>('', [
    Validators.required,
    Validators.pattern('^[0-9]{4}$'),
    Validators.min(2000),
    Validators.max(2100)
  ]);

  yearEndControl = new FormControl<number | string>('', [
    Validators.required,
    Validators.pattern('^[0-9]{4}$'),
    Validators.min(2000),
    Validators.max(2100)
  ]);

  availableDomains = signal<string[]>(
    [
      'Cabecera',
      'Cabeceras',
      'Caribe',
      'Central',
      'Centros poblados y rural disperso',
      'Bogotá (Cabecera)',
      'Nacional',
      'Oriental',
      'Orinoquía - Amazonia',
      'Pacífica'
    ]
  );

  availableVariables = signal<string[]>(
    [
      'Analfabetismo',
      'Bajo logro educativo',
      'Barreras a servicios para cuidado de la primera infancia',
      'Barreras de acceso a servicios de salud',
      'Desempleo de larga duración',
      'Hacinamiento crítico',
      'Inadecuada eliminación de excretas',
      'Inasistencia escolar',
      'Material inadecuado de pisos',
      'Material inadecuado de paredes exteriores',
      'Rezago escolar',
      'Sin acceso a fuente de agua mejorada',
      'Sin aseguramiento en salud',
      'Trabajo infantil',
      'Trabajo informal'
    ]
  );

  domain = signal<string>('Nacional');
  variable = signal<string>('Trabajo informal');
  begin_year = signal<number>(2010);
  years = signal<number>(5);

  // Mensajes de error independientes por panel
  mpiError = signal<string>('');
  deprivationError = signal<string>('');

  // Formulario 1: IPM (Dominio + Años)
  mpiForm = new FormGroup({
    domain: new FormControl<string>('Nacional', { nonNullable: true }),
    yearStart: new FormControl<string>('', [Validators.required, Validators.pattern('^[0-9]{4}$'), Validators.min(2000), Validators.max(2100)]),
    yearEnd: new FormControl<string>('', [Validators.required, Validators.pattern('^[0-9]{4}$'), Validators.min(2000), Validators.max(2100)])
  });

  // Formulario 2: Privación (Variable + Dominio + Años)
  deprivationForm = new FormGroup({
    variable: new FormControl<string>('Trabajo informal', { nonNullable: true }),
    domain: new FormControl<string>('Nacional', { nonNullable: true }),
    yearStart: new FormControl<string>('', [Validators.required, Validators.pattern('^[0-9]{4}$'), Validators.min(2000), Validators.max(2100)]),
    yearEnd: new FormControl<string>('', [Validators.required, Validators.pattern('^[0-9]{4}$'), Validators.min(2000), Validators.max(2100)])
  });

  // Métodos de disparo
  mpiPrediction() {
    this.mpiError.set('');
    if (!this.validateForm(this.mpiForm, this.mpiError)) return;

    const { domain, yearStart, yearEnd } = this.mpiForm.getRawValue();
    const start = Number(yearStart);
    const diffYears = Number(yearEnd) - start;

    this.dashboardService.predictMpi(domain, start, diffYears);
  }

  deprivationsPrediction() {
    this.deprivationError.set('');
    if (!this.validateForm(this.deprivationForm, this.deprivationError)) return;

    const { variable, domain, yearStart, yearEnd } = this.deprivationForm.getRawValue();
    const start = Number(yearStart);
    const diffYears = Number(yearEnd) - start;

    this.dashboardService.predictDeprivations(variable, domain, start, diffYears);
  }

  // Validador reutilizable para cualquier formulario de rango de años
  private validateForm(form: FormGroup, errorSignal: ReturnType<typeof signal<string>>): boolean {
    if (form.invalid) {
      form.markAllAsTouched();
      errorSignal.set('Ingresa años válidos entre 2000 y 2100');
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

}


