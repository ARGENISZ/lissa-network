import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PuntoVentaComponent } from './punto-venta.component';

describe('PuntoVentaComponent', () => {
  let component: PuntoVentaComponent;
  let fixture: ComponentFixture<PuntoVentaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PuntoVentaComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PuntoVentaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
