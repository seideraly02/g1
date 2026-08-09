alter table questions
  add column if not exists is_active boolean not null default true;

alter table questions
  add constraint questions_correct_option_check
  check (correct_option >= 0 and correct_option < jsonb_array_length(options));

alter table diagnostic_attempts
  add constraint diagnostic_attempts_counts_check
  check (total_count > 0 and correct_count >= 0 and correct_count <= total_count);

alter table otp_requests
  add constraint otp_requests_attempts_check
  check (attempts >= 0 and attempts <= 5);

create table diagnostic_answers (
  attempt_id uuid not null references diagnostic_attempts(id) on delete cascade,
  question_id varchar(50) not null references questions(id) on delete restrict,
  selected_option int not null check (selected_option >= 0),
  is_correct boolean not null,
  created_at timestamptz not null default now(),
  primary key (attempt_id, question_id)
);

create index if not exists questions_subject_active_sort_idx
  on questions(subject_id, is_active, sort_order);

create index if not exists diagnostic_attempts_user_completed_idx
  on diagnostic_attempts(user_id, completed_at desc)
  where user_id is not null;

create index if not exists diagnostic_answers_question_idx
  on diagnostic_answers(question_id);

create index if not exists sessions_user_active_idx
  on sessions(user_id, expires_at)
  where revoked_at is null;

create index if not exists otp_requests_expires_idx
  on otp_requests(expires_at);
