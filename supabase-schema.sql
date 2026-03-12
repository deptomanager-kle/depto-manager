-- =============================================
-- DeptoManager - Supabase Schema Completo
-- Sistema de gestión de departamentos Airbnb
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- =============================================

-- ─── 1. Profiles (extiende auth.users) ─────────────────
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  full_name text not null default '',
  phone text,
  role text not null default 'limpieza' check (role in ('admin', 'subadmin', 'limpieza')),
  avatar_url text,
  location text,
  preferences jsonb default '{}',
  hourly_rate numeric(10,2),
  is_active boolean default true,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index idx_profiles_role on public.profiles(role);
create index idx_profiles_is_active on public.profiles(is_active);

-- ─── 2. Departamentos ──────────────────────────────────
create table public.deptos (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  address text not null,
  city text not null default '',
  neighborhood text,
  airbnb_url text,
  airbnb_price_per_night numeric(10,2),
  owner_name text not null default '',
  owner_phone text,
  owner_email text,
  owner_percentage numeric(5,2) default 0,
  bedrooms smallint default 1,
  bathrooms smallint default 1,
  max_guests smallint default 2,
  avg_cleaning_time_min smallint,
  notes text,
  is_active boolean default true,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index idx_deptos_city on public.deptos(city);
create index idx_deptos_is_active on public.deptos(is_active);

-- ─── 3. Asignaciones SubAdmin → Depto ──────────────────
create table public.depto_assignments (
  id uuid default gen_random_uuid() primary key,
  depto_id uuid references public.deptos(id) on delete cascade not null,
  subadmin_id uuid references public.profiles(id) on delete cascade not null,
  assigned_at timestamptz default now() not null,
  unique(depto_id, subadmin_id)
);

create index idx_assignments_subadmin on public.depto_assignments(subadmin_id);
create index idx_assignments_depto on public.depto_assignments(depto_id);

-- ─── 4. Reservas (Bookings / Inquilinos) ───────────────
create table public.bookings (
  id uuid default gen_random_uuid() primary key,
  depto_id uuid references public.deptos(id) on delete cascade not null,
  guest_name text not null,
  guest_phone text,
  guest_email text,
  check_in date not null,
  check_out date not null,
  total_nights smallint not null,
  total_amount numeric(12,2),
  airbnb_fee numeric(12,2),
  status text not null default 'upcoming' check (status in ('upcoming', 'active', 'completed', 'cancelled')),
  checked_in_at timestamptz,
  checked_out_at timestamptz,
  checked_in_by uuid references public.profiles(id),
  checked_out_by uuid references public.profiles(id),
  notes text,
  created_at timestamptz default now() not null
);

create index idx_bookings_depto on public.bookings(depto_id);
create index idx_bookings_status on public.bookings(status);
create index idx_bookings_check_in on public.bookings(check_in);
create index idx_bookings_check_out on public.bookings(check_out);

-- ─── 5. Gastos ─────────────────────────────────────────
create table public.expenses (
  id uuid default gen_random_uuid() primary key,
  depto_id uuid references public.deptos(id) on delete cascade not null,
  uploaded_by uuid references public.profiles(id) not null,
  category text not null default 'otro' check (category in ('servicios', 'reparacion', 'limpieza', 'suministros', 'impuestos', 'otro')),
  description text not null,
  amount numeric(12,2) not null,
  receipt_url text,
  expense_date date not null default current_date,
  is_reimbursed boolean default false,
  reimbursed_at timestamptz,
  created_at timestamptz default now() not null
);

create index idx_expenses_depto on public.expenses(depto_id);
create index idx_expenses_category on public.expenses(category);
create index idx_expenses_date on public.expenses(expense_date);

-- ─── 6. Trabajos de Limpieza ───────────────────────────
create table public.cleaning_jobs (
  id uuid default gen_random_uuid() primary key,
  depto_id uuid references public.deptos(id) on delete cascade not null,
  booking_id uuid references public.bookings(id) on delete set null,
  assigned_by uuid references public.profiles(id) not null,
  assigned_to uuid references public.profiles(id),
  scheduled_date date not null,
  scheduled_time time,
  cleaning_type text not null default 'regular' check (cleaning_type in ('regular', 'deep', 'checkout')),
  priority text not null default 'normal' check (priority in ('normal', 'urgent')),
  tip_percentage numeric(5,2) default 0,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'in_progress', 'completed', 'verified', 'cancelled')),
  accepted_at timestamptz,
  check_in_at timestamptz,
  check_out_at timestamptz,
  time_spent_min smallint,
  photos_before text[] default '{}',
  photos_after text[] default '{}',
  notes text,
  payment_amount numeric(10,2),
  is_paid boolean default false,
  created_at timestamptz default now() not null
);

create index idx_cleaning_depto on public.cleaning_jobs(depto_id);
create index idx_cleaning_assigned_to on public.cleaning_jobs(assigned_to);
create index idx_cleaning_status on public.cleaning_jobs(status);
create index idx_cleaning_scheduled on public.cleaning_jobs(scheduled_date);

-- ─── 7. Facturas / Servicios ───────────────────────────
create table public.invoices (
  id uuid default gen_random_uuid() primary key,
  depto_id uuid references public.deptos(id) on delete cascade not null,
  type text not null default 'otro' check (type in ('agua', 'luz', 'gas', 'internet', 'impuesto', 'otro')),
  description text not null default '',
  amount numeric(12,2) not null,
  due_date date not null,
  is_paid boolean default false,
  paid_at timestamptz,
  receipt_url text,
  created_at timestamptz default now() not null
);

