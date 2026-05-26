import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

interface SalidaHistorial {
  id?: number;
  fecha: string;
  folio: string;
  tecnico: string;
  factura: string;
  codigo: string;
  nombre: string;
  categoria: string;
  proveedor: string;
  disponibles: number;
  unidades: number;
  imagen: string;
  creado_en?: string;
}

@Component({
  selector: 'app-historial-ventas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './historial-ventas.component.html',
  styleUrls: ['./historial-ventas.component.css']
})
export class HistorialVentasComponent implements OnInit {

  private apiUrl = 'http://localhost:3000/api/salidas';
  private uploadsUrl = 'http://localhost:3000/uploads/';

  salidas: SalidaHistorial[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.obtenerSalidas();
  }

  obtenerSalidas() {
    this.http.get<SalidaHistorial[]>(this.apiUrl).subscribe({
      next: (data) => {
        this.salidas = data;
      },
      error: (error) => {
        console.error('Error al obtener historial de salidas:', error);
        alert('Error al cargar el historial de salidas');
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