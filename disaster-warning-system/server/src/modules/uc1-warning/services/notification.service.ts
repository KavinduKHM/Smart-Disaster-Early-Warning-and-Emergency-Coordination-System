import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { HazardWarning, HazardWarningDocument } from '../schemas/hazard-warning.schema';
import { NotificationLog, NotificationLogDocument } from '../schemas/notification-log.schema';
import { User, UserDocument } from '../../auth/schemas/user.schema';
import { NotificationChannel } from '../enums/notification-channel.enum';
import { NotificationStatus } from '../enums/notification-status.enum';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectModel(HazardWarning.name)
    private readonly warningModel: Model<HazardWarningDocument>,
    @InjectModel(NotificationLog.name)
    private readonly notificationLogModel: Model<NotificationLogDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  /**
   * Broadcast warning across specified multi-channels (PUSH, SMS, AUDIBLE)
   * to targeted citizens in affected districts or river basins.
   */
  async broadcastWarning(warningId: string, customChannels?: NotificationChannel[]): Promise<any> {
    const warning = await this.warningModel.findById(warningId).exec();
    if (!warning) {
      throw new Error(`Warning with ID ${warningId} not found`);
    }

    const channelsToBroadcast = customChannels && customChannels.length > 0
      ? customChannels
      : warning.notificationChannels;

    this.logger.log(`Starting multi-channel alert broadcast for Warning: ${warning.warningId}`);
    this.logger.log(`Channels: [${channelsToBroadcast.join(', ')}]`);
    this.logger.log(`Districts: [${warning.affectedDistricts.join(', ')}], River Basins: [${warning.affectedRiverBasins.join(', ')}]`);

    // Build recipient query filter for citizens in affected districts or river basins
    const recipientFilter: any = {};
    const conditions: any[] = [];

    if (warning.affectedDistricts && warning.affectedDistricts.length > 0) {
      conditions.push({ district: { $in: warning.affectedDistricts } });
    }
    if (warning.affectedRiverBasins && warning.affectedRiverBasins.length > 0) {
      conditions.push({ riverBasin: { $in: warning.affectedRiverBasins } });
    }

    if (conditions.length > 0) {
      recipientFilter.$or = conditions;
    }

    // Fetch matching citizens (if no specific district matched, fetch all registered citizens as fallback)
    let citizens = await this.userModel.find(recipientFilter).exec();
    if (citizens.length === 0) {
      this.logger.warn(`No target citizens found in specified zones. Broadcasting to all system citizens as safety measure.`);
      citizens = await this.userModel.find({ role: 'CITIZEN' }).exec();
    }

    const deliveryMetricsMap: Map<NotificationChannel, any> = new Map();

    for (const channel of channelsToBroadcast) {
      let targetCount = 0;
      let deliveredCount = 0;
      let ackCount = 0;
      let failedCount = 0;

      for (const citizen of citizens) {
        targetCount++;
        const logEntry = await this.sendMockAlert(warning, citizen, channel);
        if (logEntry.status === NotificationStatus.DELIVERED || logEntry.status === NotificationStatus.ACKNOWLEDGED) {
          deliveredCount++;
        }
        if (logEntry.status === NotificationStatus.ACKNOWLEDGED) {
          ackCount++;
        }
        if (logEntry.status === NotificationStatus.FAILED) {
          failedCount++;
        }
      }

      deliveryMetricsMap.set(channel, {
        channel,
        sentAt: new Date(),
        targetRecipientCount: targetCount,
        deliveredCount,
        acknowledgedCount: ackCount,
        failedCount,
        status: 'BROADCAST_COMPLETE',
      });
    }

    // Update deliveryStatus metric array on the HazardWarning document
    const deliveryStatusArray = Array.from(deliveryMetricsMap.values());
    warning.deliveryStatus = deliveryStatusArray;
    warning.status = (warning.status as string) === 'DRAFT' ? ('ISSUED' as any) : ('BROADCAST_COMPLETE' as any);
    await warning.save();

    return {
      warningId: warning.warningId,
      status: warning.status,
      recipientCount: citizens.length,
      channelsBroadcasted: channelsToBroadcast,
      deliveryStatus: deliveryStatusArray,
    };
  }

  /**
   * Dispatch mock alert based on channel type (PUSH, SMS, AUDIBLE)
   * and log per-citizen per-channel status in NotificationLog.
   */
  private async sendMockAlert(
    warning: HazardWarningDocument,
    citizen: UserDocument,
    channel: NotificationChannel,
  ): Promise<NotificationLogDocument> {
    const sentAt = new Date();
    let status: NotificationStatus = NotificationStatus.SENT;
    let recipientAddress = '';
    let details = '';

    switch (channel) {
      case NotificationChannel.PUSH:
        recipientAddress = citizen.pushToken || `push_device_${citizen._id}`;
        // Mock Push Delivery Simulation (95% success rate)
        status = Math.random() < 0.95 ? NotificationStatus.DELIVERED : NotificationStatus.FAILED;
        details = `[Mock Push Gateway] Alert sent to device token: ${recipientAddress}`;
        break;

      case NotificationChannel.SMS:
        recipientAddress = citizen.phone || '+94770000000';
        // Mock SMS Gateway Delivery (90% success rate)
        status = Math.random() < 0.90 ? NotificationStatus.DELIVERED : NotificationStatus.FAILED;
        details = `[Mock SMS Gateway] SMS sent to ${recipientAddress}: "${warning.warningLevel.toUpperCase()}: ${warning.message}"`;
        break;

      case NotificationChannel.AUDIBLE:
        recipientAddress = `audible_siren_zone_${citizen.district || 'GLOBAL'}`;
        // Mock Siren / Loudspeaker / Audible Mobile Alert (100% Broadcast)
        status = NotificationStatus.ACKNOWLEDGED;
        details = `[Mock Audible Siren System] High-decibel audio siren activated in district ${citizen.district}. Instructions: ${warning.emergencyInstructions}`;
        break;
    }

    const deliveredAt = (status === NotificationStatus.DELIVERED || status === NotificationStatus.ACKNOWLEDGED)
      ? new Date()
      : null;
    const acknowledgedAt = status === NotificationStatus.ACKNOWLEDGED ? new Date() : null;

    const log = new this.notificationLogModel({
      warningId: warning._id,
      citizenId: citizen._id,
      channel,
      status,
      sentAt,
      deliveredAt,
      acknowledgedAt,
      recipientAddress,
      details,
    });

    return log.save();
  }

  /**
   * Fetch notification logs for a specific warning
   */
  async getWarningNotificationLogs(warningId: string): Promise<NotificationLogDocument[]> {
    return this.notificationLogModel
      .find({ warningId })
      .populate('citizenId', 'name email phone district riverBasin')
      .exec();
  }
}
