import { Test, TestingModule } from '@nestjs/testing';
import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { UserRole } from '@mgummadi-6f0f3b8e-2f14-4e74-9e44-5c6e0d1e7fa5/data';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true when no roles are required', () => {
      const mockContext = createMockExecutionContext({ id: 1, role: UserRole.VIEWER });
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

      const result = guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should return true when user has required role', () => {
      const mockContext = createMockExecutionContext({ id: 1, role: UserRole.ADMIN });
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN, UserRole.OWNER]);

      const result = guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should return false when user does not have required role', () => {
      const mockContext = createMockExecutionContext({ id: 1, role: UserRole.VIEWER });
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN, UserRole.OWNER]);

      const result = guard.canActivate(mockContext);

      expect(result).toBe(false);
    });

    it('should return true for OWNER accessing OWNER-only endpoint', () => {
      const mockContext = createMockExecutionContext({ id: 1, role: UserRole.OWNER });
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.OWNER]);

      const result = guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should return false for VIEWER accessing ADMIN endpoint', () => {
      const mockContext = createMockExecutionContext({ id: 1, role: UserRole.VIEWER });
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);

      const result = guard.canActivate(mockContext);

      expect(result).toBe(false);
    });

    it('should handle multiple required roles', () => {
      const adminContext = createMockExecutionContext({ id: 1, role: UserRole.ADMIN });
      const ownerContext = createMockExecutionContext({ id: 2, role: UserRole.OWNER });
      const viewerContext = createMockExecutionContext({ id: 3, role: UserRole.VIEWER });

      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN, UserRole.OWNER]);

      expect(guard.canActivate(adminContext)).toBe(true);
      expect(guard.canActivate(ownerContext)).toBe(true);
      expect(guard.canActivate(viewerContext)).toBe(false);
    });
  });
});

function createMockExecutionContext(user: any): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as ExecutionContext;
}
