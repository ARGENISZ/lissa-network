import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {

  usuario: string = '';
  password: string = '';
  mostrarPassword: boolean = false;
  cargando: boolean = false;

  private apiUrl = 'http://localhost:3000/api/login';

  constructor(
    private router: Router,
    private http: HttpClient
  ) {}

  togglePassword() {
    this.mostrarPassword = !this.mostrarPassword;
  }

  login() {
    if (!this.usuario.trim() || !this.password.trim()) {
      alert('Ingrese usuario y contraseña');
      return;
    }

    this.cargando = true;

    const datos = {
      usuario: this.usuario,
      contrasena: this.password
    };

    this.http.post<any>(this.apiUrl, datos).subscribe({
      next: (resp) => {
        this.cargando = false;

        if (resp.ok) {
          localStorage.setItem('usuarioLogueado', JSON.stringify(resp.usuario));
          localStorage.setItem('rolUsuario', resp.usuario.rol);
          localStorage.setItem('permisosUsuario', JSON.stringify(resp.permisos || []));

          this.router.navigate(['/dashboard']);
        } else {
          alert(resp.mensaje || 'Usuario o contraseña incorrectos');
        }
      },
      error: (error) => {
        this.cargando = false;
        console.error('Error en login:', error);

        if (error.error && error.error.mensaje) {
          alert(error.error.mensaje);
        } else {
          alert('Error al conectar con el servidor');
        }
      }
    });
  }
}