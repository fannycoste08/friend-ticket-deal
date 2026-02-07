import { useState } from "react";
import { MessageSquarePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FeedbackDialog } from "@/components/FeedbackDialog";
import { useAuth } from "@/hooks/useAuth";

export const FeedbackButton = () => {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();

  if (!user) return null;

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 rounded-full shadow-lg px-5 py-3 gap-2 gradient-primary text-primary-foreground hover:opacity-90 transition-all duration-300 hover:scale-105"
        size="lg"
      >
        <MessageSquarePlus className="w-5 h-5" />
        <span className="hidden sm:inline">Dar mi opinión sobre Trusticket</span>
        <span className="sm:hidden">Opinión</span>
      </Button>

      <FeedbackDialog open={open} onOpenChange={setOpen} />
    </>
  );
};
