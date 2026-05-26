import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

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
  selector: 'app-inicio',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './inicio.component.html',
  styleUrls: ['./inicio.component.css']
})
export class InicioComponent implements OnInit {

  usuarioLogueado: UsuarioLogueado | null = null;
  rolUsuario: string = '';
  fechaActual: string = '';

  ngOnInit() {
    const usuarioStorage = localStorage.getItem('usuarioLogueado');
    const rolStorage = localStorage.getItem('rolUsuario');

    if (usuarioStorage) {
      this.usuarioLogueado = JSON.parse(usuarioStorage);
    }

    this.rolUsuario = rolStorage || this.usuarioLogueado?.rol || 'Usuario';

    this.fechaActual = new Date().toLocaleDateString('es-HN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

}