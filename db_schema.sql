-- 記事テーブル: ニュース記事を保存
create table public.articles (
  id uuid default gen_random_uuid() primary key,
  source text not null,
  title text not null,
  url text not null unique,
  image_url text,
  published_at timestamp with time zone,
  summary text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 設定テーブル: ユーザーごとの設定を保存
-- 今回はシングルユーザー想定ですが、拡張性を考慮して user_id を持てるようにしつつ
-- 当面は 'default' という固定IDで運用します。
create table public.settings (
  key text primary key, -- 'default'
  value jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 初期データのインサート (設定)
insert into public.settings (key, value)
values (
  'default',
  '{
    "maxArticles": 30,
    "period": "3days",
    "summaryLength": 200,
    "language": "ja",
    "enabledSources": {}
  }'::jsonb
) on conflict do nothing;

-- セキュリティポリシー (RLS) の設定
-- 今回はシンプルにするため、一旦全公開(public)で読み書き許可設定にします。
-- ※本番運用時は認証ユーザーのみに絞るべきですが、開発中はこれで進めます。

alter table public.articles enable row level security;
alter table public.settings enable row level security;

create policy "Allow public read access on articles"
on public.articles for select to anon using (true);

create policy "Allow public read access on settings"
on public.settings for select to anon using (true);

-- Backend (Service Role) can bypass RLS, so no specific policy needed for ingest normally.
-- BUT if we use simple client, we might need insert policy.
-- For safety, let's allow insert for authenticated users (if we login) or anon for now?
-- Let's open it for now to avoid roadblocks, and tighten later.

create policy "Allow public insert/update on settings"
on public.settings for all to anon using (true) with check (true);

create policy "Allow public insert on articles"
on public.articles for insert to anon with check (true);
