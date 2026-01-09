import { Entity, Column, PrimaryGeneratedColumn, OneToMany, ManyToOne, ManyToMany, JoinTable } from 'typeorm';
import { Task } from '../../tasks/entities/task.entity';
import { Organization } from './organization.entity';
import { Permission } from './permission.entity';
import { UserRole } from '@mgummadi-6f0f3b8e-2f14-4e74-9e44-5c6e0d1e7fa5/data';

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ unique: true })
    username!: string;

    @Column()
    password!: string;

    @Column({ type: 'simple-enum', enum: UserRole, default: UserRole.VIEWER })
    role!: UserRole;

    @OneToMany(() => Task, (task) => task.owner)
    tasks!: Task[];

    @ManyToOne(() => Organization, (org) => org.users)
    organization!: Organization;

    @ManyToMany(() => Permission, (permission) => permission.users)
    @JoinTable()
    permissions!: Permission[];
}
