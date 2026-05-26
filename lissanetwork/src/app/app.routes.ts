import { Routes } from '@angular/router';

import { LoginComponent } from './pages/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';

import { InicioComponent } from './pages/inicio/inicio.component';
import { ProveedoresComponent } from './pages/proveedores/proveedores.component';
import { InventarioComponent } from './pages/inventario/inventario.component';
import { UsuariosComponent } from './pages/usuarios/usuarios.component';
import { NuevaEntradaComponent } from './pages/nueva-entrada/nueva-entrada.component';
import { NuevaSalidaComponent } from './pages/nueva-salida/nueva-salida.component';
import { HistorialEntradasComponent } from './pages/historial-entradas/historial-entradas.component';
import { HistorialVentasComponent } from './pages/historial-ventas/historial-ventas.component';
import { PuntoVentaComponent } from './pages/punto-venta/punto-venta.component';
import { AtencionClienteComponent } from './pages/atencion-cliente/atencion-cliente.component'; 
import { CategoriasComponent } from './pages/categorias/categorias.component';

import { RolesComponent } from './pages/roles/roles.component';
import { PermisosComponent } from './pages/permisos/permisos.component';

export const routes: Routes = [

  { path: '', redirectTo: 'login', pathMatch: 'full' },

  { path: 'login', component: LoginComponent },

  {
    path: 'dashboard',
    component: DashboardComponent,
    children: [

      // Al entrar al dashboard irá directo a Inicio
      { path: '', redirectTo: 'inicio', pathMatch: 'full' },

      { path: 'inicio', component: InicioComponent },

      { path: 'nueva-entrada', component: NuevaEntradaComponent },
      { path: 'nueva-salida', component: NuevaSalidaComponent },
      { path: 'historial-entradas', component: HistorialEntradasComponent },
      { path: 'historial-ventas', component: HistorialVentasComponent },
      { path: 'inventario', component: InventarioComponent },
      { path: 'punto-venta', component: PuntoVentaComponent },
      { path: 'atencion-al-cliente', component: AtencionClienteComponent },
      { path: 'proveedores', component: ProveedoresComponent },
      { path: 'categorias', component: CategoriasComponent },
      { path: 'usuarios', component: UsuariosComponent },

      { path: 'roles', component: RolesComponent },
      { path: 'permisos', component: PermisosComponent }

    ]
  },

  { path: '**', redirectTo: 'login' }

];