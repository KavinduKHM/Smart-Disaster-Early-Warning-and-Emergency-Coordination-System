import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from './schemas/user.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserRole } from './enums/user-role.enum';

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly jwtService: JwtService,
  ) {}

  async onModuleInit() {
    try {
      await this.seedUsers();
    } catch (err) {
      console.error('Error during auto-seeding users on module init:', err);
    }
  }

  async register(dto: RegisterDto) {
    const existing = await this.userModel.findOne({ email: dto.email.toLowerCase() }).exec();
    if (existing) {
      throw new ConflictException(`User with email "${dto.email}" already exists`);
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const role = dto.role || UserRole.CITIZEN;

    const newUser = new this.userModel({
      name: dto.name,
      email: dto.email.toLowerCase(),
      password: hashedPassword,
      role,
      district: dto.district || 'Colombo',
      riverBasin: dto.riverBasin || '',
      phone: dto.phone || '',
      pushToken: dto.pushToken || '',
      badgeId: dto.badgeId || '',
    });

    const savedUser = await newUser.save();

    const payload = {
      sub: savedUser._id,
      email: savedUser.email,
      name: savedUser.name,
      role: savedUser.role,
      district: savedUser.district,
      riverBasin: savedUser.riverBasin,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      message: 'Registration successful',
      accessToken,
      user: {
        id: savedUser._id,
        name: savedUser.name,
        email: savedUser.email,
        role: savedUser.role,
        district: savedUser.district,
        riverBasin: savedUser.riverBasin,
        phone: savedUser.phone,
        pushToken: savedUser.pushToken,
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
      riverBasin: user.riverBasin,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      message: 'Login successful',
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        district: user.district,
        riverBasin: user.riverBasin,
        phone: user.phone,
        pushToken: user.pushToken,
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
    const passwordHash = await bcrypt.hash('password123', 10);
    const officerHash = await bcrypt.hash('Password123!', 10);

    const defaultUsers = [
      {
        name: 'DMC Officer Kamal',
        email: 'dmc.officer@disaster.lk',
        password: officerHash,
        role: UserRole.DMC_OFFICER,
        district: 'Colombo',
        riverBasin: 'Kelani River Basin',
        phone: '0112345678',
        badgeId: 'DMC-OFF-2026',
      },
      {
        name: 'DMC Officer Perera',
        email: 'dmc@disaster.lk',
        password: passwordHash,
        role: UserRole.DMC_OFFICER,
        district: 'Colombo',
        riverBasin: 'Kelani River Basin',
        phone: '0119998877',
        badgeId: 'DMC-OFF-001',
      },
      {
        name: 'System Admin',
        email: 'admin@disaster.lk',
        password: passwordHash,
        role: UserRole.ADMIN,
        district: 'Colombo',
        phone: '0110000000',
        badgeId: 'ADMIN-001',
      },
      {
        name: 'Citizen Amara',
        email: 'citizen@disaster.lk',
        password: passwordHash,
        role: UserRole.CITIZEN,
        district: 'Kandy',
        riverBasin: 'Mahaweli River Basin',
        phone: '0771234567',
        pushToken: 'push_token_citizen_1',
      },
      {
        name: 'Citizen Sunil',
        email: 'citizen.user@disaster.lk',
        password: officerHash,
        role: UserRole.CITIZEN,
        district: 'Colombo',
        riverBasin: 'Kelani River Basin',
        phone: '0779998877',
        pushToken: 'push_token_citizen_2',
      },
      {
        name: 'Volunteer Nimal',
        email: 'volunteer@disaster.lk',
        password: passwordHash,
        role: UserRole.VOLUNTEER,
        district: 'Galle',
        riverBasin: 'Gin River Basin',
        phone: '0719876543',
        pushToken: 'push_token_volunteer_1',
      },
    ];

    for (const u of defaultUsers) {
      await this.userModel.findOneAndUpdate(
        { email: u.email },
        { $setOnInsert: u },
        { upsert: true, new: true }
      );
    }

    console.log('=======================================================');
    console.log('✅ DMC OFFICER ACCOUNTS VERIFIED / SEEDED IN DATABASE');
    console.log('1. dmc.officer@disaster.lk  | Password: Password123!');
    console.log('2. dmc@disaster.lk          | Password: password123');
    console.log('=======================================================');

    return {
      message: 'Default system users verified/seeded successfully!',
      users: defaultUsers.map((u) => ({ email: u.email, role: u.role, name: u.name })),
    };
  }
}
