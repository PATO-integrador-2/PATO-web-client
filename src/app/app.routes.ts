import { Routes } from '@angular/router';
import {Registry} from './pages/registry/registry';
import { Login } from './auth/login/login';
import { MapViewer } from './pages/map-viewer/map-viewer';
import { ChatBOT } from './pages/chat-bot/chat-bot';
import { FindAccount } from './pages/account-recovery/account-recovery';
import { VerifyEmail } from './pages/verify-email/verify-email';
import { ResetPassword } from './pages/reset-password/reset-password';
import { authGuard } from './core/guards/auth-guard';
import { authenticatedGuard } from './core/guards/authenticated-guard';
import { ColNationalDash } from './pages/dashboard-viewer/col-national-dash/col-national-dash';
import { ColNationalPredict } from './pages/prediction-viewer/col-national-predict/col-national-predict';
import { LatinAmericaPredict } from './pages/prediction-viewer/latin-america-predict/latin-america-predict';
import { LatinAmericaDash } from './pages/dashboard-viewer/latin-america-dash/latin-america-dash';
import { ColDeptDash } from './pages/dashboard-viewer/col-dept-dash/col-dept-dash';
import { Landing } from './pages/landing/landing';
import { ColDeptPredict } from './pages/prediction-viewer/col-dept-predict/col-dept-predict';

export const routes: Routes = [
  // Landing pública 
  { path: '', component: Landing, pathMatch: 'full' },

  // Rutas públicas / de autenticación
  { path: 'login', component: Login, canActivate: [authenticatedGuard]},
  { path: 'register', component: Registry, canActivate: [authenticatedGuard]},
  { path: 'accountRecovery', component: FindAccount, canActivate: [authenticatedGuard]},
  { path: 'verify-email', component: VerifyEmail, canActivate: [authenticatedGuard]},
  { path: 'reset-password', component: ResetPassword, canActivate: [authenticatedGuard]},

  // Rutas protegidas por authGuard
  { path: 'dash', component: ColNationalDash, canActivate: [authGuard]},
  { path: 'dash/col-regional', component: ColDeptDash, canActivate: [authGuard]},
  { path: 'dash/latin', component: LatinAmericaDash, canActivate: [authGuard]},
  { path: 'predict', component: ColNationalPredict, canActivate: [authGuard]},
  { path: 'predict/col-regional', component: ColDeptPredict, canActivate: [authGuard]},
  { path: 'predict/latin', component: LatinAmericaPredict, canActivate: [authGuard]},
  { path: 'map-viewer', component: MapViewer, canActivate: [authGuard]},
  { path: 'chat-bot', component: ChatBOT, canActivate: [authGuard]},

  // Ruta comodín
  { path: '**', redirectTo: 'login' }
  
];

