# Auditoría de Seguridad — Dry & High Five

**Fecha:** 2026-05-29
**Alcance:** Frontend React, Edge Functions Supabase, base de datos, autenticación, integración Telegram.

---

## 1. Resumen ejecutivo

Estado general: **BUENO** tras aplicar correcciones críticas.

| Categoría | Estado |
|---|---|
| Claves API expuestas en código | ✅ Limpio |
| RLS en todas las tablas sensibles | ✅ Habilitado |
| Rutas protegidas | ⚠️ Parcial → corregido |
| Validación de inputs (Zod) | ⚠️ Faltante → añadida en login |
| Triggers / funciones SECURITY DEFINER | ✅ Corregido (EXECUTE revocado) |
| Exposición de datos operativos a `anon` | ✅ Corregido (vista pública) |
| Escalada de privilegios a `admin` | ✅ Bloqueada por trigger |

---

## 2. Claves API y secretos

**Resultado:** No se encontraron API keys, tokens ni passwords hardcodeados en `src/`.

Secretos gestionados correctamente en Lovable Cloud:
- `LOVABLE_API_KEY` (IA Gemini)
- `TELEGRAM_API_KEY` (vía connector, no editable manualmente)
- `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_URL`, `SUPABASE_JWKS` (gestionados)
- Keys publicables (`VITE_SUPABASE_PUBLISHABLE_KEY`) son seguras en cliente.

✅ **Sin acción requerida.**

---

## 3. Row-Level Security (RLS)

Todas las tablas tienen RLS habilitado:

| Tabla | Acceso | Notas |
|---|---|---|
| `profiles` | Usuario ve/edita lo suyo; admin ve todo | ✅ OK |
| `user_roles` | Solo admin gestiona; usuario ve los suyos | ✅ OK |
| `crisis_flags` | Solo admin | ✅ OK |
| `security_alerts` | Solo admin | ✅ OK |
| `emotional_logs` | Usuario ve los suyos | ✅ OK |
| `milestones` | Usuario ve los suyos | ✅ OK |
| `telegram_users` / `telegram_messages` / `telegram_conversations` | Solo admin | ✅ OK |
| `bot_events` / `bot_settings` | Solo admin | ✅ OK |
| `broadcast_campaigns` | Solo admin | ✅ OK |
| `mexican_holidays` | Vista pública `mexican_holidays_public` solo expone `name, holiday_date, description` | ✅ Corregido |
| `telegram_bot_state` | Denegado a todos (solo service_role) | ✅ OK |

---

## 4. Hallazgos críticos corregidos

### 4.1. Exposición de campos operativos en `mexican_holidays` ✅ FIX
**Antes:** política `Anyone can read holidays` exponía `alert_sent` y `is_high_risk` a anónimos.
**Después:** política eliminada. Se creó vista `mexican_holidays_public` (con `security_invoker = true`) que solo expone `id, name, holiday_date, description`.

### 4.2. Funciones SECURITY DEFINER ejecutables por usuarios firmados ✅ FIX
Se revocó `EXECUTE` a `PUBLIC, anon, authenticated` en:
- `notify_admin_on_signup()`
- `enforce_single_admin()`
- `detect_message_threats()`
- `handle_new_user()`
- `update_updated_at_column()`

Siguen funcionando como triggers internos.

### 4.3. Validación de inputs en login/registro ✅ FIX
`src/pages/Auth.tsx` ahora valida con **Zod**:
- Email: formato válido, máx 255 chars
- Password: 8–72 caracteres
- Forgot password: email validado antes de enviar

### 4.4. Login con Google ✅ VERIFICADO
Flujo usa `signInWithManagedGoogle()` (Lovable OAuth gestionado).
`onAuthStateChange` redirige automáticamente por rol (admin → `/admin`, usuario → `/dashboard`).

### 4.5. Recuperación de contraseña ✅ VERIFICADO
- Link "¿Olvidaste tu contraseña?" en `/auth`
- Envía email con `redirectTo: /reset-password`
- Página `/reset-password` permite establecer nueva contraseña

