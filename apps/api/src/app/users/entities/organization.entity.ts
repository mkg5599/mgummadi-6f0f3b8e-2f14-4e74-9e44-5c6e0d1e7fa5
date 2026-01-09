import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity()
export class Organization {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    name!: string;

    @ManyToOne(() => Organization, (org) => org.children, { nullable: true })
    parent!: Organization | null;

    @OneToMany(() => Organization, (org) => org.parent)
    children!: Organization[];

    @OneToMany(() => User, (user) => user.organization)
    users!: User[];
}
