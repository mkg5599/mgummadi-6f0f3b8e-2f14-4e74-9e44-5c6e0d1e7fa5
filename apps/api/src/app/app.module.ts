import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { TasksModule } from './tasks/tasks.module';
import { AuthModule } from './auth/auth.module';
import { User } from './users/entities/user.entity';
import { Task } from './tasks/entities/task.entity';
import { AuditModule } from './audit/audit.module';
import { Organization } from './users/entities/organization.entity';
import { AuditLog } from './audit/entities/audit-log.entity';
import { Permission } from './users/entities/permission.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'db.sqlite',
      synchronize: true, // Only for development/challenge
      autoLoadEntities: true,
      entities: [User, Task, Organization, AuditLog, Permission],
    }),
    UsersModule,
    TasksModule,
    AuthModule,
    AuditModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
