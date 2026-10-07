import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NavbarPredictions } from './navbar-predictions';

describe('NavbarPredictions', () => {
  let component: NavbarPredictions;
  let fixture: ComponentFixture<NavbarPredictions>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavbarPredictions],
    }).compileComponents();

    fixture = TestBed.createComponent(NavbarPredictions);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
