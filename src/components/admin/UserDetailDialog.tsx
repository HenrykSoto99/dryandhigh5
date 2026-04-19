import { useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTelegramUsers, useEmotionalLogs, useUserMessages, useUserCrisis } from "@/hooks/useAdminData";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Flame, Calendar, MessageSquare, AlertTriangle } from "lucide-react";

interface Props {
  userId: string | null;
  onClose: () => void;
  language: "en" | "es";
}

function calcDays(date?: string | null) {
  if (!date) return 0;
  return Math.floor((Date.now() - new Date(date).getTime()) / 86_400_000);
}

export default function UserDetailDialog({ userId, onClose, language }: Props) {
  const { data: users = [] } = useTelegramUsers();
  const user = users.find((u) => u.id === userId) || null;
  const { data: logs = [] } = useEmotionalLogs(user?.id);
  const { data: messages = [] } = useUserMessages(user?.id);
  const { data: crisis = [] } = useUserCrisis(user?.id);

  const chartData = useMemo(() => {
    const days = 30;
    const cutoff = Date.now() - days * 86_400_000;
    return logs
      .filter((l) => new Date(l.created_at).getTime() > cutoff)
      .map((l) => ({
        date: new Date(l.created_at).toLocaleDateString("es-MX", { day: "2-digit", month: "short" }),
        intensity: l.intensity ?? 5,
        emotion: l.emotion,
      }));
  }, [logs]);

  const lastMessage = messages.length ? messages[messages.length - 1] : null;
  const activeCrisis = crisis.filter((c) => !c.resolved);

  return (
    <Dialog open={!!userId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-gold flex items-center gap-3">
            {user?.first_name || "Usuario"}
            <span className="text-sm font-body font-normal text-muted-foreground">
              {user?.telegram_username ? `@${user.telegram_username}` : `#${user?.telegram_user_id}`}
            </span>
          </DialogTitle>
        </DialogHeader>

        {user && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Card className="border-gold/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-gold mb-1">
                    <Flame className="h-4 w-4" />
                    <p className="text-xs font-body uppercase tracking-wide">{language === "es" ? "Sobriedad" : "Sobriety"}</p>
                  </div>
                  <p className="text-2xl font-display font-bold">
                    {user.sobriety_start_date ? `${calcDays(user.sobriety_start_date)} d` : "—"}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-amber/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-amber mb-1">
                    <Calendar className="h-4 w-4" />
                    <p className="text-xs font-body uppercase tracking-wide">{language === "es" ? "Inscrito" : "Joined"}</p>
                  </div>
                  <p className="text-sm font-display font-bold">
                    {new Date(user.created_at).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-forest/30">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-forest mb-1">
                    <MessageSquare className="h-4 w-4" />
                    <p className="text-xs font-body uppercase tracking-wide">{language === "es" ? "Mensajes" : "Messages"}</p>
                  </div>
                  <p className="text-2xl font-display font-bold">{messages.length}</p>
                </CardContent>
              </Card>
              <Card className={activeCrisis.length ? "border-destructive/40" : "border-success/30"}>
                <CardContent className="p-4">
                  <div className={`flex items-center gap-2 mb-1 ${activeCrisis.length ? "text-destructive" : "text-success"}`}>
                    <AlertTriangle className="h-4 w-4" />
                    <p className="text-xs font-body uppercase tracking-wide">{language === "es" ? "Crisis" : "Crisis"}</p>
                  </div>
                  <p className="text-2xl font-display font-bold">{activeCrisis.length}</p>
                  <p className="text-[10px] text-muted-foreground">{crisis.length} {language === "es" ? "totales" : "total"}</p>
                </CardContent>
              </Card>
            </div>

            <Card className="border-gold/20">
              <CardHeader className="pb-2">
                <CardTitle className="font-display text-base text-gold">
                  {language === "es" ? "Tendencia Emocional (30d)" : "Emotional Trend (30d)"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {chartData.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    {language === "es" ? "Sin registros emocionales aún" : "No emotional logs yet"}
                  </p>
                ) : (
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                        <YAxis domain={[0, 10]} stroke="hsl(var(--muted-foreground))" fontSize={10} />
                        <Tooltip
                          contentStyle={{
                            background: "hsl(var(--card))",
                            border: "1px solid hsl(var(--gold))",
                            borderRadius: 8,
                            fontSize: 12,
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="intensity"
                          stroke="hsl(var(--gold))"
                          strokeWidth={2}
                          dot={{ fill: "hsl(var(--gold))", r: 3 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {activeCrisis.length > 0 && (
              <Card className="border-destructive/40 bg-destructive/5">
                <CardHeader className="pb-2">
                  <CardTitle className="font-display text-base text-destructive">
                    {language === "es" ? "Alertas Activas" : "Active Alerts"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {activeCrisis.map((c) => (
                    <div key={c.id} className="flex items-start justify-between gap-3 p-2 rounded border border-destructive/30 bg-card">
                      <div>
                        <Badge variant="destructive" className="text-[10px]">{c.severity}</Badge>
                        <p className="text-xs mt-1 text-muted-foreground">
                          {c.trigger_keywords?.join(", ")}
                        </p>
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(c.created_at).toLocaleString("es-MX")}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <Card className="border-gold/20">
              <CardHeader className="pb-2">
                <CardTitle className="font-display text-base text-gold flex items-center justify-between">
                  <span>{language === "es" ? "Conversación" : "Conversation"}</span>
                  {lastMessage && (
                    <span className="text-[10px] font-body font-normal text-muted-foreground">
                      {language === "es" ? "Último:" : "Last:"} {new Date(lastMessage.created_at).toLocaleString("es-MX")}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-72 rounded border border-border bg-muted/20">
                  <div className="p-3 space-y-2">
                    {messages.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-6">
                        {language === "es" ? "Sin mensajes" : "No messages"}
                      </p>
                    )}
                    {messages.map((m) => (
                      <div
                        key={m.id}
                        className={`flex ${m.message_type === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg px-3 py-2 text-xs ${
                            m.message_type === "user"
                              ? "bg-gold/15 border border-gold/30 text-foreground"
                              : m.message_type === "bot"
                                ? "bg-forest/15 border border-forest/30 text-foreground"
                                : "bg-muted border border-border text-muted-foreground italic"
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{m.content}</p>
                          <p className="text-[9px] opacity-60 mt-1">
                            {new Date(m.created_at).toLocaleString("es-MX", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
