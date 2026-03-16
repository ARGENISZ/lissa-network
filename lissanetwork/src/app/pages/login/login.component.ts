import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {

  usuario: string = '';
  password: string = '';
  mostrarPassword: boolean = false; // 👁 CONTROL DEL OJO

  constructor(private router: Router) {}

  togglePassword() {
    this.mostrarPassword = !this.mostrarPassword;
  }

  login() {
    if (this.usuario === 'admin' && this.password === '1234') {
      this.router.navigate(['/dashboard']);
    } else {
      alert('Usuario o contraseña incorrectos');
    }
  }
}