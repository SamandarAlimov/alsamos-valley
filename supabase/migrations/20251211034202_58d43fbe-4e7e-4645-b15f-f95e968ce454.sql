-- Fix room_members RLS: Only authenticated users can see memberships (not public)
DROP POLICY IF EXISTS "Room members viewable by everyone" ON public.room_members;
CREATE POLICY "Room members viewable by authenticated users"
ON public.room_members
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Add explicit DENY policies for investors table (INSERT/UPDATE/DELETE)
-- Only admins should be able to modify investor profiles
CREATE POLICY "Only admins can insert investors"
ON public.investors
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update investors"
ON public.investors
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete investors"
ON public.investors
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Create notifications table for system-wide notifications
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL, -- 'investor_response', 'task_assignment', 'room_invitation', 'room_join'
  title TEXT NOT NULL,
  message TEXT,
  data JSONB, -- Additional metadata (room_id, task_id, etc.)
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only view their own notifications
CREATE POLICY "Users can view own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

-- System can insert notifications (via service role or triggers)
CREATE POLICY "Authenticated users can create notifications"
ON public.notifications
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Users can mark their notifications as read
CREATE POLICY "Users can update own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
ON public.notifications
FOR DELETE
USING (auth.uid() = user_id);

-- Create message_reactions table for Telegram-style reactions
CREATE TABLE public.message_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);

-- Enable RLS on message_reactions
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

-- Anyone in the room can view reactions (same as messages)
CREATE POLICY "Reactions viewable by room members"
ON public.message_reactions
FOR SELECT
USING (
  auth.uid() IN (
    SELECT rm.user_id FROM room_members rm
    JOIN chat_messages cm ON cm.room_id = rm.room_id
    WHERE cm.id = message_reactions.message_id
  )
);

-- Authenticated users can add reactions
CREATE POLICY "Authenticated users can add reactions"
ON public.message_reactions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can remove their own reactions
CREATE POLICY "Users can remove own reactions"
ON public.message_reactions
FOR DELETE
USING (auth.uid() = user_id);

-- Enable realtime for notifications and reactions
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;