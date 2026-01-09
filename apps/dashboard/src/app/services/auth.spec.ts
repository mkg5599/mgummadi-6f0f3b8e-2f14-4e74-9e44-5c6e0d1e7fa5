import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('login', () => {
    it('should send login request and store token', (done) => {
      const credentials = { username: 'testuser', password: 'password123' };
      const mockResponse = { access_token: 'mock.jwt.token' };

      service.login(credentials).subscribe((response) => {
        expect(response).toEqual(mockResponse);
        expect(localStorage.getItem('access_token')).toBe('mock.jwt.token');
        done();
      });

      const req = httpMock.expectOne('/api/auth/login');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(credentials);
      req.flush(mockResponse);
    });

    it('should decode and set user from token', (done) => {
      const mockToken = btoa(JSON.stringify({ sub: 1, username: 'testuser', role: 'ADMIN' }));
      const mockResponse = { access_token: `header.${mockToken}.signature` };

      service.login({ username: 'testuser', password: 'pass' }).subscribe(() => {
        service.user$.subscribe((user) => {
          if (user) {
            expect(user.username).toBe('testuser');
            expect(user.role).toBe('ADMIN');
            done();
          }
        });
      });

      const req = httpMock.expectOne('/api/auth/login');
      req.flush(mockResponse);
    });
  });

  describe('logout', () => {
    it('should remove token from localStorage and clear user', () => {
      localStorage.setItem('access_token', 'some.token');

      service.logout();

      expect(localStorage.getItem('access_token')).toBeNull();
      service.user$.subscribe((user) => {
        expect(user).toBeNull();
      });
    });
  });

  describe('getToken', () => {
    it('should return token from localStorage', () => {
      localStorage.setItem('access_token', 'test.token');

      const token = service.getToken();

      expect(token).toBe('test.token');
    });

    it('should return null when no token exists', () => {
      const token = service.getToken();

      expect(token).toBeNull();
    });
  });

  describe('getUserRole', () => {
    it('should return user role when user is set', (done) => {
      const mockToken = btoa(JSON.stringify({ sub: 1, username: 'admin', role: 'OWNER' }));
      const mockResponse = { access_token: `header.${mockToken}.signature` };

      service.login({ username: 'admin', password: 'pass' }).subscribe(() => {
        const role = service.getUserRole();
        expect(role).toBe('OWNER');
        done();
      });

      const req = httpMock.expectOne('/api/auth/login');
      req.flush(mockResponse);
    });

    it('should return null when no user is set', () => {
      const role = service.getUserRole();
      expect(role).toBeNull();
    });
  });

  describe('token decoding', () => {
    it('should properly decode valid JWT token', (done) => {
      const payload = { sub: 1, username: 'testuser', role: 'ADMIN' };
      const mockToken = btoa(JSON.stringify(payload));
      const mockResponse = { access_token: `header.${mockToken}.signature` };

      service.login({ username: 'testuser', password: 'pass' }).subscribe(() => {
        service.user$.subscribe((user) => {
          if (user) {
            expect(user.sub).toBe(1);
            expect(user.username).toBe('testuser');
            expect(user.role).toBe('ADMIN');
            done();
          }
        });
      });

      const req = httpMock.expectOne('/api/auth/login');
      req.flush(mockResponse);
    });
  });
});
