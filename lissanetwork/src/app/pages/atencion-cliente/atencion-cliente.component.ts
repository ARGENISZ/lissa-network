import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface ReporteAtencion {
  id?: number;
  nombreCliente: string;
  identidad: string;
  numeroContrato: string;
  telefono: string;
  descripcionProblema: string;
  estado: string;
}

@Component({
  selector: 'app-atencion-cliente',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './atencion-cliente.component.html',
  styleUrls: ['./atencion-cliente.component.css']
})
export class AtencionClienteComponent implements OnInit {

  private apiUrl = 'http://localhost:3000/api/atencion-cliente';

  mostrarFormulario = false;
  modoEdicion = false;
  indiceEdicion: number | null = null;

  reportes: ReporteAtencion[] = [];

  reporteActual: ReporteAtencion = {
    nombreCliente: '',
    identidad: '',
    numeroContrato: '',
    telefono: '',
    descripcionProblema: '',
    estado: 'Pendiente'
  };

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.obtenerReportes();
  }

  obtenerReportes() {
    this.http.get<ReporteAtencion[]>(this.apiUrl).subscribe({
      next: (data) => {
        this.reportes = data;
      },
      error: (error) => {
        console.error('Error al obtener reportes:', error);
        alert('Error al cargar los reportes de atención al cliente');
      }
    });
  }

  abrirFormulario() {
    this.modoEdicion = false;
    this.indiceEdicion = null;

    this.reporteActual = {
      nombreCliente: '',
      identidad: '',
      numeroContrato: '',
      telefono: '',
      descripcionProblema: '',
      estado: 'Pendiente'
    };

    this.mostrarFormulario = true;
  }

  editarReporte(index: number) {
    this.modoEdicion = true;
    this.indiceEdicion = index;
    this.reporteActual = { ...this.reportes[index] };
    this.mostrarFormulario = true;
  }

  guardarReporte() {
    if (!this.reporteActual.nombreCliente.trim()) {
      alert('Ingrese el nombre del cliente');
      return;
    }

    if (!this.reporteActual.identidad.trim()) {
      alert('Ingrese el número de identidad');
      return;
    }

    if (!this.reporteActual.numeroContrato.trim()) {
      alert('Ingrese el número de contrato');
      return;
    }

    if (!this.reporteActual.telefono.trim()) {
      alert('Ingrese el teléfono');
      return;
    }

    if (!this.reporteActual.descripcionProblema.trim()) {
      alert('Ingrese la descripción del problema');
      return;
    }

    if (this.modoEdicion && this.reporteActual.id) {
      this.http.put(`${this.apiUrl}/${this.reporteActual.id}`, this.reporteActual).subscribe({
        next: () => {
          alert('Reporte actualizado correctamente');
          this.obtenerReportes();
          this.mostrarFormulario = false;
          this.limpiarFormulario();
        },
        error: (error) => {
          console.error('Error al actualizar reporte:', error);
          alert('Error al actualizar el reporte');
        }
      });
    } else {
      this.http.post(this.apiUrl, this.reporteActual).subscribe({
        next: () => {
          alert('Reporte guardado correctamente');
          this.obtenerReportes();
          this.mostrarFormulario = false;
          this.limpiarFormulario();
        },
        error: (error) => {
          console.error('Error al guardar reporte:', error);
          alert('Error al guardar el reporte');
        }
      });
    }
  }

  eliminarReporte(index: number) {
    const reporte = this.reportes[index];

    if (!reporte.id) {
      alert('No se puede eliminar este reporte');
      return;
    }

    const confirmar = confirm(`¿Desea eliminar el reporte de "${reporte.nombreCliente}"?`);

    if (!confirmar) {
      return;
    }

    this.http.delete(`${this.apiUrl}/${reporte.id}`).subscribe({
      next: () => {
        alert('Reporte eliminado correctamente');
        this.obtenerReportes();
      },
      error: (error) => {
        console.error('Error al eliminar reporte:', error);
        alert('Error al eliminar el reporte');
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
    this.reporteActual = {
      nombreCliente: '',
      identidad: '',
      numeroContrato: '',
      telefono: '',
      descripcionProblema: '',
      estado: 'Pendiente'
    };
  }
}