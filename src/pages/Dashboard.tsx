import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CalendarDays, HeartHandshake, LineChart, LogOut, ShieldCheck, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/safe-client";
import { ensureMemberProfile } from "@/lib/auth-profile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import ProfileEditor from "@/components/dashboard/ProfileEditor";

type MemberProfile = {
  display_name: string | null;
  name: string | null;
  avatar_url: string | null;
  sobriety_start_date: string | null;
  check_in_morning: string;
  check_in_evening: string;
  onboarding_complete: boolean;
};

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;

    const loadDashboard = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        if (mounted) {
          setLoading(false);
          navigate("/auth", { replace: true });
        }
        return;
      }

      await ensureMemberProfile(session.user);

      const [{ data: roleData, error: roleError }, { data: profileData, error: profileError }] = await Promise.all([
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .eq("role", "admin")
          .maybeSingle(),
        supabase
          .from("profiles")
          .select("display_name, name, sobriety_start_date, check_in_morning, check_in_evening, onboarding_complete")
          .eq("user_id", session.user.id)
          .maybeSingle(),
      ]);

      if (!mounted) return;

      const admin = !roleError && roleData?.role === "admin";
      setIsAdmin(admin);

      if (admin) {
        navigate("/admin", { replace: true });
        return;
      }

      if (profileError && profileError.code !== "PGRST116") {
        toast({
          title: "Error al cargar tu cuenta",
          description: profileError.message,
          variant: "destructive",
        });
      }

      setProfile((profileData as MemberProfile | null) ?? null);
      setLoading(false);
    };

    void loadDashboard();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth", { replace: true });
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [navigate, toast]);

  const streakDays = useMemo(() => {
    if (!profile?.sobriety_start_date) return null;
    const start = new Date(`${profile.sobriety_start_date}T00:00:00`);
    const today = new Date();
    const diff = today.getTime() - start.getTime();
    return Math.max(0, Math.floor(diff / 86_400_000));
  }, [profile?.sobriety_start_date]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth", { replace: true });
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
        <p className="font-body text-sm text-muted-foreground">Cargando tu espacio…</p>
      </main>
    );
  }

  const displayName = profile?.display_name || profile?.name || "Compa";

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="border-b border-border bg-card/40">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <Badge variant="secondary" className="bg-primary/10 text-primary">Miembro activo</Badge>
            <div className="space-y-2">
              <h1 className="font-display text-4xl text-gold">Hola, {displayName}</h1>
              <p className="max-w-2xl font-body text-sm text-muted-foreground">
                Aquí puedes llevar tu avance, revisar tus horarios de check-in y entrar al bot para registrar cómo vas hoy.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <a href="https://t.me/DryandHighFiveAABot" target="_blank" rel="noreferrer">Abrir bot</a>
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-6 py-8 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Racha actual</CardDescription>
            <CardTitle className="font-display text-3xl text-gold">{streakDays ?? "—"}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 font-body text-sm text-muted-foreground">
            {streakDays !== null ? "días desde tu fecha de inicio registrada." : "Agrega tu fecha de inicio para ver tu avance."}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Check-ins</CardDescription>
            <CardTitle className="font-display text-3xl text-gold">2 al día</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 font-body text-sm text-muted-foreground">
            Mañana: {profile?.check_in_morning?.slice(0, 5) ?? "08:00"} · Noche: {profile?.check_in_evening?.slice(0, 5) ?? "20:00"}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Estado de onboarding</CardDescription>
            <CardTitle className="font-display text-3xl text-gold">{profile?.onboarding_complete ? "Completo" : "Pendiente"}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 font-body text-sm text-muted-foreground">
            {profile?.onboarding_complete ? "Tu cuenta ya está lista para registrar progreso." : "Completa tu primer check-in desde Telegram para terminar de activar tu proceso."}
          </CardContent>
        </Card>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-6 pb-10 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-2xl"><HeartHandshake className="h-5 w-5 text-primary" />Tu recorrido</CardTitle>
            <CardDescription>Accesos rápidos para registrar y seguir tu proceso.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-border p-4">
              <div className="mb-2 flex items-center gap-2 font-display text-lg text-foreground"><CalendarDays className="h-4 w-4 text-primary" />Rutina diaria</div>
              <p className="font-body text-sm text-muted-foreground">Entra al bot para contestar tus check-ins y mantener tu constancia visible.</p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <div className="mb-2 flex items-center gap-2 font-display text-lg text-foreground"><LineChart className="h-4 w-4 text-primary" />Seguimiento</div>
              <p className="font-body text-sm text-muted-foreground">Tu panel mostrará aquí tu récord conforme registres avances y emociones.</p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <div className="mb-2 flex items-center gap-2 font-display text-lg text-foreground"><ShieldCheck className="h-4 w-4 text-primary" />Privacidad</div>
              <p className="font-body text-sm text-muted-foreground">Solo tú y el panel autorizado pueden ver tus datos personales.</p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <div className="mb-2 flex items-center gap-2 font-display text-lg text-foreground"><Sparkles className="h-4 w-4 text-primary" />Siguiente paso</div>
              <p className="font-body text-sm text-muted-foreground">Si aún no has enlazado Telegram, abre el bot y escribe cualquier mensaje para empezar.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-display text-2xl">¿Necesitas acceso admin?</CardTitle>
            <CardDescription>El panel administrativo está separado del espacio de miembros.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 font-body text-sm text-muted-foreground">
            <p>
              Si eres miembro, quédate en este panel. Si eres administrador autorizado, tu cuenta se redirige automáticamente al panel de control.
            </p>
            {!isAdmin ? (
              <Button asChild variant="outline" className="w-full">
                <Link to="/auth">Ir a login / registro</Link>
              </Button>
            ) : null}
          </CardContent>
        </Card>
      </section>
    </main>
  );
};

export default Dashboard;
