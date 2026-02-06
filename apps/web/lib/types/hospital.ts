export interface Hospital {
  id: string;
  name: string;
  code: string;
  type: string;
  address: string;
  city: string;
  province: string;
  country: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  bedCapacity: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  departments?: Department[];
}

export interface Department {
  id: string;
  hospitalId: string;
  name: string;
  code: string;
  description: string | null;
  headOfDepartment: string | null;
  specialty: string | null;
  floor: string | null;
  phone: string | null;
  email: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  wards?: Ward[];
}

export interface Ward {
  id: string;
  departmentId: string;
  name: string;
  code: string;
  type: string;
  floor: string | null;
  bedCapacity: number;
  currentOccupancy: number;
  nurseInCharge: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  beds?: Bed[];
}

export interface Bed {
  id: string;
  wardId: string;
  bedNumber: string;
  type: string;
  status: 'available' | 'occupied' | 'maintenance' | 'reserved';
  currentPatientId: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHospitalDto {
  name: string;
  code: string;
  type?: string;
  address: string;
  city: string;
  province?: string;
  country?: string;
  phone?: string;
  email?: string;
  website?: string;
  bedCapacity?: number;
}

export interface CreateDepartmentDto {
  name: string;
  code: string;
  description?: string;
  headOfDepartment?: string;
  specialty?: string;
  floor?: string;
  phone?: string;
  email?: string;
}

export interface CreateWardDto {
  name: string;
  code: string;
  type?: string;
  floor?: string;
  bedCapacity?: number;
  nurseInCharge?: string;
  phone?: string;
}

export interface CreateBedDto {
  bedNumber: string;
  type?: string;
  status?: string;
  notes?: string;
}

export interface HospitalStats {
  totalHospitals: number;
  totalDepartments: number;
  totalWards: number;
  totalBeds: number;
  availableBeds: number;
  occupiedBeds: number;
  occupancyRate: number;
}
