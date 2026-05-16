import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

interface PermisoUsuario {
  modulo: string;
  puede_ver: boolean;
  puede_crear: boolean;
  puede_editar: boolean;
  puede_eliminar: boolean;
}

interface UsuarioLogueado {
  id: number;
  nombre_completo: string;
  usuario: string;
  correo?: string;
  telefono?: string;
  estado: string;
  rol: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  usuarioLogueado: UsuarioLogueado | null = null;
  permisosUsuario: PermisoUsuario[] = [];
  rolUsuario: string = '';

  constructor(private router: Router) {}

  ngOnInit() {
    const usuarioStorage = localStorage.getItem('usuarioLogueado');
    const permisosStorage = localStorage.getItem('permisosUsuario');
    const rolStorage = localStorage.getItem('rolUsuario');

    if (!usuarioStorage) {
      this.router.navigate(['/login']);
      return;
    }

    this.usuarioLogueado = JSON.parse(usuarioStorage);
    this.rolUsuario = rolStorage || this.usuarioLogueado?.rol || 'Normal';

    if (permisosStorage) {
      this.permisosUsuario = JSON.parse(permisosStorage);
    }

    if (this.rolUsuario === 'Administrador') {
      this.permisosUsuario = [
        { modulo: 'nueva_entrada', puede_ver: true, puede_crear: true, puede_editar: true, puede_eliminar: true },
        { modulo: 'nueva_salida', puede_ver: true, puede_crear: true, puede_editar: true, puede_eliminar: true },
        { modulo: 'historial_entradas', puede_ver: true, puede_crear: true, puede_editar: true, puede_eliminar: true },
        { modulo: 'historial_ventas', puede_ver: true, puede_crear: true, puede_editar: true, puede_eliminar: true },
        { modulo: 'inventario', puede_ver: true, puede_crear: true, puede_editar: true, puede_eliminar: true },
        { modulo: 'punto_venta', puede_ver: true, puede_crear: true, puede_editar: true, puede_eliminar: true },
        { modulo: 'atencion_cliente', puede_ver: true, puede_crear: true, puede_editar: true, puede_eliminar: true },
        { modulo: 'proveedores', puede_ver: true, puede_crear: true, puede_editar: true, puede_eliminar: true },
        { modulo: 'categorias', puede_ver: true, puede_crear: true, puede_editar: true, puede_eliminar: true },
        { modulo: 'usuarios', puede_ver: true, puede_crear: true, puede_editar: true, puede_eliminar: true }
      ];
    }
  }

  puedeVer(modulo: string): boolean {
    if (this.rolUsuario === 'Administrador') {
      return true;
    }

    const permiso = this.permisosUsuario.find(p => p.modulo === modulo);

    return permiso ? permiso.puede_ver === true : false;
  }

  cerrarSesion() {
    localStorage.removeItem('usuarioLogueado');
    localStorage.removeItem('rolUsuario');
    localStorage.removeItem('permisosUsuario');

    this.router.navigate(['/login']);
  }
}