import { IsEnum, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { UserRole } from '@mgummadi-6f0f3b8e-2f14-4e74-9e44-5c6e0d1e7fa5/data';

export class CreateUserDto {
    @IsString()
    @IsNotEmpty()
    username!: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    password!: string;

    @IsEnum(UserRole)
    role!: UserRole;

    @IsString()
    organizationId?: number;
}
