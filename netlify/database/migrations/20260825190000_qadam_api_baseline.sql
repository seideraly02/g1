create table users (
  id uuid primary key,
  full_name varchar(121) not null,
  first_name varchar(60) not null,
  last_name varchar(60) not null,
  city varchar(80) not null,
  phone varchar(20) not null unique,
  password_hash varchar(72),
  created_at timestamptz not null default now(),
  constraint users_password_hash_format_check
    check (password_hash is null or password_hash ~ '^\$2[aby]\$[0-9]{2}\$.{53}$')
);

create table sessions (
  id uuid primary key,
  user_id uuid not null references users(id) on delete cascade,
  token_hash varchar(64) not null unique,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index sessions_user_active_idx
  on sessions(user_id, expires_at)
  where revoked_at is null;

create table login_attempts (
  id uuid primary key,
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
  id uuid primary key,
  phone_fingerprint varchar(64) not null,
  request_fingerprint varchar(64) not null,
  created_at timestamptz not null default now()
);

create index registration_attempts_phone_created_idx
  on registration_attempts(phone_fingerprint, created_at desc);

create index registration_attempts_request_created_idx
  on registration_attempts(request_fingerprint, created_at desc);

create table subjects (
  id varchar(50) primary key,
  name varchar(120) not null,
  sort_order int not null default 0
);

create table questions (
  id varchar(50) primary key,
  subject_id varchar(50) not null references subjects(id),
  topic varchar(120) not null,
  prompt text not null,
  options jsonb not null,
  correct_option int not null,
  explanation text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  constraint questions_correct_option_check
    check (correct_option >= 0 and correct_option < jsonb_array_length(options))
);

create index questions_subject_active_sort_idx
  on questions(subject_id, is_active, sort_order);

create table diagnostic_answer_checks (
  user_id uuid not null references users(id) on delete cascade,
  operation_id varchar(100) not null,
  subject_id varchar(50) not null references subjects(id),
  question_id varchar(50) not null references questions(id) on delete restrict,
  selected_option int not null check (selected_option >= 0),
  is_correct boolean not null,
  result_json jsonb not null,
  created_at timestamptz not null default now(),
  primary key (user_id, operation_id, question_id)
);

create index diagnostic_answer_checks_operation_idx
  on diagnostic_answer_checks(user_id, operation_id, subject_id);

create table diagnostic_attempts (
  id uuid primary key,
  user_id uuid references users(id) on delete set null,
  operation_id varchar(100) not null,
  subject_id varchar(50) not null references subjects(id),
  correct_count int not null,
  total_count int not null,
  completed_at timestamptz not null default now(),
  result_json jsonb not null,
  constraint diagnostic_attempts_counts_check
    check (total_count > 0 and correct_count >= 0 and correct_count <= total_count)
);

create unique index diagnostic_attempts_user_operation_idx
  on diagnostic_attempts(user_id, operation_id)
  where user_id is not null;

create index diagnostic_attempts_user_completed_idx
  on diagnostic_attempts(user_id, completed_at desc)
  where user_id is not null;

create table diagnostic_answers (
  attempt_id uuid not null references diagnostic_attempts(id) on delete cascade,
  question_id varchar(50) not null references questions(id) on delete restrict,
  selected_option int not null check (selected_option >= 0),
  is_correct boolean not null,
  created_at timestamptz not null default now(),
  primary key (attempt_id, question_id)
);

create index diagnostic_answers_question_idx
  on diagnostic_answers(question_id);

insert into subjects(id, name, sort_order) values
  ('history-kz', 'Қазақстан тарихы', 1);

insert into questions(id, subject_id, topic, prompt, options, correct_option, explanation, sort_order) values
  ('history-1','history-kz','Қазақ хандығы','Қазақ хандығының негізін қалаған хандар кімдер?','["Керей мен Жәнібек","Абылай мен Әбілқайыр","Қасым мен Есім","Тәуке мен Хақназар"]',0,'Керей мен Жәнібек қазақ руларының басын қосып, дербес хандықтың негізін қалады.',1),
  ('history-2','history-kz','Қазақ хандығы','Қазақ хандығы қай жылы құрылды?','["1456 жылы","1466 жылы","1465 жылы","1470 жылы"]',2,'Қазақ хандығы 1465 жылы Батыс Жетісуда құрылды.',2),
  ('history-3','history-kz','Қазақ хандығы','Қазақ хандығы алғаш құрылған өңірді белгіле.','["Сарыарқа","Батыс Жетісу","Маңғыстау","Ертіс бойы"]',1,'Хандықтың алғашқы аумағы Шу мен Талас өзендері аралығындағы Батыс Жетісуда болды.',3),
  ('history-4','history-kz','XX ғасыр','Алаш автономиясы қай жылы жарияланды?','["1905 жылы","1916 жылы","1917 жылы","1920 жылы"]',2,'Алаш автономиясы 1917 жылғы желтоқсанда жарияланды.',4),
  ('history-5','history-kz','Тәуелсіз Қазақстан','Қазақстан тәуелсіздігін қай жылы жариялады?','["1986 жылы","1990 жылы","1991 жылы","1993 жылы"]',2,'Қазақстан 1991 жылғы 16 желтоқсанда мемлекеттік тәуелсіздігін жариялады.',5);
