import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { messagesApi, Conversation } from '@/lib/api/messages'
import { propertiesApi } from '@/lib/api/properties'
import { tenantsApi } from '@/lib/api/tenants'
import { TenantWithUser } from '@/types'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { SearchInput } from '@/components/ui/SearchInput'
import { LoadingScreen } from '@/components/ui/Spinner'
import { MessageSquare, Send, User, MapPin, Plus, X } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'

export function MessagesPage() {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messageText, setMessageText] = useState('')
  const [showNewMessageModal, setShowNewMessageModal] = useState(false)
  const [selectedTenantId, setSelectedTenantId] = useState<string>('')

  const { data: conversations, isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: messagesApi.getConversations,
  })

  // Get all properties first
  const { data: properties } = useQuery({
    queryKey: ['properties'],
    queryFn: propertiesApi.getAll,
  })

  // Get all tenants across all properties
  const { data: allTenants } = useQuery<TenantWithUser[]>({
    queryKey: ['all-tenants-for-messages', properties?.map(p => p.id)],
    queryFn: async () => {
      if (!properties || properties.length === 0) return []
      // Fetch tenants for all properties and combine them
      const tenantPromises = properties.map(property => 
        tenantsApi.getByProperty(property.id)
      )
      const tenantArrays = await Promise.all(tenantPromises)
      return tenantArrays.flat()
    },
    enabled: !!properties && properties.length > 0,
  })

  const sendMessageMutation = useMutation({
    mutationFn: messagesApi.sendMessage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      setMessageText('')
      setShowNewMessageModal(false)
      setSelectedTenantId('')
      toast.success('Message sent')
    },
    onError: () => {
      toast.error('Failed to send message')
    },
  })

  const markAllReadMutation = useMutation({
    mutationFn: messagesApi.markAllRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })

  if (isLoading) {
    return <LoadingScreen message="Loading messages..." />
  }

  const filteredConversations = conversations?.filter((conv) =>
    conv.tenant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.tenant_email.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  // Get tenants without existing conversations
  const tenantsWithoutConversations = allTenants?.filter(
    (tenant: TenantWithUser) => !conversations?.some(conv => conv.tenant_id === tenant.id)
  ) || []

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedConversation) return

    // Get tenant user_id from first message
    const tenantMessage = selectedConversation.messages.find(m => m.sender_role === 'tenant')
    const receiver_id = tenantMessage?.sender_id || selectedConversation.messages[0]?.sender_id

    if (!receiver_id) {
      toast.error('Cannot determine receiver')
      return
    }

    sendMessageMutation.mutate({
      receiver_id,
      tenant_id: selectedConversation.tenant_id,
      message: messageText,
    })
  }

  const handleStartNewConversation = () => {
    if (!messageText.trim() || !selectedTenantId) {
      toast.error('Please select a tenant and enter a message')
      return
    }

    const selectedTenant = allTenants?.find((t: TenantWithUser) => t.id === selectedTenantId)
    if (!selectedTenant) return

    sendMessageMutation.mutate({
      receiver_id: selectedTenant.user_id,
      tenant_id: selectedTenantId,
      message: messageText,
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Messages</h1>
          <p className="text-[#98989d] mt-1">
            Communicate with your tenants
          </p>
        </div>
        <Button onClick={() => setShowNewMessageModal(true)}>
          <Plus className="w-5 h-5 mr-2" />
          New Message
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversations List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Conversations</h2>
              {conversations && conversations.length > 0 && (
                <span className="px-2 py-1 rounded-full bg-[#667eea]/20 text-[#667eea] text-sm">
                  {conversations.length}
                </span>
              )}
            </div>
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search tenants..."
            />
          </CardHeader>
          <CardContent>
            {filteredConversations.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 text-[#636366]" />
                <p className="text-[#98989d] mb-4">No conversations yet</p>
                <Button onClick={() => setShowNewMessageModal(true)} variant="secondary">
                  Start a conversation
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredConversations.map((conv) => (
                  <button
                    key={conv.tenant_id}
                    onClick={() => {
                      setSelectedConversation(conv)
                      if (conv.unread_count > 0) {
                        markAllReadMutation.mutate(conv.tenant_id)
                      }
                    }}
                    className={`w-full text-left p-4 rounded-lg transition-colors ${
                      selectedConversation?.tenant_id === conv.tenant_id
                        ? 'bg-[#667eea]/20 border border-[#667eea]/50'
                        : 'bg-[#1c1c1e] hover:bg-[#2c2c2e] border border-[#2c2c2e]'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-white">{conv.tenant_name}</p>
                          <div className="flex items-center gap-1 text-xs text-[#98989d]">
                            <MapPin className="w-3 h-3" />
                            <span>{conv.property_name} - Unit {conv.unit_number}</span>
                          </div>
                        </div>
                      </div>
                      {conv.unread_count > 0 && (
                        <span className="px-2 py-1 rounded-full bg-[#ff453a] text-white text-xs font-semibold">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[#98989d] truncate">{conv.last_message}</p>
                    <p className="text-xs text-[#636366] mt-1">{formatDate(conv.last_message_time)}</p>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chat Window */}
        <Card className="lg:col-span-2">
          {selectedConversation ? (
            <>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-white">{selectedConversation.tenant_name}</h2>
                    <p className="text-sm text-[#98989d]">{selectedConversation.tenant_email}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Messages */}
                <div className="h-[400px] overflow-y-auto mb-4 space-y-4 p-4 bg-[#141414] rounded-lg">
                  {selectedConversation.messages.map((msg) => {
                    const isOperator = msg.sender_role === 'operator'
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isOperator ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] p-3 rounded-lg ${
                            isOperator
                              ? 'bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white'
                              : 'bg-[#1c1c1e] text-white'
                          }`}
                        >
                          <p className="text-sm font-semibold mb-1">{msg.sender_name}</p>
                          <p>{msg.message}</p>
                          <p className="text-xs mt-1 opacity-70">{formatDate(msg.created_at)}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Message Input */}
                <div className="flex gap-3">
                  <textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-3 bg-[#1c1c1e] border border-[#2c2c2e] rounded-lg text-white placeholder-[#636366] focus:outline-none focus:ring-2 focus:ring-[#667eea] resize-none"
                    rows={3}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!messageText.trim() || sendMessageMutation.isPending}
                    className="px-6"
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </div>
              </CardContent>
            </>
          ) : (
            <div className="flex items-center justify-center h-full py-20">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 text-[#636366]" />
                <p className="text-[#98989d] mb-4">Select a conversation to start messaging</p>
                <Button onClick={() => setShowNewMessageModal(true)}>
                  <Plus className="w-5 h-5 mr-2" />
                  Start New Conversation
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* New Message Modal */}
      {showNewMessageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-[#1c1c1e] border border-[#2c2c2e] rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-[#2c2c2e]">
              <h2 className="text-xl font-semibold text-white">New Message</h2>
              <button
                onClick={() => {
                  setShowNewMessageModal(false)
                  setMessageText('')
                  setSelectedTenantId('')
                }}
                className="p-2 rounded-lg hover:bg-[#2c2c2e] transition-colors"
              >
                <X className="w-5 h-5 text-[#98989d]" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#98989d] mb-2">
                  Select Tenant
                </label>
                <select
                  value={selectedTenantId}
                  onChange={(e) => setSelectedTenantId(e.target.value)}
                  className="w-full px-4 py-3 bg-[#141414] border border-[#2c2c2e] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#667eea]"
                >
                  <option value="">Choose a tenant...</option>
                  {tenantsWithoutConversations.map((tenant: TenantWithUser) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.first_name && tenant.last_name 
                        ? `${tenant.first_name} ${tenant.last_name}` 
                        : tenant.email} - {tenant.property_name}, Unit {tenant.unit_number}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#98989d] mb-2">
                  Message
                </label>
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type your message..."
                  className="w-full px-4 py-3 bg-[#141414] border border-[#2c2c2e] rounded-lg text-white placeholder-[#636366] focus:outline-none focus:ring-2 focus:ring-[#667eea] resize-none"
                  rows={5}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-[#2c2c2e]">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowNewMessageModal(false)
                  setMessageText('')
                  setSelectedTenantId('')
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleStartNewConversation}
                disabled={!messageText.trim() || !selectedTenantId || sendMessageMutation.isPending}
              >
                <Send className="w-5 h-5 mr-2" />
                Send Message
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
