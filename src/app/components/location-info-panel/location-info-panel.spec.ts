import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LocationInfoPanel } from './location-info-panel';

describe('LocationInfoPanel', () => {
  let component: LocationInfoPanel;
  let fixture: ComponentFixture<LocationInfoPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LocationInfoPanel],
    }).compileComponents();

    fixture = TestBed.createComponent(LocationInfoPanel);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('locationName', 'Colombia');
    fixture.componentRef.setInput('level', 'country');
    fixture.componentRef.setInput('metrics', {
      national: 0.35,
      urban: 0.15,
      rural: 0.55,
      highestYear: 2021,
      lowestYear: 2022,
    });
    fixture.detectChanges();
  });

  it('renders all country metric sections', () => {
    const text = fixture.nativeElement.textContent;

    expect(text).toContain('IPM Nacional');
    expect(text).toContain('35.0%');
    expect(text).toContain('IPM Urbano');
    expect(text).toContain('15.0%');
    expect(text).toContain('IPM Rural');
    expect(text).toContain('55.0%');
    expect(text).toContain('Año del IPM nacional más alto');
    expect(text).toContain('2021');
    expect(text).toContain('Año del IPM nacional más bajo');
    expect(text).toContain('2022');
  });

  it('shows unavailable only for a missing area', () => {
    fixture.componentRef.setInput('metrics', { national: 0.25, rural: 0.5 });
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;

    expect(text).toContain('25.0%');
    expect(text).toContain('50.0%');
    expect(text).toContain('No disponible');
  });
});
