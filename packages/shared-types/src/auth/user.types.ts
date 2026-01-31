export type UserRole =
  | 'super_admin'
  | 'consultant'
  | 'doctor'
  | 'hospital_pharmacist'
  | 'pharmacy_technician'
  | 'pharmacy_support_worker'
  | 'pharmacy_support_manager'
  | 'clinical_admin'
  | 'prescriber';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  isActive?: boolean;
}
