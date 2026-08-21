-- ScamGuard core schema: user-owned analyses, explainability, storage metadata, settings.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  input_type text not null,
  original_text text,
  preview text,
  risk_score integer not null default 0,
  risk_level text not null default 'low',
  classification text not null default 'safe',
  label text,
  summary text,
  result_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.analysis_reasons (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid not null references public.analyses(id) on delete cascade,
  reason text not null,
  category text,
  severity text,
  created_at timestamptz not null default now()
);

create table if not exists public.detected_signals (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid not null references public.analyses(id) on delete cascade,
  signal_type text not null,
  signal_name text not null,
  confidence numeric,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.urls (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid not null references public.analyses(id) on delete cascade,
  url text not null,
  domain text,
  risk_score integer,
  risk_level text,
  is_suspicious boolean not null default false,
  is_shortened boolean not null default false,
  brand_match text,
  reputation text,
  created_at timestamptz not null default now()
);

create table if not exists public.screenshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  analysis_id uuid references public.analyses(id) on delete set null,
  storage_path text not null,
  storage_url text,
  file_name text,
  mime_type text,
  file_size integer,
  ocr_text text,
  created_at timestamptz not null default now()
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  analysis_id uuid references public.analyses(id) on delete set null,
  title text,
  risk_score integer not null default 0,
  risk_level text not null default 'low',
  classification text not null default 'safe',
  summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.conversation_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender text,
  message text not null,
  timestamp timestamptz,
  sequence_number integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  analysis_id uuid references public.analyses(id) on delete set null,
  transaction_reference text,
  amount numeric,
  currency text not null default 'INR',
  transaction_type text,
  recipient text,
  timestamp timestamptz,
  device_information text,
  location_information text,
  is_anomaly boolean not null default false,
  anomaly_score integer,
  created_at timestamptz not null default now()
);

create table if not exists public.transaction_anomalies (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  anomaly_score integer,
  risk_level text,
  reason text,
  detected_signals jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  analysis_id uuid references public.analyses(id) on delete set null,
  notes text,
  confirmed_scam boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists analyses_user_created_idx on public.analyses (user_id, created_at desc);
create index if not exists analyses_user_class_idx on public.analyses (user_id, classification);
create index if not exists analysis_reasons_analysis_idx on public.analysis_reasons (analysis_id);
create index if not exists detected_signals_analysis_idx on public.detected_signals (analysis_id);
create index if not exists urls_analysis_idx on public.urls (analysis_id);
create index if not exists screenshots_user_idx on public.screenshots (user_id, created_at desc);
create index if not exists conversations_user_idx on public.conversations (user_id, created_at desc);
create index if not exists conversation_messages_convo_idx on public.conversation_messages (conversation_id, sequence_number);
create index if not exists transactions_user_idx on public.transactions (user_id, created_at desc);
create index if not exists reports_user_idx on public.reports (user_id, created_at desc);

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists analyses_updated_at on public.analyses;
create trigger analyses_updated_at before update on public.analyses
for each row execute function public.set_updated_at();

drop trigger if exists conversations_updated_at on public.conversations;
create trigger conversations_updated_at before update on public.conversations
for each row execute function public.set_updated_at();

drop trigger if exists user_settings_updated_at on public.user_settings;
create trigger user_settings_updated_at before update on public.user_settings
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, full_name)
  values (new.id, coalesce(new.profile->>'name', split_part(new.email, '@', 1)))
  on conflict (user_id) do nothing;
  insert into public.user_settings (user_id, settings)
  values (
    new.id,
    jsonb_build_object(
      'automaticDetection', true,
      'scamAlerts', true,
      'blockHighRiskLinks', true,
      'alertSound', true,
      'language', 'English',
      'blockedIds', '[]'::jsonb
    )
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.owns_analysis(p_analysis_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.analyses a
    where a.id = p_analysis_id and a.user_id = auth.uid()
  );
$$;

create or replace function public.owns_conversation(p_conversation_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.conversations c
    where c.id = p_conversation_id and c.user_id = auth.uid()
  );
$$;

create or replace function public.owns_transaction(p_transaction_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.transactions t
    where t.id = p_transaction_id and t.user_id = auth.uid()
  );
$$;

create or replace function public.dashboard_stats()
returns jsonb
language plpgsql
stable
security invoker
as $$
declare
  result jsonb;
  verdicts jsonb;
begin
  select coalesce(jsonb_object_agg(classification, cnt), '{}'::jsonb)
    into verdicts
  from (
    select classification, count(*)::int as cnt
    from public.analyses
    where user_id = auth.uid()
    group by classification
  ) s;

  select jsonb_build_object(
    'messages_analyzed', count(*)::int,
    'safe', count(*) filter (where classification = 'safe')::int,
    'suspicious', count(*) filter (where classification in ('suspicious', 'likely_scam'))::int,
    'phishing', count(*) filter (where classification = 'phishing')::int,
    'payment_scams', count(*) filter (where classification = 'payment_fraud')::int,
    'critical', count(*) filter (where risk_score >= 76)::int,
    'verdicts', verdicts
  )
  into result
  from public.analyses
  where user_id = auth.uid();

  return result;
end;
$$;

alter table public.profiles enable row level security;
alter table public.analyses enable row level security;
alter table public.analysis_reasons enable row level security;
alter table public.detected_signals enable row level security;
alter table public.urls enable row level security;
alter table public.screenshots enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_messages enable row level security;
alter table public.transactions enable row level security;
alter table public.transaction_anomalies enable row level security;
alter table public.user_settings enable row level security;
alter table public.reports enable row level security;

create policy profiles_own on public.profiles for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy analyses_own on public.analyses for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy analysis_reasons_own on public.analysis_reasons for all to authenticated
  using (public.owns_analysis(analysis_id)) with check (public.owns_analysis(analysis_id));

create policy detected_signals_own on public.detected_signals for all to authenticated
  using (public.owns_analysis(analysis_id)) with check (public.owns_analysis(analysis_id));

create policy urls_own on public.urls for all to authenticated
  using (public.owns_analysis(analysis_id)) with check (public.owns_analysis(analysis_id));

create policy screenshots_own on public.screenshots for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy conversations_own on public.conversations for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy conversation_messages_own on public.conversation_messages for all to authenticated
  using (public.owns_conversation(conversation_id)) with check (public.owns_conversation(conversation_id));

create policy transactions_own on public.transactions for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy transaction_anomalies_own on public.transaction_anomalies for all to authenticated
  using (public.owns_transaction(transaction_id)) with check (public.owns_transaction(transaction_id));

create policy user_settings_own on public.user_settings for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy reports_own on public.reports for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

grant usage on schema public to authenticated, anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant execute on function public.dashboard_stats() to authenticated;
grant execute on function public.owns_analysis(uuid) to authenticated;
grant execute on function public.owns_conversation(uuid) to authenticated;
grant execute on function public.owns_transaction(uuid) to authenticated;
