# Secure Task Management System

A full-stack task management application with Role-Based Access Control (RBAC), built using **NestJS** (backend) and **Angular** (frontend) in an **Nx Monorepo**.

## Setup Instructions

1.  **Install Dependencies**
    ```sh
    npm install
    ```

2.  **Environment Setup**
    - Copy `.env.example` to `.env` and configure as needed:
      ```sh
      cp .env.example .env
      ```
    - The application uses `sqlite` by default.
    - For production, update JWT secrets and database credentials in `.env`.

3.  **Run the Backend (API)**
    ```sh
    npx nx serve api
    ```
    - API runs at `http://localhost:3000/api`

4.  **Run the Frontend (Dashboard)**
    ```sh
    npx nx serve dashboard
    ```
    - App runs at `http://localhost:4200`

## Architecture Overview

This project is structured as an **Nx Monorepo**:

-   **`apps/api`**: NestJS backend application. Handles authentication, RBAC, and data persistence.
-   **`apps/dashboard`**: Angular frontend application. Provides the user interface for task management.
-   **`libs/data`**: Shared library containing TypeScript interfaces, DTOs, and Enums (e.g., `UserRole`) used by both frontend and backend.
-   **`libs/auth`**: Shared library for reusable authentication guards (`RolesGuard`, `JwtAuthGuard`) and decorators.

## Data Model

### Entity Relationship Diagram

```
┌─────────────────────┐
│   Organization      │
│─────────────────────│
│ id (PK)             │
│ name                │
│ parentId (FK) ◄─────┼─┐ Self-referencing
└─────────────────────┘ │  (2-level hierarchy)
         △              │
         │              │
         │ 1:N          │
         │              └──────────────────┐
         │                                 │
┌─────────────────────┐         ┌─────────────────────┐
│       User          │         │    Permission       │
│─────────────────────│         │─────────────────────│
│ id (PK)             │         │ id (PK)             │
│ username (unique)   │◄────────┤ userId (FK)         │
│ password (hashed)   │  N:M    │ action (enum)       │
│ role (enum)         │         │ resource (enum)     │
│ organizationId (FK) │         │ description         │
└─────────────────────┘         └─────────────────────┘
         △
         │
         │ 1:N
         │
┌─────────────────────┐
│       Task          │
│─────────────────────│
│ id (PK)             │
│ title               │
│ description         │
│ status (enum)       │
│ priority (enum)     │
│ category            │
│ dueDate             │
│ ownerId (FK)        │──────► References User.id
│ createdAt           │         (for org scoping)
│ updatedAt           │
└─────────────────────┘

┌─────────────────────┐
│    AuditLog         │
│─────────────────────│
│ id (PK)             │
│ userId (FK)         │──────► References User.id (nullable)
│ action              │         (null for failed logins)
│ resource            │
│ timestamp           │
└─────────────────────┘
```

### Relationships

- **Organization ↔ Organization**: Self-referencing (parent/child) for 2-level hierarchy
- **User → Organization**: Many-to-One (users belong to one organization)
- **User ↔ Permission**: Many-to-Many (users can have multiple permissions)
- **Task → User**: Many-to-One (each task has an owner for org scoping)
- **AuditLog → User**: Many-to-One (nullable, tracks who performed action)

### Entities

-   **User**: Represents a system user.
    -   `id`: Primary Key
    -   `username`: Unique identifier
    -   `password`: Hashed password (bcrypt)
    -   `role`: Enum (`OWNER`, `ADMIN`, `VIEWER`)
    -   `organization`: Link to Organization
-   **Organization**: Hierarchical grouping for users (2-level hierarchy).
    -   `id`: Primary Key
    -   `name`: Organization name
    -   `parent`: Reference to parent organization (nullable)
    -   `children`: List of child organizations
    -   `users`: List of users in org
-   **Task**: A unit of work.
    -   `id`: Primary Key
    -   `title`: Task title
    -   `description`: Task details
    -   `status`: Enum (`TODO`, `IN_PROGRESS`, `DONE`)
    -   `priority`: Enum (`LOW`, `MEDIUM`, `HIGH`)
    -   `category`: String (`WORK`, `PERSONAL`, `URGENT`)
    -   `dueDate`: Optional date
    -   `owner`: User who created the task (Used for organization scoping)
