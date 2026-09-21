import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ColNationalDash } from './col-national-dash';

describe('ColNational', () => {
  let component: ColNationalDash;
  let fixture: ComponentFixture<ColNationalDash>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ColNationalDash],
    }).compileComponents();

    fixture = TestBed.createComponent(ColNationalDash);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
