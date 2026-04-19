import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTelegramUsers, useBroadcasts } from "@/hooks/useAdminData";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Send, Eye } from "lucide-react";

interface Props {
  language: "en" | "es";
}

type Audience = "all" | "active" | "risk";

export default function BroadcastSection({ language }: Props) {
  const { data: users = [] } = useTelegramUsers();
  const { data: campaigns = [] } = useBroadcasts();
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [audience, setAudience] = useState<Audience>("all");
  const [sending, setSending] = useState(false);

  const targets = users.filter((u) => {
    if (!u.telegram_chat_id) return false;
    if (audience === "all") return u.onboarding_completed;
    if (audience === "active") {
      return u.onboarding_completed && u.last_interaction_at &&
        Date.now() - new Date(u.last_interaction_at).getTime() < 7 * 86_400_000;
    }
    if (audience === "risk") return ["high", "critical"].includes(u.risk_level);
    return false;
  });

  const send = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error(language === "es" ? "Título y contenido obligatorios" : "Title and content required");
      return;
    }
    if (targets.length === 0) {
      toast.error(language === "es" ? "Sin destinatarios" : "No recipients");
      return;
    }
    setSending(true);
    let success = 0;
    for (const u of targets) {
      try {
        const { error } = await supabase.functions.invoke("telegram-send", {
          body: { chat_id: u.telegram_chat_id, text: content },
        });
        if (!error) success++;
      } catch (e) {
        console.error("send failed", u.telegram_chat_id, e);
      }
    }
    const { data: { session } } = await supabase.auth.getSession();
    await supabase.from("broadcast_campaigns").insert({
      title,
      content,
      sent_at: new Date().toISOString(),
      sent_by: session?.user.id,
      recipients_count: success,
    });
    qc.invalidateQueries({ queryKey: ["broadcast_campaigns"] });
    toast.success(language === "es" ? `Enviado a ${success}/${targets.length}` : `Sent to ${success}/${targets.length}`);
    setTitle("");
    setContent("");
    setSending(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2">
        <Card className="border-gold/20">
          <CardHeader>
            <CardTitle className="font-display text-xl text-gold">
              {language === "es" ? "Constructor de Mensajes" : "Message Builder"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs">{language === "es" ? "Título de campaña" : "Campaign title"}</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">{language === "es" ? "Contenido del mensaje" : "Message content"}</Label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
                placeholder={language === "es" ? "¿Qué quieres decirle a tu comunidad, compa?" : "What do you want to say?"}
                className="mt-1 font-body"
              />
              <p className="text-[10px] text-muted-foreground mt-1">{content.length} / 4096</p>
            </div>
            <div>
              <Label className="text-xs">{language === "es" ? "Audiencia" : "Audience"}</Label>
              <Select value={audience} onValueChange={(v: Audience) => setAudience(v)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{language === "es" ? "Todos los activos" : "All active"}</SelectItem>
                  <SelectItem value="active">{language === "es" ? "Activos últimos 7 días" : "Active last 7 days"}</SelectItem>
                  <SelectItem value="risk">{language === "es" ? "Solo en riesgo" : "At-risk only"}</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-2">
                {language === "es" ? `Destinatarios estimados: ` : "Estimated recipients: "}
                <span className="font-bold text-gold">{targets.length}</span>
              </p>
            </div>

            {content && (
              <div className="rounded-lg border border-gold/30 bg-forest/10 p-3">
                <p className="text-[10px] uppercase tracking-wide text-gold mb-1 flex items-center gap-1">
                  <Eye className="h-3 w-3" /> {language === "es" ? "Vista previa Telegram" : "Telegram preview"}
                </p>
                <p className="font-body text-sm whitespace-pre-wrap">{content}</p>
              </div>
            )}

            <Button
              onClick={send}
              disabled={sending || !title || !content || targets.length === 0}
              className="w-full bg-gold hover:bg-gold/90 text-charcoal font-bold gap-2"
            >
              <Send className="h-4 w-4" />
              {sending
                ? language === "es" ? "Enviando..." : "Sending..."
                : language === "es" ? `Enviar a ${targets.length} usuarios` : `Send to ${targets.length} users`}
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}>
        <Card className="border-gold/20 h-full">
          <CardHeader>
            <CardTitle className="font-display text-base text-gold">
              {language === "es" ? "Campañas Recientes" : "Recent Campaigns"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {campaigns.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                {language === "es" ? "Aún no hay campañas" : "No campaigns yet"}
              </p>
            )}
            {campaigns.slice(0, 8).map((c) => (
              <div key={c.id} className="p-3 rounded border border-border bg-muted/20">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-body font-semibold text-sm">{c.title}</p>
                  <Badge variant="outline" className="text-[10px] border-gold/30 text-gold">
                    {c.recipients_count ?? 0}
                  </Badge>
                </div>
                <p className="text-[10px] text-muted-foreground line-clamp-2">{c.content}</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {c.sent_at ? new Date(c.sent_at).toLocaleString("es-MX") : "—"}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
