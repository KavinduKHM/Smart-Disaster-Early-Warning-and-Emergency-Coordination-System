import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RescueTeam, RescueTeamDocument } from './schemas/rescue-team.schema';
import { CreateRescueTeamDto } from './dto/create-rescue-team.dto';
import { UpdateRescueTeamDto } from './dto/update-rescue-team.dto';

@Injectable()
export class RescueTeamsService {
  constructor(
    @InjectModel(RescueTeam.name) private rescueTeamModel: Model<RescueTeamDocument>,
  ) {}

  async create(createRescueTeamDto: CreateRescueTeamDto): Promise<RescueTeam> {
    const count = await this.rescueTeamModel.countDocuments();
    const teamId = `TEAM-${(count + 1).toString().padStart(3, '0')}`;
    const newTeam = new this.rescueTeamModel({ ...createRescueTeamDto, teamId });
    return newTeam.save();
  }

  async findAll(query: any): Promise<RescueTeam[]> {
    return this.rescueTeamModel.find(query).exec();
  }

  async findOne(id: string): Promise<RescueTeam> {
    const team = await this.rescueTeamModel.findOne({ teamId: id }).exec();
    if (!team) {
      throw new NotFoundException(`Rescue team with ID ${id} not found`);
    }
    return team;
  }

  async update(id: string, updateRescueTeamDto: UpdateRescueTeamDto): Promise<RescueTeam> {
    const updatedTeam = await this.rescueTeamModel
      .findOneAndUpdate({ teamId: id }, updateRescueTeamDto, { new: true })
      .exec();
    if (!updatedTeam) {
      throw new NotFoundException(`Rescue team with ID ${id} not found`);
    }
    return updatedTeam;
  }

  async deactivate(id: string): Promise<RescueTeam> {
    const deactivatedTeam = await this.rescueTeamModel
      .findOneAndUpdate({ teamId: id }, { status: 'INACTIVE' }, { new: true })
      .exec();
    if (!deactivatedTeam) {
      throw new NotFoundException(`Rescue team with ID ${id} not found`);
    }
    return deactivatedTeam;
  }
}
