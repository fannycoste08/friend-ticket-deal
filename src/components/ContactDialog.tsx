import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const formSchema = z.object({
  name: z.string().trim().min(1, "El nombre es requerido").max(100),
  email: z.string().trim().email("Email inválido").max(255),
  phone: z.string().trim().min(1, "El teléfono es requerido").max(20),
  message: z.string().trim().min(1, "El mensaje es requerido").max(1000),
});

interface ContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticket: {
    id: string;
    artist: string;
    seller: string;
    seller_email: string;
  };
  isWantedTicket?: boolean;
}

export function ContactDialog({ open, onOpenChange, ticket, isWantedTicket = false }: ContactDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultMessage = isWantedTicket 
    ? `Hola, tengo entrada para ${ticket.artist} que estás buscando. Me gustaría hablar contigo sobre ello.`
    : "";

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      message: defaultMessage,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Debes iniciar sesión para contactar con el vendedor");
        setIsSubmitting(false);
        return;
      }

      console.log('Sending contact email with data:', {
        seller_email: ticket.seller_email,
        seller_name: ticket.seller,
        artist: ticket.artist,
        ticket_id: ticket.id,
      });

      const { data, error } = await supabase.functions.invoke('send-contact-email', {
        body: {
          seller_email: ticket.seller_email,
          seller_name: ticket.seller,
          buyer_name: values.name,
          buyer_email: values.email,
          buyer_phone: values.phone,
          message: values.message,
          artist: ticket.artist,
          ticket_id: ticket.id,
        },
      });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      console.log('Contact email sent successfully:', data);

      toast.success("Mensaje enviado", {
        description: "Tu mensaje ha sido enviado al vendedor",
      });
      
      form.reset();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error sending contact email:', error);
      console.error('Error details:', {
        message: error?.message,
        status: error?.status,
        details: error
      });
      
      toast.error("Error al enviar el mensaje", {
        description: error?.message || "Por favor, inténtalo de nuevo más tarde",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isWantedTicket ? `Ofrecer entrada a ${ticket.seller}` : `Contactar con ${ticket.seller}`}
          </DialogTitle>
          <DialogDescription>
            {isWantedTicket ? `Tienes entrada para: ${ticket.artist}` : `Envía un mensaje sobre: ${ticket.artist}`}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Tu nombre" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="tu@email.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="+34 600 000 000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mensaje</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Escribe tu mensaje aquí..."
                      className="min-h-[120px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? "Enviando..." : "Enviar mensaje"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
