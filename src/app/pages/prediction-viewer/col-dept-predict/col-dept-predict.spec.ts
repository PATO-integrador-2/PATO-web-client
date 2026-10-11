import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ColDeptPredict } from './col-dept-predict';

describe('ColDeptPredict', () => {
  let component: ColDeptPredict;
  let fixture: ComponentFixture<ColDeptPredict>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ColDeptPredict],
    }).compileComponents();

    fixture = TestBed.createComponent(ColDeptPredict);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
