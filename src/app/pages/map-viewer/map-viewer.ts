import { Component, computed, inject, signal } from '@angular/core';
import { Navbar } from '../../components/navbar/navbar';
import { MapElementComponent } from '../../components/map-element/map-element';
import { LocationInfoPanel } from '../../components/location-info-panel/location-info-panel';
import { MapMetricsService, normalizeCountryName } from '../../core/services/map-metrics.service';
import type { LocationInfoLevel, MapLocation } from '../../interfaces/map-location';

@Component({
  selector: 'app-map-viewer',
  imports: [Navbar, MapElementComponent, LocationInfoPanel],
  templateUrl: './map-viewer.html',
  styleUrl: './map-viewer.css',
})
export class MapViewer {
  
  currentLocation = signal<MapLocation | null>(null);
  panelOpen = signal(false);
  panelPosition = signal<{ x: number; y: number } | null>(null);
  private readonly mapMetricsService = inject(MapMetricsService);

  selectedLevel = computed<LocationInfoLevel>(() => {
    const location = this.currentLocation();
    if (location?.departamento) return 'department';
    if (location?.region) return 'region';
    return 'country';
  });

  selectedName = computed(() => {
    const location = this.currentLocation();
    return location?.departamento ?? location?.region ?? location?.pais ?? '';
  });

  selectedMetrics = computed(() => {
    const location = this.currentLocation();
    if (!location?.pais || location.region || location.departamento) return null;
    return this.mapMetricsService.countryInfo().get(normalizeCountryName(location.pais)) ?? null;
  });

  onMapLocationChange(location: MapLocation): void {
    this.currentLocation.set(location);
    this.panelOpen.set(!!location.pais || !!location.region || !!location.departamento);
  }

  onLocationAnchorChange(position: { x: number; y: number }): void {
    this.panelPosition.set(position);
  }

  closeLocationPanel(): void {
    this.panelOpen.set(false);
  }
}
