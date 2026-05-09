import { useEffect, useState } from "react";
import { useAdminGuard } from "@/hooks/useAdminGuard";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar, { AdminSection } from "@/components/admin/AdminSidebar";
import AdminStatsCards from "@/components/admin/AdminStatsCards";
import UsersSection from "@/components/admin/UsersSection";
import CrisisSection from "@/components/admin/CrisisSection";
import BroadcastSection from "@/components/admin/BroadcastSection";
import HolidaysSection from "@/components/admin/HolidaysSection";
import TemplatesSection from "@/components/admin/TemplatesSection";
import EventsSection from "@/components/admin/EventsSection";
import SuccessStoriesPanel from "@/components/admin/SuccessStoriesPanel";
import SecuritySection from "@/components/admin/SecuritySection";
import ProfileEditor from "@/components/dashboard/ProfileEditor";
import { useCrisisFlags, useSecurityAlerts } from "@/hooks/useAdminData";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/safe-client";

export default function AdminDashboard() {
  const { loading, isAdmin } = useAdminGuard();
  const navigate = useNavigate();
  const [language, setLanguage] = useState<"en" | "es">("es");
  const [section, setSection] = useState<AdminSection>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: unresolvedCrisis = [] } = useCrisisFlags(true);
  const { data: unresolvedSecurity = [] } = useSecurityAlerts(true);
  const [meId, setMeId] = useState<string | null>(null);
  const [meProfile, setMeProfile] = useState<{ display_name: string | null; name: string | null; avatar_url: string | null } | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !mounted) return;
      setMeId(session.user.id);
      const { data } = await supabase
        .from("profiles")
        .select("display_name, name, avatar_url")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (mounted) setMeProfile(data ?? { display_name: null, name: null, avatar_url: null });
    })();
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <div className="dark min-h-screen bg-background flex items-center justify-center">
        <p className="font-display text-gold animate-pulse">Cargando panel...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="dark min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="border-destructive/40 max-w-md">
          <CardContent className="p-6 text-center space-y-3">
            <h2 className="font-display text-xl text-destructive">Acceso restringido</h2>
            <p className="text-sm text-muted-foreground">
              Este panel está reservado para el dueño de la app. Si crees que debes tener acceso, contacta al administrador.
            </p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => navigate("/")}>Inicio</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const titles: Record<AdminSection, [string, string]> = {
    dashboard: ["Overview", "Vista General"],
    users: ["User Accounts", "Cuentas de Usuario"],
    crisis: ["Crisis Alerts", "Alertas de Crisis"],
    broadcast: ["Broadcast", "Difusión"],
    holidays: ["Holidays", "Festivos"],
    templates: ["Templates", "Plantillas"],
    events: ["Events Log", "Registro de Eventos"],
    security: ["Security", "Seguridad"],
    settings: ["Settings", "Configuración"],
  };
  const title = language === "es" ? titles[section][1] : titles[section][0];

  return (
    <div className="dark min-h-screen bg-background text-foreground font-body">
      <div className="flex min-h-screen w-full">
        <AdminSidebar
          active={section}
          onSelect={(s) => { setSection(s); setSidebarOpen(false); }}
          language={language}
          isOpen={sidebarOpen}
          crisisCount={unresolvedCrisis.length}
          securityCount={unresolvedSecurity.length}
        />

        {sidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-black/60 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <div className="flex-1 flex flex-col min-w-0">
          <AdminHeader
            onToggleSidebar={() => setSidebarOpen((o) => !o)}
            language={language}
            onToggleLanguage={() => setLanguage((l) => (l === "en" ? "es" : "en"))}
            title={title}
          />

          <main className="flex-1 p-4 lg:p-6 space-y-6 overflow-x-hidden">
            {section === "dashboard" && (
              <>
                <AdminStatsCards language={language} />
                <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
                  <div className="space-y-6">
                    <UsersSection language={language} />
                    {unresolvedCrisis.length > 0 && <CrisisSection language={language} />}
                  </div>
                  <SuccessStoriesPanel language={language} />
                </div>
              </>
            )}
            {section === "users" && <UsersSection language={language} />}
            {section === "crisis" && <CrisisSection language={language} />}
            {section === "broadcast" && <BroadcastSection language={language} />}
            {section === "holidays" && <HolidaysSection language={language} />}
            {section === "templates" && <TemplatesSection language={language} />}
            {section === "events" && <EventsSection language={language} />}
            {section === "security" && <SecuritySection language={language} />}
            {section === "settings" && (
              <Card className="border-gold/20">
                <CardContent className="p-8 text-center text-muted-foreground">
                  {language === "es"
                    ? "Configuración avanzada próximamente."
                    : "Advanced settings coming soon."}
                </CardContent>
              </Card>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
