import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

interface EntradaHistorial {
  id?: number;
  nombre: string;
  categoria: string;
  codigo: string;
  proveedor: string;
  costo: number;
  unidades: number;
  fecha: string;
  factura: string;
  imagen: string;
  creado_en?: string;
}

@Component({
  selector: 'app-historial-entradas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './historial-entradas.component.html',
  styleUrls: ['./historial-entradas.component.css']
})
export class HistorialEntradasComponent implements OnInit {

  private apiUrl = 'http://localhost:3000/api/entradas';
  private uploadsUrl = 'http://localhost:3000/uploads/';

  entradas: EntradaHistorial[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.obtenerEntradas();
  }

  obtenerEntradas() {
    this.http.get<EntradaHistorial[]>(this.apiUrl).subscribe({
      next: (data) => {
        this.entradas = data;
      },
      error: (error) => {
        console.error('Error al obtener historial de entradas:', error);
        alert('Error al cargar el historial de entradas');
      }
    });
  }

  obtenerImagen(imagen: string): string {
    return imagen ? `${this.uploadsUrl}${imagen}` : '';
  }

  formatearFecha(fecha: string): string {
    if (!fecha) {
      return 'Sin fecha';
    }

    return new Date(fecha).toLocaleDateString('es-HN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }

}