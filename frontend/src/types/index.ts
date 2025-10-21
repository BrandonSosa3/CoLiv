export interface User {
  id: string
  email: string
  role: 'operator' | 'tenant' | 'admin'
  created_at: string
}

export interface Property {
  id: string
  operator_id: string
  name: string
  address: string
  city: string
  state: string
  zip: string
  amenities?: Record<string, boolean>
  house_rules?: string
  created_at: string
}

export interface Unit {
  id: string
  property_id: string
  unit_number: string
  floor?: number
  bedrooms: number
  bathrooms: number
  square_feet?: number
  furnished: boolean
}

export interface Room {
  id: string
  unit_id: string
  room_number: string
  room_type: 'private' | 'shared'
  size_sqft?: number
  has_private_bath: boolean
  rent_amount: number
  available_date?: string
  status: 'vacant' | 'occupied' | 'maintenance'
  current_tenant_id?: string
  created_at: string
}

export interface Tenant {
  id: string
  user_id: string
  room_id: string
  lease_start: string
  lease_end: string
  rent_amount: number
  deposit_paid?: number
  status: 'active' | 'pending' | 'moved_out'
  move_in_date?: string
  created_at: string
}

export interface Dashboard {
  property: {
    id: string
    name: string
  }
  units: {
    total: number
  }
  rooms: {
    total: number
    occupied: number
    vacant: number
    occupancy_rate: number
  }
  revenue: {
    potential_monthly: number
    actual_monthly: number
  }
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface SignupData {
  email: string
  password: string
  company_name: string
  role: 'operator' | 'tenant'
}

export interface AuthResponse {
  access_token: string
  token_type: string
}

export interface TenantWithUser {
  id: string
  user_id: string
  room_id: string
  lease_start: string
  lease_end: string
  rent_amount: number
  deposit_paid?: number
  status: 'active' | 'pending' | 'moved_out'
  move_in_date?: string
  created_at: string
  email: string
  room_number: string
  unit_number: string
  property_name: string
}

// Add tenant info to Room type
export interface RoomWithTenant extends Room {
  tenant?: {
    id: string
    name: string
    email: string
    lease_start: string
    lease_end: string
    status: string
  }
}
