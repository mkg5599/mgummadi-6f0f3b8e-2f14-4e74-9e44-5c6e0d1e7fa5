import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { User } from './user.entity';

export enum PermissionAction {
    CREATE = 'CREATE',
    READ = 'READ',
    UPDATE = 'UPDATE',
    DELETE = 'DELETE',
}

export enum PermissionResource {
    TASK = 'TASK',
    USER = 'USER',
    ORGANIZATION = 'ORGANIZATION',
    AUDIT_LOG = 'AUDIT_LOG',
}

@Entity()
export class Permission {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'simple-enum', enum: PermissionAction })
    action!: PermissionAction;

    @Column({ type: 'simple-enum', enum: PermissionResource })
    resource!: PermissionResource;

    @Column({ nullable: true })
    description!: string;

    @ManyToMany(() => User, (user) => user.permissions)
    users!: User[];
}
