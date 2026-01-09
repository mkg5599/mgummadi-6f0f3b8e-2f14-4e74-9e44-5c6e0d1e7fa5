import { Component, OnInit, inject, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  ReactiveFormsModule,
  FormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { TasksService } from '../services/tasks';
import { AuthService } from '../services/auth';
import { Task } from '@mgummadi-6f0f3b8e-2f14-4e74-9e44-5c6e0d1e7fa5/data';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, DragDropModule],
  templateUrl: './tasks.html',
  styleUrl: './tasks.css',
})
export class TasksComponent implements OnInit {
  private tasksService = inject(TasksService);
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  public router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  tasks: Task[] = [];
  taskForm: FormGroup;
  showModal = false;
  isEditing = false;
  currentTaskId: number | null = null;
  userRole: string | null = null;

  // Filtering & Sorting
  filteredTasks: Task[] = [];
  filterStatus = 'ALL';
  filterPriority = 'ALL';
  filterCategory = 'ALL';
  categories = ['WORK', 'PERSONAL', 'URGENT'];
  sortField: keyof Task = 'dueDate';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Drag and Drop
  todoTasks: Task[] = [];
  inProgressTasks: Task[] = [];
  doneTasks: Task[] = [];

  // Dark Mode
  isDarkMode = false;

  // Statistics for visualization
  taskStats = {
    total: 0,
    todo: 0,
    inProgress: 0,
    done: 0,
    low: 0,
    medium: 0,
    high: 0
  };
  showStats = false;

  constructor() {
    this.userRole = this.authService.getUserRole();
    this.taskForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      status: ['TODO'],
      priority: ['MEDIUM'],
      category: ['WORK'],
      dueDate: [''],
    });
    
    // Load dark mode preference
    const savedTheme = localStorage.getItem('theme');
    this.isDarkMode = savedTheme === 'dark';
    this.applyTheme();
  }

  ngOnInit() {
    this.loadTasks();
  }

  // Keyboard shortcuts
  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    // Ctrl+N or Cmd+N: New task
    if ((event.ctrlKey || event.metaKey) && event.key === 'n' && !this.showModal) {
      event.preventDefault();
      if (this.userRole !== 'VIEWER') {
        this.openCreateModal();
      }
    }
    // Escape: Close modal
    if (event.key === 'Escape' && this.showModal) {
      this.closeModal();
    }
    // Ctrl+S or Cmd+S: Toggle stats
    if ((event.ctrlKey || event.metaKey) && event.key === 's') {
      event.preventDefault();
      this.toggleStats();
    }
    // Ctrl+D or Cmd+D: Toggle dark mode
    if ((event.ctrlKey || event.metaKey) && event.key === 'd') {
      event.preventDefault();
      this.toggleDarkMode();
    }
  }

  loadTasks() {
    this.tasksService.getTasks().subscribe((tasks) => {
      this.tasks = tasks;
      this.calculateStats();
      this.applyFilters();
      this.cdr.detectChanges(); // Force change detection
    });
  }

  applyFilters() {
    this.filteredTasks = this.tasks.filter(task => {
      const categoryMatch = this.filterCategory === 'ALL' || 
        (task.category && task.category.toUpperCase() === this.filterCategory.toUpperCase()) ||
        (!task.category && this.filterCategory === 'WORK'); // default is WORK
      
      return (this.filterStatus === 'ALL' || task.status === this.filterStatus) &&
        (this.filterPriority === 'ALL' || task.priority === this.filterPriority) &&
        categoryMatch;
    });
    this.sortTasks();
    this.organizeTasks();
  }

  organizeTasks() {
    this.todoTasks = this.filteredTasks.filter(t => t.status === 'TODO');
    this.inProgressTasks = this.filteredTasks.filter(t => t.status === 'IN_PROGRESS');
    this.doneTasks = this.filteredTasks.filter(t => t.status === 'DONE');
  }

  calculateStats() {
    this.taskStats = {
      total: this.tasks.length,
      todo: this.tasks.filter(t => t.status === 'TODO').length,
      inProgress: this.tasks.filter(t => t.status === 'IN_PROGRESS').length,
      done: this.tasks.filter(t => t.status === 'DONE').length,
      low: this.tasks.filter(t => t.priority === 'LOW').length,
      medium: this.tasks.filter(t => t.priority === 'MEDIUM').length,
      high: this.tasks.filter(t => t.priority === 'HIGH').length,
    };
  }

  toggleStats() {
    this.showStats = !this.showStats;
  }

  toggleDarkMode() {
    this.isDarkMode = !this.isDarkMode;
    localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
    this.applyTheme();
  }

  applyTheme() {
    if (this.isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  sortTasks() {
    this.filteredTasks.sort((a, b) => {
      const fieldA = a[this.sortField];
      const fieldB = b[this.sortField];
      if (!fieldA) return 1;
      if (!fieldB) return -1;

      let comparison = 0;
      if (fieldA > fieldB) comparison = 1;
      else if (fieldA < fieldB) comparison = -1;

      return this.sortDirection === 'asc' ? comparison : -comparison;
    });
    this.organizeTasks();
  }

  openCreateModal() {
    this.showModal = true;
    this.isEditing = false;
    this.taskForm.reset({ status: 'TODO', priority: 'MEDIUM' });
  }

  openEditModal(task: Task) {
    this.showModal = true;
    this.isEditing = true;
    this.currentTaskId = task.id;
    this.taskForm.patchValue(task);
  }

  closeModal() {
    this.showModal = false;
  }

  onSubmit() {
    if (this.taskForm.valid) {
      const formValue = { ...this.taskForm.value };
      // Keep date as YYYY-MM-DD string to avoid timezone issues
      // Backend will handle it correctly as a date
      if (this.isEditing && this.currentTaskId) {
        this.tasksService
          .updateTask(this.currentTaskId, formValue)
          .subscribe(() => {
            this.loadTasks();
            this.closeModal();
          });
      } else {
        this.tasksService.createTask(formValue).subscribe(() => {
          this.loadTasks();
          this.closeModal();
        });
      }
    }
  }

  deleteTask(id: number) {
    if (confirm('Are you sure?')) {
      this.tasksService.deleteTask(id).subscribe(() => this.loadTasks());
    }
  }

  logout() {
    this.authService.logout();
    window.location.reload();
  }

  moveToStatus(task: Task, status: string) {
    this.tasksService.updateTask(task.id, { ...task, status }).subscribe(() => {
      this.loadTasks();
    });
  }

  // Drag and drop handler
  drop(event: CdkDragDrop<Task[]>, newStatus: string) {
    if (event.previousContainer === event.container) {
      // Same container: just reorder locally
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      // Different container: get the task being moved
      const task = event.previousContainer.data[event.previousIndex];
      
      // Optimistically update the UI first
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
      
      // Update the task object status
      task.status = newStatus;
      
      // Update backend without reloading (to preserve drop position)
      this.tasksService.updateTask(task.id, { ...task, status: newStatus }).subscribe({
        error: () => {
          // On error, reload to sync with backend
          this.loadTasks();
        }
      });
    }
  }

  getCompletionPercentage(): number {
    return this.taskStats.total === 0 ? 0 : Math.round((this.taskStats.done / this.taskStats.total) * 100);
  }
}
