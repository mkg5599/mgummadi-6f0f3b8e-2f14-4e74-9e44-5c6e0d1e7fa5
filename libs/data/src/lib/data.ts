export enum UserRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  VIEWER = 'VIEWER',
}

export interface Organization {
  id: number;
  name: string;
}

export interface User {
  id: number;
  username: string;
  role: UserRole;
  organization?: Organization;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  dueDate?: string;
  owner?: User;
}
