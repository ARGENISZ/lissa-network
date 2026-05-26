import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { jsPDF } from 'jspdf';

interface SalidaProducto {
  idEntrada: number | null;
  fecha: string;
  folio: string;
  tecnico: string;
  factura: string;
  codigo: string;
  nombre: string;
  categoria: string;
  proveedor: string;
  disponibles: number;
  unidades: number | string;
  imagen: string;
}

@Component({
  selector: 'app-nueva-salida',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './nueva-salida.component.html',
  styleUrls: ['./nueva-salida.component.css']
})
export class NuevaSalidaComponent {

  private apiUrl = 'http://localhost:3000/api';

  imagenPreview: string | ArrayBuffer | null = null;
  nombreImagen: string = '';

  tiempoScanner: any;

  salida: SalidaProducto = {
    idEntrada: null,
    fecha: '',
    folio: 'TEP00222',
    tecnico: '',
    factura: '',
    codigo: '',
    nombre: '',
    categoria: '',
    proveedor: '',
    disponibles: 0,
    unidades: '',
    imagen: ''
  };

  constructor(private http: HttpClient) {}

  detectarCodigoScanner() {
    clearTimeout(this.tiempoScanner);

    this.tiempoScanner = setTimeout(() => {
      if (this.salida.codigo.trim().length >= 3) {
        this.buscarProductoPorCodigo();
      }
    }, 500);
  }

  buscarProductoPorCodigo() {
    const codigo = this.salida.codigo.trim();

    if (!codigo) {
      alert('Ingrese o escanee un código');
      return;
    }

    this.http.get<any>(`${this.apiUrl}/inventario/codigo/${codigo}`).subscribe({
      next: (resp) => {
        if (resp.ok && resp.producto) {
          const productoEncontrado = resp.producto;

          this.salida.idEntrada = productoEncontrado.id || null;
          this.salida.codigo = productoEncontrado.codigo || codigo;
          this.salida.nombre = productoEncontrado.nombre || '';
          this.salida.categoria = productoEncontrado.categoria || '';
          this.salida.proveedor = productoEncontrado.proveedor || '';
          this.salida.disponibles = Number(productoEncontrado.unidades || 0);
          this.salida.factura = productoEncontrado.factura || '';
          this.salida.imagen = productoEncontrado.imagen || '';

          if (productoEncontrado.imagen) {
            this.imagenPreview = `http://localhost:3000/uploads/${productoEncontrado.imagen}`;
            this.nombreImagen = productoEncontrado.imagen;
          } else {
            this.imagenPreview = null;
            this.nombreImagen = '';
          }
        }
      },
      error: (error) => {
        console.error('Producto no encontrado:', error);
        alert('No se encontró un producto con ese código');

        this.salida.idEntrada = null;
        this.salida.nombre = '';
        this.salida.categoria = '';
        this.salida.proveedor = '';
        this.salida.disponibles = 0;
        this.salida.unidades = '';
        this.salida.factura = '';
        this.salida.imagen = '';

        this.imagenPreview = null;
        this.nombreImagen = '';
      }
    });
  }

  registrarSalida() {
    if (!this.salida.fecha) {
      alert('Ingrese la fecha');
      return;
    }

    if (!this.salida.folio.trim()) {
      alert('Ingrese el folio de salida');
      return;
    }

    if (!this.salida.tecnico.trim()) {
      alert('Ingrese el nombre del técnico');
      return;
    }

    if (!this.salida.codigo.trim()) {
      alert('Ingrese o escanee el código del producto');
      return;
    }

    if (!this.salida.nombre.trim()) {
      alert('Primero debe buscar un producto válido');
      return;
    }

    const unidadesNumero = Number(this.salida.unidades);

    if (
      this.salida.unidades === null ||
      this.salida.unidades === undefined ||
      this.salida.unidades === '' ||
      isNaN(unidadesNumero) ||
      unidadesNumero <= 0
    ) {
      alert('Debe ingresar una cantidad de unidades válida');
      return;
    }

    if (unidadesNumero > this.salida.disponibles) {
      alert('No puede registrar una salida mayor a las unidades disponibles');
      return;
    }

    const formData = new FormData();

    formData.append('idEntrada', String(this.salida.idEntrada));
    formData.append('fecha', this.salida.fecha);
    formData.append('folio', this.salida.folio);
    formData.append('tecnico', this.salida.tecnico);
    formData.append('factura', this.salida.factura);
    formData.append('codigo', this.salida.codigo);
    formData.append('nombre', this.salida.nombre);
    formData.append('categoria', this.salida.categoria);
    formData.append('proveedor', this.salida.proveedor);
    formData.append('disponibles', String(this.salida.disponibles));
    formData.append('unidades', String(unidadesNumero));
    formData.append('imagen', this.salida.imagen);

    this.http.post(`${this.apiUrl}/salidas`, formData).subscribe({
      next: async () => {
        await this.generarPaseSalida(unidadesNumero);
        alert('Salida registrada correctamente');
        this.limpiarFormulario();
      },
      error: (error) => {
        console.error('Error al registrar salida:', error);
        alert('Error al registrar la salida');
      }
    });
  }

