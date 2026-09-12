CREATE POLICY "Public read task images" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'task-images');
CREATE POLICY "Public upload task images" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'task-images');
CREATE POLICY "Public delete task images" ON storage.objects FOR DELETE TO anon, authenticated USING (bucket_id = 'task-images');