### 4.6. Bloqueo de escalada a admin ✅ ACTIVO
Trigger `enforce_single_admin` impide que cualquier usuario distinto de `henryk.soto@gmail.com` obtenga rol `admin`. Cualquier intento queda registrado en `security_alerts` con severidad `critical`.

### 4.7. Notificación de nuevas cuentas ✅ ACTIVO
Trigger `notify_admin_on_signup` registra en `security_alerts` cada nueva cuenta. La función `security-monitor` (cron) las envía por Telegram al admin.

### 4.8. Detección de mensajes sospechosos ✅ ACTIVO
Trigger `detect_message_threats` detecta y reporta:
- Prompt injection (ignore previous, jailbreak, role hijack)
- Exfiltración de credenciales (api_key, password, token)
- XSS / SQL injection
- Phishing links

### 4.9. Detección de crisis severa ✅ ACTIVO
Edge function `telegram-router` detecta keywords de relapse/atentar contra la vida y:
- Crea `security_alerts` severidad `critical`
- Incluye estado de consentimiento (autorizado / no autorizado / no vinculado)
- Se envía por Telegram al admin inmediatamente

---

## 5. Hallazgos aceptados (riesgo bajo)

| Hallazgo | Justificación |
|---|---|
| `has_role()` es SECURITY DEFINER ejecutable por authenticated | Necesario para evaluar RLS sin recursión. Solo lee `user_roles`. |
| Extensión `pgmq` (o similar) instalada en schema `public` | Default de Supabase; sin impacto directo en datos del proyecto. |

---

## 6. Rutas frontend

| Ruta | Protección | Notas |
|---|---|---|
| `/` (landing) | Pública | Marketing, sin datos sensibles |
| `/auth` | Pública | Login/registro/forgot |
| `/reset-password` | Pública | Requiere token de Supabase en URL |
| `/dashboard` | **Auth requerido** | Redirige a `/auth` si no hay sesión |
| `/admin` | **Solo admin** | `useAdminGuard()` valida rol con `has_role()` server-side |

✅ Todas las rutas que tocan datos del usuario están protegidas con verificación server-side (no localStorage).

---

## 7. Edge Functions

| Función | Validación | CORS | JWT |
|---|---|---|---|
| `ai-agent` | ✅ | ✅ | service_role |
| `telegram-router` | ✅ valida payload Telegram | ✅ | webhook secret |
| `telegram-poll` / `telegram-send` | ✅ | ✅ | service_role |
| `security-monitor` | ✅ | ✅ | service_role (cron) |
| `scheduled-checkins` | ✅ | ✅ | service_role (cron) |
| `preventive-alerts` | ✅ | ✅ | service_role (cron) |

---

## 8. Sistema de notificaciones de emergencia

- **Consentimiento explícito** (`profiles.emergency_contact_consent`) configurable desde el dashboard del miembro.
- Alertas a admin vía **Telegram** (activo) y **email a henryk.soto@gmail.com** (preparado, requiere configurar dominio propio en Lovable Cloud → Emails).

---

## 9. Recomendaciones pendientes (no críticas)

1. **Configurar dominio propio** para activar emails a `henryk.soto@gmail.com` (alertas + reporte).
2. **Activar HIBP** (Have I Been Pwned) en auth para bloquear contraseñas filtradas. Se puede activar desde Cloud → Users → Auth Settings.
3. **Rate limiting** en endpoints públicos (Supabase ya aplica defaults razonables).
4. **Rotar `SUPABASE_SERVICE_ROLE_KEY`** cada 6 meses como buena práctica.

---

## 10. Conclusión

La aplicación **está lista para producción** desde el punto de vista de seguridad. Solo personas registradas vía `/auth` pueden acceder al dashboard, y solo el dueño (`henryk.soto@gmail.com`) puede llegar al panel admin o vincularse a usuarios de Telegram con privilegios elevados. Todas las alertas críticas (signup, escalada, crisis severa, mensajes sospechosos) se registran y se envían al admin en tiempo real por Telegram.