  async generarPaseSalida(unidadesSalida: number) {
    const doc = new jsPDF();

    const datosSalida = {
      fecha: this.salida.fecha,
      folio: this.salida.folio,
      tecnico: this.salida.tecnico,
      factura: this.salida.factura,
      codigo: this.salida.codigo,
      nombre: this.salida.nombre,
      categoria: this.salida.categoria,
      proveedor: this.salida.proveedor
    };

    const fechaGeneracion = new Date().toLocaleString();

    let logoBase64 = '';

    try {
      logoBase64 = await this.convertirImagenBase64('assets/logos.jpeg');
    } catch (error) {
      console.warn('No se pudo cargar el logo de la empresa:', error);
    }

    // ==========================
    // ENCABEZADO PRINCIPAL
    // ==========================
    doc.setFillColor(8, 52, 82);
    doc.rect(0, 0, 210, 38, 'F');

    if (logoBase64) {
      doc.addImage(logoBase64, 'PNG', 15, 7, 25, 24);
    }

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('PASE DE SALIDA', 105, 17, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Documento de control para entrega de productos', 105, 26, { align: 'center' });

    // ==========================
    // DATOS GENERALES
    // ==========================
    doc.setTextColor(0, 0, 0);

    doc.setFillColor(245, 248, 250);
    doc.roundedRect(15, 48, 180, 48, 4, 4, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('Información de la salida', 20, 58);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    doc.text(`Fecha de generación: ${fechaGeneracion}`, 20, 68);
    doc.text(`Fecha de salida: ${datosSalida.fecha}`, 20, 78);
    doc.text(`Folio de salida: ${datosSalida.folio}`, 20, 88);

    doc.text(`Técnico: ${datosSalida.tecnico}`, 115, 68);
    doc.text(`No. Factura: ${datosSalida.factura || 'N/A'}`, 115, 78);

    // ==========================
    // DETALLE DEL PRODUCTO
    // ==========================
    doc.setDrawColor(210, 210, 210);
    doc.roundedRect(15, 108, 180, 76, 4, 4, 'S');

    doc.setFillColor(8, 52, 82);
    doc.rect(15, 108, 180, 14, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Detalle del producto entregado', 20, 117);

    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    doc.text(`Código: ${datosSalida.codigo}`, 20, 136);
    doc.text(`Producto: ${datosSalida.nombre}`, 20, 148);
    doc.text(`Categoría: ${datosSalida.categoria}`, 20, 160);
    doc.text(`Proveedor: ${datosSalida.proveedor}`, 20, 172);

    // Caja destacada de unidades entregadas
    doc.setFillColor(232, 244, 255);
    doc.roundedRect(125, 136, 55, 34, 4, 4, 'F');

    doc.setTextColor(8, 52, 82);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Unidades', 152.5, 148, { align: 'center' });
    doc.text('entregadas', 152.5, 156, { align: 'center' });

    doc.setFontSize(20);
    doc.text(String(unidadesSalida), 152.5, 168, { align: 'center' });

    // ==========================
    // OBSERVACIONES
    // ==========================
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Observaciones:', 20, 202);

    doc.setDrawColor(170, 170, 170);
    doc.line(20, 214, 190, 214);
    doc.line(20, 226, 190, 226);

    // ==========================
    // FIRMAS
    // ==========================
    doc.setDrawColor(0, 0, 0);
    doc.line(25, 255, 85, 255);
    doc.line(125, 255, 185, 255);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Firma Técnico', 55, 263, { align: 'center' });
    doc.text('Firma Autorizado', 155, 263, { align: 'center' });

    // ==========================
    // PIE DE PÁGINA
    // ==========================
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(
      'Documento generado automáticamente por el sistema de inventario.',
      105,
      285,
      { align: 'center' }
    );

    doc.save(`pase-salida-${datosSalida.folio}.pdf`);
  }

  convertirImagenBase64(ruta: string): Promise<string> {
    return new Promise((resolve, reject) => {
      fetch(ruta)
        .then(response => response.blob())
        .then(blob => {
          const reader = new FileReader();

          reader.onloadend = () => {
            resolve(reader.result as string);
          };

          reader.onerror = reject;
          reader.readAsDataURL(blob);
        })
        .catch(error => reject(error));
    });
  }

  limpiarFormulario() {
    this.salida = {
      idEntrada: null,
      fecha: '',
      folio: 'TEP00222',
      tecnico: '',
      factura: '',
      codigo: '',
      nombre: '',
      categoria: '',
      proveedor: '',
      disponibles: 0,
      unidades: '',
      imagen: ''
    };

    this.imagenPreview = null;
    this.nombreImagen = '';
  }

}