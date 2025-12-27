import { create } from 'zustand'
import type { User, Facility, TimeEntry, Conversation, Notification } from '@/types'

interface AppState {
  // User state
  currentUser: User | null
  setCurrentUser: (user: User | null) => void

  // Users list
  users: User[]
  setUsers: (users: User[]) => void
  addUser: (user: User) => void
  updateUser: (user: User) => void

  // Facilities
  facilities: Facility[]
  setFacilities: (facilities: Facility[]) => void
  addFacility: (facility: Facility) => void
  updateFacility: (facility: Facility) => void

  // Time entries
  activeTimeEntry: TimeEntry | null
  setActiveTimeEntry: (entry: TimeEntry | null) => void

  // Conversations
  conversations: Conversation[]
  setConversations: (conversations: Conversation[]) => void
  activeConversation: Conversation | null
  setActiveConversation: (conversation: Conversation | null) => void

  // Notifications
  notifications: Notification[]
  setNotifications: (notifications: Notification[]) => void
  addNotification: (notification: Notification) => void
  unreadCount: number

  // UI state
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
}

export const useStore = create<AppState>((set) => ({
  // User state
  currentUser: null,
  setCurrentUser: (user) => set({ currentUser: user }),

  // Users list
  users: [],
  setUsers: (users) => set({ users }),
  addUser: (user) => set((state) => ({ users: [...state.users, user] })),
  updateUser: (user) =>
    set((state) => ({
      users: state.users.map((u) => (u.id === user.id ? user : u)),
    })),

  // Facilities
  facilities: [],
  setFacilities: (facilities) => set({ facilities }),
  addFacility: (facility) =>
    set((state) => ({ facilities: [...state.facilities, facility] })),
  updateFacility: (facility) =>
    set((state) => ({
      facilities: state.facilities.map((f) =>
        f.id === facility.id ? facility : f
      ),
    })),

  // Time entries
  activeTimeEntry: null,
  setActiveTimeEntry: (entry) => set({ activeTimeEntry: entry }),

  // Conversations
  conversations: [],
  setConversations: (conversations) => set({ conversations }),
  activeConversation: null,
  setActiveConversation: (conversation) =>
    set({ activeConversation: conversation }),

  // Notifications
  notifications: [],
  setNotifications: (notifications) =>
    set({
      notifications,
      unreadCount: notifications.filter((n) => !n.is_read).length,
    }),
  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    })),
  unreadCount: 0,

  // UI state
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}))
