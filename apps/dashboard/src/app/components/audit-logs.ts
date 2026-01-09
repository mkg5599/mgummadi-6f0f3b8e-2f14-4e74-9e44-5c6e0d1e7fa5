import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuditService, AuditLog } from '../services/audit.service';
import { Router, RouterModule } from '@angular/router';

@Component({
    selector: 'app-audit-logs',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './audit-logs.html',
})
export class AuditLogsComponent implements OnInit {
    private auditService = inject(AuditService);
    private router = inject(Router);

    logs: AuditLog[] = [];
    loading = true;
    error: string | null = null;

    ngOnInit() {
        this.auditService.getAuditLogs().subscribe({
            next: (data) => {
                
                this.logs = data;
                this.loading = false;
            },
            error: (err) => {
                console.error('Failed to fetch audit logs', err);
                this.error = 'Failed to load audit logs';
                this.loading = false;
            }
        });
    }

    goBack() {
        this.router.navigate(['/tasks']);
    }
}
