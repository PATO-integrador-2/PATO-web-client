import {
  Component, ElementRef, Injector, OnDestroy, ViewChild,
  afterNextRender, effect, input, output,
} from '@angular/core';
import type * as L from 'leaflet';
import type { Feature, FeatureCollection } from 'geojson';
import type { MapLocation } from '../../interfaces/map-location';
import { GeoDataService } from '../../core/services/geo-data-service';
import { dptName } from '../../interfaces/department-model';
import { LocationService } from '../../core/services/location.service';
import {
  MapMetricsService,
  normalizeCountryName,
  normalizeRegionName,
} from '../../core/services/map-metrics.service';


const DEFAULT_VIEW = { center: [4.5709, -74.2973] as L.LatLngExpression, zoom: 6 };
const LATIN_AMERICA_BOUNDS: L.LatLngBoundsExpression = [[-60, -160], [35, -20]];
const REGION_BASE_STYLE = { color: '#4b5563', weight: 2, fillColor: '#e5e7eb', fillOpacity: 0.6 };
const REGION_HOVER_STYLE = { weight: 3, color: '#111827', fillOpacity: 0.8 };
const DEPARTMENT_BASE_STYLE = { color: '#6b7280', weight: 1.2, fillColor: '#f3f4f6', fillOpacity: 0.6 };
const DEPARTMENT_HOVER_STYLE = { weight: 2.5, color: '#111827', fillOpacity: 0.8 };
const COUNTRY_BASE_STYLE = { color: '#64748b', weight: 1, fillColor: '#cbd5e1', fillOpacity: 0.45 };
const NO_DATA_COLOR = '#d1d5db';

export function metricColor(value: number | undefined): string {
  if (value === undefined || Number.isNaN(value)) return NO_DATA_COLOR;

  const normalized = Math.min(1, Math.max(0, value));
  const stops = [
    { at: 0, color: [46, 125, 50] },
    { at: 0.5, color: [245, 196, 66] },
    { at: 1, color: [198, 40, 40] },
  ];
  const start = normalized <= 0.5 ? stops[0] : stops[1];
  const end = normalized <= 0.5 ? stops[1] : stops[2];
  const ratio = (normalized - start.at) / (end.at - start.at);
  const channels = start.color.map((channel, index) =>
    Math.round(channel + (end.color[index] - channel) * ratio)
  );

  return `rgb(${channels.join(', ')})`;
}

type ColombiaViewLevel = 'regions' | 'departments';
const MAP_SIDE_PANEL_SPACE = 320;

@Component({
  selector: 'app-map-element',
  imports: [],
  templateUrl: './map-element.html',
  styleUrl: './map-element.css',
})
export class MapElementComponent implements OnDestroy {
  locationChange = output<MapLocation>();
  locationAnchor = output<{ x: number; y: number }>();
  location = input<MapLocation | null>(null);
  @ViewChild('mapContainer', { static: true })
  mapContainer!: ElementRef<HTMLDivElement>;

  private map: L.Map | undefined;
  private leaflet: typeof import('leaflet') | undefined;
  private countriesLayer: L.GeoJSON | undefined;
  private regionsLayer: L.GeoJSON | undefined;
  private departmentsLayer: L.GeoJSON | undefined;
  colombiaLevel: ColombiaViewLevel = 'regions';
  private countriesGeojson: FeatureCollection | undefined;
  private countriesRequestId = 0;
  private regionsRequestId = 0;
  private departmentsRequestId = 0;

  constructor(
    private injector: Injector,
    private geoDataService: GeoDataService,
    private locationService: LocationService,
    private mapMetricsService: MapMetricsService
  ) {
    afterNextRender(async () => {
      const leafletModule: any = await import('leaflet');
      this.leaflet = leafletModule.default ?? leafletModule;

      this.initMap();
      this.locationService.load();
      this.mapMetricsService.load();

      effect(
        () => {
          const loc = this.location();
          this.locationService.status();
          this.mapMetricsService.ready();
          this.updateView(loc);
          this.syncColombiaLayers(loc);
        },
        { injector: this.injector }
      );
    }, { injector: this.injector });
  }

