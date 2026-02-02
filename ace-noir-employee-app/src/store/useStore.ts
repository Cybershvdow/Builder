import { create } from 'zustand'
import type { User, Facility, TimeEntry, Conversation, Notification, Client, Invoice, Receipt } from '@/types'

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

  // Billing - Clients
  clients: Client[]
  setClients: (clients: Client[]) => void
  addClient: (client: Client) => void
  updateClient: (client: Client) => void
  deleteClient: (clientId: string) => void

  // Billing - Invoices
  invoices: Invoice[]
  setInvoices: (invoices: Invoice[]) => void
  addInvoice: (invoice: Invoice) => void
  updateInvoice: (invoice: Invoice) => void
  deleteInvoice: (invoiceId: string) => void

  // Billing - Receipts
  receipts: Receipt[]
  setReceipts: (receipts: Receipt[]) => void
  addReceipt: (receipt: Receipt) => void
  updateReceipt: (receipt: Receipt) => void
  deleteReceipt: (receiptId: string) => void

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

  // Billing - Clients
  clients: [],
  setClients: (clients) => set({ clients }),
  addClient: (client) => set((state) => ({ clients: [...state.clients, client] })),
  updateClient: (client) =>
    set((state) => ({
      clients: state.clients.map((c) => (c.id === client.id ? client : c)),
    })),
  deleteClient: (clientId) =>
    set((state) => ({
      clients: state.clients.filter((c) => c.id !== clientId),
    })),

  // Billing - Invoices
  invoices: [],
  setInvoices: (invoices) => set({ invoices }),
  addInvoice: (invoice) => set((state) => ({ invoices: [...state.invoices, invoice] })),
  updateInvoice: (invoice) =>
    set((state) => ({
      invoices: state.invoices.map((i) => (i.id === invoice.id ? invoice : i)),
    })),
  deleteInvoice: (invoiceId) =>
    set((state) => ({
      invoices: state.invoices.filter((i) => i.id !== invoiceId),
    })),

  // Billing - Receipts
  receipts: [],
  setReceipts: (receipts) => set({ receipts }),
  addReceipt: (receipt) => set((state) => ({ receipts: [...state.receipts, receipt] })),
  updateReceipt: (receipt) =>
    set((state) => ({
      receipts: state.receipts.map((r) => (r.id === receipt.id ? receipt : r)),
    })),
  deleteReceipt: (receiptId) =>
    set((state) => ({
      receipts: state.receipts.filter((r) => r.id !== receiptId),
    })),

  // UI state
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}))