-   **AuditLog**: System audit trail for security and compliance.
    -   `id`: Primary Key
    -   `userId`: Reference to User (nullable for failed login attempts)
    -   `action`: Action performed (e.g., `LOGIN_SUCCESS`, `CREATE_TASK`, `VIEW_AUDIT_LOGS`)
    -   `resource`: Resource affected (e.g., `User: admin`, `Task ID: 123`)
    -   `timestamp`: When the action occurred (auto-generated)
    -   `user`: Many-to-one relation to User entity for displaying username
-   **Permission**: Granular access control.
    -   `id`: Primary Key
    -   `action`: Enum (`CREATE`, `READ`, `UPDATE`, `DELETE`)
    -   `resource`: Enum (`TASK`, `USER`, `ORGANIZATION`, `AUDIT_LOG`)
    -   `description`: Optional description
    -   Many-to-many relationship with Users for fine-grained permissions

## Access Control Implementation

RBAC is implemented using NestJS Guards and Decorators.

-   **Roles**:
    -   **OWNER**: Full access to all tasks across the system.
    -   **ADMIN**: Can Create/Edit/Delete tasks within their organization. (Inherited permissions logic can be extended).
    -   **VIEWER**: Read-only access to tasks within their organization.

-   **Permissions**:
    -   Fine-grained permission system with `Permission` entity
    -   Users can have specific action-resource permissions (e.g., CREATE_TASK, READ_AUDIT_LOG)
    -   Complements role-based access control for advanced scenarios

-   **Scoping**:
    -   `TasksService.findAll` filters tasks based on the authenticated user's organization. Owners see all.

-   **Authentication**:
    -   **JWT** is used for stateless authentication with configurable secret from environment variables
    -   `Login` endpoint issues a token.
    -   `JwtAuthGuard` validates the token on protected routes.
    -   `RolesGuard` checks the user's role against `@Roles(...)` decorator on endpoints.
    -   JWT secret and expiration are configurable via `JWT_SECRET` and `JWT_EXPIRATION` environment variables

## API Documentation

### Auth
-   `POST /api/auth/login`
    -   Body: `{ "username": "admin", "password": "password" }`
    -   Response: `{ "access_token": "..." }`

