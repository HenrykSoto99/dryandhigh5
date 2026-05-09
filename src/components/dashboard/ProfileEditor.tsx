import { useRef, useState } from "react";
import { Camera, Loader2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/safe-client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface ProfileEditorProps {
  userId: string;
  initialDisplayName: string | null;
  initialName: string | null;
  initialAvatarUrl: string | null;
  onUpdated: (data: { display_name: string | null; name: string | null; avatar_url: string | null }) => void;
}

const ProfileEditor = ({
  userId,
  initialDisplayName,
  initialName,
  initialAvatarUrl,
  onUpdated,
}: ProfileEditorProps) => {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [displayName, setDisplayName] = useState(initialDisplayName ?? "");
  const [name, setName] = useState(initialName ?? "");
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Imagen muy pesada", description: "Máximo 5 MB.", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${userId}/avatar-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadError) throw uploadError;

      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      const publicUrl = pub.publicUrl;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("user_id", userId);

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      onUpdated({ display_name: displayName || null, name: name || null, avatar_url: publicUrl });
      toast({ title: "Foto actualizada", description: "Tu nueva foto de perfil ya está guardada." });
    } catch (err: any) {
      toast({
        title: "No se pudo subir la foto",
        description: err?.message ?? String(err),
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: displayName.trim() || null,
          name: name.trim() || null,
        })
        .eq("user_id", userId);

      if (error) throw error;

      onUpdated({
        display_name: displayName.trim() || null,
        name: name.trim() || null,
        avatar_url: avatarUrl || null,
      });
      toast({ title: "Perfil actualizado", description: "Tus cambios se guardaron." });
    } catch (err: any) {
      toast({
        title: "No se pudo guardar",
        description: err?.message ?? String(err),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const initials = (displayName || name || "U")
    .split(" ")
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-2xl">Tu perfil</CardTitle>
        <CardDescription>Personaliza tu foto y cómo quieres que te llamemos.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="h-20 w-20 border-2 border-primary">
              <AvatarImage src={avatarUrl || undefined} alt="Foto de perfil" />
              <AvatarFallback className="bg-primary/10 text-primary font-display text-xl">
                {initials || "U"}
              </AvatarFallback>
            </Avatar>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-1 -right-1 rounded-full bg-primary p-1.5 text-primary-foreground shadow-md hover:bg-primary/90 disabled:opacity-50"
              aria-label="Cambiar foto"
            >
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
          <div className="flex-1">
            <p className="font-body text-sm text-muted-foreground">
              Toca el ícono de cámara para subir una foto. Formato JPG o PNG, máximo 5 MB.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="displayName" className="font-body text-xs">Alias / cómo te llamamos</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Compa"
              maxLength={50}
              className="font-body"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="name" className="font-body text-xs">Nombre completo</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre"
              maxLength={80}
              className="font-body"
            />
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Guardar cambios
        </Button>
      </CardContent>
    </Card>
  );
};

export default ProfileEditor;
