import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OtListComponent } from './ot-list.component';

describe('OtListComponent', () => {
  let component: OtListComponent;
  let fixture: ComponentFixture<OtListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OtListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OtListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
