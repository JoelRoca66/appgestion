import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MaintenanceUser } from './maintenance-user';

describe('MaintenanceUser', () => {
  let component: MaintenanceUser;
  let fixture: ComponentFixture<MaintenanceUser>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MaintenanceUser]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MaintenanceUser);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
