import { Injectable } from '@nestjs/common';

@Injectable()
export class LocalStrategy {
  async validate() {
    return true;
  }
}
