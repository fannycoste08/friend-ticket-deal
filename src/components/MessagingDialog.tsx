import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Send } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
}

interface MessagingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketId: string;
  sellerId: string;
  sellerName: string;
}

export const MessagingDialog = ({ open, onOpenChange, ticketId, sellerId, sellerName }: MessagingDialogProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && user) {
      loadOrCreateConversation();
    }
  }, [open, user]);

  useEffect(() => {
    if (conversationId) {
      loadMessages();
      subscribeToMessages();
    }
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const loadOrCreateConversation = async () => {
    if (!user) return;

    // Buscar conversación existente
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .or(`and(user1_id.eq.${user.id},user2_id.eq.${sellerId}),and(user1_id.eq.${sellerId},user2_id.eq.${user.id})`)
      .eq('ticket_id', ticketId)
      .maybeSingle();

    if (existing) {
      setConversationId(existing.id);
      return;
    }

    // Crear nueva conversación
    const { data: newConv, error } = await supabase
      .from('conversations')
      .insert({
        ticket_id: ticketId,
        user1_id: user.id,
        user2_id: sellerId,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating conversation:', error);
      return;
    }

    setConversationId(newConv.id);
  };

  const loadMessages = async () => {
    if (!conversationId) return;

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading messages:', error);
      return;
    }

    setMessages(data || []);
  };

  const subscribeToMessages = () => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !conversationId || !user) return;

    setLoading(true);

    const { error } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content: newMessage.trim(),
    });

    if (error) {
      toast.error('Error al enviar el mensaje');
      console.error(error);
      setLoading(false);
      return;
    }

    // Get ticket and seller info for email notification
    try {
      const { data: conversation } = await supabase
        .from('conversations')
        .select('ticket_id')
        .eq('id', conversationId)
        .single();

      if (conversation) {
        const { data: ticket } = await supabase
          .from('tickets')
          .select('artist, user_id')
          .eq('id', conversation.ticket_id)
          .single();

        const { data: sellerProfile } = await supabase
          .from('profiles')
          .select('name, email')
          .eq('id', sellerId)
          .single();

        const { data: senderProfile } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', user.id)
          .single();

        if (ticket && sellerProfile && senderProfile && ticket.user_id === sellerId) {
          // Only send email if the recipient is the seller
          await supabase.functions.invoke('send-message-notification', {
            body: {
              recipient_email: sellerProfile.email,
              recipient_name: sellerProfile.name,
              sender_name: senderProfile.name,
              ticket_artist: ticket.artist,
              ticket_id: ticketId,
            },
          });
        }
      }
    } catch (emailError) {
      console.error('Error sending email notification:', emailError);
    }

    setNewMessage('');
    setLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle>Conversación con {sellerName}</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    message.sender_id === user?.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {format(new Date(message.created_at), "HH:mm", { locale: es })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        <div className="flex gap-2 pt-4 border-t">
          <Input
            placeholder="Escribe un mensaje..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
          />
          <Button onClick={handleSend} disabled={loading || !newMessage.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
