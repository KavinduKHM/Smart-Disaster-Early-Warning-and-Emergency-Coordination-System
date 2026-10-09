import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Incident, IncidentDocument } from './schemas/incident.schema';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';

import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class IncidentsService {
  constructor(
    @InjectModel(Incident.name) private incidentModel: Model<IncidentDocument>,
  ) {}

  @OnEvent('warning.escalated')
  async handleWarningEscalated(warning: any) {
    try {
      const district = (warning.affectedDistricts && warning.affectedDistricts[0]) || 'Kalutara';
      const warningIdStr = warning.warningId || warning._id;

      const existing = await this.incidentModel.findOne({
        $or: [
          { description: { $regex: new RegExp(warningIdStr, 'i') } },
          { linkedWarningId: warningIdStr },
        ],
      });

      if (!existing) {
        const count = await this.incidentModel.countDocuments();
        const incidentId = `INC-${new Date().getFullYear()}-${(count + 1).toString().padStart(3, '0')}`;

        await this.incidentModel.create({
          incidentId,
          type: 'FLOOD_RESCUE',
          description: `Auto-generated from Warning ${warningIdStr}: ${warning.message || 'Evacuate immediately'}`,
          district,
          location: {
            type: 'Point',
            coordinates: [80.6337, 7.2906],
          },
          priority: 'CRITICAL',
          peopleAffected: 50,
          requiredAssistance: ['WATER_RESCUE', 'MEDICAL'],
          status: 'ACTIVE',
          createdBy: warning.issuedBy || 'DMC_OFFICER',
        });
        console.log(`[UC3 IncidentsService] Auto-created CRITICAL Rescue Incident ${incidentId} from escalated Warning ${warningIdStr}`);
      }
    } catch (err) {
      console.error('[UC3 IncidentsService] Error handling warning.escalated event:', err);
    }
  }

  async create(createIncidentDto: CreateIncidentDto): Promise<Incident> {
    const count = await this.incidentModel.countDocuments();
    const incidentId = `INC-${new Date().getFullYear()}-${(count + 1).toString().padStart(3, '0')}`;
    const newIncident = new this.incidentModel({ ...createIncidentDto, incidentId });
    return newIncident.save();
  }

  async findAll(query: any): Promise<Incident[]> {
    return this.incidentModel.find(query).exec();
  }

  async findOne(id: string): Promise<Incident> {
    const incident = await this.incidentModel.findOne({ incidentId: id }).exec();
    if (!incident) {
      throw new NotFoundException(`Incident with ID ${id} not found`);
    }
    return incident;
  }

  async update(id: string, updateIncidentDto: UpdateIncidentDto): Promise<Incident> {
    const updatedIncident = await this.incidentModel
      .findOneAndUpdate({ incidentId: id }, updateIncidentDto, { new: true })
      .exec();
    if (!updatedIncident) {
      throw new NotFoundException(`Incident with ID ${id} not found`);
    }
    return updatedIncident;
  }

  async close(id: string): Promise<Incident> {
    const closedIncident = await this.incidentModel
      .findOneAndUpdate({ incidentId: id }, { status: 'CLOSED' }, { new: true })
      .exec();
    if (!closedIncident) {
      throw new NotFoundException(`Incident with ID ${id} not found`);
    }
    return closedIncident;
  }
}
