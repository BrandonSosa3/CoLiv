// Create src/pages/DocumentsPage.tsx in tenant-portal
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { documentsApi } from '@/lib/api/documents'
import { TenantDocumentUploadModal } from '@/components/documents/TenantDocumentUploadModal'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { SearchInput } from '@/components/ui/SearchInput'
import { LoadingScreen } from '@/components/ui/Spinner'
import { Upload, FileText, Download, Calendar, Building, User } from 'lucide-react'
import { formatDate, formatFileSize } from '@/lib/utils'
import { useEffect } from 'react'

export function DocumentsPage() {
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const { data: documents, isLoading } = useQuery({
    queryKey: ['my-documents'],
    queryFn: documentsApi.getMyDocuments,
  })

  // Add debug logging here
  useEffect(() => {
    if (documents) {
      console.log('DEBUG: All documents received:', documents)
      documents.forEach(doc => {
        console.log(`DEBUG: Document - id: "${doc.id}", file_url: "${doc.file_url}", title: "${doc.title}"`)
      })
    }
  }, [documents])

  if (isLoading) {
    return <LoadingScreen message="Loading documents..." />
  }

  const allDocuments = documents || []

  // Apply search filter
  const filteredDocuments = allDocuments.filter(document => {
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase()
      return (
        document.title.toLowerCase().includes(searchLower) ||
        document.filename.toLowerCase().includes(searchLower) ||
        document.document_type.toLowerCase().includes(searchLower) ||
        document.description?.toLowerCase().includes(searchLower)
      )
    }
    return true
  })

  // Separate documents by source
  const myDocuments = filteredDocuments.filter(doc => doc.is_tenant_specific)
  const sharedDocuments = filteredDocuments.filter(doc => !doc.is_tenant_specific)

  const handleDownload = async (documentId: string, filename: string) => {
    console.log('DEBUG: Downloading document:', documentId, filename)
    try {
      const response = await documentsApi.downloadDocument(documentId)
      const { download_url } = response
      
      const link = document.createElement('a')
      link.href = download_url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Download error:', error)
      toast.error('Failed to download document')
    }
  }

  // ... rest of your component
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Documents</h1>
          <p className="text-[#98989d] mt-1">
            View shared documents and upload your own
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#667eea]/20">
                <FileText className="w-5 h-5 text-[#667eea]" />
              </div>
              <div>
                <p className="text-sm text-[#98989d]">Total Documents</p>
                <p className="text-xl font-bold text-white">{allDocuments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#32d74b]/20">
                <User className="w-5 h-5 text-[#32d74b]" />
              </div>
              <div>
                <p className="text-sm text-[#98989d]">My Uploads</p>
                <p className="text-xl font-bold text-white">{myDocuments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#ffd60a]/20">
                <Building className="w-5 h-5 text-[#ffd60a]" />
              </div>
              <div>
                <p className="text-sm text-[#98989d]">From Property Manager</p>
                <p className="text-xl font-bold text-white">{sharedDocuments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      {allDocuments.length > 0 && (
        <div className="max-w-md">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search documents..."
          />
        </div>
      )}

      {/* No Documents State */}
      {allDocuments.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-[#667eea]/20 to-[#764ba2]/20 flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-[#667eea]" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              No documents yet
            </h3>
            <p className="text-[#98989d] mb-4">
              Your property manager hasn't shared any documents yet, and you haven't uploaded any.
            </p>
            <Button onClick={() => setShowUploadModal(true)}>
              Upload Your First Document
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Shared Documents Section */}
          {sharedDocuments.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Building className="w-5 h-5 text-[#ffd60a]" />
                  <h2 className="text-lg font-semibold text-white">
                    From Property Manager ({sharedDocuments.length})
                  </h2>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sharedDocuments.map((document) => (
                    <div
                      key={document.id}
                      className="p-4 rounded-lg bg-[#141414] border border-[#2c2c2e]"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="p-2 rounded-lg bg-gradient-to-br from-[#ffd60a]/20 to-[#ff9500]/20 mt-1">
                            <FileText className="w-5 h-5 text-[#ffd60a]" />
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-white">{document.title}</h3>
                              <span className="px-2 py-1 rounded-full text-xs bg-[#ffd60a]/20 text-[#ffd60a] border border-[#ffd60a]/20">
                                {document.document_type}
                              </span>
                            </div>
                            
                            {document.description && (
                              <p className="text-sm text-[#98989d] mb-2">{document.description}</p>
                            )}
                            
                            <div className="flex items-center gap-4 text-sm text-[#636366]">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span>{formatDate(document.created_at)}</span>
                              </div>
                              <span>{document.filename}</span>
                              {document.file_size && (
                                <span>{formatFileSize(document.file_size)}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <Button
                          size="sm"
                          onClick={() => handleDownload(document.id, document.filename)}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* My Documents Section */}
          {myDocuments.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-[#32d74b]" />
                  <h2 className="text-lg font-semibold text-white">
                    My Uploads ({myDocuments.length})
                  </h2>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {myDocuments.map((document) => (
                    <div
                      key={document.id}
                      className="p-4 rounded-lg bg-[#141414] border border-[#2c2c2e]"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="p-2 rounded-lg bg-gradient-to-br from-[#32d74b]/20 to-[#30d158]/20 mt-1">
                            <FileText className="w-5 h-5 text-[#32d74b]" />
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-white">{document.title}</h3>
                              <span className="px-2 py-1 rounded-full text-xs bg-[#32d74b]/20 text-[#32d74b] border border-[#32d74b]/20">
                                {document.document_type}
                              </span>
                            </div>
                            
                            {document.description && (
                              <p className="text-sm text-[#98989d] mb-2">{document.description}</p>
                            )}
                            
                            <div className="flex items-center gap-4 text-sm text-[#636366]">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span>{formatDate(document.created_at)}</span>
                              </div>
                              <span>{document.filename}</span>
                              {document.file_size && (
                                <span>{formatFileSize(document.file_size)}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <Button
                          size="sm"
                          onClick={() => handleDownload(document.id, document.filename)}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* No Results Message */}
          {filteredDocuments.length === 0 && searchQuery && (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-[#98989d] mb-4">
                  No documents found matching "{searchQuery}"
                </p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-[#667eea] hover:underline"
                >
                  Clear search
                </button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <TenantDocumentUploadModal
          onClose={() => setShowUploadModal(false)}
        />
      )}
    </div>
  )
}