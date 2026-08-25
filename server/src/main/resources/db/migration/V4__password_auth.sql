alter table users
  add column first_name varchar(60),
  add column last_name varchar(60),
  add column password_hash varchar(72);

alter table users
  add constraint users_password_hash_format_check
  check (password_hash is null or password_hash ~ '^\$2[aby]\$[0-9]{2}\$.{53}$');

create table login_attempts (
  id uuid primary key default gen_random_uuid(),
  phone_fingerprint varchar(64) not null,
  request_fingerprint varchar(64) not null,
  succeeded boolean not null default false,
  created_at timestamptz not null default now()
);

create index login_attempts_phone_created_idx
  on login_attempts(phone_fingerprint, created_at desc);

create index login_attempts_request_created_idx
  on login_attempts(request_fingerprint, created_at desc);

create table registration_attempts (
  id uuid primary key default gen_random_uuid(),
  phone_fingerprint varchar(64) not null,
  request_fingerprint varchar(64) not null,
  created_at timestamptz not null default now()
);

create index registration_attempts_phone_created_idx
  on registration_attempts(phone_fingerprint, created_at desc);

create index registration_attempts_request_created_idx
  on registration_attempts(request_fingerprint, created_at desc);

-- otp_requests is intentionally retained, unused, for one rollback-compatibility window.
-- Remove it only in a later migration after the previous backend image is retired.
