import { apiClient } from '../api'

export interface LoginCredentials {
  email: string
  password: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
}

export interface CheckEmailResponse {
  eligible: boolean
  first_name?: string
  last_name?: string
  message: string
}

export interface SignupRequest {
  email: string
  password: string
  confirm_password: string
}

export const authApi = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const formData = new URLSearchParams()
    formData.append('username', email)
    formData.append('password', password)
    
    const { data } = await apiClient.post('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
    return data
  },

  checkEmail: async (email: string): Promise<CheckEmailResponse> => {
    const { data } = await apiClient.post('/tenant-auth/check-email', { email })
    return data
  },

  signup: async (signupData: SignupRequest): Promise<AuthResponse> => {
    const { data } = await apiClient.post('/tenant-auth/signup', signupData)
    return data
  },
}
