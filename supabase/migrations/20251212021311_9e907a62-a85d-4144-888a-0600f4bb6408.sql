-- Add last_seen column to profiles for presence tracking
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_seen timestamp with time zone DEFAULT now();

-- Create file_attachments table for chat files/media
CREATE TABLE IF NOT EXISTS public.file_attachments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id uuid REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  file_name text NOT NULL,
  file_type text NOT NULL,
  file_size integer NOT NULL,
  file_url text NOT NULL,
  thumbnail_url text,
  duration integer, -- for audio/video files in seconds
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on file_attachments
ALTER TABLE public.file_attachments ENABLE ROW LEVEL SECURITY;

-- RLS policies for file_attachments
CREATE POLICY "File attachments viewable by room members"
ON public.file_attachments FOR SELECT
USING (
  auth.uid() IN (
    SELECT rm.user_id FROM room_members rm
    JOIN chat_messages cm ON cm.room_id = rm.room_id
    WHERE cm.id = file_attachments.message_id
  )
);

CREATE POLICY "Authenticated users can upload files"
ON public.file_attachments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own files"
ON public.file_attachments FOR DELETE
USING (auth.uid() = user_id);

-- Add reply_to column to chat_messages for reply functionality
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS reply_to uuid REFERENCES public.chat_messages(id) ON DELETE SET NULL;

-- Add message_type column for different message types (text, audio, video, file, sticker)
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS message_type text DEFAULT 'text';

-- Create storage bucket for chat files
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-files', 'chat-files', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for chat files
CREATE POLICY "Chat files viewable by authenticated users"
ON storage.objects FOR SELECT
USING (bucket_id = 'chat-files' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can upload chat files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'chat-files' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete own chat files"
ON storage.objects FOR DELETE
USING (bucket_id = 'chat-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Enable realtime for profiles (for presence)
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.file_attachments;