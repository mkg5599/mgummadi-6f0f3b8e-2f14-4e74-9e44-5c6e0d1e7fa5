import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';

import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  const mockUser = {
    id: 1,
    username: 'testuser',
    password: 'hashedpassword',
    role: 'ADMIN',
    organization: { id: 1, name: 'Test Org' },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findOneByUsername: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user without password when credentials are valid', async () => {
      const plainPassword = 'testpassword';
      const hashedPassword = await bcrypt.hash(plainPassword, 10);
      const userWithHashedPassword = { ...mockUser, password: hashedPassword };

      jest.spyOn(usersService, 'findOneByUsername').mockResolvedValue(userWithHashedPassword as any);

      const result = await service.validateUser('testuser', plainPassword);

      expect(result).toBeDefined();
      expect(result.username).toBe('testuser');
      expect(result.password).toBeUndefined();
      expect(result.role).toBe('ADMIN');
    });

    it('should return null when user is not found', async () => {
      jest.spyOn(usersService, 'findOneByUsername').mockResolvedValue(null);

      const result = await service.validateUser('nonexistent', 'password');

      expect(result).toBeNull();
    });

    it('should return null when password is incorrect', async () => {
      const hashedPassword = await bcrypt.hash('correctpassword', 10);
      const userWithHashedPassword = { ...mockUser, password: hashedPassword };

      jest.spyOn(usersService, 'findOneByUsername').mockResolvedValue(userWithHashedPassword as any);

      const result = await service.validateUser('testuser', 'wrongpassword');

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return an access token', async () => {
      const mockToken = 'mock.jwt.token';
      jest.spyOn(jwtService, 'sign').mockReturnValue(mockToken);

      const user = { id: 1, username: 'testuser', role: 'ADMIN' };
      const result = await service.login(user);

      expect(result).toEqual({ access_token: mockToken });
      expect(jwtService.sign).toHaveBeenCalledWith({
        username: 'testuser',
        sub: 1,
        role: 'ADMIN',
      });
    });

    it('should create JWT with correct payload structure', async () => {
      const mockToken = 'mock.jwt.token';
      jest.spyOn(jwtService, 'sign').mockReturnValue(mockToken);

      const user = { id: 5, username: 'owner', role: 'OWNER' };
      await service.login(user);

      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          username: 'owner',
          sub: 5,
          role: 'OWNER',
        })
      );
    });
  });
});