  ngOnDestroy(): void {
    this.countriesRequestId++;
    this.regionsRequestId++;
    this.departmentsRequestId++;
    this.map?.remove();
  }

  private initMap(): void {
    const L = this.leaflet!;

    this.map = L.map(this.mapContainer.nativeElement, {
      center: DEFAULT_VIEW.center,
      zoom: DEFAULT_VIEW.zoom,
      maxBounds: LATIN_AMERICA_BOUNDS,
      maxBoundsViscosity: 1,
      minZoom: 3,
      scrollWheelZoom: true,
    });

    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
        maxZoom: 16,
      }
    ).addTo(this.map);
  }

  private updateView(loc: MapLocation | null): void {
    if (!this.map || !this.leaflet) return;

    const L = this.leaflet;

    if (loc?.departamento) {
      const department = this.locationService
        .departmentFeatures()
        .find(department => department.code === loc.departamento);

      if (department) {
        this.focusBounds(L.geoJSON(department.feature as any).getBounds(), 1.2);
      }

      return;
    }

    if (loc?.region) {
      const region = this.locationService
        .regionFeatures()
        .find(region => region.name === loc.region);

      if (region) {
        this.focusBounds(L.geoJSON(region.feature as any).getBounds(), 1.2);
      }

      return;
    }

    if (loc?.pais && loc.pais !== 'Colombia') {
      const country = this.countriesGeojson?.features.find(
        feature => feature.properties?.['name'] === loc.pais
      );

      if (country) {
        this.focusBounds(L.geoJSON(country as any).getBounds(), 1.2);
      }

      return;
    }

    if (loc?.pais === 'Colombia') {
      this.focusBounds(L.latLngBounds([3.8, -79.1], [12.6, -66.8]), 1.2);
    }
  }

  private focusBounds(bounds: L.LatLngBounds, duration: number): void {
    this.map?.flyToBounds(bounds, {
      duration,
      paddingTopLeft: [32, 32],
      paddingBottomRight: [MAP_SIDE_PANEL_SPACE, 32],
    });
  }

  private updateLocationAnchor(location: L.LatLng): void {
    if (!this.map) return;

    const emitAnchor = () => {
      if (!this.map) return;
      const point = this.map.latLngToContainerPoint(location);
      this.locationAnchor.emit({ x: point.x, y: point.y });
    };

    emitAnchor();
    this.map.once('moveend', emitAnchor);
  }

  private syncColombiaLayers(loc: MapLocation | null): void {
    const isColombia = loc?.pais === 'Colombia';

    if (!isColombia) {
      this.removeRegionsLayer();
      this.removeDepartmentsLayer();
      this.showCountriesLayer();
      this.refreshCountriesLayer();
      this.colombiaLevel = 'regions';
      return;
    }
    
    this.removeCountriesLayer();
    const wantsDepartmentLevel = !!loc?.departamento || this.colombiaLevel === 'departments';

    if (wantsDepartmentLevel) {
      this.removeRegionsLayer();
      this.showDepartmentsLayer();
      this.refreshDepartmentsLayer();
    } else {
      this.removeDepartmentsLayer();
      this.showRegionsLayer();
      this.refreshRegionsLayer();
    }
  }

  private showRegionsLayer(): void {
    if (this.regionsLayer || !this.map) return;
    const L = this.leaflet!;
    const requestId = ++this.regionsRequestId;

    this.geoDataService.getColombiaRegions().subscribe((geojson) => {
      if (!this.map || requestId !== this.regionsRequestId || this.regionsLayer) return;
      this.regionsLayer = L.geoJSON(geojson as any, {
        style: (feature) => this.regionStyle(feature as Feature | undefined),
        onEachFeature: (feature: Feature, layer: L.Layer) => {
          const name = feature.properties?.['region'] ?? 'Región';
          layer.bindTooltip(name, { permanent: true, direction: 'center', className: 'department-label' });

          layer.on('mouseover', () => (layer as L.Path).setStyle(REGION_HOVER_STYLE));
          layer.on('mouseout', () => (layer as L.Path).setStyle(this.regionStyle(feature)));

          layer.on('click', (event: L.LeafletMouseEvent) => {
            this.locationChange.emit({
              pais: 'Colombia',
              region: name,
              departamento: null,
            });

            const bounds = (layer as L.Polygon).getBounds();
            this.focusBounds(bounds, 1.2);
            this.updateLocationAnchor(event.latlng);
          });
        },
      }).addTo(this.map);
    });
  }

  private showDepartmentsLayer(): void {
    if (this.departmentsLayer || !this.map) return;
    const L = this.leaflet!;
    const requestId = ++this.departmentsRequestId;

    this.geoDataService.getColombiaDepartments().subscribe((geojson) => {
      if (!this.map || requestId !== this.departmentsRequestId || this.departmentsLayer) return;
      this.departmentsLayer = L.geoJSON(geojson as any, {
        style: (feature) => this.departmentStyle(feature as Feature | undefined),
        onEachFeature: (feature: Feature, layer: L.Layer) => {
          const name = feature.properties?.[dptName] ?? 'Departamento';
          layer.bindTooltip(name, { permanent: true, direction: 'center', className: 'department-label' });

          layer.on('mouseover', () => (layer as L.Path).setStyle(DEPARTMENT_HOVER_STYLE));
          layer.on('mouseout', () => (layer as L.Path).setStyle(this.departmentStyle(feature)));
          layer.on('click', (event: L.LeafletMouseEvent) => {
            const code = feature.properties?.['DPTO'] ?? null;

            this.locationChange.emit({
              pais: 'Colombia',
              region: this.locationService.departmentFeatures()
                .find(department => department.code === code)?.regionName ?? null,
              departamento: code,
            });

            const bounds = (layer as L.Polygon).getBounds();
            this.focusBounds(bounds, 1.2);
            this.updateLocationAnchor(event.latlng);
          });
        },
      }).addTo(this.map);
    });
  }

  private regionStyle(feature: Feature | undefined): typeof REGION_BASE_STYLE {
    const name = feature?.properties?.['region'];
    return {
      ...REGION_BASE_STYLE,
      fillColor: metricColor(this.mapMetricsService.regionMetrics().get(normalizeRegionName(name))),
    };
  }

  private departmentStyle(feature: Feature | undefined): typeof DEPARTMENT_BASE_STYLE {
    const code = feature?.properties?.['DPTO'];
    const regionName = this.locationService.departmentFeatures()
      .find(department => department.code === code)?.regionName;

    return {
      ...DEPARTMENT_BASE_STYLE,
      fillColor: metricColor(
        regionName ? this.mapMetricsService.regionMetrics().get(normalizeRegionName(regionName)) : undefined
      ),
    };
  }

  private refreshRegionsLayer(): void {
    this.regionsLayer?.eachLayer(layer => this.refreshLayerStyle(layer, feature => this.regionStyle(feature)));
  }

  private refreshDepartmentsLayer(): void {
    this.departmentsLayer?.eachLayer(layer => this.refreshLayerStyle(layer, feature => this.departmentStyle(feature)));
  }

  private refreshCountriesLayer(): void {
    this.countriesLayer?.eachLayer(layer => this.refreshLayerStyle(layer, feature => this.countryStyle(feature)));
  }

  private refreshLayerStyle(
    layer: L.Layer,
    style: (feature: Feature) => L.PathOptions,
  ): void {
    const group = layer as L.Layer & {
      eachLayer?: (callback: (nestedLayer: L.Layer) => void) => void;
    };
    if (group.eachLayer) {
      group.eachLayer(nestedLayer => this.refreshLayerStyle(nestedLayer, style));
      return;
    }

    const feature = (layer as L.Layer & { feature?: Feature }).feature;
    if (feature && 'setStyle' in layer) {
      (layer as L.Path).setStyle(style(feature));
    }
  }

  private removeRegionsLayer(): void {
    this.regionsRequestId++;
    this.regionsLayer?.remove();
    this.regionsLayer = undefined;
  }

  private removeDepartmentsLayer(): void {
    this.departmentsRequestId++;
    this.departmentsLayer?.remove();
    this.departmentsLayer = undefined;
  }

  private showCountriesLayer(): void {
    if (this.countriesLayer || !this.map || !this.leaflet) return;

    const L = this.leaflet;
    const requestId = ++this.countriesRequestId;

    this.geoDataService.getCountries().subscribe({
      next: (geojson) => {
        if (!this.map || requestId !== this.countriesRequestId || this.countriesLayer) return;

        this.countriesGeojson = geojson;

        this.countriesLayer = L.geoJSON(geojson as any, {
          style: (feature) => this.countryStyle(feature as Feature | undefined),

          onEachFeature: (feature: Feature, layer: L.Layer) => {
            const name = feature.properties?.['name'] ?? 'País';

            layer.bindTooltip(name, {
              direction: 'center',
              className: 'country-label',
            });

            layer.on('mouseover', () => {
              (layer as L.Path).setStyle({
                weight: 2,
                color: '#0f172a',
                fillOpacity: 0.7,
              });
            });

            layer.on('mouseout', () => {
              (layer as L.Path).setStyle(this.countryStyle(feature));
            });

            layer.on('click', (event) => {
              const path = layer as L.Path;

              // Quita el foco que genera el cuadro naranja
              (event.originalEvent.target as HTMLElement).blur();

              const bounds = (layer as L.Polygon).getBounds();
              this.focusBounds(bounds, 1);
              this.updateLocationAnchor(event.latlng);

              // Mantiene el estilo normal, sin selección naranja
              path.setStyle(this.countryStyle(feature));

              this.locationChange.emit({
                pais: name,
                region: null,
                departamento: null,
              });

              console.log('País seleccionado:', name);
            });
          },
        }).addTo(this.map);
      },

      error: (error) => {
        console.error('Error cargando países', error);
      },
    });
  }

  private countryStyle(feature: Feature | undefined): typeof COUNTRY_BASE_STYLE {
    const name = feature?.properties?.['name'];
    const id = typeof feature?.id === 'string' ? feature.id : undefined;
    const metrics = this.mapMetricsService.countryMetrics();
    return {
      ...COUNTRY_BASE_STYLE,
      fillColor: metricColor(metrics.get(normalizeCountryName(name)) ?? metrics.get(normalizeCountryName(id))),
    };
  }

  private removeCountriesLayer(): void {
    this.countriesRequestId++;
    this.countriesLayer?.remove();
    this.countriesLayer = undefined;
  }

  goBackToLatinAmerica(): void {
    this.colombiaLevel = 'regions';
    this.locationChange.emit({ pais: null, region: null, departamento: null });
    this.removeRegionsLayer();
    this.removeDepartmentsLayer();
    this.showCountriesLayer();
    this.map?.flyTo(DEFAULT_VIEW.center, DEFAULT_VIEW.zoom, { duration: 1.2 });
  }

  setColombiaLevel(level: ColombiaViewLevel): void {
    const location = this.location();
    if (location?.pais !== 'Colombia' || this.colombiaLevel === level) return;

    this.colombiaLevel = level;
    this.locationChange.emit({
      pais: 'Colombia',
      region: location.region,
      departamento: level === 'regions' ? null : location.departamento,
    });

    if (level === 'regions') {
      this.removeDepartmentsLayer();
      this.showRegionsLayer();
    } else {
      this.removeRegionsLayer();
      this.showDepartmentsLayer();
    }
  }
}