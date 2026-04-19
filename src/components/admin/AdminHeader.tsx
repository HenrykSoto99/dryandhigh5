import { Menu, Globe, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface Props {
  onToggleSidebar: () => void;
  language: "en" | "es";
  onToggleLanguage: () => void;
  title?: string;
}

export default function AdminHeader({ onToggleSidebar, language, onToggleLanguage, title }: Props) {
  const navigate = useNavigate();
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between px-4 lg:px-6 py-3 border-b border-gold/20 bg-charcoal/95 backdrop-blur">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onToggleSidebar} className="lg:hidden text-gold hover:bg-gold/10">
          <Menu className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="font-display text-lg lg:text-xl font-bold text-gold">
            {title || (language === "es" ? "Panel de Control" : "Control Panel")}
          </h1>
          <p className="text-[11px] font-body text-sidebar-foreground/60">
            {language === "es" ? "Dry & High Five — Comunidad" : "Dry & High Five — Community"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleLanguage}
          className="gap-1.5 font-body text-xs border-gold/40 text-gold hover:bg-gold/10 hover:text-gold"
        >
          <Globe className="h-3.5 w-3.5" />
          <span className={language === "en" ? "font-bold" : "opacity-60"}>EN</span>
          <span className="opacity-40">/</span>
          <span className={language === "es" ? "font-bold" : "opacity-60"}>ES</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          className="gap-1.5 font-body text-xs border-destructive/40 text-destructive hover:bg-destructive/10"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{language === "es" ? "Salir" : "Logout"}</span>
        </Button>
      </div>
    </header>
  );
}
