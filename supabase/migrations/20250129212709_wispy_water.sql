-- Create assets bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('assets', 'assets', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for assets
CREATE POLICY "Anyone can view assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'assets');

-- Create policy for admins to manage assets
CREATE POLICY "Admins can manage assets"
ON storage.objects FOR ALL
TO authenticated
WITH CHECK (bucket_id = 'assets');