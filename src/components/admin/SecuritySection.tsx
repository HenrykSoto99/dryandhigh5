import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, ShieldAlert, ShieldCheck, BellRing } from "lucide-react";
import { useSecurityAlerts, useBotSettings } from "@/hooks/useAdminData";
import { supabase } from "@/integrations/supabase/safe-client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface Props {
  language: "en" | "es";
}

const t = (lang: "en" | "es", es: string, en: string) => (lang === "es" ? es : en);

const severityColor = (sev: string) => {
  if (sev === "critical") return "bg-destructive/20 text-destructive border-destructive/40";
  if (sev === "warning") return "bg-yellow-500/20 text-yellow-400 border-yellow-500/40";
  return "bg-muted text-muted-foreground border-border";
};

export default function SecuritySection({ language }: Props) {
  const { data: alerts = [], refetch } = useSecurityAlerts(false);
  const { data: chatSetting, refetch: refetchSetting } = useBotSettings("admin_telegram_chat_id");
  const { toast } = useToast();
  const qc = useQueryClient();
  const [chatId, setChatId] = useState<string>(
    chatSetting?.setting_value ? String(chatSetting.setting_value) : "",
  );

  const saveChatId = async () => {
    const num = Number(chatId);
    if (!chatId || Number.isNaN(num)) {
      toast({ title: "Chat ID inválido", description: "Debe ser un número.", variant: "destructive" });
      return;
    }
    const { error } = await supabase
      .from("bot_settings")
      .update({ setting_value: num as never, updated_at: new Date().toISOString() })
      .eq("setting_key", "admin_telegram_chat_id");
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Listo", description: "Chat ID guardado, vas a recibir alertas." });
      refetchSetting();
    }
  };

  const resolveAlert = async (id: string) => {
    const { error } = await supabase
      .from("security_alerts")
      .update({ resolved: true, resolved_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      qc.invalidateQueries({ queryKey: ["security_alerts"] });
      refetch();
    }
  };

  const unresolved = alerts.filter((a: any) => !a.resolved);
  const critical = unresolved.filter((a: any) => a.severity === "critical");

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-gold/20">
          <CardContent className="p-5 flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-gold" />
            <div>
              <p className="text-2xl font-display font-bold text-foreground">{alerts.length}</p>
              <p className="text-xs text-muted-foreground">{t(language, "Alertas totales", "Total alerts")}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-yellow-500/30">
          <CardContent className="p-5 flex items-center gap-3">
            <Shield className="h-8 w-8 text-yellow-400" />
            <div>
              <p className="text-2xl font-display font-bold text-foreground">{unresolved.length}</p>
              <p className="text-xs text-muted-foreground">{t(language, "Sin resolver", "Unresolved")}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-destructive/40">
          <CardContent className="p-5 flex items-center gap-3">
            <ShieldAlert className="h-8 w-8 text-destructive" />
            <div>
              <p className="text-2xl font-display font-bold text-foreground">{critical.length}</p>
              <p className="text-xs text-muted-foreground">{t(language, "Críticas activas", "Active critical")}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-gold/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display text-gold text-lg">
            <BellRing className="h-5 w-5" />
            {t(language, "Notificaciones a Telegram", "Telegram notifications")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {t(
              language,
              "Pega aquí tu Telegram chat_id para recibir las alertas críticas en tu DM. Para obtenerlo: abre tu bot, escribe /start, y revisa la sección Usuarios para ver tu chat_id.",
              "Paste your Telegram chat_id to receive critical alerts in your DM.",
            )}
          </p>
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <Label htmlFor="chatid" className="text-xs">Chat ID</Label>
              <Input
                id="chatid"
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
                placeholder="123456789"
                className="font-mono"
              />
            </div>
            <Button onClick={saveChatId} className="bg-gold hover:bg-gold/90 text-charcoal font-body">
              {t(language, "Guardar", "Save")}
            </Button>
          </div>
          {chatSetting?.setting_value ? (
            <p className="text-xs text-success">
              ✓ {t(language, "Configurado:", "Configured:")} <span className="font-mono">{String(chatSetting.setting_value)}</span>
            </p>
          ) : (
            <p className="text-xs text-yellow-400">
              ⚠️ {t(language, "Sin configurar — no recibirás alertas en Telegram", "Not configured")}
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="border-gold/20">
        <CardHeader>
          <CardTitle className="font-display text-gold text-lg">
            {t(language, "Bitácora de seguridad", "Security log")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {t(language, "Todo tranquilo, compa. Sin alertas. 🛡️", "All clear. No alerts. 🛡️")}
            </p>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {alerts.map((a: any) => (
                <div
                  key={a.id}
                  className={`p-3 rounded-lg border ${a.resolved ? "border-border opacity-60" : "border-gold/20"} bg-card/50`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Badge variant="outline" className={severityColor(a.severity)}>
                          {a.severity.toUpperCase()}
                        </Badge>
                        <span className="text-xs font-mono text-muted-foreground">{a.alert_type}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(a.created_at).toLocaleString("es-MX")}
                        </span>
                      </div>
                      <p className="text-sm font-body text-foreground">{a.summary}</p>
                      {a.details && Object.keys(a.details).length > 0 && (
                        <pre className="mt-2 text-[10px] text-muted-foreground bg-muted/30 p-2 rounded overflow-x-auto max-h-32">
                          {JSON.stringify(a.details, null, 2)}
                        </pre>
                      )}
                    </div>
                    {!a.resolved && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => resolveAlert(a.id)}
                        className="shrink-0"
                      >
                        {t(language, "Resolver", "Resolve")}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}