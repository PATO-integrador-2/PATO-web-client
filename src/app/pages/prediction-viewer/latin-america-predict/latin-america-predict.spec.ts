import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LatinAmericaPredict } from './latin-america-predict';

describe('LatinAmerica', () => {
  let component: LatinAmericaPredict;
  let fixture: ComponentFixture<LatinAmericaPredict>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LatinAmericaPredict],
    }).compileComponents();

    fixture = TestBed.createComponent(LatinAmericaPredict);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
