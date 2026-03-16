import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistorialEntradasComponent } from './historial-entradas.component';

describe('HistorialEntradasComponent', () => {
  let component: HistorialEntradasComponent;
  let fixture: ComponentFixture<HistorialEntradasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistorialEntradasComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HistorialEntradasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
