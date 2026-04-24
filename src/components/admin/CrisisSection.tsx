import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCrisisFlags, useTelegramUsers } from "@/hooks/useAdminData";
import { supabase } from "@/integrations/supabase/safe-client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface Props {
  language: "en" | "es";
}

export default function CrisisSection({ language }: Props) {
  const { data: flags = [] } = useCrisisFlags(false);
  const { data: users = [] } = useTelegramUsers();
  const qc = useQueryClient();

  const resolve = async (id: string) => {
    const { error } = await supabase
      .from("crisis_flags")
      .update({ resolved: true, resolved_at: new Date().toISOString(), admin_acknowledged: true })
      .eq("id", id);
    if (error) {
      toast.error(language === "es" ? "Error al resolver" : "Failed to resolve");
      return;
    }
    toast.success(language === "es" ? "Marcado como resuelto" : "Marked as resolved");
    qc.invalidateQueries({ queryKey: ["crisis_flags"] });
  };

  const userName = (uid: string) => {
    const u = users.find((x) => x.id === uid);
    return u?.first_name || u?.telegram_username || `#${u?.telegram_user_id || "?"}`;
  };

  const sevColor = (s: string) => {
    switch (s) {
      case "critical":
        return "bg-destructive/15 text-destructive border-destructive/40";
      case "high":
        return "bg-warning/15 text-warning border-warning/40";
      case "medium":
        return "bg-amber/15 text-amber border-amber/40";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-gold/20">
        <CardHeader>
          <CardTitle className="font-display text-xl text-gold flex items-center gap-2">
            {language === "es" ? "Banderas de Crisis" : "Crisis Flags"}
            <Badge variant="outline" className="text-xs">{flags.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {flags.length === 0 && (
            <p className="text-center text-muted-foreground py-8 text-sm">
              {language === "es" ? "Sin alertas. Todo tranqui 🤙" : "No alerts. All calm 🤙"}
            </p>
          )}
          {flags.map((f) => (
            <motion.div
              key={f.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className={`p-4 rounded-lg border ${
                f.resolved ? "border-border bg-muted/30 opacity-70" : "border-destructive/30 bg-destructive/5"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-display font-bold text-foreground">{userName(f.user_id)}</span>
                    <Badge variant="outline" className={`text-[10px] ${sevColor(f.severity)}`}>
                      {f.severity}
                    </Badge>
                    {f.resolved && (
                      <Badge variant="outline" className="text-[10px] border-success/40 text-success bg-success/10">
                        {language === "es" ? "Resuelto" : "Resolved"}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    {new Date(f.created_at).toLocaleString("es-MX")}
                  </p>
                  {f.trigger_keywords?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {f.trigger_keywords.map((k, i) => (
                        <Badge key={i} variant="secondary" className="text-[10px]">
                          {k}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {f.admin_notes && (
                    <p className="text-xs italic text-muted-foreground">{f.admin_notes}</p>
                  )}
                </div>
                {!f.resolved && (
                  <Button
                    size="sm"
                    onClick={() => resolve(f.id)}
                    className="bg-success hover:bg-success/90 text-success-foreground"
                  >
                    {language === "es" ? "Resolver" : "Resolve"}
                  </Button>
                )}
              </div>
            </motion.div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}
