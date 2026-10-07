import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Hazard, HazardSchema } from './schemas/hazard.schema';
import { HazardWarning, HazardWarningSchema } from './schemas/hazard-warning.schema';
import { NotificationLog, NotificationLogSchema } from './schemas/notification-log.schema';
import { User, UserSchema } from '../auth/schemas/user.schema';
import { HazardService } from './services/hazard.service';
import { WarningService } from './services/warning.service';
import { NotificationService } from './services/notification.service';
import { HazardController } from './controllers/hazard.controller';
import { WarningController } from './controllers/warning.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Hazard.name, schema: HazardSchema },
      { name: HazardWarning.name, schema: HazardWarningSchema },
      { name: NotificationLog.name, schema: NotificationLogSchema },
      { name: User.name, schema: UserSchema },
    ]),
    AuthModule,
  ],
  controllers: [HazardController, WarningController],
  providers: [HazardService, WarningService, NotificationService],
  exports: [HazardService, WarningService, NotificationService, MongooseModule],
})
export class WarningModule {}
