import { Test, TestingModule } from '@nestjs/testing';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('TasksController', () => {
  let controller: TasksController;
  let tasksService: TasksService;

  const mockTasksService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [
        {
          provide: TasksService,
          useValue: mockTasksService,
        },
      ],
    }).compile();

    controller = module.get<TasksController>(TasksController);
    tasksService = module.get<TasksService>(TasksService);

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a task for authorized user', async () => {
      const createDto = { title: 'Test Task', description: 'Description' };
      const user = { id: 1, role: 'ADMIN', organization: { id: 1 } };
      const expectedTask = { id: 1, ...createDto, owner: user };

      mockTasksService.create.mockResolvedValue(expectedTask);

      const result = await controller.create(createDto as any, { user });

      expect(result).toEqual(expectedTask);
      expect(tasksService.create).toHaveBeenCalledWith(createDto, user);
    });
  });

  describe('findAll', () => {
    it('should call service.findAll with user', async () => {
      const user = { id: 1, role: 'ADMIN', organization: { id: 1 } };
      const mockTasks = [{ id: 1, title: 'Task 1' }];

      mockTasksService.findAll.mockResolvedValue(mockTasks);

      const result = await controller.findAll({ user });

      expect(result).toEqual(mockTasks);
      expect(tasksService.findAll).toHaveBeenCalledWith(user);
    });

    it('should return organization-scoped tasks for ADMIN', async () => {
      const user = { id: 1, role: 'ADMIN', organization: { id: 1 } };
      const mockTasks = [{ id: 1, title: 'Org Task' }];

      mockTasksService.findAll.mockResolvedValue(mockTasks);

      const result = await controller.findAll({ user });

      expect(result).toEqual(mockTasks);
    });

    it('should return all tasks for OWNER', async () => {
      const user = { id: 1, role: 'OWNER', organization: { id: 1 } };
      const mockTasks = [
        { id: 1, title: 'Task 1' },
        { id: 2, title: 'Task 2' },
      ];

      mockTasksService.findAll.mockResolvedValue(mockTasks);

      const result = await controller.findAll({ user });

      expect(result).toEqual(mockTasks);
    });
  });

  describe('findOne', () => {
    it('should return a task by id', async () => {
      const user = { id: 1, role: 'ADMIN', organization: { id: 1 } };
      const mockTask = { id: 1, title: 'Test Task', owner: user };

      mockTasksService.findOne.mockResolvedValue(mockTask);

      const result = await controller.findOne('1', { user });

      expect(result).toEqual(mockTask);
      expect(tasksService.findOne).toHaveBeenCalledWith(1, user);
    });
  });

  describe('update', () => {
    it('should update task when user is owner', async () => {
      const updateDto = { title: 'Updated Task' };
      const user = { id: 1, role: 'ADMIN', organization: { id: 1 } };
      const existingTask = { id: 1, title: 'Old Task', owner: user };
      const updatedTask = { affected: 1 };

      mockTasksService.findOne.mockResolvedValue(existingTask);
      mockTasksService.update.mockResolvedValue(updatedTask);

      const result = await controller.update('1', updateDto as any, { user });

      expect(result).toEqual(updatedTask);
      expect(tasksService.update).toHaveBeenCalledWith(1, updateDto, user);
    });

    it('should throw NotFoundException when task does not exist', async () => {
      const updateDto = { title: 'Updated Task' };
      const user = { id: 1, role: 'ADMIN', organization: { id: 1 } };

      mockTasksService.findOne.mockResolvedValue(null);

      await expect(controller.update('1', updateDto as any, { user })).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw ForbiddenException when user is not owner and not OWNER role', async () => {
      const updateDto = { title: 'Updated Task' };
      const user = { id: 1, role: 'VIEWER', organization: { id: 1 } };
      const existingTask = { id: 1, title: 'Old Task', owner: { id: 2 } };

      mockTasksService.findOne.mockResolvedValue(existingTask);

      await expect(controller.update('1', updateDto as any, { user })).rejects.toThrow(
        ForbiddenException
      );
    });

    it('should allow OWNER to update any task', async () => {
      const updateDto = { title: 'Updated Task' };
      const user = { id: 1, role: 'OWNER', organization: { id: 1 } };
      const existingTask = { id: 1, title: 'Old Task', owner: { id: 2 } };
      const updatedTask = { affected: 1 };

      mockTasksService.findOne.mockResolvedValue(existingTask);
      mockTasksService.update.mockResolvedValue(updatedTask);

      const result = await controller.update('1', updateDto as any, { user });

      expect(result).toEqual(updatedTask);
    });
  });

  describe('remove', () => {
    it('should delete task when user is owner', async () => {
      const user = { id: 1, role: 'ADMIN', organization: { id: 1 } };
      const existingTask = { id: 1, title: 'Task', owner: user };
      const deleteResult = { affected: 1 };

      mockTasksService.findOne.mockResolvedValue(existingTask);
      mockTasksService.remove.mockResolvedValue(deleteResult);

      const result = await controller.remove('1', { user });

      expect(result).toEqual(deleteResult);
      expect(tasksService.remove).toHaveBeenCalledWith(1, user);
    });

    it('should throw NotFoundException when task does not exist', async () => {
      const user = { id: 1, role: 'ADMIN', organization: { id: 1 } };

      mockTasksService.findOne.mockResolvedValue(null);

      await expect(controller.remove('1', { user })).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user is not owner and not OWNER role', async () => {
      const user = { id: 1, role: 'ADMIN', organization: { id: 1 } };
      const existingTask = { id: 1, title: 'Task', owner: { id: 2 } };

      mockTasksService.findOne.mockResolvedValue(existingTask);

      await expect(controller.remove('1', { user })).rejects.toThrow(ForbiddenException);
    });

    it('should allow OWNER to delete any task', async () => {
      const user = { id: 1, role: 'OWNER', organization: { id: 1 } };
      const existingTask = { id: 1, title: 'Task', owner: { id: 2 } };
      const deleteResult = { affected: 1 };

      mockTasksService.findOne.mockResolvedValue(existingTask);
      mockTasksService.remove.mockResolvedValue(deleteResult);

      const result = await controller.remove('1', { user });

      expect(result).toEqual(deleteResult);
    });
  });
});
