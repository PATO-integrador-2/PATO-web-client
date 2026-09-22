import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NationalPoverty } from './national-poverty';

describe('NationalPoverty', () => {
  let component: NationalPoverty;
  let fixture: ComponentFixture<NationalPoverty>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NationalPoverty],
    }).compileComponents();

    fixture = TestBed.createComponent(NationalPoverty);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
