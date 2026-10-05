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
import { RescueTeam, RescueTeamDocument } from '../uc3-rescue/rescue-teams/schemas/rescue-team.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(RescueTeam.name)
    private readonly rescueTeamModel: Model<RescueTeamDocument>,
    private readonly jwtService: JwtService,
  ) {}

  private async generateTeamId(): Promise<string> {
    const count = await this.rescueTeamModel.countDocuments();
    return `TEAM-${(count + 1).toString().padStart(3, '0')}`;
  }

  async register(dto: RegisterDto) {
    const existing = await this.userModel.findOne({ email: dto.email.toLowerCase() }).exec();
    if (existing) {
      throw new ConflictException(`User with email "${dto.email}" already exists`);
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const role = dto.role || 'CITIZEN';

    let generatedTeamId = dto.badgeId;

    // If registering as a RESCUE_TEAM, automatically create the full RescueTeam record
    if (role === 'RESCUE_TEAM') {
      generatedTeamId = await this.generateTeamId();

      const newRescueTeam = new this.rescueTeamModel({
        teamId: generatedTeamId,
        name: dto.name,
        organization: dto.organization || 'Sri Lanka Navy',
        type: dto.teamType || 'WATER_RESCUE',
        members: dto.membersCount || 10,
        district: dto.district || 'Kandy',
        location: {
          type: 'Point',
          coordinates: [dto.longitude || 80.6337, dto.latitude || 7.2906],
        },
        status: 'AVAILABLE',
      });

      await newRescueTeam.save();
    }

    const newUser = new this.userModel({
      name: dto.name,
      email: dto.email.toLowerCase(),
      password: hashedPassword,
      role,
      district: dto.district || 'Kandy',
      phone: dto.phone || '',
      badgeId: dto.badgeId || '',
      teamId: generatedTeamId,
      organization: dto.organization,
      teamType: dto.teamType,
      membersCount: dto.membersCount,
    });

    const savedUser = await newUser.save();

    const payload = {
      sub: savedUser._id,
      email: savedUser.email,
      name: savedUser.name,
      role: savedUser.role,
      district: savedUser.district,
      teamId: savedUser.teamId,
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
        teamId: savedUser.teamId,
        organization: savedUser.organization,
        teamType: savedUser.teamType,
        membersCount: savedUser.membersCount,
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
      teamId: user.teamId,
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
        teamId: user.teamId,
        organization: user.organization,
        teamType: user.teamType,
        membersCount: user.membersCount,
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
        name: 'Sri Lanka Navy Water Rescue Team 1',
        email: 'rescueteam@disaster.lk',
        password: passwordHash,
        role: 'RESCUE_TEAM',
        district: 'Kandy',
        phone: '0812345678',
        teamId: 'TEAM-001',
        organization: 'Sri Lanka Navy',
        teamType: 'WATER_RESCUE',
        membersCount: 12,
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

    // Also seed initial RescueTeam record for the sample rescue team
    const sampleTeam = new this.rescueTeamModel({
      teamId: 'TEAM-001',
      name: 'Sri Lanka Navy Water Rescue Team 1',
      organization: 'Sri Lanka Navy',
      type: 'WATER_RESCUE',
      members: 12,
      district: 'Kandy',
      location: { type: 'Point', coordinates: [80.6337, 7.2906] },
      status: 'AVAILABLE',
    });
    await sampleTeam.save();

    await this.userModel.insertMany(defaultUsers);
    return {
      message: 'Default system users seeded successfully! All users have password: "password123"',
      users: defaultUsers.map(u => ({ email: u.email, role: u.role, name: u.name })),
    };
  }
}
