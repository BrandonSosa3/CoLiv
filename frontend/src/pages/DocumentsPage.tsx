// Create src/pages/DocumentsPage.tsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { documentsApi, DocumentResponse } from '@/lib/api/documents'
import { propertiesApi } from '@/lib/api/properties'
import { DocumentUploadModal } from '@/components/documents/DocumentUploadModal'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { FilterDropdown } from '@/components/ui/FilterDropdown'
import { SearchInput } from '@/components/ui/SearchInput'
import { LoadingScreen } from '@/components/ui/Spinner'
import { Upload, FileText, Download, Trash2, User, Users, Building, Calendar } from 'lucide-react'
import { formatDate, formatFileSize } from '@/lib/utils'

export function DocumentsPage() {
  const queryClient = useQueryClient()
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [propertyFilter, setPropertyFilter] = useState('all')

  const { data: documents, isLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: documentsApi.getAllDocuments,
  })

  const { data: properties } = useQuery({
    queryKey: ['properties'],
    queryFn: propertiesApi.getAll,
  })

  const deleteMutation = useMutation({
    mutationFn: documentsApi.deleteDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      toast.success('Document deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to delete document')
    },
  })

  if (isLoading) {
    return <LoadingScreen message="Loading documents..." />
  }

  const allDocuments = documents || []

  // Get unique document types for filter
  const documentTypes = Array.from(new Set(allDocuments.map(doc => doc.document_type)))

  // Apply filters
  const filteredDocuments = allDocuments.filter(document => {
    if (typeFilter !== 'all' && document.document_type !== typeFilter) return false
    if (propertyFilter !== 'all' && document.property_name !== propertyFilter) return false

    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase()
      return (
        document.title.toLowerCase().includes(searchLower) ||
        document.filename.toLowerCase().includes(searchLower) ||
        document.document_type.toLowerCase().includes(searchLower) ||
        document.property_name?.toLowerCase().includes(searchLower) ||
        document.tenant_name?.toLowerCase().includes(searchLower)
      )
    }

    return true
  })

  const handleDownload = (fileUrl: string, filename: string) => {
    const link = document.createElement('a')
    link.href = fileUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleDelete = (documentId: string) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      deleteMutation.mutate(documentId)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Documents</h1>
          <p className="text-[#98989d] mt-2">
            Manage documents across all properties
          </p>
        </div>
        <Button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          Upload Document
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent>
            <p className="text-sm text-[#98989d]">Total Documents</p>
            <p className="text-2xl font-bold text-white mt-1">
              {allDocuments.length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <p className="text-sm text-[#98989d]">Document Types</p>
            <p className="text-2xl font-bold text-white mt-1">
              {documentTypes.length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <p className="text-sm text-[#98989d]">Tenant Specific</p>
            <p className="text-2xl font-bold text-white mt-1">
              {allDocuments.filter(doc => doc.tenant_id).length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <p className="text-sm text-[#98989d]">Property Level</p>
            <p className="text-2xl font-bold text-white mt-1">
              {allDocuments.filter(doc => doc.visible_to_all_tenants).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      {allDocuments.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search documents by title, type, or property..."
            />
          </div>
          <FilterDropdown
            label="Document Type"
            value={typeFilter}
            onChange={setTypeFilter}
            options={[
              { value: 'all', label: 'All Types' },
              ...documentTypes.map(type => ({ value: type, label: type })),
            ]}
          />
          <FilterDropdown
            label="Property"
            value={propertyFilter}
            onChange={setPropertyFilter}
            options={[
              { value: 'all', label: 'All Properties' },
              ...(properties?.map(p => ({ value: p.name, label: p.name })) || []),
            ]}
          />
        </div>
      )}

      {/* Documents List */}
      {allDocuments.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-[#667eea]/20 to-[#764ba2]/20 flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-[#667eea]" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              No documents yet
            </h3>
            <p className="text-[#98989d]">
              Upload your first document to get started
            </p>
          </CardContent>
        </Card>
      ) : filteredDocuments.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-[#98989d] mb-4">
              No documents found matching your filters
            </p>
            <button
              onClick={() => {
                setSearchQuery('')
                setTypeFilter('all')
                setPropertyFilter('all')
              }}
              className="text-[#667eea] hover:underline"
            >
              Clear filters
            </button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-white">
              {filteredDocuments.length} {filteredDocuments.length === 1 ? 'Document' : 'Documents'}
            </h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredDocuments.map((document: DocumentResponse) => (
                <div
                  key={document.id}
                  className="p-4 rounded-lg bg-[#141414] border border-[#2c2c2e] hover:border-[#3a3a3c] transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-[#667eea]/20 to-[#764ba2]/20 mt-1">
                        <FileText className="w-5 h-5 text-[#667eea]" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-white">{document.title}</h3>
                          <span className="px-2 py-1 rounded-full text-xs bg-[#667eea]/20 text-[#667eea] border border-[#667eea]/20">
                            {document.document_type}
                          </span>
                        </div>
                        
                        {document.description && (
                          <p className="text-sm text-[#98989d] mb-2">{document.description}</p>
                        )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Building className="w-4 h-4 text-[#636366]" />
                            <span className="text-[#98989d]">{document.property_name}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {document.tenant_name ? (
                              <>
                                <User className="w-4 h-4 text-[#636366]" />
                                <span className="text-[#98989d]">{document.tenant_name}</span>
                              </>
                            ) : document.visible_to_all_tenants ? (
                              <>
                                <Users className="w-4 h-4 text-[#636366]" />
                                <span className="text-[#98989d]">All tenants</span>
                              </>
                            ) : (
                              <>
                                <Building className="w-4 h-4 text-[#636366]" />
                                <span className="text-[#98989d]">Property only</span>
                              </>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-[#636366]" />
                            <span className="text-[#98989d]">{formatDate(document.created_at)}</span>
                          </div>
                          
                          <div>
                            <p className="text-[#98989d]">{document.filename}</p>
                            {document.file_size && (
                              <p className="text-xs text-[#636366]">{formatFileSize(document.file_size)}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleDownload(document.file_url, document.filename)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleDelete(document.id)}
                        disabled={deleteMutation.isPending}
                        className="text-[#ff453a] hover:bg-[#ff453a]/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <DocumentUploadModal
          onClose={() => setShowUploadModal(false)}
        />
      )}
    </div>
  )
}