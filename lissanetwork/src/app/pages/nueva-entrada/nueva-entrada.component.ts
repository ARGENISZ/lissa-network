import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-nueva-entrada',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './nueva-entrada.component.html',
  styleUrls: ['./nueva-entrada.component.css']
})
export class NuevaEntradaComponent {

  pestanaActiva: 'nuevo' | 'existente' = 'nuevo';

  producto = {
    nombre: '',
    categoria: '',
    codigo: '',
    proveedor: '',
    costo: '',
    unidades: '',
    fecha: '',
    precioVenta: '',
    utilidad: '',
    factura: '',
    almacen: '',
    lote: '',
    caducidad: ''
  };

  cambiarPestana(tipo: 'nuevo' | 'existente') {
    this.pestanaActiva = tipo;
  }

  registrarEntrada() {
    console.log('Producto registrado:', this.producto);
    alert('Entrada registrada correctamente');
  }
}