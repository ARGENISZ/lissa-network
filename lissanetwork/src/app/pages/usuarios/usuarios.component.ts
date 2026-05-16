import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

interface Usuario {
  id?: number;
  nombre_completo: string;
  usuario: string;
  correo: string;
  telefono: string;
  contrasena: string;
  estado: string;
}

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.css']
})
export class UsuariosComponent implements OnInit {

  private apiUrl = 'http://localhost:3000/api/usuarios';

  mostrarFormulario = false;
  modoEdicion = false;

  usuarios: Usuario[] = [];

  usuarioActual: Usuario = {
    nombre_completo: '',
    usuario: '',
    correo: '',
    telefono: '',
    contrasena: '',
    estado: 'Activo'
  };

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit() {
    this.obtenerUsuarios();
  }

  obtenerUsuarios() {
    this.http.get<Usuario[]>(this.apiUrl).subscribe({
      next: (data) => {
        this.usuarios = data;
      },
      error: (error) => {
        console.error('Error al obtener usuarios:', error);
        alert('Error al cargar los usuarios');
      }
    });
  }

  abrirFormulario() {
    this.modoEdicion = false;

    this.usuarioActual = {
      nombre_completo: '',
      usuario: '',
      correo: '',
      telefono: '',
      contrasena: '',
      estado: 'Activo'
    };

    this.mostrarFormulario = true;
  }

  editarUsuario(usuario: Usuario) {
    this.modoEdicion = true;

    this.usuarioActual = {
      ...usuario,
      contrasena: ''
    };

    this.mostrarFormulario = true;
  }

  guardarUsuario() {
    if (!this.usuarioActual.nombre_completo.trim()) {
      alert('Ingrese el nombre completo');
      return;
    }

    if (!this.usuarioActual.usuario.trim()) {
      alert('Ingrese el usuario');
      return;
    }

    if (!this.modoEdicion && !this.usuarioActual.contrasena.trim()) {
      alert('Ingrese la contraseña');
      return;
    }

    if (this.modoEdicion && this.usuarioActual.id) {
      this.http.put(`${this.apiUrl}/${this.usuarioActual.id}`, this.usuarioActual).subscribe({
        next: () => {
          alert('Usuario actualizado correctamente');
          this.obtenerUsuarios();
          this.cancelar();
        },
        error: (error) => {
          console.error('Error al actualizar usuario:', error);
          alert('Error al actualizar el usuario');
        }
      });
    } else {
      this.http.post(this.apiUrl, this.usuarioActual).subscribe({
        next: () => {
          alert('Usuario guardado correctamente');
          this.obtenerUsuarios();
          this.cancelar();
        },
        error: (error) => {
          console.error('Error al guardar usuario:', error);
          alert('Error al guardar el usuario');
        }
      });
    }
  }

  eliminarUsuario(usuario: Usuario) {
    if (!usuario.id) {
      alert('No se puede eliminar este usuario');
      return;
    }

    const confirmar = confirm(`¿Desea eliminar el usuario "${usuario.usuario}"?`);

    if (!confirmar) {
      return;
    }

    this.http.delete(`${this.apiUrl}/${usuario.id}`).subscribe({
      next: () => {
        alert('Usuario eliminado correctamente');
        this.obtenerUsuarios();
      },
      error: (error) => {
        console.error('Error al eliminar usuario:', error);
        alert('Error al eliminar el usuario');
      }
    });
  }

  abrirRoles(usuario: Usuario) {
    this.router.navigate(['/dashboard/roles'], {
      queryParams: {
        id: usuario.id,
        usuario: usuario.usuario,
        nombre: usuario.nombre_completo
      }
    });
  }

  abrirPermisos(usuario: Usuario) {
    this.router.navigate(['/dashboard/permisos'], {
      queryParams: {
        id: usuario.id,
        usuario: usuario.usuario,
        nombre: usuario.nombre_completo
      }
    });
  }

  cancelar() {
    this.mostrarFormulario = false;
    this.modoEdicion = false;

    this.usuarioActual = {
      nombre_completo: '',
      usuario: '',
      correo: '',
      telefono: '',
      contrasena: '',
      estado: 'Activo'
    };
  }
}