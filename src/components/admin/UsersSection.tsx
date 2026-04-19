import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Search } from "lucide-react";
import { useTelegramUsers } from "@/hooks/useAdminData";
import UserDetailDialog from "./UserDetailDialog";

interface Props {
  language: "en" | "es";
}

const moodEmoji = (risk: string) => {
  switch (risk) {
    case "critical":
      return "🆘";
    case "high":
      return "😰";
    case "medium":
      return "😐";
    default:
      return "😊";
  }
};

const moodLabel = (risk: string, lang: "en" | "es") => {
  const map: Record<string, [string, string]> = {
    critical: ["Crisis", "Crisis"],
    high: ["At Risk", "En Riesgo"],
    medium: ["Neutral", "Neutral"],
    low: ["Doing well", "Bien"],
  };
  const [en, es] = map[risk] ?? map.low;
  return lang === "es" ? es : en;
};

function calcDays(date?: string | null) {
  if (!date) return 0;
  return Math.floor((Date.now() - new Date(date).getTime()) / 86_400_000);
}

export default function UsersSection({ language }: Props) {
  const { data: users = [], isLoading } = useTelegramUsers();
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const pageSize = 10;

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        !search ||
        u.first_name?.toLowerCase().includes(search.toLowerCase()) ||
        u.telegram_username?.toLowerCase().includes(search.toLowerCase()) ||
        String(u.telegram_user_id).includes(search);
      const matchesRisk = riskFilter === "all" || u.risk_level === riskFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && u.onboarding_completed) ||
        (statusFilter === "pending" && !u.onboarding_completed);
      return matchesSearch && matchesRisk && matchesStatus;
    });
  }, [users, search, riskFilter, statusFilter]);

  const pageData = filtered.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  const exportCsv = () => {
    const headers = [
      "name",
      "telegram_username",
      "telegram_user_id",
      "sobriety_start_date",
      "sobriety_days",
      "risk_level",
      "onboarding",
      "last_interaction",
      "created_at",
    ];
    const rows = filtered.map((u) => [
      u.first_name ?? "",
      u.telegram_username ?? "",
      u.telegram_user_id,
      u.sobriety_start_date ?? "",
      calcDays(u.sobriety_start_date),
      u.risk_level,
      u.onboarding_completed ? "complete" : "pending",
      u.last_interaction_at ?? "",
      u.created_at,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dry-high-five-users-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-gold/20">
        <CardHeader className="pb-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <CardTitle className="font-display text-xl text-gold">
              {language === "es" ? "Cuentas de Usuario" : "User Accounts"}
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder={language === "es" ? "Buscar..." : "Search..."}
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(0);
                  }}
                  className="h-9 pl-8 w-44 text-sm"
                />
              </div>
              <Select value={riskFilter} onValueChange={(v) => { setRiskFilter(v); setPage(0); }}>
                <SelectTrigger className="h-9 w-36 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{language === "es" ? "Todo riesgo" : "All risk"}</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
                <SelectTrigger className="h-9 w-36 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{language === "es" ? "Todo estado" : "All status"}</SelectItem>
                  <SelectItem value="active">{language === "es" ? "Activo" : "Active"}</SelectItem>
                  <SelectItem value="pending">{language === "es" ? "Pendiente" : "Pending"}</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={exportCsv} className="gap-1.5 border-gold/40 text-gold hover:bg-gold/10">
                <Download className="h-3.5 w-3.5" /> CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs">{language === "es" ? "Nombre" : "Name"}</TableHead>
                  <TableHead className="text-xs">@usuario</TableHead>
                  <TableHead className="text-xs">{language === "es" ? "Sobriedad" : "Sobriety"}</TableHead>
                  <TableHead className="text-xs">{language === "es" ? "Estado" : "Status"}</TableHead>
                  <TableHead className="text-xs">Mood</TableHead>
                  <TableHead className="text-xs">{language === "es" ? "Última Interacción" : "Last Active"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8 text-sm">
                      {language === "es" ? "Cargando..." : "Loading..."}
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && pageData.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8 text-sm">
                      {language === "es" ? "Sin usuarios" : "No users"}
                    </TableCell>
                  </TableRow>
                )}
                {pageData.map((u) => (
                  <TableRow
                    key={u.id}
                    onClick={() => setSelectedId(u.id)}
                    className="cursor-pointer hover:bg-gold/5 transition-colors"
                  >
                    <TableCell className="font-medium text-sm">{u.first_name || "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {u.telegram_username ? `@${u.telegram_username}` : `#${u.telegram_user_id}`}
                    </TableCell>
                    <TableCell className="text-sm">
                      {u.sobriety_start_date ? (
                        <span className="font-semibold text-gold">{calcDays(u.sobriety_start_date)} d</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          u.onboarding_completed
                            ? "border-success/40 text-success bg-success/10 text-xs"
                            : "border-warning/40 text-warning bg-warning/10 text-xs"
                        }
                      >
                        {u.onboarding_completed
                          ? language === "es" ? "Activo" : "Active"
                          : language === "es" ? "Onboarding" : "Onboarding"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {moodEmoji(u.risk_level)} {moodLabel(u.risk_level, language)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {u.last_interaction_at
                        ? new Date(u.last_interaction_at).toLocaleString("es-MX", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : language === "es" ? "Nunca" : "Never"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between p-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              {language === "es"
                ? `${filtered.length} usuarios — página ${page + 1} de ${totalPages}`
                : `${filtered.length} users — page ${page + 1} of ${totalPages}`}
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                ←
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page + 1 >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                →
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <UserDetailDialog
        userId={selectedId}
        onClose={() => setSelectedId(null)}
        language={language}
      />
    </motion.div>
  );
}
