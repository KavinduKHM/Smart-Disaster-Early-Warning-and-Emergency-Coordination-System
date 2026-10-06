import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RescueAssignment, RescueAssignmentDocument } from './schemas/rescue-assignment.schema';
import { RescueStatusUpdate, RescueStatusUpdateDocument } from './schemas/rescue-status-update.schema';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';

@Injectable()
export class RescueAssignmentsService {
  constructor(
    @InjectModel(RescueAssignment.name) private assignmentModel: Model<RescueAssignmentDocument>,
    @InjectModel(RescueStatusUpdate.name) private statusUpdateModel: Model<RescueStatusUpdateDocument>,
  ) {}

  async create(createAssignmentDto: CreateAssignmentDto): Promise<RescueAssignment> {
    const count = await this.assignmentModel.countDocuments();
    const assignmentId = `ASN-${new Date().getFullYear()}-${(count + 1).toString().padStart(3, '0')}`;
    
    const newAssignment = new this.assignmentModel({
      ...createAssignmentDto,
      assignmentId,
      status: 'ASSIGNED',
      assignedAt: new Date(),
    });
    
    const savedAssignment = await newAssignment.save();

    // Create initial status update record
    await new this.statusUpdateModel({
      assignmentId,
      status: 'ASSIGNED',
      updatedBy: createAssignmentDto.assignedBy,
      notes: createAssignmentDto.notes || 'Initial assignment created',
    }).save();

    return savedAssignment;
  }

  async findAll(query: any): Promise<RescueAssignment[]> {
    return this.assignmentModel.find(query).exec();
  }

  async findOne(id: string): Promise<RescueAssignment> {
    const assignment = await this.assignmentModel.findOne({ assignmentId: id }).exec();
    if (!assignment) {
      throw new NotFoundException(`Rescue assignment with ID ${id} not found`);
    }
    return assignment;
  }

  async updateStatus(id: string, newStatus: string, updatedBy: string, notes?: string): Promise<RescueAssignment> {
    const assignment = await this.findOne(id);
    
    // Status transition logic (simplified for prototype)
    const updateData: any = { status: newStatus };
    if (newStatus === 'ACCEPTED') updateData.acceptedAt = new Date();
    if (newStatus === 'COMPLETED') updateData.completedAt = new Date();
    if (notes) updateData.notes = notes;

    const updatedAssignment = await this.assignmentModel
      .findOneAndUpdate({ assignmentId: id }, updateData, { new: true })
      .exec();

    // Record status history
    await new this.statusUpdateModel({
      assignmentId: id,
      status: newStatus,
      updatedBy,
      notes: notes || `Status updated to ${newStatus}`,
    }).save();

    return updatedAssignment;
  }

  async getStatusHistory(id: string): Promise<RescueStatusUpdate[]> {
    return this.statusUpdateModel.find({ assignmentId: id }).sort({ createdAt: 1 }).exec();
  }
}
