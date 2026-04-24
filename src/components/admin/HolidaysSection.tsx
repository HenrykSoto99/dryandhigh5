import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useHolidays } from "@/hooks/useAdminData";
import { supabase } from "@/integrations/supabase/safe-client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

interface Props {
  language: "en" | "es";
}

export default function HolidaysSection({ language }: Props) {
  const { data: holidays = [] } = useHolidays();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [isHighRisk, setIsHighRisk] = useState(true);

  const refetch = () => qc.invalidateQueries({ queryKey: ["mexican_holidays"] });

  const add = async () => {
    if (!name.trim() || !date) {
      toast.error(language === "es" ? "Nombre y fecha obligatorios" : "Name and date required");
      return;
    }
    const { error } = await supabase
      .from("mexican_holidays")
      .insert({ name, holiday_date: date, description: description || null, is_high_risk: isHighRisk });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(language === "es" ? "Festivo agregado" : "Holiday added");
    setName(""); setDate(""); setDescription(""); setIsHighRisk(true);
    refetch();
  };

  const toggleRisk = async (id: string, current: boolean) => {
    await supabase.from("mexican_holidays").update({ is_high_risk: !current }).eq("id", id);
    refetch();
  };

  const remove = async (id: string) => {
    await supabase.from("mexican_holidays").delete().eq("id", id);
    toast.success(language === "es" ? "Eliminado" : "Removed");
    refetch();
  };

  const upcoming = (d: string) => {
    const days = Math.ceil((new Date(d).getTime() - Date.now()) / 86_400_000);
    return days >= 0 && days <= 7;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}>
        <Card className="border-gold/20">
          <CardHeader>
            <CardTitle className="font-display text-base text-gold">
              {language === "es" ? "Agregar Festivo" : "Add Holiday"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs">{language === "es" ? "Nombre" : "Name"}</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">{language === "es" ? "Fecha" : "Date"}</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">{language === "es" ? "Descripción" : "Description"}</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="mt-1" />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">{language === "es" ? "Alto riesgo" : "High risk"}</Label>
              <Switch checked={isHighRisk} onCheckedChange={setIsHighRisk} />
            </div>
            <Button onClick={add} className="w-full gap-2 bg-gold hover:bg-gold/90 text-charcoal">
              <Plus className="h-4 w-4" /> {language === "es" ? "Agregar" : "Add"}
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2">
        <Card className="border-gold/20">
          <CardHeader>
            <CardTitle className="font-display text-xl text-gold">
              {language === "es" ? "Festivos Mexicanos" : "Mexican Holidays"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">{language === "es" ? "Nombre" : "Name"}</TableHead>
                    <TableHead className="text-xs">{language === "es" ? "Fecha" : "Date"}</TableHead>
                    <TableHead className="text-xs">{language === "es" ? "Riesgo" : "Risk"}</TableHead>
                    <TableHead className="text-xs"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {holidays.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-6 text-sm">
                        {language === "es" ? "Sin festivos" : "No holidays"}
                      </TableCell>
                    </TableRow>
                  )}
                  {holidays.map((h) => (
                    <TableRow key={h.id}>
                      <TableCell className="text-sm font-medium">
                        {h.name}
                        {upcoming(h.holiday_date) && (
                          <Badge variant="outline" className="ml-2 text-[10px] border-amber/40 text-amber bg-amber/10">
                            {language === "es" ? "Próximo" : "Soon"}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(h.holiday_date).toLocaleDateString("es-MX", {
                          day: "2-digit", month: "short", year: "numeric",
                        })}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={h.is_high_risk}
                          onCheckedChange={() => toggleRisk(h.id, h.is_high_risk)}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => remove(h.id)}
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
