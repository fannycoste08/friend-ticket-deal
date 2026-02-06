import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const Register = () => {
  const navigate = useNavigate();
  const { signUp, user } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [inviterEmail, setInviterEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [inviterName, setInviterName] = useState("");
  const [acceptedManifesto, setAcceptedManifesto] = useState(false);

  if (user) {
    navigate("/");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const normalizedEmail = email.trim().toLowerCase();

    const { data: existingUser } = await supabase
      .from("profiles")
      .select("email")
      .ilike("email", normalizedEmail)
      .maybeSingle();

    if (existingUser) {
      toast.error("Este email ya está registrado");
      setLoading(false);
      return;
    }

    const normalizedInviterEmail = inviterEmail.trim().toLowerCase();

    const { data: verifyResult, error: verifyError } = await supabase.functions.invoke("verify-inviter-email", {
      body: { email: normalizedInviterEmail },
    });

    if (verifyError || !verifyResult?.exists) {
      toast.error("El email del padrino no existe en el sistema");
      setLoading(false);
      return;
    }

    const { data: invitationResult, error: invitationError } = await supabase.functions.invoke(
      "create-invitation-request",
      {
        body: {
          inviter_email: normalizedInviterEmail,
          invitee_email: normalizedEmail,
          invitee_name: name,
        },
      },
    );

    if (invitationError || !invitationResult?.success) {
      if (invitationResult?.error === "Pending invitation already exists") {
        toast.error("Ya existe una solicitud pendiente para este email");
      } else {
        toast.error("Error al crear la solicitud de invitación");
      }
      setLoading(false);
      return;
    }

    const { error: emailError } = await supabase.functions.invoke("send-invitation-notification", {
      body: {
        inviter_email: normalizedInviterEmail,
        inviter_name: invitationResult.invitation?.inviter_name || "Usuario",
        invitee_name: name,
        invitee_email: normalizedEmail,
      },
    });

    if (emailError) {
      // Don't fail the registration if email fails
    }

    setInviterName("tu padrino");
    setShowSuccessModal(true);
    setLoading(false);
  };

  return (
    <>
      <Dialog
        open={showSuccessModal}
        onOpenChange={(open) => {
          setShowSuccessModal(open);
          if (!open) navigate("/login");
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
            <DialogTitle className="text-center text-xl">¡Gracias por registrarte!</DialogTitle>
            <DialogDescription className="text-center space-y-3 pt-4">
              <p className="text-sm">
                Tu solicitud ha sido enviada a <strong>{inviterName}</strong>.
              </p>
              <p className="text-sm text-muted-foreground">
                Recibirás un correo de confirmación cuando la persona que te apadrina haya aceptado tu solicitud.
              </p>
              <p className="text-xs text-muted-foreground">
                Una vez aprobada, recibirás un correo para crear tu contraseña e iniciar sesión.
              </p>
            </DialogDescription>
          </DialogHeader>
          <Button
            onClick={() => {
              setShowSuccessModal(false);
              navigate("/login");
            }}
            className="w-full mt-4"
          >
            Entendido
          </Button>
        </DialogContent>
      </Dialog>

      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-md fade-in-up">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground tracking-tight">
              Registro por invitación
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Solo puedes registrarte si alguien te apadrina
            </p>
          </div>

          <div className="bg-card rounded-xl p-8 border border-border/60" style={{ boxShadow: "var(--shadow-card)" }}>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre completo</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Juan Pérez"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="h-11"
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
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inviterEmail">Email de quien te invita</Label>
                <Input
                  id="inviterEmail"
                  type="email"
                  placeholder="padrino@email.com"
                  value={inviterEmail}
                  onChange={(e) => setInviterEmail(e.target.value)}
                  required
                  className="h-11"
                />
              </div>

              <div className="flex items-start gap-3 rounded-lg bg-muted p-4">
                <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  Tu registro debe ser aprobado por la persona que te invita
                </p>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="manifesto"
                  checked={acceptedManifesto}
                  onCheckedChange={(checked) => setAcceptedManifesto(checked === true)}
                />
                <label htmlFor="manifesto" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                  Estoy de acuerdo con el{" "}
                  <a
                    href="/manifesto"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline hover:text-primary/80"
                  >
                    manifiesto trusticket
                  </a>{" "}
                  y me comprometo a seguir las reglas de uso del servicio.
                </label>
              </div>

              <Button type="submit" className="w-full h-11" disabled={loading || !acceptedManifesto}>
                {loading ? "Solicitando registro..." : "Solicitar registro"}
              </Button>
            </form>

            <p className="mt-5 text-center text-sm text-muted-foreground">
              ¿Ya tienes cuenta?{" "}
              <Link to="/login" className="text-primary hover:text-primary/80 font-medium transition-colors">
                Inicia sesión
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Register;
