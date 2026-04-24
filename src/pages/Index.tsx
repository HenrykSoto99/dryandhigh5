import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import mascotImg from "@/assets/mascot.jpg";

const Index = () => (
  <main className="dark min-h-screen bg-background text-foreground font-body">
    <section className="min-h-screen grid lg:grid-cols-[1.05fr_0.95fr] items-center overflow-hidden">
      <div className="px-6 py-12 sm:px-10 lg:px-16 xl:px-24 space-y-8">
        <div className="inline-flex items-center gap-3 border border-gold/30 bg-card/70 px-4 py-2 rounded-full">
          <span className="h-2 w-2 rounded-full bg-success" />
          <span className="text-xs uppercase tracking-wider text-muted-foreground">Bot activo · Comunidad protegida</span>
        </div>

        <div className="space-y-5 max-w-3xl">
          <h1 className="font-display text-5xl sm:text-6xl xl:text-7xl font-bold leading-[0.95] text-gold">
            Dry &amp; High Five
          </h1>
          <p className="text-lg sm:text-xl text-foreground/85 max-w-2xl leading-relaxed">
            Acompañamiento cálido por Telegram para compas que están construyendo una vida sin alcohol, con check-ins diarios, apoyo en crisis y seguimiento privado.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button asChild size="lg" className="bg-gold hover:bg-gold/90 text-charcoal font-semibold">
            <a href="https://t.me/DryandHighFiveAABot" target="_blank" rel="noreferrer">Abrir bot en Telegram</a>
          </Button>
          <Button asChild size="lg" variant="outline" className="border-gold/40 text-gold hover:bg-gold/10">
            <Link to="/admin">Panel privado</Link>
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-3 max-w-xl pt-4">
          {[
            ["2x", "check-ins diarios"],
            ["24/7", "detección de crisis"],
            ["MX", "tono cercano"],
          ].map(([value, label]) => (
            <div key={label} className="border border-border bg-card/60 p-4 rounded-lg">
              <p className="font-display text-2xl text-gold font-bold">{value}</p>
              <p className="text-xs text-muted-foreground leading-tight">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="relative min-h-[42vh] lg:min-h-screen flex items-end justify-center bg-sidebar border-t lg:border-t-0 lg:border-l border-gold/20 px-8 pt-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,hsl(var(--gold)/0.16),transparent_38%)]" />
        <img
          src={mascotImg}
          alt="Mascota de Dry & High Five"
          className="relative z-10 w-full max-w-[520px] aspect-square object-cover rounded-t-full border-x border-t border-gold/30 shadow-[0_24px_80px_-28px_hsl(var(--gold)/0.45)]"
        />
      </div>
    </section>
  </main>
);

export default Index;
