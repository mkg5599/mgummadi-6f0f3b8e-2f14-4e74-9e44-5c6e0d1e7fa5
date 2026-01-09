import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AuditLog {
    id: number;
    userId: number;
    action: string;
    resource: string;
    timestamp: string;
    user?: { username: string };
}

@Injectable({
    providedIn: 'root'
})
export class AuditService {
    private http = inject(HttpClient);

    private apiUrl = '/api/audit-log';

    getAuditLogs(): Observable<AuditLog[]> {
        return this.http.get<AuditLog[]>(this.apiUrl);
    }
}
