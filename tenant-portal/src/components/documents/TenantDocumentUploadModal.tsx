// Create src/components/documents/TenantDocumentUploadModal.tsx
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { documentsApi, DocumentUploadData } from '@/lib/api/documents'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { X, Upload, CheckCircle } from 'lucide-react'

interface TenantDocumentUploadModalProps {
  onClose: () => void
}

export function TenantDocumentUploadModal({ onClose }: TenantDocumentUploadModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const queryClient = useQueryClient()

  const { register, handleSubmit, formState: { errors } } = useForm<DocumentUploadData>()

  const uploadMutation = useMutation({
    mutationFn: (data: DocumentUploadData & { file: File }) => 
      documentsApi.uploadDocument(data.file, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-documents'] })
      toast.success('Document uploaded successfully!')
      onClose()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to upload document')
    },
  })

  const handleFileSelect = (selectedFile: File) => {
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (selectedFile.size > maxSize) {
      toast.error('File size must be less than 10MB')
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
      <Card className="w-full max-w-lg">
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
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* File Drop Zone */}
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
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
                <div className="space-y-3">
                  <div className="flex items-center justify-center">
                    <div className="p-2 rounded-full bg-[#32d74b]/20">
                      <CheckCircle className="w-6 h-6 text-[#32d74b]" />
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
                <div className="space-y-3">
                  <div className="flex items-center justify-center">
                    <div className="p-2 rounded-full bg-[#667eea]/20">
                      <Upload className="w-6 h-6 text-[#667eea]" />
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

            <p className="text-xs text-[#636366] text-center">
              Max file size: 10MB
            </p>

            {/* Document Info */}
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
                placeholder="e.g., Insurance, ID, Employment"
              />
              {errors.document_type && (
                <p className="text-[#ff453a] text-sm mt-1">{errors.document_type.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#98989d] mb-2">
                Description
              </label>
              <textarea
                {...register('description')}
                className="w-full px-3 py-2 rounded-lg bg-[#141414] border border-[#2c2c2e] text-white placeholder:text-[#636366] focus:outline-none focus:ring-2 focus:ring-[#667eea] focus:border-transparent"
                placeholder="Optional description"
                rows={2}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
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
                {uploadMutation.isPending ? 'Uploading...' : 'Upload'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}