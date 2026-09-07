import { Injectable } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  async login(dto: LoginDto) {
    return { token: 'mock-jwt-token', user: dto.username };
  }

  async register(dto: RegisterDto) {
    return { status: 'created', username: dto.username };
  }
}
