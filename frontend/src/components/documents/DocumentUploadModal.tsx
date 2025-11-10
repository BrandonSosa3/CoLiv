// Create src/components/documents/DocumentUploadModal.tsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { documentsApi, DocumentUploadData } from '@/lib/api/documents'
import { propertiesApi } from '@/lib/api/properties'
import { tenantsApi } from '@/lib/api/tenants'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { X, Upload, CheckCircle } from 'lucide-react'

interface DocumentUploadModalProps {
  onClose: () => void
}

export function DocumentUploadModal({ onClose }: DocumentUploadModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const queryClient = useQueryClient()

  const { register, handleSubmit, watch, formState: { errors } } = useForm<DocumentUploadData>({
    defaultValues: {
      visible_to_all_tenants: false
    }
  })

  const selectedPropertyId = watch('property_id')

  // Fetch properties
  const { data: properties } = useQuery({
    queryKey: ['properties'],
    queryFn: propertiesApi.getAll,
  })

  // Fetch tenants for selected property
  const { data: tenants } = useQuery({
    queryKey: ['tenants', selectedPropertyId],
    queryFn: () => tenantsApi.getByProperty(selectedPropertyId),
    enabled: !!selectedPropertyId,
  })

  const uploadMutation = useMutation({
    mutationFn: (data: DocumentUploadData & { file: File }) => 
      documentsApi.uploadDocument(data.file, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      toast.success('Document uploaded successfully!')
      onClose()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to upload document')
    },
  })

  const handleFileSelect = (selectedFile: File) => {
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (selectedFile.size > maxSize) {
      toast.error('File size must be less than 50MB')
      return
    }
    setFile(selectedFile)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const onSubmit = (data: DocumentUploadData) => {
    if (!file) {
      toast.error('Please select a file')
      return
    }
    uploadMutation.mutate({ ...data, file })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Upload Document</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-[#2c2c2e] transition-colors"
            >
              <X className="w-5 h-5 text-[#98989d]" />
            </button>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* File Drop Zone */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragOver 
                  ? 'border-[#667eea] bg-[#667eea]/10' 
                  : 'border-[#2c2c2e] hover:border-[#3a3a3c]'
              }`}
              onDrop={handleDrop}
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={() => setDragOver(false)}
            >
              {file ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center">
                    <div className="p-3 rounded-full bg-[#32d74b]/20">
                      <CheckCircle className="w-8 h-8 text-[#32d74b]" />
                    </div>
                  </div>
                  <div>
                    <p className="font-medium text-white">{file.name}</p>
                    <p className="text-sm text-[#98989d]">
                      {(file.size / (1024 * 1024)).toFixed(1)} MB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="text-[#667eea] hover:underline text-sm"
                  >
                    Choose different file
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-center">
                    <div className="p-3 rounded-full bg-[#667eea]/20">
                      <Upload className="w-8 h-8 text-[#667eea]" />
                    </div>
                  </div>
                  <div>
                    <p className="text-white font-medium">Drop file here</p>
                    <p className="text-[#98989d] text-sm">or click to browse</p>
                  </div>
                  <input
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFileSelect(file)
                    }}
                    className="hidden"
                    id="file-input"
                  />
                  <label
                    htmlFor="file-input"
                    className="inline-block px-4 py-2 bg-[#667eea] text-white rounded-lg hover:bg-[#7c8aed] cursor-pointer transition-colors"
                  >
                    Browse Files
                  </label>
                </div>
              )}
            </div>

            {/* Document Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#98989d] mb-2">
                  Document Title *
                </label>
                <input
                  {...register('title', { required: 'Title is required' })}
                  className="w-full px-3 py-2 rounded-lg bg-[#141414] border border-[#2c2c2e] text-white placeholder:text-[#636366] focus:outline-none focus:ring-2 focus:ring-[#667eea] focus:border-transparent"
                  placeholder="Enter document title"
                />
                {errors.title && (
                  <p className="text-[#ff453a] text-sm mt-1">{errors.title.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#98989d] mb-2">
                  Category *
                </label>
                <input
                  {...register('document_type', { required: 'Category is required' })}
                  className="w-full px-3 py-2 rounded-lg bg-[#141414] border border-[#2c2c2e] text-white placeholder:text-[#636366] focus:outline-none focus:ring-2 focus:ring-[#667eea] focus:border-transparent"
                  placeholder="e.g., Lease, Insurance, Photo"
                />
                {errors.document_type && (
                  <p className="text-[#ff453a] text-sm mt-1">{errors.document_type.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#98989d] mb-2">
                Description
              </label>
              <textarea
                {...register('description')}
                className="w-full px-3 py-2 rounded-lg bg-[#141414] border border-[#2c2c2e] text-white placeholder:text-[#636366] focus:outline-none focus:ring-2 focus:ring-[#667eea] focus:border-transparent"
                placeholder="Optional description"
                rows={3}
              />
            </div>

            {/* Property Selection */}
            <div>
              <label className="block text-sm font-medium text-[#98989d] mb-2">
                Property *
              </label>
              <select
                {...register('property_id', { required: 'Property is required' })}
                className="w-full px-3 py-2 rounded-lg bg-[#141414] border border-[#2c2c2e] text-white focus:outline-none focus:ring-2 focus:ring-[#667eea] focus:border-transparent"
              >
                <option value="">Select Property</option>
                {properties?.map(property => (
                  <option key={property.id} value={property.id}>
                    {property.name}
                  </option>
                ))}
              </select>
              {errors.property_id && (
                <p className="text-[#ff453a] text-sm mt-1">{errors.property_id.message}</p>
              )}
            </div>

            {/* Tenant Selection */}
            {selectedPropertyId && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#98989d] mb-2">
                    Assign to Tenant
                  </label>
                  <select
                    {...register('tenant_id')}
                    className="w-full px-3 py-2 rounded-lg bg-[#141414] border border-[#2c2c2e] text-white focus:outline-none focus:ring-2 focus:ring-[#667eea] focus:border-transparent"
                  >
                    <option value="">No specific tenant (property level)</option>
                    {tenants?.map(tenant => (
                      <option key={tenant.id} value={tenant.id}>
                        {tenant.first_name} {tenant.last_name} ({tenant.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    {...register('visible_to_all_tenants')}
                    id="visible-to-all"
                    className="w-4 h-4 text-[#667eea] bg-[#141414] border-[#2c2c2e] rounded focus:ring-[#667eea] focus:ring-2"
                  />
                  <label htmlFor="visible-to-all" className="text-sm text-[#98989d]">
                    Make visible to all tenants in this property
                  </label>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={!file || uploadMutation.isPending}
              >
                {uploadMutation.isPending ? 'Uploading...' : 'Upload Document'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}