import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MpiDeptSex } from './mpi-dept-sex';

describe('MpiDeptSex', () => {
  let component: MpiDeptSex;
  let fixture: ComponentFixture<MpiDeptSex>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MpiDeptSex],
    }).compileComponents();

    fixture = TestBed.createComponent(MpiDeptSex);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
