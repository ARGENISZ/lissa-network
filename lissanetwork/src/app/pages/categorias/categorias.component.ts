import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface Categoria {
  id?: number;
  categoria: string;
}

@Component({
  selector: 'app-categorias',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './categorias.component.html',
  styleUrls: ['./categorias.component.css']
})
export class CategoriasComponent implements OnInit {

  private apiUrl = 'http://localhost:3000/api/categorias';

  mostrarFormulario = false;
  modoEdicion = false;
  indiceEdicion: number | null = null;

  categorias: Categoria[] = [];

  categoriaActual: Categoria = {
    categoria: ''
  };

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.obtenerCategorias();
  }

  obtenerCategorias() {
    this.http.get<Categoria[]>(this.apiUrl).subscribe({
      next: (data) => {
        this.categorias = data;
      },
      error: (error) => {
        console.error('Error al obtener categorías:', error);
        alert('Error al cargar las categorías');
      }
    });
  }

  abrirFormulario() {
    this.modoEdicion = false;
    this.indiceEdicion = null;
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
    if (!this.categoriaActual.categoria.trim()) {
      alert('Ingrese el nombre de la categoría');
      return;
    }

    if (this.modoEdicion && this.categoriaActual.id) {
      this.http.put(`${this.apiUrl}/${this.categoriaActual.id}`, this.categoriaActual).subscribe({
        next: () => {
          alert('Categoría actualizada correctamente');
          this.obtenerCategorias();
          this.mostrarFormulario = false;
        },
        error: (error) => {
          console.error('Error al actualizar categoría:', error);
          alert('Error al actualizar la categoría');
        }
      });
    } else {
      this.http.post(this.apiUrl, this.categoriaActual).subscribe({
        next: () => {
          alert('Categoría guardada correctamente');
          this.obtenerCategorias();
          this.mostrarFormulario = false;
        },
        error: (error) => {
          console.error('Error al guardar categoría:', error);
          alert('Error al guardar la categoría');
        }
      });
    }
  }

  eliminarCategoria(index: number) {
    const categoria = this.categorias[index];

    if (!categoria.id) {
      return;
    }

    const confirmar = confirm(`¿Desea eliminar la categoría "${categoria.categoria}"?`);

    if (!confirmar) {
      return;
    }

    this.http.delete(`${this.apiUrl}/${categoria.id}`).subscribe({
      next: () => {
        alert('Categoría eliminada correctamente');
        this.obtenerCategorias();
      },
      error: (error) => {
        console.error('Error al eliminar categoría:', error);
        alert('Error al eliminar la categoría');
      }
    });
  }

  cancelar() {
    this.mostrarFormulario = false;
    this.modoEdicion = false;
    this.indiceEdicion = null;
    this.categoriaActual = { categoria: '' };
  }
}