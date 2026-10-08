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
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UserRole } from './enums/user-role.enum';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(RescueTeam.name) private readonly rescueTeamModel: Model<RescueTeamDocument>,
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
    const role = dto.role || UserRole.CITIZEN;

    let generatedTeamId = dto.badgeId;

    if (role === UserRole.RESCUE_TEAM || role === ('RESCUE_TEAM' as any)) {
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
      district: dto.district || 'Colombo',
      riverBasin: dto.riverBasin || '',
      phone: dto.phone || '',
      pushToken: dto.pushToken || '',
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
      riverBasin: savedUser.riverBasin,
      teamId: savedUser.teamId,
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
      riverBasin: user.riverBasin,
      teamId: user.teamId,
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

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    if (dto.name !== undefined) user.name = dto.name;
    if (dto.phone !== undefined) user.phone = dto.phone;
    if (dto.district !== undefined) user.district = dto.district;
    if (dto.address !== undefined) user.address = dto.address;
    if (dto.latitude !== undefined) user.latitude = dto.latitude;
    if (dto.longitude !== undefined) user.longitude = dto.longitude;
    if (dto.organization !== undefined) user.organization = dto.organization;
    if (dto.teamType !== undefined) user.teamType = dto.teamType;
    if (dto.membersCount !== undefined) user.membersCount = dto.membersCount;

    const savedUser = await user.save();

    if (user.role === 'RESCUE_TEAM' && user.teamId) {
      await this.rescueTeamModel.updateOne(
        { teamId: user.teamId },
        {
          $set: {
            name: savedUser.name,
            district: savedUser.district,
            organization: savedUser.organization,
            type: savedUser.teamType,
            members: savedUser.membersCount,
            location: {
              type: 'Point',
              coordinates: [savedUser.longitude || 80.6337, savedUser.latitude || 7.2906],
            },
          },
        },
      ).exec();
    }

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
        address: savedUser.address,
        latitude: savedUser.latitude,
        longitude: savedUser.longitude,
        badgeId: savedUser.badgeId,
        teamId: savedUser.teamId,
        organization: savedUser.organization,
        teamType: savedUser.teamType,
        membersCount: savedUser.membersCount,
      },
    };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    const isMatch = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    user.password = await bcrypt.hash(dto.newPassword, 10);
    await user.save();

    return { message: 'Password updated successfully' };
  }

  async findAllUsers() {
    return await this.userModel.find().select('-password').sort({ createdAt: -1 }).exec();
  }

  async seedUsers() {
    const count = await this.userModel.countDocuments();
    if (count > 0) {
      return { message: 'Users already exist. Skipping seed.', seededCount: count };
    }

    const passwordHash = await bcrypt.hash('password123', 10);

    const defaultUsers = [
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
      message: 'Default system users seeded successfully! Password for all: "password123"',
      users: defaultUsers.map((u) => ({ email: u.email, role: u.role, name: u.name })),
    };
  }
}
