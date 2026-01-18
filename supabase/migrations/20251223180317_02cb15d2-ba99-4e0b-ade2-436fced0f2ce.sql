-- Add privacy settings to rooms table
ALTER TABLE public.rooms 
ADD COLUMN IF NOT EXISTS privacy text DEFAULT 'public',
ADD COLUMN IF NOT EXISTS invite_code text UNIQUE,
ADD COLUMN IF NOT EXISTS require_approval boolean DEFAULT false;

-- Create index for invite codes
CREATE INDEX IF NOT EXISTS idx_rooms_invite_code ON public.rooms(invite_code) WHERE invite_code IS NOT NULL;

-- Create room join requests table for approval workflow
CREATE TABLE public.room_join_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES public.rooms(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  status text DEFAULT 'pending',
  message text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  reviewed_at timestamp with time zone,
  reviewed_by uuid,
  UNIQUE(room_id, user_id)
);

-- Enable RLS
ALTER TABLE public.room_join_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies for room_join_requests
CREATE POLICY "Users can view their own requests"
  ON public.room_join_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Room owners can view requests for their rooms"
  ON public.room_join_requests FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.rooms 
    WHERE rooms.id = room_join_requests.room_id 
    AND rooms.owner_id = auth.uid()
  ));

CREATE POLICY "Authenticated users can create requests"
  ON public.room_join_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Room owners can update requests"
  ON public.room_join_requests FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.rooms 
    WHERE rooms.id = room_join_requests.room_id 
    AND rooms.owner_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own requests"
  ON public.room_join_requests FOR DELETE
  USING (auth.uid() = user_id);

-- Enable realtime for room_join_requests
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_join_requests;

-- Update room_members to allow role changes
CREATE POLICY "Room owners can update member roles"
  ON public.room_members FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.rooms 
    WHERE rooms.id = room_members.room_id 
    AND rooms.owner_id = auth.uid()
  ));

-- Allow room owners to remove members
CREATE POLICY "Room owners can remove members"
  ON public.room_members FOR DELETE
  USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM public.rooms 
      WHERE rooms.id = room_members.room_id 
      AND rooms.owner_id = auth.uid()
    )
  );