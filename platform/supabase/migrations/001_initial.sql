-- Jobs table
create table if not exists jobs (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc', now()) not null
);

alter table jobs enable row level security;

create policy "Users manage their own jobs"
  on jobs for all
  using (auth.uid() = user_id);

-- Candidates table
create table if not exists candidates (
  id uuid default gen_random_uuid() primary key,
  job_id uuid references jobs(id) on delete cascade not null,
  filename text not null,
  name text,
  resume_text text,
  score integer,
  analysis jsonb,
  created_at timestamp with time zone default timezone('utc', now()) not null
);

alter table candidates enable row level security;

create policy "Users manage candidates for their jobs"
  on candidates for all
  using (
    exists (
      select 1 from jobs
      where jobs.id = candidates.job_id
        and jobs.user_id = auth.uid()
    )
  );
