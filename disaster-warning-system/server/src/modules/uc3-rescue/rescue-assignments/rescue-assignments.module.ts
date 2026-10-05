import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RescueAssignmentsService } from './rescue-assignments.service';
import { RescueAssignmentsController } from './rescue-assignments.controller';
import { RescueAssignment, RescueAssignmentSchema } from './schemas/rescue-assignment.schema';
import { RescueStatusUpdate, RescueStatusUpdateSchema } from './schemas/rescue-status-update.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RescueAssignment.name, schema: RescueAssignmentSchema },
      { name: RescueStatusUpdate.name, schema: RescueStatusUpdateSchema }
    ]),
  ],
  controllers: [RescueAssignmentsController],
  providers: [RescueAssignmentsService],
  exports: [RescueAssignmentsService],
})
export class RescueAssignmentsModule {}
