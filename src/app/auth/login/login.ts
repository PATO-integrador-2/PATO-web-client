import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { LoginRequest } from '../../interfaces/LoginRequest';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule, MatFormFieldControl } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Route, Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import {MatSidenavModule} from '@angular/material/sidenav';

@Component({
  selector: 'app-login',
  imports: [
    MatSidenavModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatToolbarModule,
    ReactiveFormsModule,
    MatIconModule,
    RouterLink
  ],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private router = inject(Router);
  private authService = inject(AuthService);
  errorMessage = signal('');

  public formBuild = inject(FormBuilder);

  readonly emailControl = new FormControl('', [
    Validators.required, Validators.email
  ]);

  readonly passwordControl = new FormControl('', [Validators.required]);

  hide = signal(true);
  clickEvent(event: MouseEvent) {
    this.hide.set(!this.hide());
    event.stopPropagation();
  }

  login() {
    this.errorMessage.set('');

    if (this.emailControl.invalid || this.passwordControl.invalid) {
      this.emailControl.markAsTouched();
      this.passwordControl.markAsTouched();
      return;
    }
    const email = this.emailControl.value!;
    const password = this.passwordControl.value!;

    this.authService.login(email, password).subscribe({
      next: () => this.router.navigate(['/map-viewer']),
      error: (err) => {
        const errorCode = err.error?.code;
        console.error('Error al iniciar sesión', err);
        
        // Mensajes de error
        if (errorCode === 'EMAIL_NOT_VERIFIED') {
          this.errorMessage.set('Tu correo no ha sido verificado. Revisa tu bandeja de entrada');
        } else if (err.status === 401 || err.status === 400) {
          this.errorMessage.set('Correo o contraseña incorrectos');
        } else {
          this.errorMessage.set('Ocurrió un error en el servidor. Intenta nuevamente');
        }
      }
    })

  }


}
