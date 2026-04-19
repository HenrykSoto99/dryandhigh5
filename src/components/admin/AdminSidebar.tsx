import { LayoutDashboard, Users, Megaphone, Calendar, MessageSquare, AlertTriangle, FileText, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import mascotImg from "@/assets/mascot.jpg";

export type AdminSection =
  | "dashboard"
  | "users"
  | "crisis"
  | "broadcast"
  | "holidays"
  | "templates"
  | "events"
  | "settings";

interface NavItem {
  id: AdminSection;
  icon: React.ElementType;
  label: string;
  labelEs: string;
  badge?: number;
}

interface Props {
  active: AdminSection;
  onSelect: (id: AdminSection) => void;
  language: "en" | "es";
  isOpen: boolean;
  crisisCount: number;
}

export default function AdminSidebar({ active, onSelect, language, isOpen, crisisCount }: Props) {
  const items: NavItem[] = [
    { id: "dashboard", icon: LayoutDashboard, label: "Dashboard", labelEs: "Panel" },
    { id: "users", icon: Users, label: "Users", labelEs: "Usuarios" },
    { id: "crisis", icon: AlertTriangle, label: "Crisis Alerts", labelEs: "Alertas Crisis", badge: crisisCount },
    { id: "broadcast", icon: Megaphone, label: "Broadcast", labelEs: "Difusión" },
    { id: "holidays", icon: Calendar, label: "Holidays", labelEs: "Festivos" },
    { id: "templates", icon: MessageSquare, label: "Templates", labelEs: "Plantillas" },
    { id: "events", icon: FileText, label: "Events Log", labelEs: "Eventos" },
    { id: "settings", icon: Settings, label: "Settings", labelEs: "Configuración" },
  ];

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-30 w-64 bg-sidebar border-r border-gold/30 transition-transform duration-300 lg:relative lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 px-5 py-5 border-b border-gold/20">
          <img
            src={mascotImg}
            alt="D&HF"
            className="h-10 w-10 rounded-full object-cover border-2 border-gold"
          />
          <div>
            <h2 className="font-display text-base font-bold text-gold leading-tight">
              Dry &amp; High Five
            </h2>
            <p className="text-[10px] font-body uppercase tracking-wider text-sidebar-foreground/60">
              {language === "es" ? "Admin" : "Admin"}
            </p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {items.map((item) => {
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelect(item.id)}
                className={cn(
                  "w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-body transition-all duration-200 group",
                  isActive
                    ? "bg-gold/15 text-gold border border-gold/40 shadow-[0_0_12px_-4px_hsl(var(--gold)/0.4)]"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-gold border border-transparent"
                )}
              >
                <span className="flex items-center gap-3">
                  <item.icon
                    className={cn(
                      "h-4 w-4 transition-colors",
                      isActive ? "text-gold" : "text-sidebar-foreground/60 group-hover:text-gold"
                    )}
                  />
                  <span>{language === "es" ? item.labelEs : item.label}</span>
                </span>
                {item.badge ? (
                  <span className="text-[10px] font-bold bg-destructive text-destructive-foreground rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>

        <div className="px-5 py-3 border-t border-gold/20">
          <p className="text-[10px] font-body text-sidebar-foreground/50 italic">
            {language === "es" ? "Hecho con cariño 🤙" : "Made with care 🤙"}
          </p>
        </div>
      </div>
    </aside>
  );
}
