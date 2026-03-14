import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import mascotImg from "@/assets/mascot.jpg";
import { motion } from "framer-motion";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-lg"
      >
        <img
          src={mascotImg}
          alt="Dry & High Five Mascot"
          className="w-32 h-32 rounded-full mx-auto mb-6 border-4 border-primary object-cover shadow-lg"
        />
        <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-3">
          Dry & High Five 🚫🍺
        </h1>
        <p className="text-lg font-body text-muted-foreground mb-8 max-w-md mx-auto">
          Tu compañero de sobriedad en Telegram. Siempre disponible, nunca juzga, celebra cada logro.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            size="lg"
            className="font-body text-base"
            onClick={() => navigate("/auth")}
          >
            Panel de Administración
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="font-body text-base border-primary/30"
            onClick={() => window.open("https://t.me/DryandHighFiveAABot", "_blank")}
          >
            🤖 Abrir en Telegram
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default Index;
