import { Routes } from '@angular/router';

import { LoginComponent } from './pages/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';

import { ProveedoresComponent } from './pages/proveedores/proveedores.component';
import { InventarioComponent } from './pages/inventario/inventario.component';
import { UsuariosComponent } from './pages/usuarios/usuarios.component';
import { NuevaEntradaComponent } from './pages/nueva-entrada/nueva-entrada.component';
import { NuevaSalidaComponent } from './pages/nueva-salida/nueva-salida.component';
import { HistorialEntradasComponent } from './pages/historial-entradas/historial-entradas.component';
import { HistorialVentasComponent } from './pages/historial-ventas/historial-ventas.component';
import { PuntoVentaComponent } from './pages/punto-venta/punto-venta.component';
import { ColeccionesComponent } from './pages/colecciones/colecciones.component';
import { CategoriasComponent } from './pages/categorias/categorias.component';

export const routes: Routes = [

  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

  { path: 'login', component: LoginComponent },

  {
    path: 'dashboard',
    component: DashboardComponent,
    children: [

      { path: '', redirectTo: 'inventario', pathMatch: 'full' },

      { path: 'nueva-entrada', component: NuevaEntradaComponent },
      { path: 'nueva-salida', component: NuevaSalidaComponent },
      { path: 'historial-entradas', component: HistorialEntradasComponent },
      { path: 'historial-ventas', component: HistorialVentasComponent },
      { path: 'inventario', component: InventarioComponent },
      { path: 'punto-venta', component: PuntoVentaComponent },
      { path: 'colecciones', component: ColeccionesComponent },
      { path: 'proveedores', component: ProveedoresComponent },
      { path: 'categorias', component: CategoriasComponent },
      { path: 'usuarios', component: UsuariosComponent }

    ]
  }

];