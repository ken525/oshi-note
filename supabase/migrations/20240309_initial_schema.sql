-- 私だけの推しノート - 初期スキーマ
-- 作成日: 2024-03-09

-- ============================================
-- 1. profiles テーブル（ユーザープロフィール）
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT,
  avatar_url TEXT,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'standard')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- profiles テーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_profiles_plan ON public.profiles(plan);

-- profiles テーブルのRLSを有効化
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- profiles テーブルのRLSポリシー
-- 全ユーザーが自分のプロフィールを閲覧可能
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- 全ユーザーが自分のプロフィールを更新可能
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- 新規ユーザー登録時にプロフィールを自動作成する関数
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nickname)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nickname', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 新規ユーザー登録時にトリガーを発火
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at を自動更新する関数
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- profiles テーブルの updated_at を自動更新するトリガー
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 2. oshi テーブル（推し登録）
-- ============================================
CREATE TABLE IF NOT EXISTS public.oshi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  group_name TEXT,
  keywords TEXT[] DEFAULT '{}',
  icon_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- oshi テーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_oshi_user_id ON public.oshi(user_id);
CREATE INDEX IF NOT EXISTS idx_oshi_created_at ON public.oshi(created_at DESC);

-- oshi テーブルのRLSを有効化
ALTER TABLE public.oshi ENABLE ROW LEVEL SECURITY;

-- oshi テーブルのRLSポリシー
-- 全ユーザーが自分の推しを閲覧可能
CREATE POLICY "Users can view own oshi"
  ON public.oshi
  FOR SELECT
  USING (auth.uid() = user_id);

-- 全ユーザーが自分の推しを挿入可能
CREATE POLICY "Users can insert own oshi"
  ON public.oshi
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 全ユーザーが自分の推しを更新可能
CREATE POLICY "Users can update own oshi"
  ON public.oshi
  FOR UPDATE
  USING (auth.uid() = user_id);

-- 全ユーザーが自分の推しを削除可能
CREATE POLICY "Users can delete own oshi"
  ON public.oshi
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 3. articles テーブル（生成された推しノート記事）
-- ============================================
CREATE TABLE IF NOT EXISTS public.articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  oshi_id UUID NOT NULL REFERENCES public.oshi(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  highlights JSONB DEFAULT '{}',
  source_links JSONB DEFAULT '[]',
  published_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- articles テーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_articles_user_id ON public.articles(user_id);
CREATE INDEX IF NOT EXISTS idx_articles_oshi_id ON public.articles(oshi_id);
CREATE INDEX IF NOT EXISTS idx_articles_published_date ON public.articles(published_date DESC);
CREATE INDEX IF NOT EXISTS idx_articles_created_at ON public.articles(created_at DESC);

-- articles テーブルのRLSを有効化
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- articles テーブルのRLSポリシー
-- 全ユーザーが自分の記事を閲覧可能
CREATE POLICY "Users can view own articles"
  ON public.articles
  FOR SELECT
  USING (auth.uid() = user_id);

-- 全ユーザーが自分の記事を挿入可能
CREATE POLICY "Users can insert own articles"
  ON public.articles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 全ユーザーが自分の記事を更新可能
CREATE POLICY "Users can update own articles"
  ON public.articles
  FOR UPDATE
  USING (auth.uid() = user_id);

-- 全ユーザーが自分の記事を削除可能
CREATE POLICY "Users can delete own articles"
  ON public.articles
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 4. raw_posts テーブル（収集した生データ）
-- ============================================
CREATE TABLE IF NOT EXISTS public.raw_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  oshi_id UUID NOT NULL REFERENCES public.oshi(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('twitter', 'instagram', 'tiktok', 'youtube', 'website')),
  original_url TEXT NOT NULL,
  content TEXT NOT NULL,
  posted_at TIMESTAMPTZ,
  collected_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- raw_posts テーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_raw_posts_oshi_id ON public.raw_posts(oshi_id);
CREATE INDEX IF NOT EXISTS idx_raw_posts_source ON public.raw_posts(source);
CREATE INDEX IF NOT EXISTS idx_raw_posts_posted_at ON public.raw_posts(posted_at DESC);
CREATE INDEX IF NOT EXISTS idx_raw_posts_collected_at ON public.raw_posts(collected_at DESC);
CREATE INDEX IF NOT EXISTS idx_raw_posts_original_url ON public.raw_posts(original_url);

-- raw_posts テーブルのRLSを有効化
ALTER TABLE public.raw_posts ENABLE ROW LEVEL SECURITY;

-- raw_posts テーブルのRLSポリシー
-- ユーザーは自分の推しに関連するraw_postsを閲覧可能
CREATE POLICY "Users can view raw_posts for own oshi"
  ON public.raw_posts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.oshi
      WHERE oshi.id = raw_posts.oshi_id
      AND oshi.user_id = auth.uid()
    )
  );

-- ユーザーは自分の推しに関連するraw_postsを挿入可能
CREATE POLICY "Users can insert raw_posts for own oshi"
  ON public.raw_posts
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.oshi
      WHERE oshi.id = raw_posts.oshi_id
      AND oshi.user_id = auth.uid()
    )
  );

-- ユーザーは自分の推しに関連するraw_postsを更新可能
CREATE POLICY "Users can update raw_posts for own oshi"
  ON public.raw_posts
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.oshi
      WHERE oshi.id = raw_posts.oshi_id
      AND oshi.user_id = auth.uid()
    )
  );

-- ユーザーは自分の推しに関連するraw_postsを削除可能
CREATE POLICY "Users can delete raw_posts for own oshi"
  ON public.raw_posts
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.oshi
      WHERE oshi.id = raw_posts.oshi_id
      AND oshi.user_id = auth.uid()
    )
  );
