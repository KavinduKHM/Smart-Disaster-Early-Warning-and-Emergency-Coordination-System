import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { WarningService } from '../services/warning.service';
import { NotificationService } from '../services/notification.service';
import { IssueWarningDto } from '../dto/issue-warning.dto';
import { EscalateWarningDto } from '../dto/escalate-warning.dto';
import { BroadcastWarningDto } from '../dto/broadcast-warning.dto';
import { GeoQueryDto } from '../dto/geo-query.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../auth/enums/user-role.enum';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

@Controller(['uc1-warning/warnings', 'warnings'])
export class WarningController {
  constructor(
    private readonly warningService: WarningService,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Workflow 1: Issue Warning (DMC Officer links hazard, specifies affected districts/river-basins, channels)
   */
  @Post('issue')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DMC_OFFICER, UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async issueWarning(@Body() dto: IssueWarningDto, @CurrentUser() user: any) {
    return this.warningService.issueWarning(dto, user._id || user.id);
  }

  /**
   * Workflow 2: Broadcast Warning (Trigger multi-channel alert delivery across Push, SMS, Audible)
   */
  @Post(':id/broadcast')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DMC_OFFICER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async broadcastWarning(@Param('id') id: string, @Body() dto: BroadcastWarningDto) {
    return this.warningService.broadcastWarning(id, dto);
  }

  /**
   * Workflow 3: Escalate Warning (Escalate warning level/severity and re-broadcast)
   */
  @Post(':id/escalate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DMC_OFFICER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async escalateWarning(@Param('id') id: string, @Body() dto: EscalateWarningDto) {
    return this.warningService.escalateWarning(id, dto);
  }

  /**
   * Geospatial Query: Find active warnings near a GPS coordinate (latitude, longitude, radiusKm)
   */
  @Get('nearby')
  async findActiveWarningsNearLocation(@Query() query: GeoQueryDto) {
    return this.warningService.findActiveWarningsNearLocation(query);
  }

  /**
   * Get all warnings
   */
  @Get()
  async findAll(@Query('status') status?: string) {
    return this.warningService.findAll(status);
  }

  /**
   * Get single warning by ID
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.warningService.findOne(id);
  }

  /**
   * Get detailed Notification Logs for a warning (tracking per citizen per channel)
   */
  @Get(':id/logs')
  @UseGuards(JwtAuthGuard)
  async getWarningNotificationLogs(@Param('id') id: string) {
    return this.notificationService.getWarningNotificationLogs(id);
  }

  /**
   * Cancel Warning
   */
  @Post(':id/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DMC_OFFICER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async cancelWarning(@Param('id') id: string, @Body('reason') reason?: string) {
    return this.warningService.cancelWarning(id, reason);
  }
}
