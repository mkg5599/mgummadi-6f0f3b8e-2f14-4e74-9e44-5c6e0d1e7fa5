import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TasksService } from './tasks';
import { Task } from '@mgummadi-6f0f3b8e-2f14-4e74-9e44-5c6e0d1e7fa5/data';

describe('TasksService', () => {
  let service: TasksService;
  let httpMock: HttpTestingController;

  const mockTasks: Task[] = [
    {
      id: 1,
      title: 'Test Task 1',
      description: 'Description 1',
      status: 'TODO',
      priority: 'HIGH',
      category: 'WORK',
    },
    {
      id: 2,
      title: 'Test Task 2',
      description: 'Description 2',
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
      category: 'PERSONAL',
    },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TasksService],
    });
    service = TestBed.inject(TasksService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getTasks', () => {
    it('should retrieve all tasks', (done) => {
      service.getTasks().subscribe((tasks) => {
        expect(tasks).toEqual(mockTasks);
        expect(tasks.length).toBe(2);
        done();
      });

      const req = httpMock.expectOne('/api/tasks');
      expect(req.request.method).toBe('GET');
      req.flush(mockTasks);
    });

    it('should handle empty task list', (done) => {
      service.getTasks().subscribe((tasks) => {
        expect(tasks).toEqual([]);
        done();
      });

      const req = httpMock.expectOne('/api/tasks');
      req.flush([]);
    });
  });

  describe('createTask', () => {
    it('should create a new task', (done) => {
      const newTask: Partial<Task> = {
        title: 'New Task',
        description: 'New Description',
        status: 'TODO',
        priority: 'LOW',
      };

      const createdTask = { id: 3, ...newTask };

      service.createTask(newTask).subscribe((task) => {
        expect(task).toEqual(createdTask);
        done();
      });

      const req = httpMock.expectOne('/api/tasks');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newTask);
      req.flush(createdTask);
    });
  });

  describe('updateTask', () => {
    it('should update an existing task', (done) => {
      const taskId = 1;
      const updates: Partial<Task> = {
        title: 'Updated Title',
        status: 'DONE',
      };

      const updatedTask = { id: taskId, ...updates };

      service.updateTask(taskId, updates).subscribe((task) => {
        expect(task).toEqual(updatedTask);
        done();
      });

      const req = httpMock.expectOne(`/api/tasks/${taskId}`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(updates);
      req.flush(updatedTask);
    });
  });

  describe('deleteTask', () => {
    it('should delete a task', (done) => {
      const taskId = 1;

      service.deleteTask(taskId).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(`/api/tasks/${taskId}`);
      expect(req.request.method).toBe('DELETE');
      req.flush({});
    });
  });

  describe('error handling', () => {
    it('should handle HTTP errors on getTasks', (done) => {
      service.getTasks().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
          done();
        },
      });

      const req = httpMock.expectOne('/api/tasks');
      req.flush('Error', { status: 500, statusText: 'Server Error' });
    });

    it('should handle HTTP errors on createTask', (done) => {
      const newTask: Partial<Task> = { title: 'New Task' };

      service.createTask(newTask).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(403);
          done();
        },
      });

      const req = httpMock.expectOne('/api/tasks');
      req.flush('Forbidden', { status: 403, statusText: 'Forbidden' });
    });
  });
});
