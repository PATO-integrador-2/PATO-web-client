import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MpiDept } from './mpi-dept';

describe('MpiDept', () => {
  let component: MpiDept;
  let fixture: ComponentFixture<MpiDept>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MpiDept],
    }).compileComponents();

    fixture = TestBed.createComponent(MpiDept);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
