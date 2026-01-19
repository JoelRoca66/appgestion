import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MaintenanceProject } from './maintenance-project';

describe('MaintenanceProject', () => {
  let component: MaintenanceProject;
  let fixture: ComponentFixture<MaintenanceProject>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MaintenanceProject]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MaintenanceProject);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
