create extension if not exists pgcrypto;

create table users (
  id uuid primary key default gen_random_uuid(),
  full_name varchar(120) not null,
  city varchar(80) not null,
  phone varchar(20) not null unique,
  verified_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table otp_requests (
  id uuid primary key default gen_random_uuid(),
  full_name varchar(120) not null,
  city varchar(80) not null,
  phone varchar(20) not null,
  code_hash varchar(64) not null,
  attempts int not null default 0,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
create index otp_requests_phone_created_idx on otp_requests(phone, created_at desc);

create table sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  token_hash varchar(64) not null unique,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

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
  sort_order int not null default 0
);

create table diagnostic_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  subject_id varchar(50) not null references subjects(id),
  correct_count int not null,
  total_count int not null,
  completed_at timestamptz not null default now()
);

insert into subjects(id, name, sort_order) values
('history-kz', 'Қазақстан тарихы', 1);

insert into questions(id, subject_id, topic, prompt, options, correct_option, explanation, sort_order) values
('history-1','history-kz','Қазақ хандығы','Қазақ хандығының негізін қалаған хандар кімдер?','["Керей мен Жәнібек","Абылай мен Әбілқайыр","Қасым мен Есім","Тәуке мен Хақназар"]',0,'Керей мен Жәнібек қазақ руларының басын қосып, дербес хандықтың негізін қалады.',1),
('history-2','history-kz','Қазақ хандығы','Қазақ хандығы қай жылы құрылды?','["1456 жылы","1466 жылы","1465 жылы","1470 жылы"]',2,'Қазақ хандығы 1465 жылы Батыс Жетісуда құрылды.',2),
('history-3','history-kz','Қазақ хандығы','Қазақ хандығы алғаш құрылған өңірді белгіле.','["Сарыарқа","Батыс Жетісу","Маңғыстау","Ертіс бойы"]',1,'Хандықтың алғашқы аумағы Шу мен Талас өзендері аралығындағы Батыс Жетісуда болды.',3),
('history-4','history-kz','XX ғасыр','Алаш автономиясы қай жылы жарияланды?','["1905 жылы","1916 жылы","1917 жылы","1920 жылы"]',2,'Алаш автономиясы 1917 жылғы желтоқсанда жарияланды.',4),
('history-5','history-kz','Тәуелсіз Қазақстан','Қазақстан тәуелсіздігін қай жылы жариялады?','["1986 жылы","1990 жылы","1991 жылы","1993 жылы"]',2,'Қазақстан 1991 жылғы 16 желтоқсанда мемлекеттік тәуелсіздігін жариялады.',5);
