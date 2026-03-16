import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-proveedores',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './proveedores.component.html',
  styleUrls: ['./proveedores.component.css']
})
export class ProveedoresComponent {

  mostrarFormulario = false;
  modoEdicion = false;
  indiceEdicion: number | null = null;

  proveedores = [
    {
      nombre: 'Proveedor Demo',
      domicilio: 'San Pedro Sula',
      telefono: '9999-9999',
      correo: 'demo@email.com',
      rfc: 'RFC123456'
    }
  ];

  proveedorActual = {
    nombre: '',
    domicilio: '',
    telefono: '',
    correo: '',
    rfc: ''
  };

  abrirFormulario() {
    this.modoEdicion = false;
    this.proveedorActual = {
      nombre: '',
      domicilio: '',
      telefono: '',
      correo: '',
      rfc: ''
    };
    this.mostrarFormulario = true;
  }

  editarProveedor(index: number) {
    this.modoEdicion = true;
    this.indiceEdicion = index;
    this.proveedorActual = { ...this.proveedores[index] };
    this.mostrarFormulario = true;
  }

  guardarProveedor() {
    if (this.modoEdicion && this.indiceEdicion !== null) {
      this.proveedores[this.indiceEdicion] = { ...this.proveedorActual };
    } else {
      this.proveedores.push({ ...this.proveedorActual });
    }

    this.mostrarFormulario = false;
  }

  eliminarProveedor(index: number) {
    this.proveedores.splice(index, 1);
  }

  cancelar() {
    this.mostrarFormulario = false;
  }
}