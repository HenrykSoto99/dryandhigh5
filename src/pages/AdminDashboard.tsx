import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { CircleAlert as AlertCircle, Users, TriangleAlert as AlertTriangle, MessageSquare } from 'lucide-react';
import { TelegramClient, TelegramUser, CrisisFlag, BotEvent } from '@/services/telegram-client';

interface AdminStats {
  totalUsers: number;
  activeToday: number;
  criticalCrisis: number;
  onboardingPending: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeToday: 0,
    criticalCrisis: 0,
    onboardingPending: 0,
  });
  const [users, setUsers] = useState<TelegramUser[]>([]);
  const [crisisFlags, setCrisisFlags] = useState<CrisisFlag[]>([]);
  const [events, setEvents] = useState<BotEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadAdminData();
    const interval = setInterval(loadAdminData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadAdminData = async () => {
    try {
      setLoading(true);

      const allUsers = await TelegramClient.getAllUsers();
      const unresolved = await TelegramClient.getCrisisFlags(undefined, true);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const activeToday = allUsers.filter((u) => {
        if (!u.last_interaction_at) return false;
        const lastInteraction = new Date(u.last_interaction_at);
        lastInteraction.setHours(0, 0, 0, 0);
        return lastInteraction.getTime() === today.getTime();
      }).length;

      const onboarding = allUsers.filter((u) => !u.onboarding_completed).length;

      setStats({
        totalUsers: allUsers.length,
        activeToday,
        criticalCrisis: unresolved.filter((f) => f.severity === 'critical').length,
        onboardingPending: onboarding,
      });

      setUsers(allUsers);
      setCrisisFlags(unresolved);

      const { data: eventData } = await supabase
        .from('bot_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (eventData) {
        setEvents(eventData);
      }
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.telegram_username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.telegram_user_id.toString().includes(searchTerm)
  );

  const handleResolveCrisis = async (flagId: string) => {
    try {
      await TelegramClient.updateCrisisFlag(flagId, {
        resolved: true,
        resolved_at: new Date().toISOString(),
      });
      await loadAdminData();
    } catch (error) {
      console.error('Error resolving crisis:', error);
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Panel de Control del Bot</h1>
          <p className="mt-2 text-gray-600">Monitoreo de usuarios, eventos de crisis y estadísticas del bot</p>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Usuarios Totales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{stats.totalUsers}</span>
                <Users className="h-5 w-5 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Activos Hoy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{stats.activeToday}</span>
                <MessageSquare className="h-5 w-5 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Crisis Crítica</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-red-600">{stats.criticalCrisis}</span>
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Pendiente Onboarding</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-yellow-600">{stats.onboardingPending}</span>
                <AlertCircle className="h-5 w-5 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList>
            <TabsTrigger value="users">Usuarios</TabsTrigger>
            <TabsTrigger value="crisis">Crisis ({crisisFlags.length})</TabsTrigger>
            <TabsTrigger value="events">Eventos</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Gestión de Usuarios</CardTitle>
                <CardDescription>Todos los usuarios de Telegram del bot</CardDescription>
                <div className="mt-4">
                  <Input
                    placeholder="Buscar por nombre, usuario o ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b">
                      <tr>
                        <th className="px-4 py-2 text-left font-semibold">Nombre</th>
                        <th className="px-4 py-2 text-left font-semibold">Usuario</th>
                        <th className="px-4 py-2 text-left font-semibold">Sobriedad</th>
                        <th className="px-4 py-2 text-left font-semibold">Riesgo</th>
                        <th className="px-4 py-2 text-left font-semibold">Última Interacción</th>
                        <th className="px-4 py-2 text-left font-semibold">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-2 font-medium">{user.first_name || 'N/A'}</td>
                          <td className="px-4 py-2">@{user.telegram_username || user.telegram_user_id}</td>
                          <td className="px-4 py-2">
                            {user.sobriety_start_date
                              ? `${TelegramClient.calculateSobrietyDays(user.sobriety_start_date)} días`
                              : '—'}
                          </td>
                          <td className="px-4 py-2">
                            <Badge className={getRiskLevelColor(user.risk_level)}>
                              {user.risk_level}
                            </Badge>
                          </td>
                          <td className="px-4 py-2 text-xs text-gray-500">
                            {user.last_interaction_at ? formatDate(user.last_interaction_at) : 'Nunca'}
                          </td>
                          <td className="px-4 py-2">
                            {user.onboarding_completed ? (
                              <Badge variant="outline" className="bg-green-50">
                                Activo
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-yellow-50">
                                Pendiente
                              </Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredUsers.length === 0 && (
                    <div className="py-8 text-center text-gray-500">No se encontraron usuarios</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="crisis">
            <Card>
              <CardHeader>
                <CardTitle>Banderas de Crisis</CardTitle>
                <CardDescription>Usuarios detectados en crisis o momento crítico</CardDescription>
              </CardHeader>
              <CardContent>
                {crisisFlags.length === 0 ? (
                  <div className="py-8 text-center text-gray-500">No hay crisis activas</div>
                ) : (
                  <div className="space-y-4">
                    {crisisFlags.map((flag) => {
                      const user = users.find((u) => u.id === flag.user_id);
                      return (
                        <Card key={flag.id} className="border border-red-200 bg-red-50">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <CardTitle className="text-base">
                                  {user?.first_name || 'Usuario'} ({user?.telegram_user_id})
                                </CardTitle>
                                <CardDescription>
                                  Detectado: {formatDate(flag.created_at)}
                                </CardDescription>
                              </div>
                              <Badge
                                variant="outline"
                                className={
                                  flag.severity === 'critical'
                                    ? 'bg-red-200 text-red-900'
                                    : 'bg-orange-200 text-orange-900'
                                }
                              >
                                {flag.severity}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div>
                              <p className="text-sm font-semibold text-gray-700">Palabras clave detectadas:</p>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {flag.trigger_keywords.map((keyword, i) => (
                                  <Badge key={i} variant="secondary">
                                    {keyword}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            {flag.admin_notes && (
                              <div>
                                <p className="text-sm font-semibold text-gray-700">Notas del Admin:</p>
                                <p className="text-sm text-gray-600">{flag.admin_notes}</p>
                              </div>
                            )}
                            <div className="flex gap-2 pt-2">
                              {!flag.resolved && (
                                <Button
                                  size="sm"
                                  onClick={() => handleResolveCrisis(flag.id)}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  Marcar como Resuelto
                                </Button>
                              )}
                              {flag.resolved && (
                                <Badge variant="outline" className="bg-green-100">
                                  Resuelto
                                </Badge>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="events">
            <Card>
              <CardHeader>
                <CardTitle>Evento del Sistema</CardTitle>
                <CardDescription>Actividades recientes del bot (últimas 50)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {events.map((event) => {
                    const user = users.find((u) => u.id === event.user_id);
                    return (
                      <div
                        key={event.id}
                        className="flex items-start justify-between border-b pb-3 last:border-0"
                      >
                        <div>
                          <p className="font-medium text-gray-900">
                            {user?.first_name || 'Usuario'} - {event.event_type}
                          </p>
                          <p className="text-xs text-gray-500">{formatDate(event.created_at)}</p>
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            event.severity === 'critical'
                              ? 'bg-red-100 text-red-900'
                              : event.severity === 'warning'
                                ? 'bg-yellow-100 text-yellow-900'
                                : 'bg-blue-100 text-blue-900'
                          }
                        >
                          {event.severity}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
