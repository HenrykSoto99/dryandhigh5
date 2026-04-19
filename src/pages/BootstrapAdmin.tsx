import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Shield, ShieldCheck } from "lucide-react";

const BootstrapAdmin = () => {
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasAnyAdmin, setHasAnyAdmin] = useState<boolean | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUserId(session.user.id);
      setEmail(session.user.email ?? null);

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);
      setIsAdmin((roles || []).some((r) => r.role === "admin"));

      const { count } = await supabase
        .from("user_roles")
        .select("*", { count: "exact", head: true })
        .eq("role", "admin");
      setHasAnyAdmin((count ?? 0) > 0);
    })();
  }, [navigate]);

  const claimAdmin = async () => {
    if (!userId) return;
    setLoading(true);
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: "admin" });
    if (error) {
      toast({ title: "No se pudo asignar admin", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "¡Listo, compa!", description: "Ya eres admin." });
      setIsAdmin(true);
      setHasAnyAdmin(true);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-primary/20">
        <CardHeader className="text-center">
          {isAdmin ? (
            <ShieldCheck className="h-12 w-12 mx-auto text-primary mb-2" />
          ) : (
            <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
          )}
          <CardTitle className="font-display text-2xl">Acceso de administrador</CardTitle>
          <CardDescription className="font-body">
            {email && <>Sesión: <strong>{email}</strong></>}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 font-body">
          {isAdmin ? (
            <>
              <p className="text-sm text-center">Ya tienes rol de administrador. ¡Vámonos al dashboard!</p>
              <Button className="w-full" onClick={() => navigate("/dashboard")}>Ir al dashboard</Button>
            </>
          ) : hasAnyAdmin === false ? (
            <>
              <p className="text-sm text-center">
                Aún no hay ningún admin en el sistema. Reclámalo para administrar el bot.
              </p>
              <Button className="w-full" onClick={claimAdmin} disabled={loading}>
                {loading ? "Asignando..." : "Convertirme en admin"}
              </Button>
            </>
          ) : (
            <p className="text-sm text-center text-muted-foreground">
              Ya existe al menos un admin. Pídele a un admin existente que te asigne el rol.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BootstrapAdmin;
