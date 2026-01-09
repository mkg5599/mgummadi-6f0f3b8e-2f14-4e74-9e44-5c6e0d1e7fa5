import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { AuditService } from '../audit/audit.service';

@Controller('auth')
export class AuthController {
    constructor(
        private authService: AuthService,
        private auditService: AuditService
    ) { }

    @Post('login')
    async login(@Body() loginDto: LoginDto) {
        const user = await this.authService.validateUser(loginDto.username, loginDto.password);
        if (!user) {
            await this.auditService.log(null, 'LOGIN_FAILED', `Username: ${loginDto.username}`);
            throw new UnauthorizedException('Invalid credentials');
        }
        return this.authService.login(user);
    }
}
