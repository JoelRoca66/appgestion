import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MaintenanceRecord } from './maintenance-record';

describe('MaintenanceRecord', () => {
  let component: MaintenanceRecord;
  let fixture: ComponentFixture<MaintenanceRecord>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MaintenanceRecord]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MaintenanceRecord);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
