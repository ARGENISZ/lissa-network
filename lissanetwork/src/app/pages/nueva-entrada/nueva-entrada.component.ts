import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface ProductoEntrada {
  id: number | null;
  nombre: string;
  categoria: string;
  codigo: string;
  proveedor: string;
  costo: string;
  unidades: string;
  fecha: string;
  factura: string;
  imagen: string;
}

@Component({
  selector: 'app-nueva-entrada',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './nueva-entrada.component.html',
  styleUrls: ['./nueva-entrada.component.css']
})
export class NuevaEntradaComponent {

  private apiUrl = 'http://localhost:3000/api';

  pestanaActiva: 'nuevo' | 'existente' = 'nuevo';

  imagenProducto: File | null = null;
  imagenPreview: string | ArrayBuffer | null = null;
  nombreImagen: string = '';

  tiempoScanner: any;

  producto: ProductoEntrada = {
    id: null,
    nombre: '',
    categoria: '',
    codigo: '',
    proveedor: '',
    costo: '',
    unidades: '',
    fecha: '',
    factura: '',
    imagen: ''
  };

  constructor(private http: HttpClient) {}

  cambiarPestana(tipo: 'nuevo' | 'existente') {
    this.pestanaActiva = tipo;
    this.limpiarFormulario();
  }

  detectarCodigoScanner() {
    if (this.pestanaActiva !== 'existente') {
      return;
    }

    clearTimeout(this.tiempoScanner);

    this.tiempoScanner = setTimeout(() => {
      if (this.producto.codigo.trim().length >= 3) {
        this.buscarProductoPorCodigo();
      }
    }, 500);
  }

  buscarProductoPorCodigo() {
    if (this.pestanaActiva !== 'existente') {
      return;
    }

    const codigo = this.producto.codigo.trim();

    if (!codigo) {
      alert('Ingrese o escanee un código');
      return;
    }

    this.http.get<any>(`${this.apiUrl}/productos/codigo/${codigo}`).subscribe({
      next: (resp) => {
        if (resp.ok && resp.producto) {
          const productoEncontrado = resp.producto;

          this.producto.id = productoEncontrado.id || null;
          this.producto.nombre = productoEncontrado.nombre || '';
          this.producto.categoria = productoEncontrado.categoria || '';
          this.producto.codigo = productoEncontrado.codigo || codigo;
          this.producto.proveedor = productoEncontrado.proveedor || '';
          this.producto.costo = productoEncontrado.costo || '';
          this.producto.unidades = productoEncontrado.unidades || '';
          this.producto.fecha = productoEncontrado.fecha || '';
          this.producto.factura = productoEncontrado.factura || '';
          this.producto.imagen = productoEncontrado.imagen || '';

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

        this.producto.id = null;
        this.producto.nombre = '';
        this.producto.categoria = '';
        this.producto.proveedor = '';
        this.producto.costo = '';
        this.producto.unidades = '';
        this.producto.fecha = '';
        this.producto.factura = '';
        this.producto.imagen = '';

        this.imagenPreview = null;
        this.nombreImagen = '';
      }
    });
  }

  seleccionarImagen(event: Event) {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return;
    }

    const archivo = input.files[0];

    const formatosPermitidos = ['image/jpeg', 'image/png', 'image/webp'];
    const tamanoMaximoMB = 2;
    const tamanoArchivoMB = archivo.size / 1024 / 1024;

    if (!formatosPermitidos.includes(archivo.type)) {
      alert('Solo se permiten imágenes JPG, PNG o WEBP');
      input.value = '';
      return;
    }

    if (tamanoArchivoMB > tamanoMaximoMB) {
      alert('La imagen no debe pesar más de 2MB');
      input.value = '';
      return;
    }

    this.imagenProducto = archivo;
    this.nombreImagen = archivo.name;
    this.producto.imagen = archivo.name;

    const reader = new FileReader();

    reader.onload = () => {
      this.imagenPreview = reader.result;
    };

    reader.readAsDataURL(archivo);
  }

  quitarImagen() {
    this.imagenProducto = null;
    this.imagenPreview = null;
    this.nombreImagen = '';
    this.producto.imagen = '';
  }

  registrarEntrada() {
    if (!this.producto.codigo.trim()) {
      alert('Ingrese o escanee el código del producto');
      return;
    }

    if (!this.producto.nombre.trim()) {
      alert('Ingrese o busque el producto');
      return;
    }

    if (!this.producto.costo) {
      alert('Ingrese el costo');
      return;
    }

    if (!this.producto.unidades) {
      alert('Ingrese las unidades');
      return;
    }

    const formData = new FormData();

    formData.append('nombre', this.producto.nombre);
    formData.append('categoria', this.producto.categoria);
    formData.append('codigo', this.producto.codigo);
    formData.append('proveedor', this.producto.proveedor);
    formData.append('costo', this.producto.costo);
    formData.append('unidades', this.producto.unidades);
    formData.append('fecha', this.producto.fecha);
    formData.append('factura', this.producto.factura);

    if (this.imagenProducto && this.pestanaActiva === 'nuevo') {
      formData.append('imagen', this.imagenProducto);
    }

    if (this.pestanaActiva === 'existente') {
      if (!this.producto.id) {
        alert('Primero debe buscar un producto existente');
        return;
      }

      this.http.put(`${this.apiUrl}/entradas/${this.producto.id}`, formData).subscribe({
        next: () => {
          alert('Producto actualizado correctamente');
          this.limpiarFormulario();
        },
        error: (error) => {
          console.error('Error al actualizar producto:', error);
          alert('Error al actualizar el producto');
        }
      });

      return;
    }

    this.http.post(`${this.apiUrl}/entradas`, formData).subscribe({
      next: () => {
        alert('Entrada registrada correctamente');
        this.limpiarFormulario();
      },
      error: (error) => {
        console.error('Error al registrar entrada:', error);
        alert('Error al registrar la entrada');
      }
    });
  }

  limpiarFormulario() {
    this.producto = {
      id: null,
      nombre: '',
      categoria: '',
      codigo: '',
      proveedor: '',
      costo: '',
      unidades: '',
      fecha: '',
      factura: '',
      imagen: ''
    };

    this.imagenProducto = null;
    this.imagenPreview = null;
    this.nombreImagen = '';
  }
}