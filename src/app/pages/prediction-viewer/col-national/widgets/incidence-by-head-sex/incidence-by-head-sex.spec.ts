import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IncidenceByHeadSex } from './incidence-by-head-sex';

describe('IncidenceByHeadSex', () => {
  let component: IncidenceByHeadSex;
  let fixture: ComponentFixture<IncidenceByHeadSex>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IncidenceByHeadSex],
    }).compileComponents();

    fixture = TestBed.createComponent(IncidenceByHeadSex);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
