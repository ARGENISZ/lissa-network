import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface Proveedor {
  id?: number;
  nombre: string;
  domicilio: string;
  telefono: string;
  correo: string;
  rfc: string;
}

@Component({
  selector: 'app-proveedores',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './proveedores.component.html',
  styleUrls: ['./proveedores.component.css']
})
export class ProveedoresComponent implements OnInit {

  private apiUrl = 'http://localhost:3000/api/proveedores';

  mostrarFormulario = false;
  modoEdicion = false;
  indiceEdicion: number | null = null;

  proveedores: Proveedor[] = [];

  proveedorActual: Proveedor = {
    nombre: '',
    domicilio: '',
    telefono: '',
    correo: '',
    rfc: ''
  };

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.obtenerProveedores();
  }

  obtenerProveedores() {
    this.http.get<Proveedor[]>(this.apiUrl).subscribe({
      next: (data) => {
        this.proveedores = data;
      },
      error: (error) => {
        console.error('Error al obtener proveedores:', error);
        alert('Error al cargar los proveedores');
      }
    });
  }

  abrirFormulario() {
    this.modoEdicion = false;
    this.indiceEdicion = null;

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
    if (!this.proveedorActual.nombre.trim()) {
      alert('Ingrese el nombre del proveedor');
      return;
    }

    if (this.modoEdicion && this.proveedorActual.id) {
      this.http.put(`${this.apiUrl}/${this.proveedorActual.id}`, this.proveedorActual).subscribe({
        next: () => {
          alert('Proveedor actualizado correctamente');
          this.obtenerProveedores();
          this.mostrarFormulario = false;
          this.limpiarFormulario();
        },
        error: (error) => {
          console.error('Error al actualizar proveedor:', error);
          alert('Error al actualizar el proveedor');
        }
      });
    } else {
      this.http.post(this.apiUrl, this.proveedorActual).subscribe({
        next: () => {
          alert('Proveedor guardado correctamente');
          this.obtenerProveedores();
          this.mostrarFormulario = false;
          this.limpiarFormulario();
        },
        error: (error) => {
          console.error('Error al guardar proveedor:', error);
          alert('Error al guardar el proveedor');
        }
      });
    }
  }

  eliminarProveedor(index: number) {
    const proveedor = this.proveedores[index];

    if (!proveedor.id) {
      alert('No se puede eliminar este proveedor');
      return;
    }

    const confirmar = confirm(`¿Desea eliminar el proveedor "${proveedor.nombre}"?`);

    if (!confirmar) {
      return;
    }

    this.http.delete(`${this.apiUrl}/${proveedor.id}`).subscribe({
      next: () => {
        alert('Proveedor eliminado correctamente');
        this.obtenerProveedores();
      },
      error: (error) => {
        console.error('Error al eliminar proveedor:', error);
        alert('Error al eliminar el proveedor');
      }
    });
  }

  cancelar() {
    this.mostrarFormulario = false;
    this.modoEdicion = false;
    this.indiceEdicion = null;
    this.limpiarFormulario();
  }

  limpiarFormulario() {
    this.proveedorActual = {
      nombre: '',
      domicilio: '',
      telefono: '',
      correo: '',
      rfc: ''
    };
  }
}