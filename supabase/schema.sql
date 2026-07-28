-- Sistema de Cotizaciones - Schema Supabase

create table if not exists empresa (
  id uuid default gen_random_uuid() primary key,
  logo text,
  razon_social text not null default '',
  rut text not null default '',
  giro text not null default '',
  direccion text not null default '',
  ciudad text not null default '',
  telefono text not null default '',
  email text not null default '',
  ejecutivo text not null default '',
  condicion_pago text not null default 'Contado',
  validez_oferta text not null default '10 días',
  datos_bancarios text,
  created_at timestamptz default now()
);

create table if not exists clientes (
  id uuid default gen_random_uuid() primary key,
  razon_social text not null,
  rut text not null default '',
  giro text not null default '',
  direccion text not null default '',
  ciudad text not null default '',
  telefono text not null default '',
  email text not null default '',
  contacto text not null default '',
  created_at timestamptz default now()
);

create table if not exists cotizaciones (
  id uuid default gen_random_uuid() primary key,
  numero text not null unique,
  cliente_id uuid references clientes(id) on delete set null,
  fecha date not null,
  compra_agil text not null default '',
  condicion_pago text not null default '',
  validez text not null default '',
  observaciones text not null default '',
  subtotal numeric(14,2) not null default 0,
  iva numeric(14,2) not null default 0,
  total numeric(14,2) not null default 0,
  estado text not null default 'borrador' check (estado in ('borrador','enviada','aceptada','rechazada')),
  created_at timestamptz default now()
);

create table if not exists detalle_cotizacion (
  id uuid default gen_random_uuid() primary key,
  cotizacion_id uuid not null references cotizaciones(id) on delete cascade,
  cantidad numeric(10,2) not null default 1,
  unidad text not null default 'unid.',
  producto text not null default '',
  descripcion text not null default '',
  valor_unitario numeric(14,2) not null default 0,
  subtotal numeric(14,2) not null default 0
);

-- RLS (habilitar en producción con auth)
alter table empresa enable row level security;
alter table clientes enable row level security;
alter table cotizaciones enable row level security;
alter table detalle_cotizacion enable row level security;

-- Políticas permisivas para desarrollo (ajustar con auth en producción)
create policy "allow all" on empresa for all using (true) with check (true);
create policy "allow all" on clientes for all using (true) with check (true);
create policy "allow all" on cotizaciones for all using (true) with check (true);
create policy "allow all" on detalle_cotizacion for all using (true) with check (true);
