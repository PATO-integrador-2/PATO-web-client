import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LatinAmericaDash } from './latin-america-dash';

describe('LatinAmerica', () => {
  let component: LatinAmericaDash;
  let fixture: ComponentFixture<LatinAmericaDash>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LatinAmericaDash],
    }).compileComponents();

    fixture = TestBed.createComponent(LatinAmericaDash);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
