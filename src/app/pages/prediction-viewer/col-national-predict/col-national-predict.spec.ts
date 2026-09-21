import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ColNationalPredict } from './col-national-predict';

describe('PredictionViewer', () => {
  let component: ColNationalPredict;
  let fixture: ComponentFixture<ColNationalPredict>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ColNationalPredict],
    }).compileComponents();

    fixture = TestBed.createComponent(ColNationalPredict);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
