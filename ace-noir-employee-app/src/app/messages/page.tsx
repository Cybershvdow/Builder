'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useStore } from '@/store/useStore'
import { formatDateTime, getInitials } from '@/lib/utils'
import type { Conversation, Message, User } from '@/types'
import toast from 'react-hot-toast'
import {
  PlusIcon,
  PaperAirplaneIcon,
  UserGroupIcon,
  UserIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline'

export default function MessagesPage() {
  const supabase = createClient()
  const { currentUser, users, conversations, setConversations, activeConversation, setActiveConversation } = useStore()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [showNewConversation, setShowNewConversation] = useState(false)
  const [showNewGroup, setShowNewGroup] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'manager'

  useEffect(() => {
    const fetchConversations = async () => {
      if (!currentUser) return

      try {
        const { data } = await supabase
          .from('conversation_participants')
          .select(`
            conversation:conversations(
              id,
              type,
              name,
              created_by,
              created_at,
              updated_at
            )
          `)
          .eq('user_id', currentUser.id)
          .order('joined_at', { ascending: false })

        if (data) {
          const convos = data
            .map((d) => d.conversation)
            .filter((c): c is Conversation => c !== null)

          // Fetch participants for each conversation
          const withParticipants = await Promise.all(
            convos.map(async (convo) => {
              const { data: participants } = await supabase
                .from('conversation_participants')
                .select('*, user:profiles(*)')
                .eq('conversation_id', convo.id)

              return { ...convo, participants: participants || [] }
            })
          )

          setConversations(withParticipants)
        }

        setLoading(false)
      } catch (error) {
        console.error('Error fetching conversations:', error)
        setLoading(false)
      }
    }

    fetchConversations()
  }, [currentUser, supabase, setConversations])

  useEffect(() => {
    if (!activeConversation) return

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*, sender:profiles(*)')
        .eq('conversation_id', activeConversation.id)
        .order('created_at', { ascending: true })

      if (data) setMessages(data)
    }

    fetchMessages()

    // Subscribe to new messages
    const channel = supabase
      .channel(`messages:${activeConversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${activeConversation.id}`,
        },
        async (payload) => {
          const { data: newMsg } = await supabase
            .from('messages')
            .select('*, sender:profiles(*)')
            .eq('id', payload.new.id)
            .single()

          if (newMsg) {
            setMessages((prev) => [...prev, newMsg])
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [activeConversation, supabase])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !activeConversation || !currentUser) return

    setSending(true)

    try {
      const { error } = await supabase.from('messages').insert({
        conversation_id: activeConversation.id,
        sender_id: currentUser.id,
        content: newMessage.trim(),
      })

      if (error) throw error

      setNewMessage('')
    } catch (error) {
      toast.error('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const getConversationName = (convo: Conversation) => {
    if (convo.type === 'group') return convo.name || 'Group Chat'

    const otherParticipant = convo.participants?.find(
      (p) => p.user_id !== currentUser?.id
    )
    return otherParticipant?.user?.full_name || 'Unknown'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner w-8 h-8"></div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-180px)] flex animate-fade-in">
      {/* Conversations List */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-ace-black">Messages</h2>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowNewConversation(true)}
                className="p-2 text-ace-gold hover:bg-ace-gold/10 rounded-lg"
                title="New message"
              >
                <PlusIcon className="w-5 h-5" />
              </button>
              {isAdmin && (
                <button
                  onClick={() => setShowNewGroup(true)}
                  className="p-2 text-ace-gold hover:bg-ace-gold/10 rounded-lg"
                  title="New group"
                >
                  <UserGroupIcon className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No conversations yet
            </div>
          ) : (
            conversations.map((convo) => (
              <button
                key={convo.id}
                onClick={() => setActiveConversation(convo)}
                className={`w-full p-4 text-left border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                  activeConversation?.id === convo.id ? 'bg-ace-gold/10' : ''
                }`}
              >
                <div className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    convo.type === 'group' ? 'bg-purple-100 text-purple-600' : 'bg-ace-gold text-ace-black'
                  }`}>
                    {convo.type === 'group' ? (
                      <UserGroupIcon className="w-5 h-5" />
                    ) : (
                      <span className="font-semibold">
                        {getInitials(getConversationName(convo))}
                      </span>
                    )}
                  </div>
                  <div className="ml-3 flex-1 min-w-0">
                    <p className="font-medium text-ace-black truncate">
                      {getConversationName(convo)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {convo.type === 'group' ? `${convo.participants?.length || 0} members` : 'Direct message'}
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {activeConversation ? (
          <>
            {/* Chat Header */}
            <div className="px-6 py-4 bg-white border-b border-gray-200">
              <div className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  activeConversation.type === 'group' ? 'bg-purple-100 text-purple-600' : 'bg-ace-gold text-ace-black'
                }`}>
                  {activeConversation.type === 'group' ? (
                    <UserGroupIcon className="w-5 h-5" />
                  ) : (
                    <span className="font-semibold">
                      {getInitials(getConversationName(activeConversation))}
                    </span>
                  )}
                </div>
                <div className="ml-3">
                  <h3 className="font-semibold text-ace-black">
                    {getConversationName(activeConversation)}
                  </h3>
                  {activeConversation.type === 'group' && (
                    <p className="text-xs text-gray-500">
                      {activeConversation.participants?.map((p) => p.user?.full_name).join(', ')}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((message) => {
                const isOwn = message.sender_id === currentUser?.id
                return (
                  <div
                    key={message.id}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[70%] ${isOwn ? 'order-2' : ''}`}>
                      {!isOwn && (
                        <p className="text-xs text-gray-500 mb-1 ml-1">
                          {message.sender?.full_name}
                        </p>
                      )}
                      <div
                        className={`px-4 py-2 rounded-2xl ${
                          isOwn
                            ? 'bg-ace-gold text-ace-black rounded-br-md'
                            : 'bg-white text-ace-black rounded-bl-md shadow-sm'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>
                      <p className={`text-xs text-gray-400 mt-1 ${isOwn ? 'text-right mr-1' : 'ml-1'}`}>
                        {formatDateTime(message.created_at)}
                      </p>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-200">
              <div className="flex items-center space-x-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 form-input"
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  className="p-3 bg-ace-gold text-ace-black rounded-lg hover:bg-ace-gold-dark disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PaperAirplaneIcon className="w-5 h-5" />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <UserIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>

      {/* New Conversation Modal */}
      {showNewConversation && (
        <NewConversationModal
          users={users.filter((u) => u.id !== currentUser?.id)}
          currentUserId={currentUser?.id || ''}
          onClose={() => setShowNewConversation(false)}
          onCreated={(convo) => {
            setConversations([convo, ...conversations])
            setActiveConversation(convo)
            setShowNewConversation(false)
          }}
        />
      )}

      {/* New Group Modal */}
      {showNewGroup && (
        <NewGroupModal
          users={users.filter((u) => u.id !== currentUser?.id)}
          currentUserId={currentUser?.id || ''}
          onClose={() => setShowNewGroup(false)}
          onCreated={(convo) => {
            setConversations([convo, ...conversations])
            setActiveConversation(convo)
            setShowNewGroup(false)
          }}
        />
      )}
    </div>
  )
}

function NewConversationModal({
  users,
  currentUserId,
  onClose,
  onCreated,
}: {
  users: User[]
  currentUserId: string
  onClose: () => void
  onCreated: (convo: Conversation) => void
}) {
  const supabase = createClient()
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)

  const filteredUsers = users.filter((u) =>
    u.full_name.toLowerCase().includes(search.toLowerCase())
  )

  const handleSelect = async (user: User) => {
    setLoading(true)

    try {
      // Create conversation
      const { data: convo, error: convoError } = await supabase
        .from('conversations')
        .insert({
          type: 'direct',
          created_by: currentUserId,
        })
        .select()
        .single()

      if (convoError) throw convoError

      // Add participants
      await supabase.from('conversation_participants').insert([
        { conversation_id: convo.id, user_id: currentUserId },
        { conversation_id: convo.id, user_id: user.id },
      ])

      // Fetch with participants
      const { data: fullConvo } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', convo.id)
        .single()

      const { data: participants } = await supabase
        .from('conversation_participants')
        .select('*, user:profiles(*)')
        .eq('conversation_id', convo.id)

      toast.success('Conversation started!')
      onCreated({ ...fullConvo, participants } as Conversation)
    } catch (error) {
      toast.error('Failed to start conversation')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full animate-slide-in">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-ace-black">New Message</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="p-4">
          <div className="relative mb-4">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input pl-10"
            />
          </div>
          <div className="max-h-64 overflow-y-auto space-y-1">
            {filteredUsers.map((user) => (
              <button
                key={user.id}
                onClick={() => handleSelect(user)}
                disabled={loading}
                className="w-full flex items-center p-3 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                <div className="w-10 h-10 bg-ace-gold rounded-full flex items-center justify-center">
                  <span className="text-ace-black font-semibold">
                    {getInitials(user.full_name)}
                  </span>
                </div>
                <div className="ml-3 text-left">
                  <p className="font-medium text-ace-black">{user.full_name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function NewGroupModal({
  users,
  currentUserId,
  onClose,
  onCreated,
}: {
  users: User[]
  currentUserId: string
  onClose: () => void
  onCreated: (convo: Conversation) => void
}) {
  const supabase = createClient()
  const [groupName, setGroupName] = useState('')
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const handleCreate = async () => {
    if (!groupName.trim() || selectedUsers.length === 0) {
      toast.error('Please enter a group name and select at least one member')
      return
    }

    setLoading(true)

    try {
      const { data: convo, error: convoError } = await supabase
        .from('conversations')
        .insert({
          type: 'group',
          name: groupName.trim(),
          created_by: currentUserId,
        })
        .select()
        .single()

      if (convoError) throw convoError

      // Add all participants including current user
      const participants = [currentUserId, ...selectedUsers].map((userId) => ({
        conversation_id: convo.id,
        user_id: userId,
      }))

      await supabase.from('conversation_participants').insert(participants)

      const { data: fullParticipants } = await supabase
        .from('conversation_participants')
        .select('*, user:profiles(*)')
        .eq('conversation_id', convo.id)

      toast.success('Group created!')
      onCreated({ ...convo, participants: fullParticipants } as Conversation)
    } catch (error) {
      toast.error('Failed to create group')
    } finally {
      setLoading(false)
    }
  }

  const toggleUser = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full animate-slide-in">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-ace-black">Create Group</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label htmlFor="groupName" className="form-label">Group Name *</label>
            <input
              id="groupName"
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="form-input"
              placeholder="e.g., Team Alpha"
            />
          </div>
          <div>
            <label className="form-label">Select Members *</label>
            <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
              {users.map((user) => (
                <label
                  key={user.id}
                  className="flex items-center p-3 hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.id)}
                    onChange={() => toggleUser(user.id)}
                    className="w-4 h-4 text-ace-gold border-gray-300 rounded focus:ring-ace-gold"
                  />
                  <span className="ml-3 text-ace-black">{user.full_name}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex space-x-3 pt-2">
            <button type="button" onClick={onClose} className="btn-outline flex-1">
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={loading}
              className="btn-primary flex-1"
            >
              {loading ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
