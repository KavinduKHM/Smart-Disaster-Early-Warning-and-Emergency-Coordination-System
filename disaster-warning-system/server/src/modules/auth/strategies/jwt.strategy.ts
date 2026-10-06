import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import { jwtConstants } from '../auth.constants';

export interface JwtPayload {
  sub: string;
  email: string;
  name: string;
  role: string;
  district?: string;
  riverBasin?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret,
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.userModel.findById(payload.sub).select('-password').exec();
    if (!user) {
      throw new UnauthorizedException('User account linked to this token no longer exists.');
    }
    return user;
  }
}
