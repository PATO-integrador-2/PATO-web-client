import { Component, computed, inject, signal } from '@angular/core';
import { Navbar } from '../../components/navbar/navbar';
import { MapElementComponent } from '../../components/map-element/map-element';
import { LocationInfoPanel } from '../../components/location-info-panel/location-info-panel';
import { LocationService } from '../../core/services/location.service';
import {
  MapMetricsService,
  normalizeCountryName,
  normalizeDepartmentName,
  normalizeRegionName,
} from '../../core/services/map-metrics.service';
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
  private readonly locationService = inject(LocationService);

  selectedLevel = computed<LocationInfoLevel>(() => {
    const location = this.currentLocation();
    if (location?.departamento) return 'department';
    if (location?.region) return 'region';
    return 'country';
  });

  selectedName = computed(() => {
    const location = this.currentLocation();
    if (location?.departamento) {
      return this.locationService.departmentFeatures()
        .find(department => department.code === location.departamento)?.name ?? location.departamento;
    }
    return location?.departamento ?? location?.region ?? location?.pais ?? '';
  });

  selectedMetrics = computed(() => {
    const location = this.currentLocation();
    if (!location?.pais) return null;

    if (location.departamento) {
      const department = this.locationService.departmentFeatures()
        .find(item => item.code === location.departamento);
      const metric = this.mapMetricsService.departmentMetrics()
        .get(normalizeDepartmentName(department?.name ?? location.departamento));
      const years = this.mapMetricsService.departmentYears()
        .get(normalizeDepartmentName(department?.name ?? location.departamento));
      return {
        primaryLabel: 'IPM Departamento',
        primaryValue: metric,
        highestYear: years?.highestYear,
        lowestYear: years?.lowestYear,
      };
    }

    if (location.region) {
      const metric = this.mapMetricsService.regionMetrics()
        .get(normalizeRegionName(location.region));
      const years = this.mapMetricsService.regionYears()
        .get(normalizeRegionName(location.region));
      return {
        primaryLabel: 'IPM Región',
        primaryValue: metric,
        highestYear: years?.highestYear,
        lowestYear: years?.lowestYear,
      };
    }

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
