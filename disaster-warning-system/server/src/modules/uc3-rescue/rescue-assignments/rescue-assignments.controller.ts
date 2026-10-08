import { Controller, Get, Post, Body, Patch, Param, Query, Delete } from '@nestjs/common';
import { RescueAssignmentsService } from './rescue-assignments.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';

@Controller('rescue-assignments')
export class RescueAssignmentsController {
  constructor(private readonly rescueAssignmentsService: RescueAssignmentsService) {}

  @Post()
  create(@Body() createAssignmentDto: CreateAssignmentDto) {
    return this.rescueAssignmentsService.create(createAssignmentDto);
  }

  @Get()
  findAll(@Query() query: any) {
    return this.rescueAssignmentsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.rescueAssignmentsService.findOne(id);
  }

  @Get(':id/status-history')
  getStatusHistory(@Param('id') id: string) {
    return this.rescueAssignmentsService.getStatusHistory(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAssignmentDto: UpdateAssignmentDto) {
    return this.rescueAssignmentsService.update(id, updateAssignmentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.rescueAssignmentsService.remove(id);
  }

  @Patch(':id/accept')
  accept(@Param('id') id: string, @Body('updatedBy') updatedBy: string) {
    return this.rescueAssignmentsService.updateStatus(id, 'ACCEPTED', updatedBy);
  }

  @Patch(':id/reject')
  reject(@Param('id') id: string, @Body('updatedBy') updatedBy: string, @Body('notes') notes: string) {
    return this.rescueAssignmentsService.updateStatus(id, 'REJECTED', updatedBy, notes);
  }

  @Patch(':id/en-route')
  enRoute(@Param('id') id: string, @Body('updatedBy') updatedBy: string) {
    return this.rescueAssignmentsService.updateStatus(id, 'EN_ROUTE', updatedBy);
  }

  @Patch(':id/on-site')
  onSite(@Param('id') id: string, @Body('updatedBy') updatedBy: string) {
    return this.rescueAssignmentsService.updateStatus(id, 'ON_SITE', updatedBy);
  }
  
  @Patch(':id/complete')
  complete(@Param('id') id: string, @Body('updatedBy') updatedBy: string, @Body('notes') notes: string) {
    return this.rescueAssignmentsService.updateStatus(id, 'COMPLETED', updatedBy, notes);
  }
}

