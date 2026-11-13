import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OtDetalleComponent } from './ot-detalle.component';

describe('OtDetalleComponent', () => {
  let component: OtDetalleComponent;
  let fixture: ComponentFixture<OtDetalleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OtDetalleComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OtDetalleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
