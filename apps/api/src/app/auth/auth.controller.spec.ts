import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    validateUser: jest.fn(),
    login: jest.fn(),
    register: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should return access token when credentials are valid', async () => {
      const loginDto = { username: 'testuser', password: 'password123' };
      const mockUser = { id: 1, username: 'testuser', role: 'ADMIN' };
      const mockToken = { access_token: 'mock.jwt.token' };

      mockAuthService.validateUser.mockResolvedValue(mockUser);
      mockAuthService.login.mockResolvedValue(mockToken);

      const result = await controller.login(loginDto);

      expect(result).toEqual(mockToken);
      expect(authService.validateUser).toHaveBeenCalledWith('testuser', 'password123');
      expect(authService.login).toHaveBeenCalledWith(mockUser);
    });

    it('should throw UnauthorizedException when credentials are invalid', async () => {
      const loginDto = { username: 'testuser', password: 'wrongpassword' };

      mockAuthService.validateUser.mockResolvedValue(null);

      await expect(controller.login(loginDto)).rejects.toThrow(UnauthorizedException);
      await expect(controller.login(loginDto)).rejects.toThrow('Invalid credentials');
    });

    it('should throw UnauthorizedException when user does not exist', async () => {
      const loginDto = { username: 'nonexistent', password: 'password123' };

      mockAuthService.validateUser.mockResolvedValue(null);

      await expect(controller.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should handle different user roles', async () => {
      const roles = ['OWNER', 'ADMIN', 'VIEWER'];

      for (const role of roles) {
        const loginDto = { username: 'user', password: 'pass' };
        const mockUser = { id: 1, username: 'user', role };
        const mockToken = { access_token: 'token' };

        mockAuthService.validateUser.mockResolvedValue(mockUser);
        mockAuthService.login.mockResolvedValue(mockToken);

        const result = await controller.login(loginDto);

        expect(result).toEqual(mockToken);
        expect(authService.login).toHaveBeenCalledWith(mockUser);
      }
    });
  });
});
