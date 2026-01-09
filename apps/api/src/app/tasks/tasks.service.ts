import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { User } from '../users/entities/user.entity';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
    private auditService: AuditService
  ) { }

  async create(createTaskDto: CreateTaskDto, user: User) {
    const task = this.tasksRepository.create({
      ...createTaskDto,
      owner: user,
    });
    const savedTask = await this.tasksRepository.save(task);
    await this.auditService.log(user.id, 'CREATE_TASK', `Task ID: ${savedTask.id}`);
    return savedTask;
  }

  findAll(user: User) {
    if (user.role === 'OWNER') {
      return this.tasksRepository.find({ relations: ['owner'] });
    }
    return this.tasksRepository.find({
      where: {
        owner: {
          organization: {
            id: user.organization?.id
          }
        }
      },
      relations: ['owner']
    });
  }

  findOne(id: number, user?: User) {
    const where: any = { id };
    if (user && user.role !== 'OWNER') {
      where.owner = { organization: { id: user.organization?.id } };
    }
    return this.tasksRepository.findOne({ where, relations: ['owner'] });
  }

  async update(id: number, updateTaskDto: UpdateTaskDto, user: User) {
    const result = await this.tasksRepository.update(id, updateTaskDto);
    if (result.affected && result.affected > 0) {
      await this.auditService.log(user.id, 'UPDATE_TASK', `Task ID: ${id}`);
    }
    return result;
  }

  async remove(id: number, user: User) {
    const result = await this.tasksRepository.delete(id);
    if (result.affected && result.affected > 0) {
      await this.auditService.log(user.id, 'DELETE_TASK', `Task ID: ${id}`);
    }
    return result;
  }
}
