import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";

interface UserAccountsTableProps {
  language: "en" | "es";
}

const moodEmoji: Record<string, string> = {
  Happy: "😊",
  Focused: "🎯",
  Inspired: "✨",
  Neutral: "😐",
  Sad: "😢",
  Anxious: "😰",
};

const mockUsers = [
  { name: "Diego R.", email: "diego@gmail.com", joinDate: "17/12/2023", location: "Argentina", subscription: "Premium", mood: "Happy" },
  { name: "Laura J.", email: "laura@gmail.com", joinDate: "11/23/2023", location: "España", subscription: "Premium", mood: "Focused" },
  { name: "Mariana H.", email: "mariana@example.com", joinDate: "11/23/2023", location: "Luxemburgo", subscription: "Premium", mood: "Inspired" },
  { name: "Paul A.", email: "paul@example.com", joinDate: "11/25/2023", location: "Chile", subscription: "Premium", mood: "Neutral" },
  { name: "David H.", email: "david@example.com", joinDate: "11/10/2023", location: "Honduras", subscription: "Premium", mood: "Neutral" },
];

const UserAccountsTable = ({ language }: UserAccountsTableProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-display font-bold text-foreground">
          {language === "es" ? "Cuentas de Usuario" : "User Accounts"}
        </h2>
        <div className="flex gap-2">
          <Select defaultValue="all">
            <SelectTrigger className="w-[130px] h-8 text-xs font-body">
              <SelectValue placeholder="All groups" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{language === "es" ? "Todos los grupos" : "All groups"}</SelectItem>
              <SelectItem value="premium">Premium</SelectItem>
              <SelectItem value="free">{language === "es" ? "Gratuito" : "Free"}</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="all">
            <SelectTrigger className="w-[130px] h-8 text-xs font-body">
              <SelectValue placeholder="All Inso" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Inso</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-body text-xs">{language === "es" ? "Nombre" : "Name"}</TableHead>
              <TableHead className="font-body text-xs">Email</TableHead>
              <TableHead className="font-body text-xs">{language === "es" ? "Fecha de Ingreso" : "Join Date"}</TableHead>
              <TableHead className="font-body text-xs">{language === "es" ? "Ubicación" : "Location"}</TableHead>
              <TableHead className="font-body text-xs">{language === "es" ? "Suscripción" : "Subscription"}</TableHead>
              <TableHead className="font-body text-xs">Status / Mood</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockUsers.map((user, i) => (
              <TableRow key={i} className="hover:bg-muted/50 transition-colors">
                <TableCell className="font-body text-sm font-medium">{user.name}</TableCell>
                <TableCell className="font-body text-sm text-muted-foreground">{user.email}</TableCell>
                <TableCell className="font-body text-sm text-muted-foreground">{user.joinDate}</TableCell>
                <TableCell className="font-body text-sm text-muted-foreground">{user.location}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="font-body text-xs bg-primary/10 text-primary border-0">
                    {user.subscription}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="font-body text-sm">
                    {moodEmoji[user.mood] || "😐"} {user.mood}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </motion.div>
  );
};

// Need Card import
import { Card } from "@/components/ui/card";

export default UserAccountsTable;
