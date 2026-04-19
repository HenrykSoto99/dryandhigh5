import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTelegramUsers } from "@/hooks/useAdminData";
import { Trophy, Star } from "lucide-react";

interface Props {
  language: "en" | "es";
}

function calcDays(date?: string | null) {
  if (!date) return 0;
  return Math.floor((Date.now() - new Date(date).getTime()) / 86_400_000);
}

const milestoneFor = (days: number) => {
  if (days >= 365) return { tier: 365, label: { es: "Un año libre", en: "One year free" } };
  if (days >= 180) return { tier: 180, label: { es: "Medio año", en: "Half a year" } };
  if (days >= 100) return { tier: 100, label: { es: "Cien días", en: "100 days" } };
  if (days >= 30) return { tier: 30, label: { es: "Un mes", en: "One month" } };
  if (days >= 7) return { tier: 7, label: { es: "Una semana", en: "One week" } };
  return null;
};

export default function SuccessStoriesPanel({ language }: Props) {
  const { data: users = [] } = useTelegramUsers();
  const stories = users
    .filter((u) => u.sobriety_start_date && u.onboarding_completed)
    .map((u) => ({ user: u, days: calcDays(u.sobriety_start_date), milestone: milestoneFor(calcDays(u.sobriety_start_date)) }))
    .filter((s) => s.milestone)
    .sort((a, b) => b.days - a.days)
    .slice(0, 5);

  return (
    <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
      <Card className="border-gold/30 bg-gradient-to-br from-card to-forest/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-display flex items-center gap-2 text-gold">
            <Trophy className="h-4 w-4" />
            {language === "es" ? "Hitos de la Comunidad" : "Community Milestones"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {stories.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">
              {language === "es" ? "Aún no hay hitos celebrados" : "No milestones yet"}
            </p>
          )}
          {stories.map(({ user, days, milestone }) => {
            const initial = (user.first_name?.[0] || "U").toUpperCase();
            const anonName = `${initial}.`;
            return (
              <div key={user.id} className="p-3 rounded-lg bg-muted/40 border border-gold/15 hover:border-gold/40 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-body text-sm font-semibold text-foreground">{anonName}</span>
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, j) => (
                      <Star
                        key={j}
                        className={`h-2.5 w-2.5 ${j < (milestone!.tier >= 100 ? 5 : milestone!.tier >= 30 ? 4 : 3) ? "fill-gold text-gold" : "text-muted-foreground/30"}`}
                      />
                    ))}
                  </div>
                </div>
                <p className="font-body text-xs text-gold font-medium">
                  🎖 {days} {language === "es" ? "días — " : "days — "}
                  <span className="text-muted-foreground italic">
                    {language === "es" ? milestone!.label.es : milestone!.label.en}
                  </span>
                </p>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </motion.div>
  );
}
