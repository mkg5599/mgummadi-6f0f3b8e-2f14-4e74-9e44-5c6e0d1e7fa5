import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity()
export class AuditLog {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    action!: string; // e.g. 'CREATE_TASK', 'DELETE_TASK'

    @Column()
    resource!: string; // e.g. 'Task:123'

    @CreateDateColumn()
    timestamp!: Date;

    @ManyToOne(() => User, { nullable: true })
    user!: User | null;

    @Column({ nullable: true })
    userId!: number;
}
