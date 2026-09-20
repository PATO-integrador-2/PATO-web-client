import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Dimension } from './dimension';

describe('Dimension', () => {
  let component: Dimension;
  let fixture: ComponentFixture<Dimension>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dimension],
    }).compileComponents();

    fixture = TestBed.createComponent(Dimension);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
