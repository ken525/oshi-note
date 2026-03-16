-- アクティブユーザー判定用: 最終アクティブ日時
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_active_at timestamptz DEFAULT now();

COMMENT ON COLUMN profiles.last_active_at IS '最終ログイン/セッション更新日時。バッチ記事生成は直近7日以内にアクティブなユーザーのみ対象。';
