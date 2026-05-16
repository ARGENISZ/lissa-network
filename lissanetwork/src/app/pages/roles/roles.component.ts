import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

interface UsuarioRol {
  id: number;
  nombre_completo: string;
  usuario: string;
  correo?: string;
  telefono?: string;
  estado?: string;
  rol: string;
}

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './roles.component.html',
  styleUrls: ['./roles.component.css']
})
export class RolesComponent implements OnInit {

  private apiUrl = 'http://localhost:3000/api/usuarios';

  idUsuario: number | null = null;
  nombreUsuario: string = '';
  usuario: string = '';

  rolSeleccionado: string = 'Normal';

  rolesDisponibles = [
    {
      nombre: 'Administrador',
      descripcion: 'Acceso completo al sistema, usuarios, inventario, reportes, roles y permisos.'
    },
    {
      nombre: 'Normal',
      descripcion: 'Acceso limitado para uso operativo del sistema.'
    }
  ];

  cargando = false;

  usuarioEncontrado: UsuarioRol | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.idUsuario = params['id'] ? Number(params['id']) : null;
      this.usuario = params['usuario'] || '';
      this.nombreUsuario = params['nombre'] || '';

      if (this.idUsuario) {
        this.obtenerUsuario();
      } else {
        alert('No se recibió el usuario seleccionado');
        this.volverUsuarios();
      }
    });
  }

  obtenerUsuario() {
    if (!this.idUsuario) {
      return;
    }

    this.cargando = true;

    this.http.get<UsuarioRol>(`${this.apiUrl}/${this.idUsuario}`).subscribe({
      next: (data) => {
        this.usuarioEncontrado = data;
        this.nombreUsuario = data.nombre_completo;
        this.usuario = data.usuario;
        this.rolSeleccionado = data.rol || 'Normal';
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al obtener usuario:', error);
        alert('Error al cargar la información del usuario');
        this.cargando = false;
      }
    });
  }

  seleccionarRol(rol: string) {
    this.rolSeleccionado = rol;
  }

  guardarRol() {
    if (!this.idUsuario) {
      alert('No hay usuario seleccionado');
      return;
    }

    if (!this.rolSeleccionado) {
      alert('Debe seleccionar un rol');
      return;
    }

    const datos = {
      rol: this.rolSeleccionado
    };

    this.http.put(`${this.apiUrl}/${this.idUsuario}/rol`, datos).subscribe({
      next: () => {
        alert('Rol asignado correctamente');
        this.volverUsuarios();
      },
      error: (error) => {
        console.error('Error al asignar rol:', error);
        alert('Error al asignar el rol');
      }
    });
  }

  volverUsuarios() {
    this.router.navigate(['/dashboard/usuarios']);
  }
}