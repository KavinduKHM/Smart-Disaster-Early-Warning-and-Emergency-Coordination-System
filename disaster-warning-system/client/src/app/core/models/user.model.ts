export enum UserRole {
  DMC_OFFICER = 'DMC_OFFICER',
  ADMIN = 'ADMIN',
  CITIZEN = 'CITIZEN',
  VOLUNTEER = 'VOLUNTEER',
  DUTY_OFFICER = 'DUTY_OFFICER',
  RESCUE_TEAM = 'RESCUE_TEAM',
  DISTRICT_OFFICER = 'DISTRICT_OFFICER',
}

export interface User {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  role: UserRole;
  district?: string;
  riverBasin?: string;
  phone?: string;
  pushToken?: string;
  badgeId?: string;
}

export interface AuthResponse {
  message?: string;
  accessToken: string;
  user: User;
}
