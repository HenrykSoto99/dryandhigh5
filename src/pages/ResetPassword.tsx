import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/safe-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff } from "lucide-react";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Supabase recovery links create a session via the URL hash
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: "Contraseña muy corta", description: "Mínimo 6 caracteres.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast({ title: "¡Listo!", description: "Tu contraseña fue actualizada." });
      navigate("/auth", { replace: true });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-primary/20">
        <CardHeader className="text-center">
          <CardTitle className="font-display text-2xl">Restablecer contraseña</CardTitle>
          <CardDescription className="font-body">
            {ready ? "Escribe tu nueva contraseña" : "Validando enlace…"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {ready ? (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <Label htmlFor="password" className="font-body text-xs">Nueva contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="font-body pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                    aria-label={showPassword ? "Ocultar" : "Mostrar"}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full font-body" disabled={loading}>
                {loading ? "Guardando…" : "Actualizar contraseña"}
              </Button>
            </form>
          ) : (
            <p className="text-center text-sm font-body text-muted-foreground">
              Si abriste este enlace desde tu correo, espera un momento. Si no, vuelve al{" "}
              <button onClick={() => navigate("/auth")} className="text-primary hover:underline">
                inicio de sesión
              </button>
              .
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
