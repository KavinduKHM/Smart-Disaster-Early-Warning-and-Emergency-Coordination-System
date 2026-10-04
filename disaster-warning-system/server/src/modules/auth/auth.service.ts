import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from './schemas/user.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.userModel.findOne({ email: dto.email.toLowerCase() }).exec();
    if (existing) {
      throw new ConflictException(`User with email "${dto.email}" already exists`);
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const newUser = new this.userModel({
      name: dto.name,
      email: dto.email.toLowerCase(),
      password: hashedPassword,
      role: dto.role || 'CITIZEN',
      district: dto.district || 'Kandy',
      phone: dto.phone || '',
      badgeId: dto.badgeId || '',
    });

    const savedUser = await newUser.save();

    const payload = {
      sub: savedUser._id,
      email: savedUser.email,
      name: savedUser.name,
      role: savedUser.role,
      district: savedUser.district,
    };

    const token = this.jwtService.sign(payload);

    return {
      accessToken: token,
      user: {
        id: savedUser._id,
        name: savedUser.name,
        email: savedUser.email,
        role: savedUser.role,
        district: savedUser.district,
        phone: savedUser.phone,
        badgeId: savedUser.badgeId,
      },
    };
  }

  async login(dto: LoginDto) {
    const user = await this.userModel.findOne({ email: dto.email.toLowerCase() }).exec();
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload = {
      sub: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      district: user.district,
    };

    const token = this.jwtService.sign(payload);

    return {
      accessToken: token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        district: user.district,
        phone: user.phone,
        badgeId: user.badgeId,
      },
    };
  }

  async getProfile(userId: string) {
    const user = await this.userModel.findById(userId).select('-password').exec();
    if (!user) {
      throw new NotFoundException('User profile not found');
    }
    return user;
  }

  async seedUsers() {
    const count = await this.userModel.countDocuments();
    if (count > 0) {
      return { message: 'Users already exist. Skipping seed.', seededCount: count };
    }

    const passwordHash = await bcrypt.hash('password123', 10);

    const defaultUsers = [
      {
        name: 'Amara Perera',
        email: 'citizen@disaster.lk',
        password: passwordHash,
        role: 'CITIZEN',
        district: 'Kandy',
        phone: '0771234567',
      },
      {
        name: 'Kamal Silva',
        email: 'volunteer@disaster.lk',
        password: passwordHash,
        role: 'VOLUNTEER',
        district: 'Badulla',
        phone: '0719876543',
      },
      {
        name: 'Duty Officer Ruwan',
        email: 'officer@dmc.gov.lk',
        password: passwordHash,
        role: 'DUTY_OFFICER',
        district: 'Colombo',
        phone: '0112345678',
        badgeId: 'DMC-OFF-101',
      },
      {
        name: 'DMC Director Jayasinghe',
        email: 'dmc@disaster.gov.lk',
        password: passwordHash,
        role: 'DMC_OFFICER',
        district: 'Colombo',
        phone: '0119998877',
        badgeId: 'DMC-DIR-001',
      },
      {
        name: 'District Officer Nimal',
        email: 'district@kandy.gov.lk',
        password: passwordHash,
        role: 'DISTRICT_OFFICER',
        district: 'Kandy',
        phone: '0812233445',
        badgeId: 'DIST-KANDY-01',
      },
    ];

    await this.userModel.insertMany(defaultUsers);
    return {
      message: 'Default system users seeded successfully! All users have password: "password123"',
      users: defaultUsers.map(u => ({ email: u.email, role: u.role, name: u.name })),
    };
  }
}
