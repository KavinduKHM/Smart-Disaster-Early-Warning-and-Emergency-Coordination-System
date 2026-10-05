import { Module } from '@nestjs/common';
import { IncidentsModule } from './incidents/incidents.module';
import { RescueTeamsModule } from './rescue-teams/rescue-teams.module';
import { RescueAssignmentsModule } from './rescue-assignments/rescue-assignments.module';

@Module({
  imports: [
    IncidentsModule,
    RescueTeamsModule,
    RescueAssignmentsModule,
  ],
})
export class RescueModule {}
