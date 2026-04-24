import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/safe-client";
import { useQueryClient } from "@tanstack/react-query";
import { useBotSettings } from "@/hooks/useAdminData";
import { toast } from "sonner";
import { Save } from "lucide-react";

interface Props {
  language: "en" | "es";
}

const DEFAULT_MORNING = "¡Buenos días, {nombre}! 🌅 Hoy es tu día {dias_sobriedad} de libertad. ¿Cómo amaneciste?";
const DEFAULT_EVENING = "Oye {nombre}, ¿cómo te fue hoy? 💪 Cuéntame cómo estuvo tu día {dias_sobriedad}.";

function previewTemplate(tpl: string) {
  return tpl
    .replace(/\{nombre\}/g, "Carlos")
    .replace(/\{dias_sobriedad\}/g, "42")
    .replace(/\{fecha\}/g, new Date().toLocaleDateString("es-MX"));
}

export default function TemplatesSection({ language }: Props) {
  const { data: morningSetting } = useBotSettings("checkin_morning_template");
  const { data: eveningSetting } = useBotSettings("checkin_evening_template");
  const qc = useQueryClient();
  const [morning, setMorning] = useState(DEFAULT_MORNING);
  const [evening, setEvening] = useState(DEFAULT_EVENING);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const m = morningSetting?.setting_value;
    if (typeof m === "string") setMorning(m);
    else if (m && typeof m === "object" && "text" in (m as Record<string, unknown>)) {
      setMorning(String((m as Record<string, unknown>).text));
    }
  }, [morningSetting]);

  useEffect(() => {
    const e = eveningSetting?.setting_value;
    if (typeof e === "string") setEvening(e);
    else if (e && typeof e === "object" && "text" in (e as Record<string, unknown>)) {
      setEvening(String((e as Record<string, unknown>).text));
    }
  }, [eveningSetting]);

  const saveOne = async (key: string, text: string) => {
    const { data: existing } = await supabase
      .from("bot_settings")
      .select("id")
      .eq("setting_key", key)
      .maybeSingle();
    if (existing) {
      return supabase.from("bot_settings").update({ setting_value: text, updated_at: new Date().toISOString() }).eq("id", existing.id);
    }
    return supabase.from("bot_settings").insert({ setting_key: key, setting_value: text });
  };

  const save = async () => {
    setSaving(true);
    const r1 = await saveOne("checkin_morning_template", morning);
    const r2 = await saveOne("checkin_evening_template", evening);
    if (r1.error || r2.error) {
      toast.error(language === "es" ? "Error al guardar" : "Save failed");
    } else {
      toast.success(language === "es" ? "Plantillas guardadas" : "Templates saved");
      qc.invalidateQueries({ queryKey: ["bot_settings"] });
    }
    setSaving(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-gold/20">
        <CardHeader>
          <CardTitle className="font-display text-xl text-gold">
            {language === "es" ? "Plantillas de Check-in" : "Check-in Templates"}
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {language === "es"
              ? "Variables: {nombre}, {dias_sobriedad}, {fecha}"
              : "Variables: {nombre}, {dias_sobriedad}, {fecha}"}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-display text-amber">
                ☀️ {language === "es" ? "Matutino" : "Morning"}
              </Label>
              <Textarea value={morning} onChange={(e) => setMorning(e.target.value)} rows={4} className="font-body" />
              <div className="rounded border border-gold/20 bg-muted/30 p-3">
                <p className="text-[10px] uppercase tracking-wide text-gold mb-1">{language === "es" ? "Vista previa" : "Preview"}</p>
                <p className="text-sm">{previewTemplate(morning)}</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-display text-forest">
                🌙 {language === "es" ? "Vespertino" : "Evening"}
              </Label>
              <Textarea value={evening} onChange={(e) => setEvening(e.target.value)} rows={4} className="font-body" />
              <div className="rounded border border-gold/20 bg-muted/30 p-3">
                <p className="text-[10px] uppercase tracking-wide text-gold mb-1">{language === "es" ? "Vista previa" : "Preview"}</p>
                <p className="text-sm">{previewTemplate(evening)}</p>
              </div>
            </div>
          </div>
          <Button onClick={save} disabled={saving} className="bg-gold hover:bg-gold/90 text-charcoal gap-2">
            <Save className="h-4 w-4" />
            {saving ? (language === "es" ? "Guardando..." : "Saving...") : (language === "es" ? "Guardar plantillas" : "Save templates")}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
