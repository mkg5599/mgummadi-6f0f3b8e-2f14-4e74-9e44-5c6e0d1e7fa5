import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum TaskStatus {
    TODO = 'TODO',
    IN_PROGRESS = 'IN_PROGRESS',
    DONE = 'DONE',
}

export enum TaskPriority {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH',
}

@Entity()
export class Task {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    title!: string;

    @Column({ nullable: true })
    description!: string;

    @Column({ type: 'simple-enum', enum: TaskStatus, default: TaskStatus.TODO })
    status!: TaskStatus;

    @Column({ type: 'simple-enum', enum: TaskPriority, default: TaskPriority.MEDIUM })
    priority!: TaskPriority;

    @Column({ type: 'date', nullable: true })
    dueDate!: string;

    @ManyToOne(() => User, (user) => user.tasks, { onDelete: 'CASCADE' })
    owner!: User;

    @Column()
    ownerId!: number;

    @Column({ nullable: true, default: 'WORK' })
    category!: string;
}
