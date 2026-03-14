import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, Trophy } from "lucide-react";
import { motion } from "framer-motion";

interface SuccessStoriesProps {
  language: "en" | "es";
}

const stories = [
  {
    name: "Carlos M.",
    days: 365,
    quote: "Un año libre. Gracias, compas.",
    quoteEn: "One year free. Thanks, friends.",
  },
  {
    name: "Ana L.",
    days: 180,
    quote: "Cada día es un regalo.",
    quoteEn: "Every day is a gift.",
  },
];

const SuccessStories = ({ language }: SuccessStoriesProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.6, duration: 0.4 }}
    >
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-display flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" />
            {language === "es" ? "Historias de Éxito" : "Success Stories"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {stories.map((story, i) => (
            <div key={i} className="p-3 rounded-lg bg-muted/50 border border-border">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-body text-sm font-semibold text-foreground">{story.name}</span>
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="h-3 w-3 fill-primary text-primary" />
                  ))}
                </div>
              </div>
              <p className="font-body text-xs text-muted-foreground italic">
                "{language === "es" ? story.quote : story.quoteEn}"
              </p>
              <p className="font-body text-xs text-primary font-medium mt-1">
                🎖 {story.days} {language === "es" ? "días sobrio" : "days sober"}
              </p>
            </div>
          ))}

          <div className="pt-2">
            <p className="font-body text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {language === "es" ? "Contribuidores" : "Contributors"}
            </p>
            <p className="font-body text-xs text-muted-foreground mt-1">
              {language === "es" ? "Titulares" : "Timelones"}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default SuccessStories;
