import { Routes } from '@angular/router';
import {Registry} from './pages/registry/registry';
import { Login } from './auth/login/login';
import { MapViewer } from './pages/map-viewer/map-viewer';
import { ChatBOT } from './pages/chat-bot/chat-bot';
import { FindAccount } from './pages/account-recovery/account-recovery';
import { VerifyEmail } from './pages/verify-email/verify-email';
import { ResetPassword } from './pages/reset-password/reset-password';
import { LatinAmerica } from './pages/latin-america/latin-america';
import { ColNational } from './pages/col-national/col-national';
import { ColDept } from './pages/col-dept/col-dept';
import { ColNational as PredictionViewer } from './pages/prediction-viewer/col-national/col-national';
import { authGuard } from './core/guards/auth-guard';
import { authenticatedGuard } from './core/guards/authenticated-guard';
import { ColNationalDash } from './pages/dashboard-viewer/col-national-dash/col-national-dash';
import { ColNationalPredict } from './pages/prediction-viewer/col-national-predict/col-national-predict';
import { LatinAmericaPredict } from './pages/prediction-viewer/latin-america-predict/latin-america-predict';

export const routes: Routes = [
  {path: '', redirectTo: 'login', pathMatch: 'full'},

  // Rutas públicas / de autenticación
  { path: 'login', component: Login, canActivate: [authenticatedGuard]},
  { path: 'register', component: Registry, canActivate: [authenticatedGuard]},
  { path: 'accountRecovery', component: FindAccount, canActivate: [authenticatedGuard]},
  { path: 'verify-email', component: VerifyEmail, canActivate: [authenticatedGuard]},
  { path: 'reset-password', component: ResetPassword, canActivate: [authenticatedGuard]},

  // Rutas protegidas por authGuard
  { path: 'col-national-dash', component: ColNationalDash, canActivate: [authGuard]},
  //{ path: 'col-dept-dash', component: ColDept, canActivate: [authGuard]},
  { path: 'latin-dash', component: LatinAmericaDash, canActivate: [authGuard]},
  { path: 'col-national-predict', component: ColNationalPredict, canActivate: [authGuard]},
  { path: 'latin-predict', component: LatinAmericaPredict, canActivate: [authGuard]},
  { path: 'map-viewer', component: MapViewer, canActivate: [authGuard]},
  { path: 'chat-bot', component: ChatBOT, canActivate: [authGuard]},

  // Ruta comodín
  { path: '**', redirectTo: 'login' }
  
];

