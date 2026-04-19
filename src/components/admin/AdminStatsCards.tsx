import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Users, UserPlus, TrendingUp, AlertTriangle, MessageSquare, Flame } from "lucide-react";
import AnimatedNumber from "./AnimatedNumber";
import { useTelegramUsers, useCrisisFlags, useBotEvents } from "@/hooks/useAdminData";

interface Props {
  language: "en" | "es";
}

export default function AdminStatsCards({ language }: Props) {
  const { data: users = [] } = useTelegramUsers();
  const { data: crisis = [] } = useCrisisFlags(false);
  const { data: events = [] } = useBotEvents(200);

  const now = Date.now();
  const dayMs = 86_400_000;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const totalActive = users.filter((u) => u.onboarding_completed).length;
  const newThisMonth = users.filter((u) => {
    const d = new Date(u.created_at);
    return d.getMonth() === new Date().getMonth() && d.getFullYear() === new Date().getFullYear();
  }).length;
  const activeToday = users.filter(
    (u) => u.last_interaction_at && new Date(u.last_interaction_at).getTime() >= todayStart.getTime()
  ).length;
  const retention = totalActive > 0 ? Math.round((activeToday / totalActive) * 100) : 0;

  const sobrietyDays = users
    .filter((u) => u.sobriety_start_date)
    .map((u) => Math.floor((now - new Date(u.sobriety_start_date!).getTime()) / dayMs));
  const avgSobriety = sobrietyDays.length
    ? Math.round(sobrietyDays.reduce((a, b) => a + b, 0) / sobrietyDays.length)
    : 0;

  const crisis24h = crisis.filter((c) => now - new Date(c.created_at).getTime() < dayMs).length;
  const crisis7d = crisis.filter((c) => now - new Date(c.created_at).getTime() < 7 * dayMs).length;
  const eventsToday = events.filter((e) => new Date(e.created_at).getTime() >= todayStart.getTime()).length;

  const t = (en: string, es: string) => (language === "es" ? es : en);

  const cards = [
    {
      icon: Users,
      value: totalActive,
      label: t("Total Active Users", "Usuarios Activos"),
      sub: t(`${activeToday} active today`, `${activeToday} activos hoy`),
      iconBg: "bg-amber/15 text-amber",
      border: "border-amber/30",
    },
    {
      icon: UserPlus,
      value: newThisMonth,
      label: t("New Members (Month)", "Nuevos (Mes)"),
      sub: t("This calendar month", "Este mes calendario"),
      iconBg: "bg-forest/15 text-forest",
      border: "border-forest/30",
    },
    {
      icon: TrendingUp,
      value: retention,
      suffix: "%",
      label: t("Daily Retention", "Retención Diaria"),
      sub: t("Active today / total", "Activos hoy / total"),
      iconBg: "bg-success/15 text-success",
      border: "border-success/30",
    },
    {
      icon: Flame,
      value: avgSobriety,
      label: t("Avg Sobriety (days)", "Sobriedad Promedio"),
      sub: t("Across all users", "Promedio de todos"),
      iconBg: "bg-gold/15 text-gold",
      border: "border-gold/30",
    },
    {
      icon: AlertTriangle,
      value: crisis24h,
      label: t("Crisis Alerts (24h)", "Crisis (24h)"),
      sub: t(`${crisis7d} in last 7 days`, `${crisis7d} en últimos 7 días`),
      iconBg: "bg-destructive/15 text-destructive",
      border: "border-destructive/30",
    },
    {
      icon: MessageSquare,
      value: eventsToday,
      label: t("Events Today", "Eventos Hoy"),
      sub: t("Bot interactions", "Interacciones del bot"),
      iconBg: "bg-primary/15 text-primary",
      border: "border-primary/30",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map((c, i) => (
        <motion.div
          key={c.label}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06, duration: 0.4 }}
          whileHover={{ y: -3, scale: 1.01 }}
        >
          <Card
            className={`${c.border} bg-card hover:shadow-lg hover:shadow-primary/5 transition-shadow`}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className={`${c.iconBg} p-2 rounded-lg`}>
                  <c.icon className="h-4 w-4" />
                </div>
              </div>
              <p className="text-3xl font-display font-bold text-foreground mt-3">
                <AnimatedNumber value={c.value} suffix={c.suffix} />
              </p>
              <p className="text-xs font-body font-semibold text-foreground mt-1">{c.label}</p>
              <p className="text-[10px] font-body text-muted-foreground">{c.sub}</p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
