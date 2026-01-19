import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MaintenanceMaterial } from './maintenance-material';

describe('MaintenanceMaterial', () => {
  let component: MaintenanceMaterial;
  let fixture: ComponentFixture<MaintenanceMaterial>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MaintenanceMaterial]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MaintenanceMaterial);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
