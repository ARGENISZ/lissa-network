import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-nueva-salida',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './nueva-salida.component.html',
  styleUrls: ['./nueva-salida.component.css']
})
export class NuevaSalidaComponent {

  pestanaActiva: 'producto' | 'coleccion' = 'producto';

  salida = {
    fecha: '',
    folio: 'TEP00222',
    cliente: '',
    factura: '',
    codigo: '',
    nombre: '',
    categoria: '',
    proveedor: '',
    disponibles: 6,
    precioVenta: 0,
    unidades: 0
  };

  cambiarPestana(tipo: 'producto' | 'coleccion') {
    this.pestanaActiva = tipo;
  }

  get totalVenta() {
    return this.salida.precioVenta * this.salida.unidades;
  }

  registrarSalida() {
    console.log('Salida registrada:', this.salida);
    alert('Salida registrada correctamente');
  }

}