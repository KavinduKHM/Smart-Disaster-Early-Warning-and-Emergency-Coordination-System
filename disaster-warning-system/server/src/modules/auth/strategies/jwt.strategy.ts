import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy {
  async validate(payload: any) {
    return { userId: payload.sub, username: payload.username };
  }
}
