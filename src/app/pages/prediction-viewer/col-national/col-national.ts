import { Component, inject, signal, effect } from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { Widget } from '../../../components/widget/widget';
import { Navbar } from '../../../components/navbar/navbar';
import { isPlatformBrowser } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ColNationalService } from '../../../core/services/predictions-services/col-national.service';
import { FormControl, Validators } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-col-national',
  imports: [Navbar, NgComponentOutlet, MatSelectModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule, MatButtonModule ],
  templateUrl: './col-national.html',
  styleUrl: './col-national.css',
})
export class ColNational {
  public dashboardService = inject(ColNationalService);

  yearStartControl = new FormControl('', [Validators.pattern('^[0-9]*$')]);
  yearEndControl = new FormControl('', [Validators.pattern('^[0-9]*$')]);

  availableDomains = signal<string[]>(
    [
      'Nacional',
      'Cabecera',
      'Bogotá (Cabecera)',
      'Pacífica'

    ]
  );

  domain = signal<string>('Nacional');
  begin_year = signal<number>(2010);
  years = signal<number>(5);

  pmiPrediction() {
    if (this.yearStartControl.invalid || this.yearEndControl.invalid) {
      this.yearStartControl.markAsTouched();
      this.yearEndControl.markAsTouched();
      return;
    }

    const start = Number(this.yearStartControl.value);
    const end = Number(this.yearEndControl.value);

    const currentDomain = this.domain(); 
    const startYear = start;
    const diffYears = end - start;

    this.begin_year.set(startYear);
    this.years.set(diffYears);
    this.dashboardService.predictMpi(currentDomain, startYear, diffYears);

  }

  constructor() {
    effect(() => {
      const domain = this.domain();
      const begin_year = this.begin_year();
      const years = this.years();

      this.dashboardService.predictMpi(domain, begin_year, years);
    });
  }
}


