import { apiClient } from './client'
import { AuthResponse, LoginCredentials, SignupData, User } from '@/types'

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const formData = new FormData()
    formData.append('username', credentials.username)
    formData.append('password', credentials.password)
    
    const { data } = await apiClient.post<AuthResponse>('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded', 
      },
    })
    return data
  },

  signup: async (signupData: SignupData): Promise<User> => {
    const { data } = await apiClient.post<User>('/auth/signup', signupData)
    return data
  },

  logout: () => {
    localStorage.removeItem('access_token')
  },
}
