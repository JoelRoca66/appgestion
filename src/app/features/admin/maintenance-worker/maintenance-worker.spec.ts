import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MaintenanceWorker } from './maintenance-worker';

describe('MaintenanceWorker', () => {
  let component: MaintenanceWorker;
  let fixture: ComponentFixture<MaintenanceWorker>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MaintenanceWorker]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MaintenanceWorker);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
