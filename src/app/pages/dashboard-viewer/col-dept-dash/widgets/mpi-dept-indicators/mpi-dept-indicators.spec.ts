import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MpiDeptIndicators } from './mpi-dept-indicators';

describe('MpiDeptIndicators', () => {
  let component: MpiDeptIndicators;
  let fixture: ComponentFixture<MpiDeptIndicators>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MpiDeptIndicators],
    }).compileComponents();

    fixture = TestBed.createComponent(MpiDeptIndicators);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
