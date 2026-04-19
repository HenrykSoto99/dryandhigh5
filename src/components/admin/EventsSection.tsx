import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useBotEvents, useTelegramUsers } from "@/hooks/useAdminData";

interface Props {
  language: "en" | "es";
}

export default function EventsSection({ language }: Props) {
  const { data: events = [] } = useBotEvents(100);
  const { data: users = [] } = useTelegramUsers();

  const userName = (uid: string | null) => {
    if (!uid) return "—";
    const u = users.find((x) => x.id === uid);
    return u?.first_name || u?.telegram_username || "Usuario";
  };

  const sevColor = (s: string) => {
    switch (s) {
      case "critical":
        return "bg-destructive/15 text-destructive border-destructive/40";
      case "warning":
        return "bg-warning/15 text-warning border-warning/40";
      default:
        return "bg-primary/10 text-primary border-primary/30";
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-gold/20">
        <CardHeader>
          <CardTitle className="font-display text-xl text-gold">
            {language === "es" ? "Registro de Eventos" : "Events Log"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <div className="space-y-2 pr-3">
              {events.length === 0 && (
                <p className="text-center text-muted-foreground py-8 text-sm">
                  {language === "es" ? "Sin eventos" : "No events"}
                </p>
              )}
              {events.map((e) => (
                <div key={e.id} className="flex items-start justify-between gap-3 p-3 rounded border border-border bg-muted/20 hover:bg-muted/40 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-body font-semibold">{userName(e.user_id)}</p>
                      <Badge variant="outline" className={`text-[10px] ${sevColor(e.severity)}`}>
                        {e.severity}
                      </Badge>
                    </div>
                    <p className="text-xs text-foreground mt-0.5">{e.event_type}</p>
                    {e.event_data && Object.keys(e.event_data as object).length > 0 && (
                      <p className="text-[10px] text-muted-foreground font-mono mt-1 truncate">
                        {JSON.stringify(e.event_data).slice(0, 120)}
                      </p>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {new Date(e.created_at).toLocaleString("es-MX", {
                      day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                    })}
                  </p>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </motion.div>
  );
}
