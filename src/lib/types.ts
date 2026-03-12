// ─── Roles ─────────────────────────────────────────────
export type UserRole = 'admin' | 'subadmin' | 'limpieza'

// ─── Profiles ──────────────────────────────────────────
export interface Profile {
  id: string
  email: string
  full_name: string
  phone: string | null
  role: UserRole
  avatar_url: string | null
  location: string | null
  preferences: Record<string, unknown> | null
  hourly_rate: number | null
  is_active: boolean
  created_at: string
  updated_at: string
}

// ─── Departamentos ─────────────────────────────────────
export interface Depto {
  id: string
  name: string
  address: string
  city: string
  neighborhood: string | null
  airbnb_url: string | null
  airbnb_price_per_night: number | null
  owner_name: string
  owner_phone: string | null
  owner_email: string | null
  owner_percentage: number | null
  bedrooms: number
  bathrooms: number
  max_guests: number
  avg_cleaning_time_min: number | null
  notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

// ─── Asignaciones SA → Depto ───────────────────────────
export interface DeptoAssignment {
  id: string
  depto_id: string
  subadmin_id: string
  assigned_at: string
  depto?: Depto
  subadmin?: Profile
}

// ─── Reservas / Inquilinos ─────────────────────────────
export interface Booking {
  id: string
  depto_id: string
  guest_name: string
  guest_phone: string | null
  guest_email: string | null
  check_in: string
  check_out: string
  total_nights: number
  total_amount: number | null
  airbnb_fee: number | null
  status: 'upcoming' | 'active' | 'completed' | 'cancelled'
  checked_in_at: string | null
  checked_out_at: string | null
  checked_in_by: string | null
  checked_out_by: string | null
  notes: string | null
  created_at: string
  depto?: Depto
}

// ─── Gastos ────────────────────────────────────────────
export interface Expense {
  id: string
  depto_id: string
  uploaded_by: string
  category: 'servicios' | 'reparacion' | 'limpieza' | 'suministros' | 'impuestos' | 'otro'
  description: string
  amount: number
  receipt_url: string | null
  expense_date: string
  is_reimbursed: boolean
  reimbursed_at: string | null
  created_at: string
  depto?: Depto
  uploader?: Profile
}

// ─── Limpiezas ─────────────────────────────────────────
export interface CleaningJob {
  id: string
  depto_id: string
  booking_id: string | null
  assigned_by: string
  assigned_to: string | null
  scheduled_date: string
  scheduled_time: string | null
  cleaning_type: 'regular' | 'deep' | 'checkout'
  priority: 'normal' | 'urgent'
  tip_percentage: number | null
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'verified' | 'cancelled'
  accepted_at: string | null
  check_in_at: string | null
  check_out_at: string | null
  time_spent_min: number | null
  photos_before: string[] | null
  photos_after: string[] | null
  notes: string | null
  payment_amount: number | null
  is_paid: boolean
  created_at: string
  depto?: Depto
  booking?: Booking
  assignee?: Profile
  assigner?: Profile
}

// ─── Facturas / Pagos Pendientes ───────────────────────
export interface Invoice {
  id: string
  depto_id: string
  type: 'agua' | 'luz' | 'gas' | 'internet' | 'impuesto' | 'otro'
  description: string
  amount: number
  due_date: string
  is_paid: boolean
  paid_at: string | null
  receipt_url: string | null
  created_at: string
  depto?: Depto
}

// ─── Stats Dashboard ───────────────────────────────────
export interface DashboardStats {
  totalDeptos: number
  activeBookings: number
  monthlyRevenue: number
  monthlyExpenses: number
  pendingCleanings: number
  occupancyRate: number
  pendingInvoices: number
  activeSubadmins: number
}

// ─── Notificaciones ────────────────────────────────────
export interface Notification {
  id: string
  user_id: string
  title: string
  body: string | null
  type: 'cleaning_assigned' | 'booking_created' | 'booking_updated' | 'payment_received' | 'expense_reimbursed' | 'general'
  is_read: boolean
  data: Record<string, unknown> | null
  created_at: string
}
