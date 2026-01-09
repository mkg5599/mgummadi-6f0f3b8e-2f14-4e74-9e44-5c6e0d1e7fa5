import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UserRole } from '@mgummadi-6f0f3b8e-2f14-4e74-9e44-5c6e0d1e7fa5/data';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

import { Organization } from './entities/organization.entity';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Organization)
    private orgRepository: Repository<Organization>
  ) { }

  async onModuleInit() {
    if (await this.usersRepository.count() === 0) {
      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash('password', salt);

      // Create Default Org
      const org = await this.orgRepository.save(this.orgRepository.create({ name: 'Default Org' }));

      await this.usersRepository.save(this.usersRepository.create({ username: 'owner', password: hashedPassword, role: UserRole.OWNER, organization: org }));
      await this.usersRepository.save(this.usersRepository.create({ username: 'admin', password: hashedPassword, role: UserRole.ADMIN, organization: org }));
      await this.usersRepository.save(this.usersRepository.create({ username: 'viewer', password: hashedPassword, role: UserRole.VIEWER, organization: org }));
    }
  }

  async create(createUserDto: CreateUserDto) {
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(createUserDto.password, salt);

    let organization = null;
    if (createUserDto.organizationId) {
      organization = await this.orgRepository.findOneBy({ id: createUserDto.organizationId });
    }

    const user = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
      organization: organization || undefined, // undefined to avoid null if not found/provided? or null is ok?
    });
    return this.usersRepository.save(user);
  }

  findAll() {
    return this.usersRepository.find();
  }

  findOne(id: number) {
    return this.usersRepository.findOneBy({ id });
  }

  findOneByUsername(username: string) {
    return this.usersRepository.findOneBy({ username });
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return this.usersRepository.update(id, updateUserDto);
  }

  remove(id: number) {
    return this.usersRepository.delete(id);
  }
}
