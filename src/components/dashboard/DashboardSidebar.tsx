import { LayoutDashboard, Users, CreditCard, BarChart3, Settings, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarItem {
  icon: React.ElementType;
  label: string;
  labelEs: string;
  id: string;
}

const sidebarItems: SidebarItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", labelEs: "Panel", id: "dashboard" },
  { icon: Users, label: "User Accounts", labelEs: "Cuentas de Usuario", id: "users" },
  { icon: CreditCard, label: "Subscriptions", labelEs: "Suscripciones", id: "subscriptions" },
  { icon: BarChart3, label: "Reports", labelEs: "Reportes", id: "reports" },
  { icon: Settings, label: "Settings", labelEs: "Configuración", id: "settings" },
  { icon: HelpCircle, label: "Support", labelEs: "Soporte", id: "support" },
];

interface DashboardSidebarProps {
  activeItem: string;
  onItemClick: (id: string) => void;
  language: "en" | "es";
  isOpen: boolean;
}

const DashboardSidebar = ({ activeItem, onItemClick, language, isOpen }: DashboardSidebarProps) => {
  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-30 w-56 bg-sidebar border-r border-sidebar-border transition-transform duration-300 lg:relative lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="flex flex-col h-full pt-20 lg:pt-4">
        <nav className="flex-1 px-3 space-y-1">
          {sidebarItems.map((item) => {
            const isActive = activeItem === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onItemClick(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-body transition-all duration-200",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary font-medium"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-primary"
                )}
              >
                <item.icon className={cn("h-4 w-4", isActive && "text-sidebar-primary")} />
                <span>{language === "es" ? item.labelEs : item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};

export default DashboardSidebar;
