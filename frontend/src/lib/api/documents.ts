// Create src/lib/api/documents.ts
import { apiClient } from './client'

export interface DocumentResponse {
  id: string
  property_id?: string
  tenant_id?: string
  document_type: string
  title: string
  description?: string
  filename: string
  file_url: string
  file_size?: number
  mime_type?: string
  visible_to_all_tenants: boolean
  created_at: string
  property_name?: string
  tenant_name?: string
}

export interface DocumentUploadData {
  title: string
  document_type: string
  description?: string
  property_id: string
  tenant_id?: string
  visible_to_all_tenants: boolean
}

export const documentsApi = {
  uploadDocument: async (file: File, data: DocumentUploadData): Promise<DocumentResponse> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('title', data.title)
    formData.append('document_type', data.document_type)
    formData.append('property_id', data.property_id)
    
    if (data.description) formData.append('description', data.description)
    if (data.tenant_id) formData.append('tenant_id', data.tenant_id)
    formData.append('visible_to_all_tenants', data.visible_to_all_tenants.toString())
    
    const { data: response } = await apiClient.post<DocumentResponse>('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response
  },

  getAllDocuments: async (): Promise<DocumentResponse[]> => {
    const { data } = await apiClient.get<DocumentResponse[]>('/documents/')
    return data
  },

  getPropertyDocuments: async (propertyId: string): Promise<DocumentResponse[]> => {
    const { data } = await apiClient.get<DocumentResponse[]>(`/documents/property/${propertyId}`)
    return data
  },

  deleteDocument: async (documentId: string): Promise<void> => {
    await apiClient.delete(`/documents/${documentId}`)
  },
}