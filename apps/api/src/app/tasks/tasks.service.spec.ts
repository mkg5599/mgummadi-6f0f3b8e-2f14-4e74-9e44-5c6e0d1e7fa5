import { Test, TestingModule } from '@nestjs/testing';
import { TasksService } from './tasks.service';

import { getRepositoryToken } from '@nestjs/typeorm';
import { Task } from './entities/task.entity';

describe('TasksService', () => {
  let service: TasksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: getRepositoryToken(Task),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all tasks for OWNER', async () => {
      const user = { role: 'OWNER', organization: { id: 1 } } as any;
      const repoSpy = jest.spyOn(service['tasksRepository'], 'find');

      await service.findAll(user);

      expect(repoSpy).toHaveBeenCalledWith({ relations: ['owner'] });
    });

    it('should return scoped tasks for non-OWNER', async () => {
      const user = { role: 'VIEWER', organization: { id: 1 } } as any;
      const repoSpy = jest.spyOn(service['tasksRepository'], 'find');

      await service.findAll(user);

      expect(repoSpy).toHaveBeenCalledWith({
        where: {
          owner: {
            organization: {
              id: 1
            }
          }
        },
        relations: ['owner']
      });
    });
  });
});
