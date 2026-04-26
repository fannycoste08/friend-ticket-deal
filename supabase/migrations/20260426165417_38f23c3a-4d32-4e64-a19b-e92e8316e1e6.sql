-- Allow either side of a friendship to delete it (reciprocal removal)
CREATE POLICY "Users can delete friendships where they are friend"
ON public.friendships
FOR DELETE
USING (auth.uid() = friend_id);