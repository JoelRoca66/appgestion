import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MaintenanceTask } from './maintenance-task';

describe('MaintenanceTask', () => {
  let component: MaintenanceTask;
  let fixture: ComponentFixture<MaintenanceTask>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MaintenanceTask]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MaintenanceTask);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
