-- Supabase Storage設定
-- 推しのアイコン画像を保存するためのバケットを作成

-- oshi-icons バケットを作成（公開バケット）
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'oshi-icons',
  'oshi-icons',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- RLSポリシー: 認証済みユーザーは自分の推しのアイコンをアップロード可能
CREATE POLICY "Users can upload own oshi icons"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'oshi-icons' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- RLSポリシー: 認証済みユーザーは自分の推しのアイコンを更新可能
CREATE POLICY "Users can update own oshi icons"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'oshi-icons' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'oshi-icons' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- RLSポリシー: 認証済みユーザーは自分の推しのアイコンを削除可能
CREATE POLICY "Users can delete own oshi icons"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'oshi-icons' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- RLSポリシー: すべてのユーザーがアイコンを閲覧可能（公開バケット）
CREATE POLICY "Anyone can view oshi icons"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'oshi-icons');
