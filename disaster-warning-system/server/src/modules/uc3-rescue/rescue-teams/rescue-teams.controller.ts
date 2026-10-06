import { Controller, Get, Post, Body, Patch, Param, Query } from '@nestjs/common';
import { RescueTeamsService } from './rescue-teams.service';
import { CreateRescueTeamDto } from './dto/create-rescue-team.dto';
import { UpdateRescueTeamDto } from './dto/update-rescue-team.dto';

@Controller('rescue-teams')
export class RescueTeamsController {
  constructor(private readonly rescueTeamsService: RescueTeamsService) {}

  @Post()
  create(@Body() createRescueTeamDto: CreateRescueTeamDto) {
    return this.rescueTeamsService.create(createRescueTeamDto);
  }

  @Get()
  findAll(@Query() query: any) {
    return this.rescueTeamsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.rescueTeamsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRescueTeamDto: UpdateRescueTeamDto) {
    return this.rescueTeamsService.update(id, updateRescueTeamDto);
  }

  @Patch(':id/deactivate')
  deactivate(@Param('id') id: string) {
    return this.rescueTeamsService.deactivate(id);
  }
}
