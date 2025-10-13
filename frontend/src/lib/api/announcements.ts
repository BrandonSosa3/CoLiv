import { apiClient } from './client'

export interface Announcement {
  id: string
  property_id: string
  title: string
  message: string  // Changed from 'content' to 'message'
  priority: 'normal' | 'important' | 'urgent'
  created_at: string
  updated_at: string
}

export interface AnnouncementWithDetails extends Announcement {
  property_name: string
}

export const announcementsApi = {
  getByProperty: async (propertyId: string): Promise<AnnouncementWithDetails[]> => {
    const { data } = await apiClient.get<AnnouncementWithDetails[]>(
      `/announcements/property/${propertyId}`
    )
    return data
  },

  create: async (announcement: {
    property_id: string
    title: string
    message: string  // Changed from 'content' to 'message'
    priority: string
  }): Promise<Announcement> => {
    const { data } = await apiClient.post<Announcement>('/announcements/', announcement)
    return data
  },

  update: async (
    id: string,
    updates: Partial<Announcement>
  ): Promise<Announcement> => {
    const { data } = await apiClient.put<Announcement>(`/announcements/${id}`, updates)
    return data
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/announcements/${id}`)
  },
}
