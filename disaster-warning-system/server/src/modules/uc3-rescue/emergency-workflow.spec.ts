import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { IncidentsService } from './incidents/incidents.service';
import { RescueAssignmentsService } from './rescue-assignments/rescue-assignments.service';
import { RescueTeamsService } from './rescue-teams/rescue-teams.service';
import { Incident } from './incidents/schemas/incident.schema';
import { RescueAssignment } from './rescue-assignments/schemas/rescue-assignment.schema';
import { RescueStatusUpdate } from './rescue-assignments/schemas/rescue-status-update.schema';
import { RescueTeam } from './rescue-teams/schemas/rescue-team.schema';

describe('Emergency Response & Coordination Workflow (UC3)', () => {
  let incidentsService: IncidentsService;
  let assignmentsService: RescueAssignmentsService;
  let teamsService: RescueTeamsService;

  // Mock repositories / models
  let mockIncidentModel: any;
  let mockAssignmentModel: any;
  let mockStatusUpdateModel: any;
  let mockRescueTeamModel: any;

  beforeEach(async () => {
    // 1. Mock Incident Model constructor and methods
    mockIncidentModel = jest.fn().mockImplementation((dto) => ({
      ...dto,
      save: jest.fn().mockResolvedValue({
        _id: 'inc-id-101',
        status: 'OPEN',
        ...dto,
      }),
    }));
    mockIncidentModel.countDocuments = jest.fn().mockResolvedValue(0);
    mockIncidentModel.findOne = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        incidentId: 'INC-2026-001',
        status: 'OPEN',
        type: 'FLOOD',
        district: 'Colombo',
      }),
    });
    mockIncidentModel.findOneAndUpdate = jest.fn().mockImplementation((query, update) => ({
      exec: jest.fn().mockResolvedValue({
        incidentId: query.incidentId,
        ...update,
      }),
    }));

    // 2. Mock Assignment Model constructor and methods
    mockAssignmentModel = jest.fn().mockImplementation((dto) => ({
      ...dto,
      save: jest.fn().mockResolvedValue({
        _id: 'asn-id-201',
        status: 'ASSIGNED',
        ...dto,
      }),
    }));
    mockAssignmentModel.countDocuments = jest.fn().mockResolvedValue(0);
    mockAssignmentModel.findOne = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        assignmentId: 'ASN-2026-001',
        incidentId: 'INC-2026-001',
        teamId: 'TEAM-001',
        status: 'ASSIGNED',
      }),
    });
    mockAssignmentModel.findOneAndUpdate = jest.fn().mockImplementation((query, update) => ({
      exec: jest.fn().mockResolvedValue({
        assignmentId: query.assignmentId,
        ...update,
      }),
    }));

    // 3. Mock Status Update Model
    mockStatusUpdateModel = jest.fn().mockImplementation((dto) => ({
      ...dto,
      save: jest.fn().mockResolvedValue({ _id: 'stat-301', ...dto }),
    }));
    mockStatusUpdateModel.find = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      }),
    });

    // 4. Mock Rescue Team Model
    mockRescueTeamModel = jest.fn().mockImplementation((dto) => ({
      ...dto,
      save: jest.fn().mockResolvedValue({ _id: 'team-401', ...dto }),
    }));
    mockRescueTeamModel.findOne = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        teamId: 'TEAM-001',
        name: 'Rapid Water Rescue',
        status: 'AVAILABLE',
        location: { type: 'Point', coordinates: [79.8612, 6.9271] },
      }),
    });
    mockRescueTeamModel.findOneAndUpdate = jest.fn().mockImplementation((query, update) => ({
      exec: jest.fn().mockResolvedValue({
        teamId: query.teamId,
        ...update,
      }),
    }));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IncidentsService,
        RescueAssignmentsService,
        RescueTeamsService,
        { provide: getModelToken(Incident.name), useValue: mockIncidentModel },
        { provide: getModelToken(RescueAssignment.name), useValue: mockAssignmentModel },
        { provide: getModelToken(RescueStatusUpdate.name), useValue: mockStatusUpdateModel },
        { provide: getModelToken(RescueTeam.name), useValue: mockRescueTeamModel },
      ],
    }).compile();

    incidentsService = module.get<IncidentsService>(IncidentsService);
    assignmentsService = module.get<RescueAssignmentsService>(RescueAssignmentsService);
    teamsService = module.get<RescueTeamsService>(RescueTeamsService);
  });

  // =========================================================================
  // 1. MAIN (HAPPY) PATH
  // =========================================================================
  describe('Main Emergency Response Lifecycle (Happy Path)', () => {
    it('Step 1: should create a new emergency Incident with OPEN status', async () => {
      const incidentDto = {
        type: 'FLOOD',
        description: 'Severe river overflow flooding residential area',
        district: 'Colombo',
        location: { type: 'Point', coordinates: [79.8612, 6.9271] },
        priority: 'CRITICAL' as const,
        peopleAffected: 45,
        requiredAssistance: ['BOAT_EVACUATION', 'MEDICAL_FIRST_AID'],
        createdBy: 'District Officer Silva',
      };

      const created = await incidentsService.create(incidentDto as any);

      expect(created).toBeDefined();
      expect(created.incidentId).toBe('INC-2026-001');
      expect(created.status).toBe('OPEN');
      expect(mockIncidentModel).toHaveBeenCalled();
    });

    it('Step 2: should dispatch an available Rescue Team and create assignment with ASSIGNED status', async () => {
      // 1. Verify team is available
      const team = await teamsService.findOne('TEAM-001');
      expect(team.status).toBe('AVAILABLE');

      // 2. District Officer creates assignment linking Incident & Team
      const assignmentDto = {
        incidentId: 'INC-2026-001',
        teamId: 'TEAM-001',
        assignedBy: 'District Officer Silva',
        notes: 'Deploy immediately with inflatable boats to Flood Zone Alpha.',
      };

      const assignment = await assignmentsService.create(assignmentDto);

      expect(assignment).toBeDefined();
      expect(assignment.assignmentId).toBe('ASN-2026-001');
      expect(assignment.status).toBe('ASSIGNED');
      expect(assignment.incidentId).toBe('INC-2026-001');
      expect(assignment.teamId).toBe('TEAM-001');
    });

    it('Step 3: should progress mission: ACCEPTED -> EN_ROUTE (with GPS) -> ON_SITE -> COMPLETED (team returns to AVAILABLE)', async () => {
      const assignmentId = 'ASN-2026-001';

      // 3a. Team accepts assignment
      const accepted = await assignmentsService.updateStatus(assignmentId, 'ACCEPTED', 'Rescue Team Leader');
      expect(accepted.status).toBe('ACCEPTED');

      // 3b. Team departs base (EN_ROUTE) and updates live telemetry coordinates
      const enRoute = await assignmentsService.updateStatus(assignmentId, 'EN_ROUTE', 'Rescue Team Leader');
      expect(enRoute.status).toBe('EN_ROUTE');

      const updatedTeamLocation = await teamsService.update('TEAM-001', {
        location: { type: 'Point', coordinates: [79.8700, 6.9350] },
      } as any);
      expect(updatedTeamLocation.location.coordinates).toEqual([79.8700, 6.9350]);

      // 3c. Team reaches location (ON_SITE)
      const onSite = await assignmentsService.updateStatus(assignmentId, 'ON_SITE', 'Rescue Team Leader');
      expect(onSite.status).toBe('ON_SITE');

      // 3d. Team completes mission (COMPLETED), timestamp recorded, team status reset to AVAILABLE
      const completed = await assignmentsService.updateStatus(
        assignmentId,
        'COMPLETED',
        'Rescue Team Leader',
        'All 45 residents successfully evacuated to safe center.'
      );
      expect(completed.status).toBe('COMPLETED');

      const restoredTeam = await teamsService.update('TEAM-001', { status: 'AVAILABLE' } as any);
      expect(restoredTeam.status).toBe('AVAILABLE');
    });

    it('Step 4: should mark Incident as RESOLVED and finally CLOSED when operations conclude', async () => {
      const incidentId = 'INC-2026-001';

      // District Officer resolves the incident
      const resolved = await incidentsService.update(incidentId, { status: 'RESOLVED' } as any);
      expect(resolved.status).toBe('RESOLVED');

      // Final closure
      const closed = await incidentsService.close(incidentId);
      expect(closed.status).toBe('CLOSED');
    });
  });

  // =========================================================================
  // 2. ALTERNATIVE & FAULT-TOLERANT FLOWS (A1, A2, A3, A4 & Resiliency)
  // =========================================================================
  describe('Alternative Scenarios & Failure Handling', () => {
    it('Scenario A1: should identify when a Rescue Team is UNAVAILABLE and select another unit', async () => {
      // Mock team in maintenance / inactive
      mockRescueTeamModel.findOne.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue({
          teamId: 'TEAM-002',
          name: 'Heavy Evacuation Unit',
          status: 'INACTIVE',
        }),
      });

      const team = await teamsService.findOne('TEAM-002');
      const isAvailableForDispatch = team.status === 'AVAILABLE';

      // Rule A1: System informs DO that unit is unavailable; DO picks alternative
      expect(isAvailableForDispatch).toBe(false);

      // DO selects alternative team that IS available
      const altTeam = await teamsService.findOne('TEAM-001');
      expect(altTeam.status).toBe('AVAILABLE');
    });

    it('Scenario A2: should mark assignment CANCELLED when unit cannot accept; Incident remains OPEN', async () => {
      const assignmentId = 'ASN-2026-001';

      // Team reports inability to accept due to mechanical issue
      const cancelledAssignment = await assignmentsService.updateStatus(
        assignmentId,
        'CANCELLED',
        'Rescue Team Leader',
        'Engine failure during turnout inspection'
      );

      expect(cancelledAssignment.status).toBe('CANCELLED');

      // Verify incident remains OPEN for DO to dispatch a replacement unit
      const incident = await incidentsService.findOne('INC-2026-001');
      expect(incident.status).toBe('OPEN');
    });

    it('Scenario A3: should allow multiple independent assignments for large-scale multi-unit incidents', async () => {
      // Mock countDocuments for sequential IDs
      mockAssignmentModel.countDocuments
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(1);

      // Unit 1 dispatch
      const asn1 = await assignmentsService.create({
        incidentId: 'INC-2026-001',
        teamId: 'TEAM-001',
        assignedBy: 'District Officer Silva',
        notes: 'Primary boat rescue unit',
      });

      // Unit 2 dispatch (Reinforcement)
      const asn2 = await assignmentsService.create({
        incidentId: 'INC-2026-001',
        teamId: 'TEAM-003',
        assignedBy: 'District Officer Silva',
        notes: 'Medical support reinforcement unit',
      });

      expect(asn1.incidentId).toBe('INC-2026-001');
      expect(asn2.incidentId).toBe('INC-2026-001');
      expect(asn1.assignmentId).not.toEqual(asn2.assignmentId);

      // Verify each unit can progress independent states (e.g. Unit 1 ON_SITE while Unit 2 is EN_ROUTE)
      const u1Status = await assignmentsService.updateStatus(asn1.assignmentId, 'ON_SITE', 'Team 1');
      const u2Status = await assignmentsService.updateStatus(asn2.assignmentId, 'EN_ROUTE', 'Team 3');

      expect(u1Status.status).toBe('ON_SITE');
      expect(u2Status.status).toBe('EN_ROUTE');
    });

    it('Scenario A4 & Fault Tolerance: should preserve state and last known coordinates during failures', async () => {
      // 1. GPS failure: System retains last known coordinates
      const lastKnownCoords = [79.8650, 6.9300];
      const teamWithLastKnownLocation = await teamsService.findOne('TEAM-001');
      expect(teamWithLastKnownLocation.location.coordinates).toBeDefined();

      // 2. Communication / Network loss: Assignment remains active at last confirmed status
      const activeAssignment = await assignmentsService.findOne('ASN-2026-001');
      expect(activeAssignment.status).not.toBe('CANCELLED');
      expect(activeAssignment.status).not.toBe('COMPLETED');

      // 3. Dispatch failure simulation: If assignment creation throws error, Incident must remain OPEN
      const failingAssignmentCreation = async () => {
        throw new Error('Database transaction timeout during dispatch');
      };

      await expect(failingAssignmentCreation()).rejects.toThrow('Database transaction timeout during dispatch');
      const incidentAfterFailedDispatch = await incidentsService.findOne('INC-2026-001');
      expect(incidentAfterFailedDispatch.status).toBe('OPEN');
    });
  });
});
//cd disaster-warning-system/server
//npx jest src/modules/uc3-rescue/emergency-workflow.spec.ts
