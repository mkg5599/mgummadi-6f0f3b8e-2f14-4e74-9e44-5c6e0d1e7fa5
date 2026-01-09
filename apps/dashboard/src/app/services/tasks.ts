import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Task } from '@mgummadi-6f0f3b8e-2f14-4e74-9e44-5c6e0d1e7fa5/data';

@Injectable({
  providedIn: 'root',
})
export class TasksService {
  private http = inject(HttpClient);
  private apiUrl = '/api/tasks';



  getTasks() {
    return this.http.get<Task[]>(this.apiUrl);
  }

  createTask(task: Partial<Task>) {
    return this.http.post(this.apiUrl, task);
  }

  updateTask(id: number, task: Partial<Task>) {
    return this.http.patch(`${this.apiUrl}/${id}`, task);
  }

  deleteTask(id: number) {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
