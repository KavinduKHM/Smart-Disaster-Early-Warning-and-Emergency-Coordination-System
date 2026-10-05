export interface IncidentLocation {
  type: string;
  coordinates: number[]; // [longitude, latitude]
}

export interface Incident {
  _id?: string;
  incidentId: string;
  type: string;
  description: string;
  district: string;
  location: IncidentLocation;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  peopleAffected: number;
  requiredAssistance: string[];
  status: 'ACTIVE' | 'CLOSED' | 'ARCHIVED';
  createdBy: string;
  reportedAt: string | Date;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface CreateIncidentPayload {
  type: string;
  description: string;
  district: string;
  location: {
    type: 'Point';
    coordinates: number[];
  };
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  peopleAffected: number;
  requiredAssistance: string[];
  createdBy: string;
}
