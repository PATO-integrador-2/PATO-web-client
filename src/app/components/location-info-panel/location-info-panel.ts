import { PercentPipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import type { LocationInfoLevel, LocationInfoMetrics } from '../../interfaces/map-location';

@Component({
  selector: 'app-location-info-panel',
  imports: [PercentPipe],
  templateUrl: './location-info-panel.html',
  styleUrl: './location-info-panel.css',
})
export class LocationInfoPanel {
  locationName = input.required<string>();
  level = input.required<LocationInfoLevel>();
  metrics = input<LocationInfoMetrics | null>(null);
  close = output<void>();

  onHistoryClick(): void {
    // TODO: conectar con el panel histórico.
  }

  onPredictionsClick(): void {
    // TODO: conectar con la vista de predicciones.
  }
}