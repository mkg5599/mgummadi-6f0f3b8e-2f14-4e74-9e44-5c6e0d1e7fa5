import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, ForbiddenException, NotFoundException } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '@mgummadi-6f0f3b8e-2f14-4e74-9e44-5c6e0d1e7fa5/auth';
import { UserRole } from '@mgummadi-6f0f3b8e-2f14-4e74-9e44-5c6e0d1e7fa5/data';

@Controller('tasks')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) { }

  @Post()
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  create(@Body() createTaskDto: CreateTaskDto, @Request() req: any) {
    return this.tasksService.create(createTaskDto, req.user);
  }

  @Get()
  findAll(@Request() req: any) {
    return this.tasksService.findAll(req.user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.tasksService.findOne(+id, req.user);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  async update(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto, @Request() req: any) {
    const task = await this.tasksService.findOne(+id, req.user);
    if (!task) throw new NotFoundException();

    // Check ownership if not Admin/Owner
    if (req.user.role !== UserRole.OWNER && req.user.role !== UserRole.ADMIN && task.owner.id !== req.user.id) {
      throw new ForbiddenException('You can only update your own tasks');
    }
    return this.tasksService.update(+id, updateTaskDto, req.user);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  async remove(@Param('id') id: string, @Request() req: any) {
    const task = await this.tasksService.findOne(+id, req.user);
    if (!task) throw new NotFoundException();

    // Check ownership if not Admin/Owner
    if (req.user.role !== UserRole.OWNER && req.user.role !== UserRole.ADMIN && task.owner.id !== req.user.id) {
      throw new ForbiddenException('You can only delete your own tasks');
    }
    return this.tasksService.remove(+id, req.user);
  }
}
