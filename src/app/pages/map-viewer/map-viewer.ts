import { Component, signal } from '@angular/core';
import { Navbar } from '../../components/navbar/navbar';
import { MapElementComponent } from '../../components/map-element/map-element';
import type { MapLocation } from '../../interfaces/map-location';

@Component({
  selector: 'app-map-viewer',
  imports: [Navbar, MapElementComponent],
  templateUrl: './map-viewer.html',
  styleUrl: './map-viewer.css',
})
export class MapViewer {
  
  currentLocation = signal<MapLocation | null>(null);

  onMapLocationChange(location: MapLocation): void {
    this.currentLocation.set(location);
  }
}
