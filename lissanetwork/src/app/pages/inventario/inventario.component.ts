import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface ProductoInventario {
  codigo: string;
  nombre: string;
  categoria: string;
  proveedor: string;
  enExistencia: number;
  status: string;
}

interface ReporteInventario {
  codigo: string;
  nombre: string;
  categoria: string;
  proveedor: string;
  entradas: number;
  salidas: number;
  enExistencia: number;
  status: string;
}

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inventario.component.html',
  styleUrls: ['./inventario.component.css']
})
export class InventarioComponent implements OnInit {

  private apiUrl = 'http://localhost:3000/api/inventario';
  private reporteUrl = 'http://localhost:3000/api/inventario/reporte';

  inventario: ProductoInventario[] = [];
  reporteInventario: ReporteInventario[] = [];

  buscarCodigo: string = '';
  filtroProveedor: string = '';
  filtroCategoria: string = '';

  proveedores: string[] = [];
  categorias: string[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.obtenerInventario();
    this.obtenerReporteInventario();
  }

  obtenerInventario() {
    this.http.get<ProductoInventario[]>(this.apiUrl).subscribe({
      next: (data) => {
        this.inventario = data.map(item => ({
          ...item,
          enExistencia: Number(item.enExistencia)
        }));

        this.cargarFiltros();
      },
      error: (error) => {
        console.error('Error al obtener inventario:', error);
        alert('Error al cargar el inventario');
      }
    });
  }

  obtenerReporteInventario() {
    this.http.get<ReporteInventario[]>(this.reporteUrl).subscribe({
      next: (data) => {
        this.reporteInventario = data.map(item => ({
          ...item,
          entradas: Number(item.entradas),
          salidas: Number(item.salidas),
          enExistencia: Number(item.enExistencia)
        }));
      },
      error: (error) => {
        console.error('Error al obtener reporte de inventario:', error);
      }
    });
  }

  cargarFiltros() {
    this.proveedores = [
      ...new Set(
        this.inventario
          .map(item => item.proveedor)
          .filter(proveedor => proveedor && proveedor.trim() !== '')
      )
    ];

    this.categorias = [
      ...new Set(
        this.inventario
          .map(item => item.categoria)
          .filter(categoria => categoria && categoria.trim() !== '')
      )
    ];
  }

  get inventarioFiltrado(): ProductoInventario[] {
    return this.inventario.filter(producto => {
      const coincideCodigo = this.buscarCodigo.trim() === '' ||
        producto.codigo.toLowerCase().includes(this.buscarCodigo.toLowerCase());

      const coincideProveedor = this.filtroProveedor === '' ||
        producto.proveedor === this.filtroProveedor;

      const coincideCategoria = this.filtroCategoria === '' ||
        producto.categoria === this.filtroCategoria;

      return coincideCodigo && coincideProveedor && coincideCategoria;
    });
  }

  get reporteFiltrado(): ReporteInventario[] {
    return this.reporteInventario.filter(producto => {
      const coincideCodigo = this.buscarCodigo.trim() === '' ||
        producto.codigo.toLowerCase().includes(this.buscarCodigo.toLowerCase());

      const coincideProveedor = this.filtroProveedor === '' ||
        producto.proveedor === this.filtroProveedor;

      const coincideCategoria = this.filtroCategoria === '' ||
        producto.categoria === this.filtroCategoria;

      return coincideCodigo && coincideProveedor && coincideCategoria;
    });
  }

  limpiarFiltros() {
    this.buscarCodigo = '';
    this.filtroProveedor = '';
    this.filtroCategoria = '';
  }

  getClaseStatus(status: string): string {
    if (status === 'Existente') {
      return 'existente';
    }

    if (status === 'Casi agotado') {
      return 'casi-agotado';
    }

    return 'agotado';
  }

  generarPDF() {
    const datos = this.reporteFiltrado;

    if (datos.length === 0) {
      alert('No hay datos para generar el reporte');
      return;
    }

    const doc = new jsPDF('landscape');

    const fecha = new Date().toLocaleString('es-HN');

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Reporte de Inventario', 148, 15, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha de generación: ${fecha}`, 14, 25);

    autoTable(doc, {
      startY: 32,
      head: [[
        'Código',
        'Nombre',
        'Categoría',
        'Proveedor',
        'Entradas',
        'Salidas',
        'En existencia',
        'Estado'
      ]],
      body: datos.map(item => [
        item.codigo,
        item.nombre,
        item.categoria,
        item.proveedor,
        item.entradas,
        item.salidas,
        item.enExistencia,
        item.status
      ]),
      styles: {
        fontSize: 8,
        cellPadding: 3
      },
      headStyles: {
        fillColor: [21, 128, 61],
        textColor: [255, 255, 255]
      }
    });

    doc.save('reporte-inventario.pdf');
  }

  generarExcel() {
    const datos = this.reporteFiltrado;

    if (datos.length === 0) {
      alert('No hay datos para generar el reporte');
      return;
    }

    const dataExcel = datos.map(item => ({
      Código: item.codigo,
      Nombre: item.nombre,
      Categoría: item.categoria,
      Proveedor: item.proveedor,
      Entradas: item.entradas,
      Salidas: item.salidas,
      'En existencia': item.enExistencia,
      Estado: item.status
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataExcel);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventario');

    worksheet['!cols'] = [
      { wch: 18 },
      { wch: 25 },
      { wch: 20 },
      { wch: 25 },
      { wch: 12 },
      { wch: 12 },
      { wch: 15 },
      { wch: 15 }
    ];

    XLSX.writeFile(workbook, 'reporte-inventario.xlsx');
  }

}