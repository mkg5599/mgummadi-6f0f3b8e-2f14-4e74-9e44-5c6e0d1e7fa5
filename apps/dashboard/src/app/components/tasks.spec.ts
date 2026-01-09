import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TasksComponent } from './tasks';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { TasksService } from '../services/tasks';
import { AuthService } from '../services/auth';
import { of } from 'rxjs';

// Mock Services
class MockTasksService {
  getTasks() { return of([]); }
}

class MockAuthService {
  getUserRole() { return 'ADMIN'; }
}

describe('TasksComponent', () => {
  let component: TasksComponent;
  let fixture: ComponentFixture<TasksComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TasksComponent, HttpClientTestingModule, RouterTestingModule],
      providers: [
        { provide: TasksService, useClass: MockTasksService },
        { provide: AuthService, useClass: MockAuthService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TasksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
