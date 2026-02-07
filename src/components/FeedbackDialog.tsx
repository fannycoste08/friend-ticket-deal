import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Send } from "lucide-react";

const MAX_CHARS = 2000;

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FeedbackDialog({ open, onOpenChange }: FeedbackDialogProps) {
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const trimmedFeedback = feedback.trim();
  const isValid = trimmedFeedback.length > 0 && trimmedFeedback.length <= MAX_CHARS;

  async function handleSubmit() {
    if (!isValid) return;

    setIsSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        toast.error("Debes iniciar sesión para enviar tu opinión");
        setIsSubmitting(false);
        return;
      }

      const { error } = await supabase.functions.invoke("send-feedback-email", {
        body: { feedback: trimmedFeedback },
      });

      if (error) throw error;

      toast.success("¡Gracias por tu opinión!", {
        description: "Tu mensaje ha sido enviado correctamente",
      });

      setFeedback("");
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Error al enviar tu opinión", {
        description: "Por favor, inténtalo de nuevo más tarde",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Dar mi opinión sobre Trusticket</DialogTitle>
          <DialogDescription>
            Tu opinión nos ayuda a mejorar. Cuéntanos qué piensas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="relative">
            <Textarea
              placeholder="Escribe tu opinión aquí..."
              className="min-h-[160px] resize-none"
              value={feedback}
              onChange={(e) => {
                if (e.target.value.length <= MAX_CHARS) {
                  setFeedback(e.target.value);
                }
              }}
              maxLength={MAX_CHARS}
            />
            <span className="absolute bottom-2 right-3 text-xs text-muted-foreground">
              {feedback.length}/{MAX_CHARS}
            </span>
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!isValid || isSubmitting}
              className="flex-1 gap-2"
            >
              <Send className="w-4 h-4" />
              {isSubmitting ? "Enviando..." : "Enviar opinión"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
