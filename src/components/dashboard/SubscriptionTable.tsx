import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";

interface SubscriptionTableProps {
  language: "en" | "es";
}

const experienceEmoji: Record<string, string> = {
  Great: "🤩",
  Confused: "😵",
  Enthusiastic: "🔥",
  Good: "👍",
  Struggling: "😤",
};

const mockSubscriptions = [
  { userId: "300206", plan: "Premium", status: "Active", startDate: "05/19/2023", experience: "Great" },
  { userId: "300340", plan: "Premium", status: "Active", startDate: "03/19/2023", experience: "Confused" },
  { userId: "300380", plan: "Premium", status: "Active", startDate: "08/19/2023", experience: "Great" },
  { userId: "300430", plan: "Management", status: "Active", startDate: "05/20/2023", experience: "Confused" },
  { userId: "300525", plan: "Premium", status: "Active", startDate: "06/13/2023", experience: "Enthusiastic" },
];

const SubscriptionTable = ({ language }: SubscriptionTableProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.4 }}
    >
      <h2 className="text-lg font-display font-bold text-foreground mb-3">
        {language === "es" ? "Gestión de Suscripciones" : "Subscription Management"}
      </h2>
      <Card>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-body text-xs">User ID</TableHead>
              <TableHead className="font-body text-xs">{language === "es" ? "Plan" : "Plan"}</TableHead>
              <TableHead className="font-body text-xs">Status</TableHead>
              <TableHead className="font-body text-xs">{language === "es" ? "Fecha de Inicio" : "Start Date"}</TableHead>
              <TableHead className="font-body text-xs">{language === "es" ? "Experiencia" : "Experience"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockSubscriptions.map((sub, i) => (
              <TableRow key={i} className="hover:bg-muted/50 transition-colors">
                <TableCell className="font-body text-sm font-mono">{sub.userId}</TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={`font-body text-xs border-0 ${
                      sub.plan === "Premium" ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent-foreground"
                    }`}
                  >
                    {sub.plan}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className="font-body text-xs bg-success/10 text-success border-0">
                    {sub.status}
                  </Badge>
                </TableCell>
                <TableCell className="font-body text-sm text-muted-foreground">{sub.startDate}</TableCell>
                <TableCell>
                  <span className="font-body text-sm">
                    {experienceEmoji[sub.experience] || "😐"} {sub.experience}
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

export default SubscriptionTable;
