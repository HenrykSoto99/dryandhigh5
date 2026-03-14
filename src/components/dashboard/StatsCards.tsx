import { Users, UserPlus, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

interface StatsCardsProps {
  language: "en" | "es";
}

const StatsCards = ({ language }: StatsCardsProps) => {
  const stats = [
    {
      icon: Users,
      value: "606",
      label: language === "es" ? "Usuarios Activos Totales" : "Total Active Users",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      icon: UserPlus,
      value: "20",
      label: language === "es" ? "Nuevos Miembros (Mes)" : "New Members (Month)",
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      icon: TrendingUp,
      value: "80%",
      label: language === "es" ? "Tasa de Retención" : "Retention Rate",
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1, duration: 0.4 }}
        >
          <Card className="border-border hover:border-primary/40 transition-colors duration-300 hover:shadow-md">
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`${stat.bgColor} p-3 rounded-xl`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-3xl font-display font-bold text-foreground">{stat.value}</p>
                <p className="text-xs font-body text-muted-foreground mt-0.5">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default StatsCards;
