import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { messagesApi, Message } from '../lib/api/messages'
import { MessageSquare, Send, User } from 'lucide-react'
import { toast } from 'sonner'

export function MessagesPage() {
  const queryClient = useQueryClient()
  const [messageText, setMessageText] = useState('')

  const { data: conversations, isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: messagesApi.getConversations,
  })

  const conversation = conversations?.[0] // Tenant only has one conversation

  const sendMessageMutation = useMutation({
    mutationFn: messagesApi.sendMessage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      setMessageText('')
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

  // Mark messages as read when conversation loads
  useEffect(() => {
    if (conversation && conversation.unread_count > 0) {
      markAllReadMutation.mutate(conversation.tenant_id)
    }
  }, [conversation?.tenant_id])

  const handleSendMessage = () => {
    if (!messageText.trim() || !conversation) return

    // Get operator user_id from messages (receiver if tenant sent, sender if operator sent)
    const operatorMessage = conversation.messages.find((m: Message) => m.sender_role === 'operator')
    const tenantMessage = conversation.messages.find((m: Message) => m.sender_role === 'tenant')
    
    const receiver_id = operatorMessage?.sender_id || tenantMessage?.receiver_id

    if (!receiver_id) {
      toast.error('Cannot determine receiver')
      return
    }

    sendMessageMutation.mutate({
      receiver_id,
      tenant_id: conversation.tenant_id,
      message: messageText,
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-white">Loading messages...</div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Messages</h1>
        <p className="text-[#98989d]">Chat with your property manager</p>
      </div>

      {/* Chat Card */}
      <div className="bg-[#1c1c1e] border border-[#2c2c2e] rounded-2xl overflow-hidden">
        {conversation ? (
          <>
            {/* Chat Header */}
            <div className="border-b border-[#2c2c2e] p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Property Manager</h2>
                  <p className="text-sm text-[#98989d]">{conversation.property_name}</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="h-[500px] overflow-y-auto p-6 space-y-4 bg-[#141414]">
              {conversation.messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <MessageSquare className="w-16 h-16 mx-auto mb-4 text-[#636366]" />
                    <p className="text-[#98989d]">No messages yet. Start a conversation!</p>
                  </div>
                </div>
              ) : (
                conversation.messages.map((msg: Message) => {
                  const isTenant = msg.sender_role === 'tenant'
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isTenant ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] p-4 rounded-2xl ${
                          isTenant
                            ? 'bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white'
                            : 'bg-[#1c1c1e] text-white border border-[#2c2c2e]'
                        }`}
                      >
                        <p className="text-sm font-semibold mb-2">{msg.sender_name}</p>
                        <p className="whitespace-pre-wrap">{msg.message}</p>
                        <p className="text-xs mt-2 opacity-70">
                          {new Date(msg.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Message Input */}
            <div className="border-t border-[#2c2c2e] p-6">
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
                  placeholder="Type your message... (Press Enter to send)"
                  className="flex-1 px-4 py-3 bg-[#141414] border border-[#2c2c2e] rounded-xl text-white placeholder-[#636366] focus:outline-none focus:ring-2 focus:ring-[#667eea] resize-none"
                  rows={3}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!messageText.trim() || sendMessageMutation.isPending}
                  className="px-6 py-3 bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-xl font-semibold hover:shadow-lg hover:shadow-[#667eea]/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  <span className="hidden sm:inline">Send</span>
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-[600px]">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 text-[#636366]" />
              <p className="text-[#98989d]">No conversation available yet</p>
              <p className="text-sm text-[#636366] mt-2">Your property manager will appear here once they send you a message</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
