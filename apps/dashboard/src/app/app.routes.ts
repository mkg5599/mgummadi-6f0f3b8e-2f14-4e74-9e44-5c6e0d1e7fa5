import { Route } from '@angular/router';
import { LoginComponent } from './components/login';
import { TasksComponent } from './components/tasks';
import { AuditLogsComponent } from './components/audit-logs';
import { authGuard } from './guards/auth-guard';

export const appRoutes: Route[] = [
  { path: 'login', component: LoginComponent },
  { path: 'tasks', component: TasksComponent, canActivate: [authGuard] },
  { path: 'audit-logs', component: AuditLogsComponent, canActivate: [authGuard] },
  { path: '', redirectTo: 'tasks', pathMatch: 'full' },
];
