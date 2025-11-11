// Create src/lib/api/documents.ts in tenant-portal
import { apiClient } from '../api'

export interface TenantDocument {
  id: string
  title: string
  document_type: string
  description?: string
  filename: string
  file_url: string
  file_size?: number
  created_at: string
  is_tenant_specific: boolean
}

export interface DocumentUploadData {
  title: string
  document_type: string
  description?: string
}

export const documentsApi = {
  getMyDocuments: async (): Promise<TenantDocument[]> => {
    const { data } = await apiClient.get<TenantDocument[]>('/tenants/me/documents')
    return data
  },

  uploadDocument: async (file: File, data: DocumentUploadData): Promise<TenantDocument> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('title', data.title)
    formData.append('document_type', data.document_type)
    if (data.description) formData.append('description', data.description)
    
    const { data: response } = await apiClient.post<TenantDocument>('/tenants/me/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response
  },

  downloadDocument: async (documentId: string): Promise<{download_url: string}> => {
    const { data } = await apiClient.get(`/tenants/me/documents/${documentId}/download`)
    return data
  },
}