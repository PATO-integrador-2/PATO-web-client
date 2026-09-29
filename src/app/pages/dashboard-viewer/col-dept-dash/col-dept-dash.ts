import { Component, inject, signal, effect } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgComponentOutlet } from '@angular/common';
import { Widget } from '../../../components/widget/widget';
import { Navbar } from '../../../components/navbar/navbar';
import { isPlatformBrowser } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ColDeptService } from '../../../core/services/dashboard-services/col-dept.service';
import { NavbarDashboard } from '../../../components/navbar-dashboard/navbar-dashboard';

@Component({
  selector: 'app-col-dept-dash',
  imports: [Navbar, NavbarDashboard, NgComponentOutlet, MatSelectModule, MatFormFieldModule],
  templateUrl: './col-dept-dash.html',
  styleUrl: './col-dept-dash.css',
})
export class ColDeptDash {
  public dashboardService = inject(ColDeptService);

  year = signal<number>(2023);
  region = signal<string>('Caribe');
  dept = signal<string>('Arauca');

  private route = inject(ActivatedRoute);

  constructor() {
    const params = this.route.snapshot.queryParamMap;
    this.year.set(Number(params.get('year')) || 2023);
    this.region.set(params.get('region') || 'Caribe');
    this.dept.set(params.get('department') || 'Arauca');
  }

  ngOnInit() {
    effect(() => {
      const year = this.year();
      const region = this.region();
      const dept= this.dept();

      this.dashboardService.loadNationalPovertyData(year, region, dept);

    })
  }
}

export { ColDeptDash as ColDept };
