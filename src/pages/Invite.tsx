import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Mail, AlertCircle, CheckCircle2 } from "lucide-react";

type State =
  | { status: "loading" }
  | { status: "valid"; inviterName: string }
  | { status: "expired" }
  | { status: "revoked" }
  | { status: "invalid" }
  | { status: "submitted" };

const Invite = () => {
  const { token } = useParams<{ token: string }>();
  const [state, setState] = useState<State>({ status: "loading" });
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const validate = async () => {
      if (!token) {
        setState({ status: "invalid" });
        return;
      }
      const { data, error } = await supabase.rpc("validate_invitation_link", {
        _token: token,
      });
      if (error || !data || data.length === 0) {
        setState({ status: "invalid" });
        return;
      }
      const row = data[0];
      if (row.is_valid) {
        setState({ status: "valid", inviterName: row.inviter_name ?? "" });
      } else if (row.is_expired) {
        setState({ status: "expired" });
      } else if (row.is_revoked) {
        setState({ status: "revoked" });
      } else {
        setState({ status: "invalid" });
      }
    };
    validate();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!name.trim() || !email.trim()) {
      toast.error("Completa nombre y email");
      return;
    }
    setSubmitting(true);
    const { data, error } = await supabase.functions.invoke("submit-invitation-link", {
      body: { token, name: name.trim(), email: email.trim() },
    });
    setSubmitting(false);
    if (error) {
      const msg = (data as any)?.message || (error as any)?.message || "No se pudo enviar la solicitud.";
      toast.error(msg);
      return;
    }
    if ((data as any)?.success) {
      setState({ status: "submitted" });
    } else {
      toast.error((data as any)?.message || "No se pudo enviar la solicitud.");
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md p-6 sm:p-8" style={{ boxShadow: "var(--shadow-card)" }}>
        {state.status === "loading" && (
          <div className="flex flex-col items-center py-8 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin mb-3" />
            <p>Validando link…</p>
          </div>
        )}

        {state.status === "invalid" && (
          <div className="text-center py-4">
            <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-3" />
            <h1 className="text-xl font-semibold mb-2">Link no válido</h1>
            <p className="text-muted-foreground text-sm">
              Este link de invitación no es válido.
            </p>
          </div>
        )}

        {state.status === "expired" && (
          <div className="text-center py-4">
            <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-3" />
            <h1 className="text-xl font-semibold mb-2">Link caducado</h1>
            <p className="text-muted-foreground text-sm">
              Este link de invitación ha caducado. Pide a tu amigo que genere uno nuevo.
            </p>
          </div>
        )}

        {state.status === "revoked" && (
          <div className="text-center py-4">
            <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-3" />
            <h1 className="text-xl font-semibold mb-2">Link no válido</h1>
            <p className="text-muted-foreground text-sm">
              Este link ya no es válido. Pide a tu amigo que genere uno nuevo.
            </p>
          </div>
        )}

        {state.status === "submitted" && (
          <div className="text-center py-4">
            <CheckCircle2 className="w-10 h-10 text-primary mx-auto mb-3" />
            <h1 className="text-xl font-semibold mb-2">Solicitud enviada</h1>
            <p className="text-muted-foreground text-sm mb-6">
              Tu solicitud está pendiente de aprobación. Recibirás un email cuando tu
              invitador la apruebe.
            </p>
            <Button asChild variant="outline">
              <Link to="/login">Volver al inicio</Link>
            </Button>
          </div>
        )}

        {state.status === "valid" && (
          <>
            <div className="text-center mb-6">
              <Mail className="w-10 h-10 text-primary mx-auto mb-3" />
              <h1 className="text-2xl font-semibold mb-2">Te han invitado a Trusticket</h1>
              <p className="text-muted-foreground text-sm">
                <span className="text-foreground font-medium">{state.inviterName}</span> te ha invitado a
                Trusticket. Rellena tus datos para enviar tu solicitud.
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Tu nombre"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={100}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enviando…
                  </>
                ) : (
                  "Enviar solicitud"
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center pt-2">
                Tu invitador deberá aprobar la solicitud antes de crear tu cuenta.
              </p>
            </form>
          </>
        )}
      </Card>
    </div>
  );
};

export default Invite;