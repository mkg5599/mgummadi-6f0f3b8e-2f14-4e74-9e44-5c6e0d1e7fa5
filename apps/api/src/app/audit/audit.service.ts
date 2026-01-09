import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

@Injectable()
export class AuditService {
    constructor(
        @InjectRepository(AuditLog)
        private auditRepository: Repository<AuditLog>,
    ) { }

    async log(userId: number | null, action: string, resource: string) {
        const log = this.auditRepository.create({
            userId,
            action,
            resource,
        });
        return this.auditRepository.save(log);
    }

    async findAll() {
        return this.auditRepository.find({ order: { timestamp: 'DESC' }, take: 100, relations: ['user'] });
    }
}
