import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Deprivations } from './deprivations';

describe('Deprivations', () => {
  let component: Deprivations;
  let fixture: ComponentFixture<Deprivations>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Deprivations],
    }).compileComponents();

    fixture = TestBed.createComponent(Deprivations);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
