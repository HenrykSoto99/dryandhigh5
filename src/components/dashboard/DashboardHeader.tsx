import { useState } from "react";
import { Menu, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import mascotImg from "@/assets/mascot.jpg";

interface DashboardHeaderProps {
  onToggleSidebar: () => void;
  onToggleLanguage: () => void;
  language: "en" | "es";
}

const DashboardHeader = ({ onToggleSidebar, onToggleLanguage, language }: DashboardHeaderProps) => {
  return (
    <header className="flex items-center justify-between px-6 py-3 border-b border-border bg-card">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onToggleSidebar} className="lg:hidden">
          <Menu className="h-5 w-5" />
        </Button>
        <img src={mascotImg} alt="Dry & High Five Mascot" className="h-10 w-10 rounded-full object-cover border-2 border-primary" />
        <div>
          <h1 className="text-lg font-display font-bold text-foreground leading-tight">Dry & High Five</h1>
          <p className="text-xs text-muted-foreground font-body">
            {language === "es" ? "Panel de Administración" : "Admin Dashboard"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm font-display font-semibold text-foreground">
          D&HF Admin Dashboard - User Overview
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleLanguage}
          className="gap-1.5 font-body text-xs border-primary/30 hover:border-primary"
        >
          <Globe className="h-3.5 w-3.5" />
          <span className={language === "en" ? "font-bold" : ""}>EN</span>
          <span className="text-muted-foreground">/</span>
          <span className={language === "es" ? "font-bold" : ""}>ES</span>
        </Button>
        <Button variant="outline" size="sm" className="font-body text-xs">
          <Menu className="h-3.5 w-3.5 mr-1" />
          Menu
        </Button>
        <Button variant="outline" size="sm" className="font-body text-xs">
          Idioma / Language
        </Button>
      </div>
    </header>
  );
};

export default DashboardHeader;
