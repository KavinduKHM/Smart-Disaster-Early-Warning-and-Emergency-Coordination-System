import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { HazardService } from '../services/hazard.service';
import { CreateHazardDto } from '../dto/create-hazard.dto';
import { UpdateHazardDto } from '../dto/update-hazard.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../auth/enums/user-role.enum';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

@Controller(['uc1-warning/hazards', 'hazards'])
export class HazardController {
  constructor(private readonly hazardService: HazardService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DMC_OFFICER, UserRole.ADMIN, UserRole.DUTY_OFFICER)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createHazardDto: CreateHazardDto, @CurrentUser() user: any) {
    return this.hazardService.create(createHazardDto, user._id || user.id);
  }

  @Get()
  async findAll(@Query('includeDeleted') includeDeleted?: string) {
    const isDeletedFlag = includeDeleted === 'true';
    return this.hazardService.findAll(isDeletedFlag);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.hazardService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DMC_OFFICER, UserRole.ADMIN)
  async update(@Param('id') id: string, @Body() updateHazardDto: UpdateHazardDto) {
    return this.hazardService.update(id, updateHazardDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DMC_OFFICER, UserRole.ADMIN)
  async remove(@Param('id') id: string) {
    return this.hazardService.softDelete(id);
  }
}
