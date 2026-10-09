export enum HazardType {
  FLOOD = 'FLOOD',
  LANDSLIDE = 'LANDSLIDE',
  TSUNAMI = 'TSUNAMI',
  CYCLONE = 'CYCLONE',
  EARTHQUAKE = 'EARTHQUAKE',
  DROUGHT = 'DROUGHT',
  OTHER = 'OTHER',
}

export enum HazardStatus {
  ACTIVE = 'ACTIVE',
  MONITORING = 'MONITORING',
  RESOLVED = 'RESOLVED',
  ARCHIVED = 'ARCHIVED',
}

export interface HazardLocation {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface Hazard {
  _id?: string;
  id?: string;
  type: HazardType;
  title: string;
  description: string;
  status: HazardStatus;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  district: string;
  riverBasin?: string;
  linkedReportId?: string;
  location: HazardLocation;
  reportedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}
