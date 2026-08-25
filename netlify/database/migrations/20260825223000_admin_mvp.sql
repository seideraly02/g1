alter table users
  add column role varchar(20) not null default 'student';

alter table users
  add constraint users_role_check check (role in ('student', 'admin'));

create index users_created_at_idx on users(created_at desc, id);

alter table sessions
  add column last_seen_at timestamptz;

update sessions set last_seen_at = created_at where last_seen_at is null;

alter table sessions
  alter column last_seen_at set default now(),
  alter column last_seen_at set not null;

create index sessions_online_idx
  on sessions(last_seen_at desc, user_id)
  where revoked_at is null;

alter table questions
  add column created_at timestamptz not null default now(),
  add column created_by uuid references users(id) on delete set null;

create index questions_created_at_idx on questions(created_at desc, id);
