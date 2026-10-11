import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PredictWidget } from './predict-widget';

describe('PredictWidget', () => {
  let component: PredictWidget;
  let fixture: ComponentFixture<PredictWidget>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PredictWidget],
    }).compileComponents();

    fixture = TestBed.createComponent(PredictWidget);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
