import { PercentPipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { Router } from '@angular/router';
import type { LocationInfoLevel, LocationInfoMetrics } from '../../interfaces/map-location';
import type { MapLocation } from '../../interfaces/map-location';

@Component({
  selector: 'app-location-info-panel',
  imports: [PercentPipe],
  templateUrl: './location-info-panel.html',
  styleUrl: './location-info-panel.css',
})
export class LocationInfoPanel {
  locationName = input.required<string>();
  location = input.required<MapLocation>();
  level = input.required<LocationInfoLevel>();
  metrics = input<LocationInfoMetrics | null>(null);
  close = output<void>();

  constructor(private router: Router) {}

  onHistoryClick(): void {
    const location = this.location();
    const isCountry = this.level() === 'country';
    this.router.navigate([isCountry ? '/latin-dash' : '/col-dept-dash'], {
      queryParams: isCountry
        ? { country: location.pais, year: this.metrics()?.latestYear }
        : {
            country: location.pais,
            region: location.region,
            department: location.departamento,
            year: this.metrics()?.latestYear,
          },
    });
  }

  onPredictionsClick(): void {
    this.router.navigate(['/col-national-predict'], {
      queryParams: {
        country: this.location().pais,
        domain: this.locationName(),
        year: this.metrics()?.latestYear,
      },
    });
  }
}