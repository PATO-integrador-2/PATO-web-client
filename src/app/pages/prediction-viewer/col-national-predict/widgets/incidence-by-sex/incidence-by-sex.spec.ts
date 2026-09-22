import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IncidenceBySex } from './incidence-by-sex';

describe('IncidenceBySex', () => {
  let component: IncidenceBySex;
  let fixture: ComponentFixture<IncidenceBySex>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IncidenceBySex],
    }).compileComponents();

    fixture = TestBed.createComponent(IncidenceBySex);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
