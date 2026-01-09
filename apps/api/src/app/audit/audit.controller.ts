import { Controller, Get, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '@mgummadi-6f0f3b8e-2f14-4e74-9e44-5c6e0d1e7fa5/auth';
import { UserRole } from '@mgummadi-6f0f3b8e-2f14-4e74-9e44-5c6e0d1e7fa5/data';

@Controller('audit-log')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditController {
    constructor(private readonly auditService: AuditService) { }

    @Get()
    @Roles(UserRole.OWNER, UserRole.ADMIN)
    async findAll(@Request() req: any) {
        const logs = await this.auditService.findAll();
        await this.auditService.log(req.user.id, 'VIEW_AUDIT_LOGS', `User accessed audit logs`);
        return logs;
    }
}
