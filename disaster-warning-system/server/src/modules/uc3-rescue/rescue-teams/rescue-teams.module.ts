import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RescueTeamsService } from './rescue-teams.service';
import { RescueTeamsController } from './rescue-teams.controller';
import { RescueTeam, RescueTeamSchema } from './schemas/rescue-team.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: RescueTeam.name, schema: RescueTeamSchema }]),
  ],
  controllers: [RescueTeamsController],
  providers: [RescueTeamsService],
  exports: [RescueTeamsService],
})
export class RescueTeamsModule {}
