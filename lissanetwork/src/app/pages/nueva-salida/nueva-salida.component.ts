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

  imagenProducto: File | null = null;
  imagenPreview: string | ArrayBuffer | null = null;
  nombreImagen: string = '';

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
    unidades: 0,
    imagen: ''
  };

  cambiarPestana(tipo: 'producto' | 'coleccion') {
    this.pestanaActiva = tipo;
  }

  get totalVenta() {
    return this.salida.precioVenta * this.salida.unidades;
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
    this.salida.imagen = archivo.name;

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
    this.salida.imagen = '';
  }

  registrarSalida() {
    if (!this.salida.fecha || !this.salida.folio || !this.salida.codigo || !this.salida.nombre) {
      alert('Por favor complete los campos obligatorios');
      return;
    }

    if (this.salida.unidades <= 0) {
      alert('Debe ingresar una cantidad de unidades válida');
      return;
    }

    if (this.salida.unidades > this.salida.disponibles) {
      alert('No puede registrar una salida mayor a las unidades disponibles');
      return;
    }

    const formData = new FormData();

    formData.append('fecha', this.salida.fecha);
    formData.append('folio', this.salida.folio);
    formData.append('cliente', this.salida.cliente);
    formData.append('factura', this.salida.factura);
    formData.append('codigo', this.salida.codigo);
    formData.append('nombre', this.salida.nombre);
    formData.append('categoria', this.salida.categoria);
    formData.append('proveedor', this.salida.proveedor);
    formData.append('disponibles', this.salida.disponibles.toString());
    formData.append('precioVenta', this.salida.precioVenta.toString());
    formData.append('unidades', this.salida.unidades.toString());
    formData.append('totalVenta', this.totalVenta.toString());

    if (this.imagenProducto) {
      formData.append('imagen', this.imagenProducto);
    }

    console.log('Salida registrada:', this.salida);
    console.log('Imagen seleccionada:', this.imagenProducto);
    console.log('Total de venta:', this.totalVenta);

    alert('Salida registrada correctamente');

    this.limpiarFormulario();
  }

  limpiarFormulario() {
    this.salida = {
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
      unidades: 0,
      imagen: ''
    };

    this.imagenProducto = null;
    this.imagenPreview = null;
    this.nombreImagen = '';
  }

}