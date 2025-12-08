import { apiClient } from '../api'

export interface Message {
  id: string
  sender_id: string
  sender_role: string
  sender_name: string
  sender_email: string
  receiver_id: string
  receiver_role: string
  receiver_name: string
  receiver_email: string
  tenant_id: string
  subject?: string
  message: string
  is_read: boolean
  created_at: string
  read_at?: string
}

export interface Conversation {
  tenant_id: string
  tenant_name: string
  tenant_email: string
  property_name: string
  unit_number: string
  room_number: string
  last_message: string
  last_message_time: string
  unread_count: number
  messages: Message[]
}

export interface SendMessageData {
  receiver_id: string
  tenant_id: string
  subject?: string
  message: string
}

export const messagesApi = {
  getConversations: async () => {
    const { data } = await apiClient.get<Conversation[]>('/messages/conversations')
    return data
  },

  sendMessage: async (messageData: SendMessageData) => {
    const { data } = await apiClient.post<Message>('/messages/send', messageData)
    return data
  },

  markAsRead: async (messageId: string) => {
    const { data } = await apiClient.post(`/messages/mark-read/${messageId}`)
    return data
  },

  markAllRead: async (tenantId: string) => {
    const { data } = await apiClient.post(`/messages/mark-all-read/${tenantId}`)
    return data
  },
}
