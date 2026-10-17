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

import { PredictionPdfExportService } from '../../../core/services/pdf-export/prediction-pdf-export.service';
import { ColDeptService } from '../../../core/services/predictions-services/col-dept.service';

@Component({
  selector: 'app-col-dept-predict',
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
  templateUrl: './col-dept-predict.html',
  styleUrl: './col-dept-predict.css',
})
export class ColDeptPredict {
  public dashboardService = inject(ColDeptService);
  readonly panelOpenState = signal(false);

  private regionDepartamentsMap: Record<string, string[]> = {
    'Bogotá D.C': ['Bogotá D.C.'],
    'Caribe': ['Atlántico', 'Bolívar', 'Cesar', 'Córdoba', 'La Guajira', 'Magdalena', 'Sucre'],
    'Central': ['Antioquia', 'Caldas', 'Risaralda', 'Quindío', 'Tolima'],
    'Oriental': ['Boyacá', 'Cundinamarca', 'Meta', 'Norte de Santander', 'Santander'],
    'Orinoquía - Amazonía': ['Arauca', 'Casanare', 'Guainía', 'Guaviare', 'Vichada', 'Amazonas', 'Caquetá', 'Vaupés'],
    'Pacífica': ['Cauca', 'Chocó', 'Nariño', 'Valle del Cauca']
  };

  availableRegions = signal<string[]>([
    'Bogotá D.C', 'Caribe',
    'Central', 'Oriental',
    'Orinoquía - Amazonía', 'Pacífica',
  ]);

  availableDepartaments = signal<string[]>(this.regionDepartamentsMap['Caribe']);
  deptartamentPovertyError = signal<string>('');

  // Formulario Contribuciones con múltiples dominios (Máx. 5)
  deptartamentPovertyForm = new FormGroup({
    region: new FormControl<string>('Caribe', { nonNullable: true }),
    departaments: new FormControl<string[]>(['Bolívar'], {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(5)]
    }),
    yearStart: new FormControl<string>('2026', [Validators.required, Validators.pattern('^[0-9]{4}$'), Validators.min(2000), Validators.max(2100)]),
    yearEnd: new FormControl<string>('2030', [Validators.required, Validators.pattern('^[0-9]{4}$'), Validators.min(2000), Validators.max(2100)])
  });

  deptartamentPovertyPrediction() {
    this.deptartamentPovertyError.set('');
    if (!this.validateForm(this.deptartamentPovertyForm, this.deptartamentPovertyError)) return;

    const { region, departaments, yearStart, yearEnd } = this.deptartamentPovertyForm.getRawValue();
    const start = Number(yearStart);
    const diffYears = Number(yearEnd) - start;

    this.dashboardService.predictdeptartamentPovertyMulti(region, departaments, start, diffYears);
  }

  ngOnInit(): void {
    // Escuchar cambios en el campo 'region' del formulario
    this.deptartamentPovertyForm.get('region')?.valueChanges.subscribe((selectedRegion) => {
      if (selectedRegion && this.regionDepartamentsMap[selectedRegion]) {
        // Actualizamos la señal con los departamentos de la región seleccionada
        this.availableDepartaments.set(this.regionDepartamentsMap[selectedRegion]);
      } else {
        this.availableDepartaments.set([]);
      }

      // Opcional: Limpiar la selección de departamentos previa al cambiar de región
      this.deptartamentPovertyForm.get('departaments')?.setValue([]);
    });
  }

  private validateForm(form: FormGroup, errorSignal: ReturnType<typeof signal<string>>): boolean {
    if (form.invalid) {
      form.markAllAsTouched();
      if (form.get('departaments')?.hasError('maxlength')) {
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


}


