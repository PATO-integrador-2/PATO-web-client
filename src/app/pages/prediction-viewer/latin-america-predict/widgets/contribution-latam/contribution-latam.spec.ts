import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContributionLatam } from './contribution-latam';

describe('ContributionLatam', () => {
  let component: ContributionLatam;
  let fixture: ComponentFixture<ContributionLatam>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContributionLatam],
    }).compileComponents();

    fixture = TestBed.createComponent(ContributionLatam);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
