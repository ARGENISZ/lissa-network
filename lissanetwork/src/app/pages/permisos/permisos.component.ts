import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

interface UsuarioPermiso {
  id: number;
  nombre_completo: string;
  usuario: string;
  correo?: string;
  telefono?: string;
  estado?: string;
  rol: string;
}

interface PermisoModulo {
  modulo: string;
  nombre: string;
  puede_ver: boolean;
  puede_crear: boolean;
  puede_editar: boolean;
  puede_eliminar: boolean;
}

@Component({
  selector: 'app-permisos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './permisos.component.html',
  styleUrls: ['./permisos.component.css']
})
export class PermisosComponent implements OnInit {

  private apiUrl = 'http://localhost:3000/api/usuarios';

  idUsuario: number | null = null;
  usuarioSeleccionado: UsuarioPermiso | null = null;

  permisos: PermisoModulo[] = [];

  cargando = false;
  guardando = false;
  esAdministrador = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.idUsuario = params['id'] ? Number(params['id']) : null;

      if (!this.idUsuario) {
        alert('No se recibió el usuario seleccionado');
        this.volverUsuarios();
        return;
      }

      this.obtenerPermisos();
    });
  }

  obtenerPermisos() {
    if (!this.idUsuario) {
      return;
    }

    this.cargando = true;

    this.http.get<any>(`${this.apiUrl}/${this.idUsuario}/permisos`).subscribe({
      next: (resp) => {
        this.usuarioSeleccionado = resp.usuario;
        this.permisos = resp.permisos;
        this.esAdministrador = this.usuarioSeleccionado?.rol === 'Administrador';
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al obtener permisos:', error);
        alert('Error al cargar los permisos del usuario');
        this.cargando = false;
      }
    });
  }

  actualizarPermiso(permiso: PermisoModulo) {
    if (
      permiso.puede_crear ||
      permiso.puede_editar ||
      permiso.puede_eliminar
    ) {
      permiso.puede_ver = true;
    }
  }

  darTodosLosPermisos() {
    this.permisos = this.permisos.map(p => ({
      ...p,
      puede_ver: true,
      puede_crear: true,
      puede_editar: true,
      puede_eliminar: true
    }));
  }

  quitarTodosLosPermisos() {
    this.permisos = this.permisos.map(p => ({
      ...p,
      puede_ver: false,
      puede_crear: false,
      puede_editar: false,
      puede_eliminar: false
    }));
  }

  guardarPermisos() {
    if (!this.idUsuario) {
      alert('No hay usuario seleccionado');
      return;
    }

    if (this.esAdministrador) {
      alert('Este usuario es Administrador. Tiene acceso completo por defecto.');
      return;
    }

    this.guardando = true;

    const datos = {
      permisos: this.permisos
    };

    this.http.put(`${this.apiUrl}/${this.idUsuario}/permisos`, datos).subscribe({
      next: () => {
        alert('Permisos guardados correctamente');
        this.guardando = false;
        this.volverUsuarios();
      },
      error: (error) => {
        console.error('Error al guardar permisos:', error);
        alert('Error al guardar los permisos');
        this.guardando = false;
      }
    });
  }

  volverUsuarios() {
    this.router.navigate(['/dashboard/usuarios']);
  }
}