create index idx_invoices_depto on public.invoices(depto_id);
create index idx_invoices_due on public.invoices(due_date);
create index idx_invoices_paid on public.invoices(is_paid);

-- ─── 8. Notificaciones ─────────────────────────────────
create table public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  body text,
  type text not null default 'general' check (type in ('cleaning_assigned', 'booking_created', 'booking_updated', 'payment_received', 'expense_reimbursed', 'general')),
  is_read boolean default false,
  data jsonb default '{}',
  created_at timestamptz default now() not null
);

create index idx_notifications_user on public.notifications(user_id);
create index idx_notifications_read on public.notifications(is_read);

-- ─── RLS (Row Level Security) ──────────────────────────

alter table public.profiles enable row level security;
alter table public.deptos enable row level security;
alter table public.depto_assignments enable row level security;
alter table public.bookings enable row level security;
alter table public.expenses enable row level security;
alter table public.cleaning_jobs enable row level security;
alter table public.invoices enable row level security;
alter table public.notifications enable row level security;

-- Helper: obtener rol del usuario actual
create or replace function public.get_user_role()
returns text as $$
  select role from public.profiles where id = auth.uid();
$$ language sql security definer stable;

-- Helper: verificar si SA tiene asignado un depto
create or replace function public.is_assigned_to_depto(p_depto_id uuid)
returns boolean as $$
  select exists(
    select 1 from public.depto_assignments
    where subadmin_id = auth.uid() and depto_id = p_depto_id
  );
$$ language sql security definer stable;

-- ─── Policies: Profiles ────────────────────────────────

create policy "Admin can see all profiles"
  on public.profiles for select
  using (public.get_user_role() = 'admin');

create policy "SA can see own + limpieza profiles"
  on public.profiles for select
  using (
    public.get_user_role() = 'subadmin'
    and (id = auth.uid() or role = 'limpieza')
  );

create policy "Limpieza can see own profile"
  on public.profiles for select
  using (id = auth.uid());

create policy "Admin can manage all profiles"
  on public.profiles for all
  using (public.get_user_role() = 'admin');

create policy "Users can update own profile"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- ─── Policies: Deptos ──────────────────────────────────

create policy "Admin full access deptos"
  on public.deptos for all
  using (public.get_user_role() = 'admin');

create policy "SA can see assigned deptos"
  on public.deptos for select
  using (
    public.get_user_role() = 'subadmin'
    and public.is_assigned_to_depto(id)
  );

-- ─── Policies: Assignments ─────────────────────────────

create policy "Admin full access assignments"
  on public.depto_assignments for all
  using (public.get_user_role() = 'admin');

create policy "SA can see own assignments"
  on public.depto_assignments for select
  using (subadmin_id = auth.uid());

-- ─── Policies: Bookings ────────────────────────────────

create policy "Admin full access bookings"
  on public.bookings for all
  using (public.get_user_role() = 'admin');

create policy "SA can manage bookings of assigned deptos"
  on public.bookings for all
  using (
    public.get_user_role() = 'subadmin'
    and public.is_assigned_to_depto(depto_id)
  );

-- ─── Policies: Expenses ────────────────────────────────

create policy "Admin full access expenses"
  on public.expenses for all
  using (public.get_user_role() = 'admin');

create policy "SA can manage expenses of assigned deptos"
  on public.expenses for all
  using (
    public.get_user_role() = 'subadmin'
    and public.is_assigned_to_depto(depto_id)
  );

-- ─── Policies: Cleaning Jobs ───────────────────────────

create policy "Admin full access cleaning"
  on public.cleaning_jobs for all
  using (public.get_user_role() = 'admin');

create policy "SA can manage cleaning of assigned deptos"
  on public.cleaning_jobs for all
  using (
    public.get_user_role() = 'subadmin'
    and public.is_assigned_to_depto(depto_id)
  );

create policy "PL can see and update assigned cleaning jobs"
  on public.cleaning_jobs for select
  using (assigned_to = auth.uid());

create policy "PL can update own cleaning jobs"
  on public.cleaning_jobs for update
  using (assigned_to = auth.uid())
  with check (assigned_to = auth.uid());

-- ─── Policies: Invoices ────────────────────────────────

create policy "Admin full access invoices"
  on public.invoices for all
  using (public.get_user_role() = 'admin');

create policy "SA can manage invoices of assigned deptos"
  on public.invoices for all
  using (
    public.get_user_role() = 'subadmin'
    and public.is_assigned_to_depto(depto_id)
  );

-- ─── Policies: Notifications ───────────────────────────

create policy "Users see own notifications"
  on public.notifications for select
  using (user_id = auth.uid());

create policy "Users update own notifications"
  on public.notifications for update
  using (user_id = auth.uid());

create policy "Users delete own notifications"
  on public.notifications for delete
  using (user_id = auth.uid());

-- Admin/SA can insert notifications for others
create policy "Admin/SA can create notifications"
  on public.notifications for insert
  with check (
    public.get_user_role() in ('admin', 'subadmin')
  );

-- ─── Triggers: auto-update updated_at ──────────────────

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger set_deptos_updated_at
  before update on public.deptos
  for each row execute function public.handle_updated_at();

-- ─── Trigger: crear perfil al registrarse ──────────────

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'limpieza')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
