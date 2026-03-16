import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-categorias',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './categorias.component.html',
  styleUrls: ['./categorias.component.css']
})
export class CategoriasComponent {

  mostrarFormulario = false;
  modoEdicion = false;
  indiceEdicion: number | null = null;

  categorias = [
    { categoria: 'Electrónica' },
    { categoria: 'Ropa' }
  ];

  categoriaActual = {
    categoria: ''
  };

  abrirFormulario() {
    this.modoEdicion = false;
    this.categoriaActual = { categoria: '' };
    this.mostrarFormulario = true;
  }

  editarCategoria(index: number) {
    this.modoEdicion = true;
    this.indiceEdicion = index;
    this.categoriaActual = { ...this.categorias[index] };
    this.mostrarFormulario = true;
  }

  guardarCategoria() {
    if (this.modoEdicion && this.indiceEdicion !== null) {
      this.categorias[this.indiceEdicion] = { ...this.categoriaActual };
    } else {
      this.categorias.push({ ...this.categoriaActual });
    }

    this.mostrarFormulario = false;
  }

  eliminarCategoria(index: number) {
    this.categorias.splice(index, 1);
  }

  cancelar() {
    this.mostrarFormulario = false;
  }
}