### Tasks
-   `GET /api/tasks`
    -   Headers: `Authorization: Bearer <token>`
    -   Response: List of tasks (scoped to user's org).
-   `POST /api/tasks`
    -   Headers: `Authorization: Bearer <token>`
    -   Body: `{ "title": "New Task", "description": "...", "status": "TODO", "priority": "MEDIUM" }`
    -   Restriction: `OWNER`, `ADMIN`
    -   Audit: Logs `CREATE_TASK` action
-   `PATCH /api/tasks/:id`
    -   Headers: `Authorization: Bearer <token>`
    -   Body: `{ "title": "Updated Task", ... }`
    -   Restriction: `OWNER`, `ADMIN` (and ownership check)
    -   Audit: Logs `UPDATE_TASK` action
-   `DELETE /api/tasks/:id`
    -   Headers: `Authorization: Bearer <token>`
    -   Restriction: `OWNER`, `ADMIN` (and ownership check)
    -   Audit: Logs `DELETE_TASK` action

### Audit Logs
-   **Comprehensive audit logging** for security and compliance:
  - Authentication events: `LOGIN_SUCCESS`, `LOGIN_FAILED`
  - Task operations: `CREATE_TASK`, `UPDATE_TASK`, `DELETE_TASK`
  - System access: `VIEW_AUDIT_LOGS`
  - Tracks user, action, resource, and timestamp
    -   Headers: `Authorization: Bearer <token>`
    -   Response: List of audit log entries with user information
    -   Restriction: `OWNER`, `ADMIN` only
    -   Audit: Logs `VIEW_AUDIT_LOGS` action
    -   Returns last 100 entries ordered by timestamp (most recent first)

## Features

### Backend
- ✅ JWT-based authentication with bcrypt password hashing
- ✅ Role-Based Access Control (RBAC) with three roles: OWNER, ADMIN, VIEWER
- ✅ Organization hierarchy with 2-level support
- ✅ Task management with status tracking (TODO, IN_PROGRESS, DONE)
- ✅ Audit logging for security and compliance
- ✅ TypeORM with SQLite (easily switchable to PostgreSQL)
- ✅ Swagger API documentation at `/api/docs`
- ✅ Jest unit tests for services and controllers

### Frontend
- ✅ Angular standalone components with TailwindCSS
- ✅ JWT token management with HTTP interceptors
- ✅ **Audit Logs Interface** (OWNER/ADMIN only):
  - View all system activity and security events
  - Shows user who performed action, timestamp, and resource
  - Loading states and error handling
- ✅ **Drag-and-drop task management** between status columns (Angular CDK)
- ✅ Task filtering by category, priority, and status
- ✅ Task sorting by due date and priority
- ✅ **Task completion visualization** with progress bars and priority distribution charts
- ✅ **Dark/Light mode toggle** with localStorage persistence
- ✅ **Keyboard shortcuts** for common actions:
  - `Ctrl + N`: Create new task
  - `Ctrl + S`: Toggle statistics view
  - `Ctrl + D`: Toggle dark mode
  - `Esc`: Close modal
- ✅ Responsive design (mobile → desktop)
- ✅ Real-time task statistics dashboard
- ✅ Kanban board with task counts per column

## Future Considerations

### Security Enhancements
1. **JWT Refresh Tokens**
   - Implement short-lived access tokens (15 minutes) with longer-lived refresh tokens
   - Add token rotation and revocation mechanisms
   - Store refresh tokens securely (HttpOnly cookies or secure database)

2. **CSRF Protection**
   - Implement CSRF tokens for state-changing operations
   - Use SameSite cookie attributes
   - Add Double Submit Cookie pattern

3. **Rate Limiting**
   - Add rate limiting middleware to prevent brute force attacks
   - Implement IP-based and user-based rate limits
   - Use Redis for distributed rate limiting in production

4. **API Key Management**
   - Support for API keys for programmatic access
   - Key rotation and expiration policies

### Access Control Improvements
1. **Advanced Role Delegation**
   - Fine-grained permissions beyond three roles
   - Custom permission sets per user
   - Role templates and inheritance chains
   - Temporary permission elevation

2. **RBAC Caching**
   - Cache permission checks in Redis for better performance
   - Implement cache invalidation on role/permission changes
   - Add permission preloading for frequently accessed resources

3. **Multi-tenancy Support**
   - Full tenant isolation with separate databases or schemas
   - Tenant-specific configuration and branding
   - Cross-tenant task sharing with explicit permissions

### Performance & Scalability
1. **Database Optimization**
   - Add database indexes for frequently queried fields
   - Implement query result caching
   - Use database connection pooling
   - Consider read replicas for heavy read operations

2. **Efficient Permission Checks**
   - Batch permission checks for bulk operations
   - Move complex permission logic to database queries
   - Implement permission materialized views

3. **Horizontal Scaling**
   - Containerize application with Docker
   - Implement stateless authentication (already JWT-based)
   - Use load balancers for API servers
   - Deploy to Kubernetes for auto-scaling

### Feature Enhancements
1. **Task Collaboration**
   - Task assignments to multiple users
   - Task comments and activity feed
   - @mentions and notifications
   - Task templates and recurring tasks

2. **Advanced Analytics**
   - Burndown charts and velocity tracking
   - Team performance metrics
   - Custom dashboards and reports
   - Export to CSV/Excel

3. **Real-time Updates**
   - WebSocket integration for live task updates
   - Presence indicators (who's viewing what)
   - Collaborative editing with conflict resolution

4. **Integration Capabilities**
   - Webhook support for external systems
   - OAuth2 integration for SSO
   - Third-party integrations (Slack, Teams, Email)
   - REST API versioning strategy

### Testing & Quality
1. **Enhanced Test Coverage**
   - E2E tests with Cypress for critical user flows
   - Integration tests for API endpoints
   - Performance testing and load testing
   - Security penetration testing

2. **Monitoring & Observability**
   - Application Performance Monitoring (APM)
   - Error tracking and alerting
   - Structured logging with log aggregation
   - Distributed tracing for microservices

## Testing

### Backend Tests
```sh
npx nx test api
```

### Frontend Tests
```sh
npx nx test dashboard
```

### E2E Tests
```sh
npx nx e2e dashboard-e2e
```

## Development Notes

- The application uses NX for monorepo management
- Shared code is located in `libs/` directory
- All API routes are prefixed with `/api`
- JWT tokens are valid for 24 hours by default (configurable in `.env`)
- SQLite database file is created automatically at `./database.sqlite`
- Swagger API documentation: `http://localhost:3000/api/docs`
