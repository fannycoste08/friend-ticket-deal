-- Create tickets table
CREATE TABLE public.tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  concert_name TEXT NOT NULL,
  artist TEXT NOT NULL,
  venue TEXT NOT NULL,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  ticket_type TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'available',
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tickets
CREATE POLICY "Anyone can view available tickets"
ON public.tickets
FOR SELECT
USING (status = 'available' OR auth.uid() = user_id);

CREATE POLICY "Users can create their own tickets"
ON public.tickets
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tickets"
ON public.tickets
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tickets"
ON public.tickets
FOR DELETE
USING (auth.uid() = user_id);

-- Create ticket_requests table
CREATE TABLE public.ticket_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ticket_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ticket_requests
CREATE POLICY "Users can view their own requests"
ON public.ticket_requests
FOR SELECT
USING (auth.uid() = requester_id OR auth.uid() = seller_id);

CREATE POLICY "Users can create requests"
ON public.ticket_requests
FOR INSERT
WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Seller can update their requests"
ON public.ticket_requests
FOR UPDATE
USING (auth.uid() = seller_id);

-- Create conversations table
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
  user1_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user1_id, user2_id, ticket_id)
);

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversations
CREATE POLICY "Users can view their own conversations"
ON public.conversations
FOR SELECT
USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can create conversations"
ON public.conversations
FOR INSERT
WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Create messages table
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for messages
CREATE POLICY "Users can view messages in their conversations"
ON public.messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM conversations
    WHERE conversations.id = conversation_id
    AND (conversations.user1_id = auth.uid() OR conversations.user2_id = auth.uid())
  )
);

CREATE POLICY "Users can create messages in their conversations"
ON public.messages
FOR INSERT
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM conversations
    WHERE conversations.id = conversation_id
    AND (conversations.user1_id = auth.uid() OR conversations.user2_id = auth.uid())
  )
);

CREATE POLICY "Users can update their own messages"
ON public.messages
FOR UPDATE
USING (auth.uid() = sender_id);

-- Add triggers for updated_at
CREATE TRIGGER update_tickets_updated_at
BEFORE UPDATE ON public.tickets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ticket_requests_updated_at
BEFORE UPDATE ON public.ticket_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at
BEFORE UPDATE ON public.conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_tickets_user_id ON public.tickets(user_id);
CREATE INDEX idx_tickets_status ON public.tickets(status);
CREATE INDEX idx_tickets_event_date ON public.tickets(event_date);
CREATE INDEX idx_ticket_requests_ticket_id ON public.ticket_requests(ticket_id);
CREATE INDEX idx_ticket_requests_requester_id ON public.ticket_requests(requester_id);
CREATE INDEX idx_ticket_requests_seller_id ON public.ticket_requests(seller_id);
CREATE INDEX idx_conversations_users ON public.conversations(user1_id, user2_id);
CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);