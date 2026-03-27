# BLUEPRINT AREA ADMIN — GAMEFLIX

## Documento di Architettura e Design Dettagliato

---

## INDICE

1. [Architettura Generale](#1-architettura-generale)
2. [Sistema Permessi e Ruoli](#2-sistema-permessi-e-ruoli)
3. [Dashboard Admin](#3-dashboard-admin)
4. [Gestione Giochi](#4-gestione-giochi)
5. [Gestione Serie](#5-gestione-serie)
6. [Content Scheduler](#6-content-scheduler)
7. [Gestione Daily Content](#7-gestione-daily-content)
8. [Gestione Utenti](#8-gestione-utenti)
9. [Gestione Badge](#9-gestione-badge)
10. [Analytics](#10-analytics)
11. [Moderazione](#11-moderazione)
12. [Impostazioni Piattaforma](#12-impostazioni-piattaforma)
13. [Priorita MVP e Roadmap](#13-priorita-mvp-e-roadmap)

---

## 1. ARCHITETTURA GENERALE

### 1.1 — Layout Shell dell'Admin

```
+----------------------------------------------------------------------+
|  TOPBAR                                                              |
|  [Menu]  GAMEFLIX ADMIN    [Cerca]  [Notifiche 3]  [Avatar Logout]   |
+------------+---------------------------------------------------------+
|            |                                                         |
|  SIDEBAR   |  CONTENT AREA                                           |
|            |                                                         |
|  Dashboard |  +-----------------------------------------------------+
|  Giochi    |  |                                                     |
|  Serie     |  |  Breadcrumb: Admin > Giochi > Nuovo Gioco           |
|  Releases  |  |                                                     |
|  Daily     |  |  +----------------------------------------------+   |
|  Utenti    |  |  |                                              |   |
|  Badge     |  |  |  PAGE CONTENT                                |   |
|  Analytics |  |  |                                              |   |
|  Moderaz.  |  |  |                                              |   |
|  Imposta.  |  |  |                                              |   |
|            |  |  +----------------------------------------------+   |
|            |  |                                                     |
|  ------    |  +-----------------------------------------------------+
|  ? Help    |                                                         |
|  <- Torna  |  FOOTER: v1.0.0 | Ultimo deploy: 26/03/2026 14:30     |
|    al sito |                                                         |
+------------+---------------------------------------------------------+
```

### 1.2 — Navigazione Sidebar

```
  Dashboard                    /admin
  Giochi                       /admin/games
    +- Tutti i giochi          /admin/games
    +- Nuovo gioco             /admin/games/new
    +- Categorie/Tag           /admin/games/tags
  Serie                        /admin/series
    +- Tutte le serie          /admin/series
    +- Nuova serie             /admin/series/new
  Releases                     /admin/releases
    +- Calendario              /admin/releases/calendar
    +- Programma release       /admin/releases/schedule
  Daily Content                /admin/daily
    +- Calendario Daily        /admin/daily/calendar
    +- Buffer Status           /admin/daily/buffer
    +- Generatore              /admin/daily/generator
  Utenti                       /admin/users
    +- Lista utenti            /admin/users
    +- Segmenti                /admin/users/segments
  Badge                        /admin/badges
    +- Tutti i badge           /admin/badges
    +- Nuovo badge             /admin/badges/new
  Analytics                    /admin/analytics
    +- Panoramica              /admin/analytics
    +- Retention               /admin/analytics/retention
    +- Revenue                 /admin/analytics/revenue
    +- Content Performance     /admin/analytics/content
  Moderazione                  /admin/moderation
  Impostazioni                 /admin/settings
    +- Piani e Prezzi          /admin/settings/plans
    +- Feature Flags           /admin/settings/features
    +- Notifiche               /admin/settings/notifications
    +- Manutenzione            /admin/settings/maintenance
```

### 1.3 — Componenti UI Condivisi

| Componente | Descrizione | Utilizzo |
|---|---|---|
| `AdminShell` | Layout con sidebar + topbar + content area | Wrapper di tutte le pagine |
| `KpiCard` | Card con valore, label, trend (freccia + %) | Dashboard, Analytics |
| `DataTable` | Tabella con sort, filter, search, pagination, bulk actions | Giochi, Utenti, Badge |
| `FormBuilder` | Form con validazione Zod, auto-save bozze | Creazione/modifica entita |
| `CalendarView` | Calendario interattivo con drag-and-drop | Releases, Daily |
| `StatusBadge` | Pill colorata per stati (bozza/live/ritirato) | Ovunque |
| `ConfirmDialog` | Modale di conferma per azioni distruttive | Elimina, Ban, Ritira |
| `Toast` | Notifiche temporanee (successo, errore, warning) | Ovunque |
| `Breadcrumb` | Navigazione gerarchica | Tutte le pagine |
| `SearchInput` | Input con debounce 300ms, suggerimenti | Giochi, Utenti |
| `FileUpload` | Upload con preview, crop, resize lato client | Giochi, Badge, Serie |
| `JsonEditor` | Editor JSON con syntax highlight e validazione | Config giochi |
| `ChartWrapper` | Wrapper per grafici (Recharts) con loading/empty state | Dashboard, Analytics |
| `BufferIndicator` | Barra progresso con colori (rosso/giallo/verde) | Daily, Releases |
| `ActivityLog` | Timeline verticale delle azioni recenti | Dettaglio gioco, utente |

### 1.4 — Stack Tecnico Admin

```
Frontend Admin:
  - Next.js App Router (route group /admin)
  - Middleware di auth: verifica ruolo admin prima di servire le pagine
  - Componenti UI: shadcn/ui + Tailwind CSS
  - Grafici: Recharts
  - Tabelle: TanStack Table v8
  - Calendario: react-big-calendar o FullCalendar
  - Form: React Hook Form + Zod
  - Drag-and-drop: dnd-kit
  - State: React Query (TanStack Query) per cache e sync server
  - Upload: presigned URL su S3/R2

Backend Admin:
  - NestJS module dedicato: AdminModule
  - Guard: AdminGuard (verifica ruolo in JWT)
  - Controller per ogni sezione con prefisso /api/admin/*
  - Service layer separato per logica admin
  - Query aggregate ottimizzate con Prisma raw SQL dove necessario
  - Rate limiting separato (piu generoso per admin)
  - Audit log su ogni operazione di scrittura
```

---

## 2. SISTEMA PERMESSI E RUOLI

### 2.1 — Ruoli Definiti

| Ruolo | Codice | Descrizione |
|---|---|---|
| **Super Admin** | `SUPER_ADMIN` | Il founder. Accesso completo a tutto. Unico che puo gestire altri admin. |
| **Content Manager** | `CONTENT_MANAGER` | Puo gestire giochi, serie, daily content, releases. Non vede revenue o impostazioni critiche. |
| **Moderatore** | `MODERATOR` | Accesso solo a moderazione e vista utenti (senza dati pagamento). |
| **Analyst** | `ANALYST` | Accesso solo lettura a dashboard e analytics. Nessuna azione di modifica. |

### 2.2 — Matrice Permessi

```
Sezione              SUPER_ADMIN   CONTENT_MANAGER   MODERATOR   ANALYST
---------------------------------------------------------------------------
Dashboard            RW            R (no revenue)     --          R
Giochi               RW            RW                 R           R
Serie                RW            RW                 --          R
Releases             RW            RW                 --          R
Daily Content        RW            RW                 --          R
Utenti               RW            R (no pagamenti)   R (limitato) R
Badge                RW            RW                 --          R
Analytics            RW            R (no revenue)     --          R
Moderazione          RW            R                  RW          --
Impostazioni         RW            --                 --          --
Gestione Admin       RW            --                 --          --

R = Read only, RW = Read + Write, -- = Nessun accesso
```

### 2.3 — Implementazione Permessi

```typescript
// Enum permessi granulari
enum AdminPermission {
  // Dashboard
  DASHBOARD_VIEW = 'dashboard:view',
  DASHBOARD_VIEW_REVENUE = 'dashboard:view:revenue',

  // Giochi
  GAMES_VIEW = 'games:view',
  GAMES_CREATE = 'games:create',
  GAMES_EDIT = 'games:edit',
  GAMES_DELETE = 'games:delete',
  GAMES_PUBLISH = 'games:publish',

  // Serie
  SERIES_VIEW = 'series:view',
  SERIES_MANAGE = 'series:manage',

  // Releases
  RELEASES_VIEW = 'releases:view',
  RELEASES_MANAGE = 'releases:manage',

  // Daily
  DAILY_VIEW = 'daily:view',
  DAILY_MANAGE = 'daily:manage',

  // Utenti
  USERS_VIEW = 'users:view',
  USERS_VIEW_PAYMENTS = 'users:view:payments',
  USERS_EDIT = 'users:edit',
  USERS_BAN = 'users:ban',
  USERS_GIFT_PREMIUM = 'users:gift_premium',
  USERS_EXPORT = 'users:export',

  // Badge
  BADGES_VIEW = 'badges:view',
  BADGES_MANAGE = 'badges:manage',

  // Analytics
  ANALYTICS_VIEW = 'analytics:view',
  ANALYTICS_VIEW_REVENUE = 'analytics:view:revenue',
  ANALYTICS_EXPORT = 'analytics:export',

  // Moderazione
  MODERATION_VIEW = 'moderation:view',
  MODERATION_ACT = 'moderation:act',

  // Impostazioni
  SETTINGS_VIEW = 'settings:view',
  SETTINGS_MANAGE = 'settings:manage',
  SETTINGS_MANAGE_ADMINS = 'settings:manage:admins',
}
```

### 2.4 — Audit Log

Ogni azione di scrittura nell'admin genera un record di audit.

```
Tabella: admin_audit_log
-------------------------------------------
id              UUID PRIMARY KEY
admin_user_id   UUID FK -> users(id)
action          VARCHAR(100)          -- 'game.create', 'user.ban', 'setting.update'
entity_type     VARCHAR(50)           -- 'game', 'user', 'badge', 'setting'
entity_id       UUID                  -- ID dell'entita modificata
changes         JSONB                 -- { before: {...}, after: {...} }
ip_address      INET
user_agent      TEXT
created_at      TIMESTAMPTZ DEFAULT NOW()

INDEX: (admin_user_id, created_at)
INDEX: (entity_type, entity_id, created_at)
INDEX: (action, created_at)
```

---

## 3. DASHBOARD ADMIN (`/admin`)

### 3.1 — Layout Wireframe

```
+----------------------------------------------------------------------+
|  Buongiorno, Luca               Ultimo accesso: oggi alle 08:14     |
+----------------------------------------------------------------------+
|                                                                      |
|  +---------+ +---------+ +---------+ +---------+ +---------+        |
|  | DAU     | | MAU     | | Nuove   | | Conv.   | | MRR     |        |
|  | 1.247   | | 8.340   | | Reg.    | | Rate    | | E4.230  |        |
|  | +12%    | | +5%     | | 89      | | 4.2%    | | +8%     |        |
|  | vs ieri | | vs sett.| | -3%     | | +0.3%   | | vs mese |        |
|  +---------+ +---------+ +---------+ +---------+ +---------+        |
|                                                                      |
|  +---------+ +---------+ +---------+                                 |
|  | Churn   | | Partite | | Streak  |                                 |
|  | Rate    | | Oggi    | | Attivi  |                                 |
|  | 3.1%    | | 5.420   | | 2.180   |                                 |
|  | -0.2%   | | +18%    | | +6%     |                                 |
|  +---------+ +---------+ +---------+                                 |
|                                                                      |
+----------------------------------------------------------------------+
|  ALERT E AVVISI                                                      |
|  +----------------------------------------------------------------+  |
|  | [CRIT] WordForge: solo 4 daily pronti (minimo consigliato: 7)  |  |
|  | [WARN] 3 giochi con rating < 50% negli ultimi 7 giorni         |  |
|  | [WARN] 12 utenti premium inattivi da 7+ giorni (rischio churn) |  |
|  | [OK]   BrainLab: 14 daily pronti | QuizArena: 21 daily pronti |  |
|  +----------------------------------------------------------------+  |
|                                                                      |
+------------------------------+---------------------------------------+
|  UTENTI ATTIVI (30gg)        |  REGISTRAZIONI vs CONVERSIONI         |
|  (grafico a linee)           |  (grafico a barre)                    |
|                              |                                       |
+------------------------------+---------------------------------------+
|  RETENTION                   |  DISTRIBUZIONE PER MONDO              |
|  D1:  68%                    |  (grafico a torta)                    |
|  D7:  45%                    |  BrainLab: 42%                        |
|  D14: 32%                    |  WordForge: 31%                       |
|  D30: 22%                    |  QuizArena: 27%                       |
|                              |                                       |
+------------------------------+---------------------------------------+
|  TOP 5 GIOCHI OGGI           |  MRR TREND (6 mesi)                   |
|  1. Sudoku Master  482       |  (grafico a linee)                    |
|  2. Word Chain     389       |                                       |
|  3. Quiz Europa    356       |                                       |
|  4. Logic Grid     298       |                                       |
|  5. Anagramma      245       |                                       |
|                              |                                       |
+------------------------------+---------------------------------------+
|  AZIONI RAPIDE                                                       |
|  [+ Nuovo Gioco] [Schedula Release] [Classifiche] [Modera] [Report] |
+----------------------------------------------------------------------+
```

### 3.2 — Specifiche KPI Cards

| KPI | Calcolo | Trend Confronto | Colore Trend |
|---|---|---|---|
| **DAU** | `COUNT DISTINCT user_id WHERE last_activity = today` | vs ieri stesso orario | Verde se +, Rosso se - |
| **MAU** | `COUNT DISTINCT user_id WHERE last_activity >= 30 days ago` | vs mese precedente | Verde se +, Rosso se - |
| **Nuove Registrazioni** | `COUNT users WHERE created_at = today` | vs ieri | Verde se +, Rosso se - |
| **Conversion Rate** | `(nuovi premium oggi / registrazioni ultimi 30gg) * 100` | vs settimana scorsa | Verde se +, Rosso se - |
| **MRR** | `SUM(active_subscriptions.price)` da Stripe | vs mese precedente | Verde se +, Rosso se - |
| **Churn Rate** | `(cancellazioni mese / totale premium inizio mese) * 100` | vs mese precedente | Verde se -, Rosso se + (inverso) |
| **Partite Oggi** | `COUNT game_sessions WHERE started_at = today` | vs ieri | Verde se +, Rosso se - |
| **Streak Attivi** | `COUNT users WHERE current_streak >= 2` | vs settimana scorsa | Verde se +, Rosso se - |

### 3.3 — Componenti UI

```typescript
// KpiCard.tsx
interface KpiCardProps {
  label: string;                    // "DAU", "MRR", etc.
  value: string | number;          // "1.247", "E4.230"
  trend: {
    value: number;                 // +12, -3
    direction: 'up' | 'down';
    isPositive: boolean;           // per churn, down = positivo
    comparedTo: string;            // "vs ieri", "vs settimana scorsa"
  };
  icon?: React.ReactNode;
  loading?: boolean;
}

// AlertPanel.tsx
interface Alert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  actionUrl?: string;
  actionLabel?: string;
  dismissible: boolean;
  createdAt: Date;
}

// QuickAction.tsx
interface QuickAction {
  label: string;
  icon: React.ReactNode;
  href: string;
  badge?: number;                  // notifica numerica opzionale
}
```

### 3.4 — API Endpoints

```
GET /api/admin/dashboard/kpis
  Response: {
    dau: { value: 1247, trend: { value: 12, direction: 'up', comparedTo: 'yesterday' } },
    mau: { value: 8340, trend: { ... } },
    newRegistrations: { value: 89, trend: { ... } },
    conversionRate: { value: 4.2, trend: { ... } },
    mrr: { value: 4230, trend: { ... } },
    churn: { value: 3.1, trend: { ... } },
    gamesToday: { value: 5420, trend: { ... } },
    activeStreaks: { value: 2180, trend: { ... } }
  }
  Cache: 5 minuti (invalidazione su richiesta)

GET /api/admin/dashboard/charts/dau?days=30
  Response: { data: [{ date: '2026-03-01', value: 1100 }, ...] }

GET /api/admin/dashboard/charts/registrations-conversions?months=6
  Response: { data: [{ month: '2026-01', registrations: 450, conversions: 19 }, ...] }

GET /api/admin/dashboard/charts/retention
  Response: { d1: 68, d7: 45, d14: 32, d30: 22 }

GET /api/admin/dashboard/charts/world-distribution
  Response: { brainlab: 42, wordforge: 31, quizarena: 27 }

GET /api/admin/dashboard/charts/top-games?limit=5
  Response: { data: [{ id, title, world, playCount: 482 }, ...] }

GET /api/admin/dashboard/charts/mrr?months=6
  Response: { data: [{ month: '2025-10', mrr: 2800 }, ...] }

GET /api/admin/dashboard/alerts
  Response: { alerts: [{ id, severity, message, actionUrl, createdAt }, ...] }
```

### 3.5 — Interazioni e Flussi

1. **Caricamento pagina**: tutte le KPI e gli alert si caricano in parallelo via React Query. Skeleton loader per ogni card durante il caricamento.
2. **Auto-refresh**: KPI si aggiornano ogni 5 minuti automaticamente (polling via React Query `refetchInterval`).
3. **Click su KPI Card**: naviga alla sezione analytics relativa (es. click su MRR porta a `/admin/analytics/revenue`).
4. **Click su alert**: naviga alla sezione indicata (es. "4 daily pronti" porta a `/admin/daily/buffer`).
5. **Dismiss alert**: POST `/api/admin/dashboard/alerts/:id/dismiss` — l'alert scompare per quella sessione.
6. **Quick Action**: semplice navigazione alla rotta indicata.
7. **Periodo grafici**: selector in alto a destra di ogni grafico per cambiare intervallo (7gg, 30gg, 90gg, 6 mesi, 1 anno).

### 3.6 — Permessi

| Elemento | SUPER_ADMIN | CONTENT_MANAGER | ANALYST |
|---|---|---|---|
| KPI Cards (tutte) | Si | Si (MRR nascosto) | Si |
| Alert Content Pipeline | Si | Si | No |
| Alert Churn | Si | No | Si |
| Grafici Revenue | Si | No | Si |
| Grafici Engagement | Si | Si | Si |
| Quick Actions | Si | Si (solo content) | No |

### 3.7 — Priorita MVP

| Elemento | Priorita | Note |
|---|---|---|
| KPI Cards (DAU, MAU, Registrazioni, Partite) | **MVP** | Core metrics |
| KPI Cards (MRR, Churn, Conv. Rate) | **MVP** | Revenue metrics |
| Alert Content Pipeline | **MVP** | Critico per operazioni |
| Grafico DAU | **MVP** | |
| Grafico MRR | **MVP** | |
| Quick Actions | **MVP** | |
| Grafico Retention | **v1.1** | Richiede tracking eventi piu sofisticato |
| Distribuzione per Mondo | **v1.1** | |
| Top 5 giochi | **v1.1** | |
| Grafico Reg. vs Conv. | **v1.1** | |
| Alert rating basso | **v1.2** | |
| Alert churn utenti | **v1.2** | |

---

## 4. GESTIONE GIOCHI (`/admin/games`)

### 4.1 — Lista Giochi — Layout

```
+----------------------------------------------------------------------+
|  Admin > Giochi                                           [+ Nuovo]  |
+----------------------------------------------------------------------+
|                                                                      |
|  Filtri: [Mondo v] [Stato v] [Difficolta v]  Cerca per titolo       |
|                                                                      |
|  Seleziona tutto          Mostra: 25 v    Pagina 1 di 12  < 1 >     |
|  +----+---------------+----------+-----+-----------+-------+------+ |
|  |    | Titolo        | Mondo    |Diff.| Stato     | Plays | Rate | |
|  +----+---------------+----------+-----+-----------+-------+------+ |
|  |    | Sudoku        | BrainLab | 3/5 | Live      | 12.4k | 92%  | |
|  |    |   Master      |          |     | 15/01/26  |       |      | |
|  +----+---------------+----------+-----+-----------+-------+------+ |
|  |    | Word          | WordForge| 2/5 | Sched.    |  --   |  --  | |
|  |    |   Chain v2    |          |     | 28/03/26  |       |      | |
|  +----+---------------+----------+-----+-----------+-------+------+ |
|  |    | Quiz          | QuizArena| 4/5 | Bozza     |  --   |  --  | |
|  |    |   Scienza     |          |     |           |       |      | |
|  +----+---------------+----------+-----+-----------+-------+------+ |
|  |    | Logic         | BrainLab | 2/5 | Ritirato  | 3.2k | 41%  | |
|  |    |   Grid        |          |     | 10/02/26  |       |      | |
|  +----+---------------+----------+-----+-----------+-------+------+ |
|                                                                      |
|  Azioni bulk: [Pubblica selezionati] [Ritira selezionati] [Elimina] |
|                                                                      |
|  Totale: 287 giochi | Live: 198 | Bozza: 45 | Schedulati: 32       |
|  Ritirati: 12                                                        |
+----------------------------------------------------------------------+
```

### 4.2 — Form Creazione/Modifica Gioco

```
+----------------------------------------------------------------------+
|  Admin > Giochi > Nuovo Gioco                                        |
|                                                [Salva Bozza] [Pubbl.]|
+----------------------------------------------------------------------+
|                                                                      |
|  +-- INFORMAZIONI BASE ------------------------------------------+  |
|  |                                                                |  |
|  |  Titolo *          [                                    ]      |  |
|  |  Slug              [auto-generato-dal-titolo            ]      |  |
|  |                                                                |  |
|  |  Descrizione *     [                                    ]      |  |
|  |                    [                                    ]      |  |
|  |                    [                      ] max 300 char       |  |
|  |                                                                |  |
|  |  Mondo *           ( ) BrainLab  ( ) WordForge  ( ) QuizArena |  |
|  |                                                                |  |
|  |  Difficolta *      1-5 (slider o click)                        |  |
|  |                                                                |  |
|  |  Durata stimata    [    ] minuti                               |  |
|  |                                                                |  |
|  |  Tag               [logica] [puzzle] [x] [+ aggiungi]         |  |
|  |                                                                |  |
|  +----------------------------------------------------------------+  |
|                                                                      |
|  +-- MEDIA -------------------------------------------------------+  |
|  |                                                                |  |
|  |  Thumbnail (400x300) *                                         |  |
|  |  +------------------+                                          |  |
|  |  |                  |  [Carica immagine]                       |  |
|  |  |   Drop zone      |  Formati: JPG, PNG, WebP                |  |
|  |  |   o click        |  Max: 2MB                                |  |
|  |  +------------------+                                          |  |
|  |                                                                |  |
|  |  Banner (1200x400)                                             |  |
|  |  +----------------------------------+                          |  |
|  |  |        Drop zone                 |  [Carica immagine]      |  |
|  |  +----------------------------------+                          |  |
|  |                                                                |  |
|  +----------------------------------------------------------------+  |
|                                                                      |
|  +-- CONFIGURAZIONE GIOCO ----------------------------------------+  |
|  |                                                                |  |
|  |  Tipo di punteggio *  [Punti v]                                |  |
|  |                       Opzioni: Punti / Tempo / Completamento   |  |
|  |                                                                |  |
|  |  Supporta Daily?     [x]                                      |  |
|  |                                                                |  |
|  |  Punteggio massimo   [1000    ]                                |  |
|  |                                                                |  |
|  |  Tempo limite (sec)  [        ] (vuoto = nessun limite)        |  |
|  |                                                                |  |
|  |  Configurazione specifica:                                     |  |
|  |  +- Modalita: [Form strutturato v] -----------------------+   |  |
|  |  |                                                         |   |  |
|  |  |  Griglia righe    [9  ]      (per Sudoku)               |   |  |
|  |  |  Griglia colonne  [9  ]                                 |   |  |
|  |  |  Parametro extra  [   ]                                 |   |  |
|  |  |                                                         |   |  |
|  |  |  [Passa a JSON Editor]                                  |   |  |
|  |  +---------------------------------------------------------+   |  |
|  |                                                                |  |
|  +----------------------------------------------------------------+  |
|                                                                      |
|  +-- PUBBLICAZIONE -----------------------------------------------+  |
|  |                                                                |  |
|  |  Stato attuale:  Bozza                                        |  |
|  |                                                                |  |
|  |  Azioni:                                                       |  |
|  |  [Salva come Bozza]  [Schedula Pubblicazione]  [Pubblica Ora] |  |
|  |                                                                |  |
|  |  Se Schedula:                                                  |  |
|  |  Data pubblicazione  [28/03/2026]  Ora [09:00]                |  |
|  |  Featured?           [ ]                                       |  |
|  |  Testo annuncio      [                                    ]    |  |
|  |                                                                |  |
|  +----------------------------------------------------------------+  |
|                                                                      |
|  +-- ANTEPRIMA ---------------------------------------------------+  |
|  |                                                                |  |
|  |  [Anteprima nel browser]  (apre nuova tab con il gioco)       |  |
|  |                                                                |  |
|  +----------------------------------------------------------------+  |
|                                                                      |
|  Auto-salvato: 2 minuti fa                                           |
|  Log modifiche: [Vedi storico v]                                     |
|  | 26/03 14:30 -- Luca: creato bozza                                 |
|  | 26/03 15:10 -- Luca: aggiornato configurazione                    |
|  | 27/03 09:00 -- Luca: schedulato per 28/03                         |
+----------------------------------------------------------------------+
```

### 4.3 — Dettaglio Gioco (`/admin/games/:id`)

```
+----------------------------------------------------------------------+
|  Admin > Giochi > Sudoku Master                                      |
|                                        [Modifica] [Ritira] [Elimina] |
+----------------------------------------------------------------------+
|                                                                      |
|  +----------+  Sudoku Master                                        |
|  |          |  Mondo: BrainLab | Difficolta: 3/5 | Stato: Live      |
|  |  [thumb] |  Pubblicato: 15/01/2026 | Supporta Daily: Si          |
|  |          |  Tag: logica, puzzle, numeri                            |
|  +----------+                                                        |
|                                                                      |
|  +---------+ +---------+ +---------+ +---------+ +---------+        |
|  | Partite | | Like    | | Rating  | | Compl.  | | Tempo   |        |
|  | Totali  | |         | |         | | Rate    | | Medio   |        |
|  | 12.4k   | | 89%     | | 92%     | | 74%     | | 8:32    |        |
|  +---------+ +---------+ +---------+ +---------+ +---------+        |
|                                                                      |
+------------------------------+---------------------------------------+
|  UTILIZZO NEL TEMPO (30gg)   |  DISTRIBUZIONE PUNTEGGI               |
|  (grafico a linee)           |  0-200:   12%                         |
|                              |  200-400: 22%                         |
|                              |  400-600: 35%                         |
|                              |  600-800: 21%                         |
|                              |  800-1000: 10%                        |
+------------------------------+---------------------------------------+
|  CLASSIFICA TOP 10                                                    |
|  +----+--------------+---------+------------------+                  |
|  | #  | Giocatore    | Punti   | Data             |                  |
|  +----+--------------+---------+------------------+                  |
|  | 1  | BrainMaster  | 980     | 25/03/2026       |                  |
|  | 2  | PuzzlePro    | 965     | 24/03/2026       |                  |
|  | 3  | LogicKing    | 950     | 26/03/2026       |                  |
|  +----+--------------+---------+------------------+                  |
|                                                                      |
|  LOG MODIFICHE                                                       |
|  | 26/03 -- Luca: aggiornata difficolta da 2 a 3                    |
|  | 15/01 -- Luca: pubblicato                                         |
|  | 14/01 -- Luca: creato                                             |
+----------------------------------------------------------------------+
```

### 4.4 — Validazione Form Gioco

```typescript
const gameFormSchema = z.object({
  title: z.string()
    .min(3, 'Il titolo deve avere almeno 3 caratteri')
    .max(100, 'Il titolo non puo superare i 100 caratteri'),

  slug: z.string()
    .regex(/^[a-z0-9-]+$/, 'Lo slug puo contenere solo lettere minuscole, numeri e trattini')
    .optional(), // auto-generato dal titolo se non specificato

  description: z.string()
    .min(20, 'La descrizione deve avere almeno 20 caratteri')
    .max(300, 'La descrizione non puo superare i 300 caratteri'),

  world: z.enum(['BRAINLAB', 'WORDFORGE', 'QUIZARENA'], {
    required_error: 'Seleziona un Mondo'
  }),

  difficulty: z.number()
    .int()
    .min(1, 'Difficolta minima: 1')
    .max(5, 'Difficolta massima: 5'),

  estimatedDurationMinutes: z.number()
    .int()
    .min(1)
    .max(60)
    .optional(),

  tags: z.array(z.string()).min(1, 'Aggiungi almeno un tag'),

  thumbnailUrl: z.string().url('URL thumbnail non valido'),

  bannerUrl: z.string().url('URL banner non valido').optional(),

  scoringType: z.enum(['POINTS', 'TIME', 'COMPLETION']),

  supportsDaily: z.boolean().default(false),

  maxScore: z.number().int().positive().optional(),

  timeLimitSeconds: z.number().int().positive().optional(),

  configuration: z.record(z.unknown()).optional(), // JSON libero per config specifica

  status: z.enum(['DRAFT', 'SCHEDULED', 'PUBLISHED', 'RETIRED']),

  scheduledAt: z.date().optional(), // obbligatorio se status = SCHEDULED
  featured: z.boolean().default(false),
  announcementText: z.string().max(200).optional(),
});
```

### 4.5 — API Endpoints Giochi

```
# Lista giochi (con filtri, sort, paginazione)
GET /api/admin/games
  Query params:
    ?world=BRAINLAB
    &status=PUBLISHED
    &difficulty=3
    &search=sudoku
    &sortBy=playCount
    &sortOrder=desc
    &page=1
    &perPage=25
  Response: {
    data: Game[],
    meta: { total: 287, page: 1, perPage: 25, totalPages: 12 }
  }

# Dettaglio gioco con stats
GET /api/admin/games/:id
  Response: {
    data: Game & {
      stats: {
        playCount: number,
        likePercentage: number,
        rating: number,
        completionRate: number,
        averageTimeSeconds: number,
        scoreDistribution: { range: string, count: number }[]
      },
      changelog: ChangelogEntry[],
      leaderboard: LeaderboardEntry[]
    }
  }

# Grafico utilizzo nel tempo
GET /api/admin/games/:id/usage?days=30
  Response: { data: [{ date: string, plays: number }] }

# Creazione gioco
POST /api/admin/games
  Body: GameFormData
  Response: { data: Game }
  Side effects: audit_log, slug generation

# Modifica gioco
PATCH /api/admin/games/:id
  Body: Partial<GameFormData>
  Response: { data: Game }
  Side effects: audit_log, changelog entry

# Cambia stato gioco
POST /api/admin/games/:id/status
  Body: { status: 'PUBLISHED' | 'RETIRED' | 'DRAFT', scheduledAt?: Date }
  Response: { data: Game }
  Side effects: audit_log, se PUBLISHED -> notifica utenti (opzionale)

# Elimina gioco (soft delete)
DELETE /api/admin/games/:id
  Response: { success: true }
  Side effects: audit_log, set deleted_at
  Validazione: non si puo eliminare un gioco con partite attive oggi

# Upload immagine
POST /api/admin/upload
  Body: FormData (file)
  Response: { url: string, key: string }
  Side effects: upload su S3/R2, generazione thumbnail multiple sizes

# Gestione tag
GET /api/admin/games/tags
POST /api/admin/games/tags
DELETE /api/admin/games/tags/:id
```

### 4.6 — Interazioni e Flussi

**Flusso Creazione Gioco:**
```
1. Admin clicca [+ Nuovo Gioco]
2. Si apre il form vuoto con auto-save ogni 60 secondi
3. Admin compila i campi obbligatori (titolo, descrizione, mondo, difficolta, thumbnail, scoring)
4. Mentre digita il titolo, lo slug si genera automaticamente (debounce 500ms)
   - Lo slug viene verificato per unicita via API
   - Se duplicato, viene aggiunto un suffisso numerico (-2, -3, etc.)
5. Admin carica thumbnail:
   - File viene validato lato client (formato, dimensione)
   - Preview immediata con crop tool
   - Upload via presigned URL su S3
   - URL salvato nel form
6. Admin configura il gioco:
   - Se il mondo e BrainLab o WordForge, appare il form strutturato specifico
   - Opzione per passare a JSON editor per configurazioni avanzate
   - JSON editor con syntax highlighting e validazione in tempo reale
7. Admin sceglie azione:
   a. [Salva Bozza] -> POST con status=DRAFT, toast "Bozza salvata"
   b. [Schedula] -> Appare date/time picker, validazione data futura, POST con status=SCHEDULED
   c. [Pubblica Ora] -> Dialog conferma "Sei sicuro?", POST con status=PUBLISHED
8. Redirect a /admin/games/:id (dettaglio) con toast di conferma
```

**Flusso Ritiro Gioco:**
```
1. Admin su dettaglio gioco clicca [Ritira]
2. ConfirmDialog: "Vuoi ritirare Sudoku Master? Il gioco non sara piu visibile agli utenti
   ma i dati e le statistiche saranno conservati."
3. Conferma -> POST /api/admin/games/:id/status { status: 'RETIRED' }
4. Il gioco resta nel database ma non appare piu nel catalogo utente
5. Possibilita di ri-pubblicare in futuro
```

### 4.7 — Permessi Giochi

| Azione | SUPER_ADMIN | CONTENT_MANAGER | MODERATOR | ANALYST |
|---|---|---|---|---|
| Vedere lista giochi | Si | Si | Si | Si |
| Creare gioco | Si | Si | No | No |
| Modificare gioco | Si | Si | No | No |
| Pubblicare gioco | Si | Si | No | No |
| Ritirare gioco | Si | Si | No | No |
| Eliminare gioco | Si | No | No | No |
| Vedere stats | Si | Si | Si | Si |
| Gestire tag | Si | Si | No | No |

### 4.8 — Priorita MVP

| Elemento | Priorita |
|---|---|
| Lista giochi con filtri e ricerca | **MVP** |
| Form creazione con tutti i campi base | **MVP** |
| Upload thumbnail | **MVP** |
| Cambio stato (Bozza -> Pubblicato) | **MVP** |
| Dettaglio gioco con stats base (play count, rating) | **MVP** |
| Paginazione e ordinamento | **MVP** |
| Scheduling pubblicazione | **v1.1** |
| JSON editor per config avanzata | **v1.1** |
| Form strutturato per config specifiche mondo | **v1.1** |
| Grafico utilizzo nel tempo | **v1.1** |
| Distribuzione punteggi | **v1.2** |
| Classifica nel dettaglio | **v1.2** |
| Bulk actions | **v1.2** |
| Log modifiche visuale | **v1.2** |
| Banner upload | **v1.2** |
| Preview gioco in admin | **v1.3** |

---

## 5. GESTIONE SERIE (`/admin/series`)

### 5.1 — Lista Serie — Layout

```
+----------------------------------------------------------------------+
|  Admin > Serie                                       [+ Nuova Serie] |
+----------------------------------------------------------------------+
|                                                                      |
|  Filtri: [Mondo v] [Stato v]                 Cerca per titolo        |
|                                                                      |
|  +------------------------------------------------------------------+
|  |                                                                  |
|  |  +----------+  Enigmi del Rinascimento                          |
|  |  |          |  Mondo: QuizArena | Episodi: 8/12 pubblicati      |
|  |  | [cover]  |  Stato: In corso | Prossimo ep: 29/03/2026       |
|  |  |          |  Engagement: 2.3k giocatori iscritti              |
|  |  +----------+  [Gestisci Episodi] [Modifica] [Dettaglio]       |
|  |                                                                  |
|  |  ----------------------------------------------------------------|
|  |                                                                  |
|  |  +----------+  Sfida Logica Progressiva                         |
|  |  |          |  Mondo: BrainLab | Episodi: 5/5 pubblicati        |
|  |  | [cover]  |  Stato: Completata | Totale plays: 15.6k         |
|  |  |          |  Engagement: 1.8k giocatori iscritti              |
|  |  +----------+  [Gestisci Episodi] [Modifica] [Dettaglio]       |
|  |                                                                  |
|  |  ----------------------------------------------------------------|
|  |                                                                  |
|  |  +----------+  Parole dal Mondo                                 |
|  |  |          |  Mondo: WordForge | Episodi: 0/10 pubblicati      |
|  |  | [cover]  |  Stato: Bozza | Primo ep schedulato: 01/04       |
|  |  |          |  Engagement: --                                    |
|  |  +----------+  [Gestisci Episodi] [Modifica] [Dettaglio]       |
|  |                                                                  |
|  +------------------------------------------------------------------+
|                                                                      |
|  Totale: 8 serie | In corso: 3 | Completate: 4 | Bozza: 1          |
+----------------------------------------------------------------------+
```

### 5.2 — Form Creazione/Modifica Serie

```
+----------------------------------------------------------------------+
|  Admin > Serie > Nuova Serie                                         |
|                                                    [Salva] [Annulla] |
+----------------------------------------------------------------------+
|                                                                      |
|  Titolo *          [                                          ]      |
|  Slug              [auto-generato                             ]      |
|                                                                      |
|  Descrizione *     [                                          ]      |
|                    [                                          ]      |
|                    [                            ] max 500 char       |
|                                                                      |
|  Mondo *           ( ) BrainLab  ( ) WordForge  ( ) QuizArena       |
|                                                                      |
|  Copertina Serie (600x400) *                                         |
|  +------------------+                                                |
|  |                  |  [Carica immagine]                             |
|  |   Drop zone      |                                                |
|  +------------------+                                                |
|                                                                      |
|  Cadenza pubblicazione:                                              |
|  ( ) Settimanale  ( ) Bisettimanale  ( ) Personalizzata             |
|                                                                      |
|  Numero episodi previsti:  [12  ]                                    |
|                                                                      |
|  Difficolta progressiva?   [x] (la difficolta aumenta con gli ep.) |
|  Difficolta iniziale:     1/5                                        |
|  Difficolta finale:       4/5                                        |
|                                                                      |
+----------------------------------------------------------------------+
```

### 5.3 — Gestione Episodi dentro la Serie

```
+----------------------------------------------------------------------+
|  Admin > Serie > Enigmi del Rinascimento > Episodi                   |
|                                                  [+ Aggiungi Episodio]|
+----------------------------------------------------------------------+
|                                                                      |
|  Serie: Enigmi del Rinascimento (QuizArena)                          |
|  Progresso: ========----  8/12 episodi pubblicati                   |
|                                                                      |
|  === EPISODI (drag-and-drop per riordinare) ===                      |
|                                                                      |
|  = Ep.1  "L'arte di Leonardo"      Live    15/01/26  2.3k plays     |
|  = Ep.2  "I Medici di Firenze"     Live    22/01/26  2.1k plays     |
|  = Ep.3  "Architettura gotica"     Live    29/01/26  1.9k plays     |
|  = Ep.4  "La musica barocca"       Live    05/02/26  1.8k plays     |
|  = Ep.5  "Scienza e alchimia"      Live    12/02/26  1.7k plays     |
|  = Ep.6  "La stampa di Gutenberg"  Live    19/02/26  1.6k plays     |
|  = Ep.7  "Navigatori e scoperte"   Live    26/02/26  1.5k plays     |
|  = Ep.8  "Il Rinascimento fiammingo" Live  05/03/26  1.4k plays     |
|  = Ep.9  "La Riforma protestante"  Sched.  29/03/26  --             |
|  = Ep.10 "Il teatro elisabettiano" Bozza   --        --             |
|  = Ep.11 (vuoto)                   -- Non assegnato                  |
|  = Ep.12 (vuoto)                   -- Non assegnato                  |
|                                                                      |
|  Per aggiungere un episodio:                                         |
|  [Seleziona un gioco esistente v]  oppure  [Crea nuovo gioco]       |
|                                                                      |
|  +- Retention Serie ------------------------------------------------+
|  | Ep.1->2: 91% | Ep.2->3: 88% | Ep.3->4: 85% | Ep.4->5: 82%     |
|  | Ep.5->6: 79% | Ep.6->7: 77% | Ep.7->8: 75%                     |
|  | Trend: stabile (media retention inter-episodio: 82.4%)           |
|  +-------------------------------------------------------------------+
+----------------------------------------------------------------------+
```

### 5.4 — API Endpoints Serie

```
GET    /api/admin/series                          # Lista serie con filtri
GET    /api/admin/series/:id                      # Dettaglio serie con episodi e stats
POST   /api/admin/series                          # Crea serie
PATCH  /api/admin/series/:id                      # Modifica serie
DELETE /api/admin/series/:id                      # Elimina serie (soft delete)

# Gestione episodi
GET    /api/admin/series/:id/episodes             # Lista episodi ordinati
POST   /api/admin/series/:id/episodes             # Aggiungi episodio (link a gioco esistente o crea nuovo)
PATCH  /api/admin/series/:id/episodes/reorder     # Riordina episodi { episodeIds: string[] }
DELETE /api/admin/series/:id/episodes/:episodeId  # Rimuovi episodio dalla serie

# Stats
GET    /api/admin/series/:id/retention            # Retention inter-episodio
```

### 5.5 — Permessi Serie

Identici a quelli dei Giochi. `CONTENT_MANAGER` puo gestire tutto tranne eliminazione. `MODERATOR` e `ANALYST` solo lettura.

### 5.6 — Priorita MVP

| Elemento | Priorita |
|---|---|
| Lista serie con filtri | **MVP** |
| Form creazione serie | **MVP** |
| Aggiunta episodi da giochi esistenti | **MVP** |
| Riordinamento episodi drag-and-drop | **v1.1** |
| Retention inter-episodio | **v1.2** |
| Cadenza pubblicazione automatica | **v1.2** |
| Difficolta progressiva automatica | **v1.3** |

---

## 6. CONTENT SCHEDULER (`/admin/releases`)

### 6.1 — Vista Calendario — Layout

```
+----------------------------------------------------------------------+
|  Admin > Releases > Calendario                                       |
|                     [Settimana v]  [< 23-29 Mar 2026 >]             |
|                                            [+ Schedula Release]      |
+----------------------------------------------------------------------+
|                                                                      |
|  Buffer: 12 giorni di contenuto preparato                            |
|  =====================-------  (12/30 target)                       |
|  [!] WordForge: solo 4 daily rimasti                                 |
|                                                                      |
|  +------+------+------+------+------+------+------+                  |
|  | LUN  | MAR  | MER  | GIO  | VEN  | SAB  | DOM  |                 |
|  | 23   | 24   | 25   | 26   | 27   | 28   | 29   |                 |
|  +------+------+------+------+------+------+------+                  |
|  |D     |D     |D     |D     |D     |D     |D     | BrainLab       |
|  |Sudoku|Logic |Kakuro|Sudoku|Nonogr|Logic |Sudoku| Daily          |
|  |      |Grid  |      |Vari. |      |Seq.  |      |                 |
|  +------+------+------+------+------+------+------+                  |
|  |D     |D     |D     |D     |D     |D     |D     | WordForge      |
|  |Anagr.|Cross |Word  |Anagr.|Cross |Word  |Anagr.| Daily          |
|  |      |word  |Chain |v2    |word  |Scram.|      |                 |
|  +------+------+------+------+------+------+------+                  |
|  |D     |D     |D     |D     |D     |D     |D     | QuizArena      |
|  |Geogr.|Scien.|Sport |Stori |Music |Cinem |Gener.| Daily          |
|  +------+------+------+------+------+------+------+                  |
|  |      |      | *    |      |      | *    |      | Release        |
|  |      |      |Word  |      |      |Quiz  |      | Settimanali    |
|  |      |      |Chain |      |      |Europ.|      |                 |
|  |      |      |v2    |      |      |v3    |      |                 |
|  +------+------+------+------+------+------+------+                  |
|  |      |      |      |      |      |Serie |      | Serie          |
|  |      |      |      |      |      |Rinas.|      | (episodi)      |
|  |      |      |      |      |      |Ep.9  |      |                 |
|  +------+------+------+------+------+------+------+                  |
|                                                                      |
|  Legenda: D = Daily | * = Featured Release | Serie = Episodio Serie |
|  Verde = Pubblicato | Giallo = Schedulato | Rosso = Vuoto/Mancante  |
|                                                                      |
|  [Vista Mese]                                                        |
+----------------------------------------------------------------------+
```

### 6.2 — Form di Scheduling

```
+----------------------------------------------------------------------+
|  Schedula Release                                          [X Chiudi]|
+----------------------------------------------------------------------+
|                                                                      |
|  Tipo release:  ( ) Gioco singolo  ( ) Episodio serie               |
|                                                                      |
|  Seleziona gioco *  [v Cerca tra le bozze...                    ]   |
|                     +---------------------------------------------+  |
|                     | Logic Sequence - BrainLab - Bozza           |  |
|                     | Word Scramble v2 - WordForge - Bozza        |  |
|                     | Quiz Cinema 80s - QuizArena - Bozza         |  |
|                     +---------------------------------------------+  |
|                                                                      |
|  Data rilascio *    [28/03/2026]                                     |
|  Ora rilascio *     [09:00 v]  (default: 09:00 CET)                |
|                                                                      |
|  Featured?          [x]  (apparira in evidenza nella home)          |
|                                                                      |
|  Testo annuncio     [Nuovo gioco disponibile! Prova Word...  ]      |
|                     max 200 caratteri                                 |
|                                                                      |
|  Notifica push?     [x]  Invia notifica agli utenti                 |
|  Notifica email?    [ ]  Invia email (solo premium)                 |
|                                                                      |
|                              [Annulla]  [Schedula]                   |
|                                                                      |
|  -- Quick Schedule --                                                |
|  [Schedula al prossimo slot disponibile] -> 29/03/2026 09:00        |
+----------------------------------------------------------------------+
```

### 6.3 — Interazioni Calendario

1. **Drag-and-drop**: trascinare un gioco schedulato su un altro giorno per spostarlo. ConfirmDialog se la data e nel passato.
2. **Click su card**: apre popover con dettagli e azioni rapide (modifica, sposta, annulla scheduling).
3. **Click su cella vuota**: apre il form di scheduling con la data pre-compilata.
4. **Indicatori visivi**: celle con bordo rosso se c'e un buco nel calendario daily. Celle future senza contenuto mostrano un warning.
5. **Cambio vista**: toggle tra vista settimanale (dettagliata) e mensile (panoramica).
6. **Quick Schedule**: bottone che trova automaticamente il prossimo slot disponibile e propone la data.

### 6.4 — Validazioni Scheduler

```typescript
const scheduleValidation = {
  // Ogni giorno deve avere almeno 1 daily per ogni Mondo
  dailyPerWorld: (date: Date) => {
    const dailies = getDailiesForDate(date);
    const worlds = ['BRAINLAB', 'WORDFORGE', 'QUIZARENA'];
    const missing = worlds.filter(w => !dailies.some(d => d.world === w));
    if (missing.length > 0) {
      return { warning: `Mancano daily per: ${missing.join(', ')}` };
    }
  },

  // Alert se buffer < 7 giorni
  bufferCheck: (world: string) => {
    const buffer = getBufferDays(world);
    if (buffer < 3) return { severity: 'critical', message: `${world}: solo ${buffer} daily!` };
    if (buffer < 7) return { severity: 'warning', message: `${world}: ${buffer} daily rimasti` };
    return { severity: 'ok', message: `${world}: ${buffer} daily pronti` };
  },

  // Non si puo schedulare nel passato
  dateValidation: (date: Date) => {
    if (date < new Date()) return { error: 'Non puoi schedulare nel passato' };
  },

  // Max 1 featured release al giorno
  featuredLimit: (date: Date, isFeatured: boolean) => {
    if (isFeatured && getFeaturedForDate(date).length > 0) {
      return { warning: 'C\'e gia una release featured per questo giorno' };
    }
  }
};
```

### 6.5 — API Endpoints Releases

```
GET    /api/admin/releases/calendar
  Query: ?startDate=2026-03-23&endDate=2026-03-29&view=week
  Response: {
    releases: [{
      id, gameId, gameTitle, world, type: 'daily' | 'release' | 'episode',
      scheduledAt, status, featured, announcementText
    }],
    buffer: { brainlab: 14, wordforge: 4, quizarena: 21 },
    gaps: [{ date: '2026-04-02', world: 'WORDFORGE', type: 'daily' }]
  }

POST   /api/admin/releases/schedule
  Body: { gameId, scheduledAt, featured, announcementText, notifyPush, notifyEmail }

PATCH  /api/admin/releases/:id
  Body: { scheduledAt?, featured?, announcementText? }

DELETE /api/admin/releases/:id                    # Annulla scheduling

POST   /api/admin/releases/:id/publish-now        # Pubblica immediatamente

GET    /api/admin/releases/next-slot              # Prossimo slot disponibile
  Response: { suggestedDate: '2026-03-29T09:00:00Z', reason: 'Nessuna release programmata' }
```

### 6.6 — Priorita MVP

| Elemento | Priorita |
|---|---|
| Vista calendario settimanale | **MVP** |
| Form scheduling base (gioco, data, ora) | **MVP** |
| Buffer indicator per mondo | **MVP** |
| Alert buchi nel calendario | **MVP** |
| Drag-and-drop per spostare release | **v1.1** |
| Quick Schedule | **v1.1** |
| Vista calendario mensile | **v1.1** |
| Notifiche push/email al momento del rilascio | **v1.2** |
| Featured release con evidenza in home | **v1.2** |

---

## 7. GESTIONE DAILY CONTENT (`/admin/daily`)

### 7.1 — Calendario Daily — Layout

```
+----------------------------------------------------------------------+
|  Admin > Daily Content                                               |
|                              [Settimana v]  [< 23-29 Mar 2026 >]    |
+----------------------------------------------------------------------+
|                                                                      |
|  BUFFER STATUS                                                       |
|  +----------------------------------------------------------------+  |
|  | BrainLab:  ==========================------  14 giorni  [OK]   |  |
|  | WordForge: ========------------------------   4 giorni  [CRIT] |  |
|  | QuizArena: ================================  21 giorni  [OK]   |  |
|  |                                                                |  |
|  | Target minimo: 7 giorni | Consigliato: 14+ giorni             |  |
|  +----------------------------------------------------------------+  |
|                                                                      |
|  === CALENDARIO DAILY PER MONDO ===                                  |
|                                                                      |
|  BRAINLAB                                                            |
|  +------+------+------+------+------+------+------+                 |
|  |LUN 23|MAR 24|MER 25|GIO 26|VEN 27|SAB 28|DOM 29|                 |
|  +------+------+------+------+------+------+------+                 |
|  |Sudoku|Logic |Kakuro|Sudoku|Nonog.|Logic |Sudoku|                 |
|  |Diff:3|Diff:2|Diff:4|Diff:3|Diff:2|Diff:3|Diff:2|                 |
|  |OK    |OK    |OK    |Oggi  |Sch.  |Sch.  |Sch.  |                 |
|  | 482p | 356p | 298p | 180p |  --  |  --  |  --  |                 |
|  +------+------+------+------+------+------+------+                 |
|                                                                      |
|  WORDFORGE                                                           |
|  +------+------+------+------+------+------+------+                 |
|  |LUN 23|MAR 24|MER 25|GIO 26|VEN 27|SAB 28|DOM 29|                 |
|  +------+------+------+------+------+------+------+                 |
|  |Anagr.|Cross |Word  |Anagr.| [!]  | [!]  | [!]  |                |
|  |Diff:2|Diff:3|Diff:2|Diff:3|VUOTO |VUOTO |VUOTO |                 |
|  |OK    |OK    |OK    |Oggi  |      |      |      |                 |
|  | 389p | 312p | 278p | 145p |  --  |  --  |  --  |                 |
|  +------+------+------+------+------+------+------+                 |
|  [!] WordForge ha solo 4 daily dopo oggi! [Genera Daily] [Upload]   |
|                                                                      |
|  QUIZARENA                                                           |
|  +------+------+------+------+------+------+------+                 |
|  |LUN 23|MAR 24|MER 25|GIO 26|VEN 27|SAB 28|DOM 29|                 |
|  +------+------+------+------+------+------+------+                 |
|  |Geogr.|Scien.|Sport |Stori.|Music |Cinem.|Gener.|                 |
|  |10 dom|10 dom|10 dom|10 dom|10 dom|10 dom|10 dom|                 |
|  |OK    |OK    |OK    |Oggi  |Sch.  |Sch.  |Sch.  |                 |
|  +------+------+------+------+------+------+------+                 |
|                                                                      |
+----------------------------------------------------------------------+
```

### 7.2 — Generazione e Upload Daily

```
+----------------------------------------------------------------------+
|  Genera Daily Content                                      [X Chiudi]|
+----------------------------------------------------------------------+
|                                                                      |
|  Mondo: [BrainLab v]                                                 |
|                                                                      |
|  -- GENERAZIONE AUTOMATICA (BrainLab, WordForge) --                  |
|                                                                      |
|  Tipo gioco:        [Sudoku v]                                       |
|  Numero da generare: [7    ]                                         |
|  Range difficolta:   [2 v] a [4 v]                                   |
|  Pattern difficolta: ( ) Uniforme  ( ) Crescente nella settimana    |
|                      (*) Facile lun-gio, difficile ven-dom           |
|                                                                      |
|  [Genera Anteprima]                                                  |
|                                                                      |
|  Anteprima generati:                                                 |
|  +-----+----------+------+--------------------------------------+   |
|  | #   | Data     | Diff.| Anteprima                            |   |
|  +-----+----------+------+--------------------------------------+   |
|  | 1   | 30/03    | 2    | [Preview] [Modifica] [Rigenera]       |   |
|  | 2   | 31/03    | 3    | [Preview] [Modifica] [Rigenera]       |   |
|  | 3   | 01/04    | 3    | [Preview] [Modifica] [Rigenera]       |   |
|  | ...                                                           |   |
|  +---------------------------------------------------------------+   |
|                                                                      |
|  [Approva Tutti e Schedula]  [Approva Selezionati]                   |
|                                                                      |
|  -- UPLOAD MANUALE (QuizArena) --                                    |
|                                                                      |
|  Upload file JSON/CSV con domande:                                   |
|  +------------------+                                                |
|  |  Drop .json/.csv |  [Carica file]                                |
|  +------------------+                                                |
|                                                                      |
|  Formato atteso:                                                     |
|  { "date": "2026-03-30", "questions": [                              |
|    { "text": "...", "options": [...], "correct": 0, "category": ""}  |
|  ]}                                                                  |
|                                                                      |
|  oppure compilazione manuale:                                        |
|  [+ Aggiungi Daily Quiz Manualmente]                                 |
+----------------------------------------------------------------------+
```

### 7.3 — Override Daily Programmato

```
Flusso Override:
1. Admin clicca su un daily programmato nel calendario
2. Popover con dettagli e azione [Sostituisci]
3. Dialog: "Sostituisci il daily di BrainLab per il 28/03/2026"
   - [Seleziona da buffer v] lista di daily pronti non ancora schedulati
   - oppure [Genera nuovo] che apre il generatore per una singola istanza
4. Conferma -> il daily originale torna nel buffer, quello nuovo prende il suo posto
5. Audit log della sostituzione
```

### 7.4 — API Endpoints Daily

```
GET    /api/admin/daily/calendar
  Query: ?startDate=2026-03-23&endDate=2026-03-29
  Response: {
    dailies: [{
      id, world, gameType, date, difficulty, status,
      playCount, configuration (preview)
    }],
    buffer: { brainlab: 14, wordforge: 4, quizarena: 21 }
  }

GET    /api/admin/daily/buffer
  Response: {
    worlds: [{
      world: 'BRAINLAB',
      totalReady: 14,
      byGameType: [{ type: 'SUDOKU', count: 6 }, { type: 'LOGIC_GRID', count: 4 }, ...],
      nextEmptyDate: '2026-04-09'
    }, ...]
  }

POST   /api/admin/daily/generate
  Body: {
    world: 'BRAINLAB',
    gameType: 'SUDOKU',
    count: 7,
    difficultyRange: { min: 2, max: 4 },
    pattern: 'weekday_easy_weekend_hard'
  }
  Response: {
    generated: [{
      tempId, configuration, difficulty, preview
    }]
  }
  Note: i daily generati sono in stato "anteprima", non ancora confermati

POST   /api/admin/daily/confirm
  Body: {
    dailies: [{
      tempId, date, approved: true
    }]
  }
  Response: { confirmed: number, scheduled: number }

POST   /api/admin/daily/upload
  Body: FormData con file JSON/CSV
  Response: { parsed: number, valid: number, errors: [...] }

GET    /api/admin/daily/:id/preview
  Response: { daily con dati completi per preview }

POST   /api/admin/daily/:id/override
  Body: { replacementDailyId: string }
  Response: { success: true }

PATCH  /api/admin/daily/:id
  Body: { configuration, difficulty, date }
```

### 7.5 — Priorita MVP

| Elemento | Priorita |
|---|---|
| Calendario daily per mondo | **MVP** |
| Buffer status per mondo | **MVP** |
| Upload manuale daily (JSON) | **MVP** |
| Override daily programmato | **MVP** |
| Generazione automatica puzzle (Sudoku, etc.) | **v1.1** |
| Preview daily inline | **v1.1** |
| Pattern difficolta automatico | **v1.2** |
| Upload CSV bulk | **v1.2** |
| Form compilazione manuale quiz | **v1.1** |

---

## 8. GESTIONE UTENTI (`/admin/users`)

### 8.1 — Lista Utenti — Layout

```
+----------------------------------------------------------------------+
|  Admin > Utenti                                      [Esporta CSV]   |
+----------------------------------------------------------------------+
|                                                                      |
|  [Cerca per email o username...                              ]       |
|                                                                      |
|  Filtri:                                                             |
|  [Piano v]  [Attivita v]  [Livello v]  [Registrato v]  [Reset]     |
|   Free       Attivo         Tutti        Ultimi 30gg                |
|   Premium    Inattivo 7gg                Ultimi 90gg                |
|              Churned                     Tutto                       |
|                                                                      |
|  Statistiche rapide:                                                 |
|  Totali: 8.340 | Free: 7.189 (86.2%) | Premium: 1.151 (13.8%)     |
|  Attivi oggi: 1.247 | Inattivi 7gg+: 2.340 | Churned: 89          |
|                                                                      |
|  +----------------------------------------------------------------+  |
|  |Username     |Email            |Piano    |Iscritto |Ultimo |Str.|  |
|  +-------------+-----------------+---------+---------+-------+----+  |
|  |BrainMaster  |brain@email.com  |Premium  |15/01/26 |Oggi   | 45 |  |
|  |PuzzlePro    |puzzle@email.com |Premium  |22/12/25 |Ieri   | 12 |  |
|  |NuovoUtente  |nuovo@email.com  |  Free   |25/03/26 |Oggi   |  1 |  |
|  |InactiveUser |lazy@email.com   |Premium  |01/10/25 |12 gg  |  0 |  |
|  |             |                 |         |  fa     |       |    |  |
|  |FlaggedName  |flag@email.com   |  Free   |20/03/26 |3 gg fa|  0 |  |
|  |             |                 |         |         |  [!]  |    |  |
|  +-------------+-----------------+---------+---------+-------+----+  |
|                                                                      |
|  Pagina 1 di 334                              [< 1 2 3 ... 334 >]  |
+----------------------------------------------------------------------+
```

### 8.2 — Dettaglio Utente (`/admin/users/:id`)

```
+----------------------------------------------------------------------+
|  Admin > Utenti > BrainMaster                                        |
|                                     [Reset Password] [Ban] [Modifica]|
+----------------------------------------------------------------------+
|                                                                      |
|  +-- PROFILO -----------------------------------------------------+  |
|  |                                                                |  |
|  |  +--------+  BrainMaster                                      |  |
|  |  |        |  brain@email.com                                   |  |
|  |  |[avatar]|  Piano: Premium (dal 15/02/2026)                  |  |
|  |  |        |  Registrato: 15/01/2026                            |  |
|  |  +--------+  Ultimo login: Oggi alle 08:45                    |  |
|  |              Ruolo: Utente                                     |  |
|  |              Stato: Attivo                                     |  |
|  |                                                                |  |
|  +----------------------------------------------------------------+  |
|                                                                      |
|  +-- STATISTICHE DI GIOCO ----------------------------------------+  |
|  |                                                                |  |
|  |  +---------+ +---------+ +---------+ +---------+              |  |
|  |  | Livello | |   XP    | | Streak  | | Partite |              |  |
|  |  |   12    | |  4.580  | | 45 gg   | |  342    |              |  |
|  |  |         | | /5.000  | |(max: 45)| | totali  |              |  |
|  |  +---------+ +---------+ +---------+ +---------+              |  |
|  |                                                                |  |
|  |  Distribuzione per Mondo:                                      |  |
|  |  BrainLab: 58% (198 partite) | WordForge: 25% (86) |         |  |
|  |  QuizArena: 17% (58)                                          |  |
|  |                                                                |  |
|  |  Badge ottenuti: 12/35                                        |  |
|  |  [Primo Login] [Streak 7] [Streak 30] [Master BrainLab]       |  |
|  |  [100 Partite] ... [Vedi tutti]                                |  |
|  |                                                                |  |
|  +----------------------------------------------------------------+  |
|                                                                      |
|  +-- CRONOLOGIA PAGAMENTI (da Stripe) ----------------------------+  |
|  |                                                                |  |
|  |  Piano attuale: Premium Mensile -- E4.99/mese                 |  |
|  |  Stripe Customer ID: cus_xxxxxxxxxxxxx  [Apri su Stripe]      |  |
|  |  Prossimo rinnovo: 15/04/2026                                 |  |
|  |                                                                |  |
|  |  +----------+----------+---------+------------------------+   |  |
|  |  | Data     | Importo  | Stato   | Invoice                |   |  |
|  |  +----------+----------+---------+------------------------+   |  |
|  |  | 15/03/26 | E4.99    | Pagato  | inv_xxx [Vedi]         |   |  |
|  |  | 15/02/26 | E4.99    | Pagato  | inv_xxx [Vedi]         |   |  |
|  |  +----------+----------+---------+------------------------+   |  |
|  |                                                                |  |
|  |  LTV stimato: E14.97                                          |  |
|  |                                                                |  |
|  +----------------------------------------------------------------+  |
|                                                                      |
|  +-- ATTIVITA RECENTE --------------------------------------------+  |
|  |                                                                |  |
|  |  Oggi 08:45    Login                                           |  |
|  |  Oggi 08:46    Giocato: Sudoku Master (BrainLab) -- 850 punti |  |
|  |  Oggi 08:52    Giocato: Word Chain (WordForge) -- 620 punti   |  |
|  |  Ieri 19:30    Giocato: Quiz Europa (QuizArena) -- 7/10       |  |
|  |  Ieri 19:20    Badge ottenuto: "Streak 45"                    |  |
|  |  ...                                                           |  |
|  |  [Carica altri]                                                |  |
|  |                                                                |  |
|  +----------------------------------------------------------------+  |
|                                                                      |
|  +-- AZIONI ADMIN ------------------------------------------------+  |
|  |                                                                |  |
|  |  [Reset Password]   Invia email di reset                      |  |
|  |  [Gift Premium]     Regala X giorni di Premium                 |  |
|  |  [Modifica Ruolo]   Promuovi a Content Manager/Moderatore     |  |
|  |  [Warn]             Invia avvertimento                         |  |
|  |  [Ban Temporaneo]   Ban per X giorni                           |  |
|  |  [Ban Permanente]   Ban definitivo                             |  |
|  |                                                                |  |
|  +----------------------------------------------------------------+  |
+----------------------------------------------------------------------+
```

### 8.3 — Dialog Gift Premium

```
+------------------------------------------------------+
|  Gift Premium a BrainMaster                [X Chiudi]|
+------------------------------------------------------+
|                                                      |
|  Durata:  ( ) 7 giorni                               |
|           (*) 30 giorni                              |
|           ( ) 90 giorni                              |
|           ( ) Personalizzata: [   ] giorni           |
|                                                      |
|  Motivo (interno, non visibile all'utente):          |
|  [Beta tester, ringraziamento                    ]   |
|                                                      |
|  Messaggio all'utente (opzionale):                   |
|  [Grazie per il tuo feedback! Ecco un regalo... ]    |
|                                                      |
|  Nota: se l'utente e gia Premium, i giorni si        |
|  sommeranno alla scadenza attuale.                   |
|                                                      |
|                      [Annulla]  [Regala Premium]     |
+------------------------------------------------------+
```

### 8.4 — Esportazione CSV

```
Campi esportati:
- user_id, username, email, plan, registration_date, last_login
- total_games_played, current_streak, max_streak, level, xp
- favorite_world, badges_count
- subscription_status, subscription_start, mrr_contribution
- is_active_7d, is_active_30d

Filtri applicabili all'export:
- Stesso set di filtri della lista
- Data registrazione: da/a
- Limite: max 50.000 righe per export

Processo:
1. Admin configura filtri e clicca [Esporta CSV]
2. Job asincrono genera il file
3. Notifica quando pronto con link download
4. Link valido per 24 ore
```

### 8.5 — API Endpoints Utenti

```
GET    /api/admin/users
  Query: ?search=brain&plan=PREMIUM&activity=active&level=10-20
         &registeredAfter=2026-01-01&sortBy=lastLogin&sortOrder=desc
         &page=1&perPage=25
  Response: {
    data: AdminUserView[],
    meta: { total, page, perPage },
    summary: { totalFree, totalPremium, activeToday, inactive7d, churned }
  }

GET    /api/admin/users/:id
  Response: {
    data: AdminUserDetail (profilo + stats + badge + attivita recente),
    payments: StripePaymentHistory[],  // solo se ha permesso USERS_VIEW_PAYMENTS
    activity: RecentActivity[]
  }

POST   /api/admin/users/:id/reset-password
  Response: { emailSent: true }
  Side effects: genera token reset, invia email

POST   /api/admin/users/:id/gift-premium
  Body: { days: 30, reason: string, userMessage?: string }
  Response: { newExpiryDate: string }
  Side effects: audit_log, estendi/crea subscription, email utente

PATCH  /api/admin/users/:id/role
  Body: { role: 'USER' | 'CONTENT_MANAGER' | 'MODERATOR' | 'ANALYST' }
  Response: { data: User }
  Side effects: audit_log
  Permesso: solo SUPER_ADMIN

POST   /api/admin/users/:id/warn
  Body: { reason: string, message: string }
  Side effects: audit_log, email utente, incrementa warning_count

POST   /api/admin/users/:id/ban
  Body: { type: 'TEMPORARY' | 'PERMANENT', durationDays?: number, reason: string }
  Response: { data: User }
  Side effects: audit_log, invalida sessioni, email utente, cancella subscription se permanente

POST   /api/admin/users/export
  Body: { filters: UserFilters, fields: string[] }
  Response: { jobId: string, estimatedRows: number }
  Note: asincrono, notifica quando pronto

GET    /api/admin/users/export/:jobId
  Response: { status: 'processing' | 'ready' | 'failed', downloadUrl?: string }
```

### 8.6 — Permessi Utenti

| Azione | SUPER_ADMIN | CONTENT_MANAGER | MODERATOR | ANALYST |
|---|---|---|---|---|
| Vedere lista utenti | Si | Si (no email completa) | Si (limitato) | Si |
| Vedere dettaglio utente | Si | Si (no pagamenti) | Si (no pagamenti) | Si |
| Vedere cronologia pagamenti | Si | No | No | No |
| Reset password | Si | No | No | No |
| Gift premium | Si | No | No | No |
| Modifica ruolo | Si | No | No | No |
| Warn utente | Si | No | Si | No |
| Ban utente | Si | No | Si (solo temporaneo) | No |
| Export CSV | Si | No | No | Si |

### 8.7 — Priorita MVP

| Elemento | Priorita |
|---|---|
| Lista utenti con ricerca e filtri base | **MVP** |
| Dettaglio utente con stats di gioco | **MVP** |
| Cronologia pagamenti Stripe | **MVP** |
| Ban utente (temporaneo e permanente) | **MVP** |
| Reset password | **MVP** |
| Gift premium | **v1.1** |
| Modifica ruolo | **v1.1** |
| Export CSV | **v1.1** |
| Attivita recente dettagliata | **v1.2** |
| Segmenti utenti salvabili | **v1.3** |

---

## 9. GESTIONE BADGE (`/admin/badges`)

### 9.1 — Lista Badge — Layout

```
+----------------------------------------------------------------------+
|  Admin > Badge                                       [+ Nuovo Badge] |
+----------------------------------------------------------------------+
|                                                                      |
|  Filtri: [Categoria v] [Stato v]              Cerca per nome         |
|           Streak        Attivo                                       |
|           Completamento Disattivato                                  |
|           Sociale                                                    |
|           Mondo                                                      |
|           Speciale                                                   |
|                                                                      |
|  +-- BADGE ATTIVI ------------------------------------------------+  |
|  |                                                                |  |
|  |  [icon] Primo Login           Categoria: Speciale              |  |
|  |         "Completa il primo login"                              |  |
|  |         XP: 10 | Ottenuto da: 8.340 (100%)  [Edit] [Off]     |  |
|  |                                                                |  |
|  |  [icon] Streak 7              Categoria: Streak                |  |
|  |         "Mantieni uno streak di 7 giorni"                      |  |
|  |         XP: 50 | Ottenuto da: 3.120 (37.4%)  [Edit] [Off]    |  |
|  |                                                                |  |
|  |  [icon] Streak 30             Categoria: Streak                |  |
|  |         "Mantieni uno streak di 30 giorni"                     |  |
|  |         XP: 200 | Ottenuto da: 890 (10.7%)  [Edit] [Off]     |  |
|  |                                                                |  |
|  |  [icon] Master BrainLab       Categoria: Mondo                 |  |
|  |         "Completa 50 giochi BrainLab"                          |  |
|  |         XP: 150 | Ottenuto da: 245 (2.9%)   [Edit] [Off]     |  |
|  |                                                                |  |
|  |  [icon] Social Butterfly      Categoria: Sociale               |  |
|  |         "Metti like a 100 giochi"                              |  |
|  |         XP: 75 | Ottenuto da: 156 (1.9%)    [Edit] [Off]     |  |
|  |                                                                |  |
|  +----------------------------------------------------------------+  |
|                                                                      |
|  Totale: 35 badge | Attivi: 32 | Disattivati: 3                    |
+----------------------------------------------------------------------+
```

### 9.2 — Form Creazione/Modifica Badge

```
+----------------------------------------------------------------------+
|  Admin > Badge > Nuovo Badge                                         |
|                                                    [Salva] [Annulla] |
+----------------------------------------------------------------------+
|                                                                      |
|  +-- INFORMAZIONI BASE -------------------------------------------+  |
|  |                                                                |  |
|  |  Nome *            [                                    ]      |  |
|  |  Slug              [auto-generato                       ]      |  |
|  |  Descrizione *     [Testo mostrato all'utente           ]      |  |
|  |                                                                |  |
|  |  Categoria *       [Streak v]                                  |  |
|  |  XP Reward *       [100   ]                                    |  |
|  |                                                                |  |
|  |  Icona *                                                       |  |
|  |  +--------+                                                    |  |
|  |  |        |  [Carica icona]  Formato: PNG/SVG, 128x128px      |  |
|  |  | [icon] |  Max: 500KB                                        |  |
|  |  +--------+                                                    |  |
|  |                                                                |  |
|  +----------------------------------------------------------------+  |
|                                                                      |
|  +-- CONDIZIONE DI ASSEGNAZIONE ----------------------------------+  |
|  |                                                                |  |
|  |  Modalita: (*) Builder visuale  ( ) JSON                      |  |
|  |                                                                |  |
|  |  -- Builder Visuale --                                         |  |
|  |                                                                |  |
|  |  Tipo condizione:  [Contatore v]                               |  |
|  |                    Opzioni:                                     |  |
|  |                    - Contatore (giochi completati, like, etc.)  |  |
|  |                    - Streak (X giorni consecutivi)              |  |
|  |                    - Livello (raggiungere livello X)            |  |
|  |                    - Mondo specifico (X giochi in un mondo)     |  |
|  |                    - Evento singolo (primo login, primo daily)  |  |
|  |                    - Combinazione (AND/OR di piu condizioni)    |  |
|  |                                                                |  |
|  |  Se Contatore:                                                 |  |
|  |  Metrica:     [Giochi completati v]                            |  |
|  |  Soglia:      [50    ]                                         |  |
|  |  Mondo:       [Tutti v]   (opzionale: filtra per mondo)       |  |
|  |  Gioco:       [Tutti v]   (opzionale: filtra per gioco)       |  |
|  |                                                                |  |
|  |  Se Streak:                                                    |  |
|  |  Giorni consecutivi:  [30  ]                                   |  |
|  |                                                                |  |
|  |  Se Combinazione:                                              |  |
|  |  Condizione 1: [Streak >= 7]  AND                              |  |
|  |  Condizione 2: [Giochi BrainLab >= 10]                        |  |
|  |  [+ Aggiungi condizione]                                       |  |
|  |                                                                |  |
|  |  -- JSON (avanzato) --                                         |  |
|  |  +----------------------------------------------------------+  |  |
|  |  | {                                                        |  |  |
|  |  |   "type": "counter",                                     |  |  |
|  |  |   "metric": "games_completed",                           |  |  |
|  |  |   "threshold": 50,                                       |  |  |
|  |  |   "filters": { "world": "BRAINLAB" }                     |  |  |
|  |  | }                                                        |  |  |
|  |  +----------------------------------------------------------+  |  |
|  |                                                                |  |
|  +----------------------------------------------------------------+  |
|                                                                      |
|  +-- ANTEPRIMA ---------------------------------------------------+  |
|  |                                                                |  |
|  |  Come apparira all'utente:                                     |  |
|  |  +-------------------------------------------------------------+  |
|  |  |  [icon]  Master BrainLab                                |  |  |
|  |  |          Completa 50 giochi BrainLab                    |  |  |
|  |  |          +150 XP                                        |  |  |
|  |  |          Progresso: ========-- 40/50 (80%)              |  |  |
|  |  +-------------------------------------------------------------+  |
|  |                                                                |  |
|  |  Utenti che attualmente soddisfano la condizione: 245 (2.9%)  |  |
|  |  (Calcolato in tempo reale sulla base dati attuale)            |  |
|  |                                                                |  |
|  +----------------------------------------------------------------+  |
|                                                                      |
|  Stato:  (*) Attivo  ( ) Disattivato                                |
|  Nota: disattivare un badge lo nasconde dal profilo ma non lo       |
|  rimuove da chi lo ha gia ottenuto.                                  |
|                                                                      |
+----------------------------------------------------------------------+
```

### 9.3 — Schema Condizioni Badge

```typescript
// Tipi di condizione per badge
type BadgeCondition =
  | CounterCondition
  | StreakCondition
  | LevelCondition
  | EventCondition
  | CompositeCondition;

interface CounterCondition {
  type: 'counter';
  metric: 'games_completed' | 'games_played' | 'likes_given' | 'likes_received'
        | 'perfect_scores' | 'daily_completed' | 'series_completed';
  threshold: number;
  filters?: {
    world?: 'BRAINLAB' | 'WORDFORGE' | 'QUIZARENA';
    gameId?: string;
    difficulty?: { min?: number; max?: number };
  };
}

interface StreakCondition {
  type: 'streak';
  days: number;          // giorni consecutivi richiesti
}

interface LevelCondition {
  type: 'level';
  level: number;
}

interface EventCondition {
  type: 'event';
  event: 'first_login' | 'first_game' | 'first_daily' | 'first_like'
       | 'first_premium' | 'profile_completed';
}

interface CompositeCondition {
  type: 'composite';
  operator: 'AND' | 'OR';
  conditions: BadgeCondition[];
}
```

### 9.4 — API Endpoints Badge

```
GET    /api/admin/badges
  Query: ?category=streak&status=active&search=master
  Response: {
    data: [{
      id, name, slug, description, iconUrl, category,
      condition: BadgeCondition, xpReward, isActive,
      earnedCount, earnedPercentage
    }]
  }

GET    /api/admin/badges/:id
  Response: { data: Badge & { earners: UserSummary[], earnedOverTime: ChartData } }

POST   /api/admin/badges
  Body: { name, slug, description, iconUrl, category, condition, xpReward, isActive }
  Response: { data: Badge }

PATCH  /api/admin/badges/:id
  Body: Partial<BadgeFormData>

POST   /api/admin/badges/:id/toggle
  Body: { isActive: boolean }

POST   /api/admin/badges/simulate
  Body: { condition: BadgeCondition }
  Response: { matchingUsers: number, percentage: number }
  Note: simula quanti utenti soddisfano la condizione senza creare il badge

DELETE /api/admin/badges/:id                      # Solo se nessun utente lo ha
```

### 9.5 — Priorita MVP

| Elemento | Priorita |
|---|---|
| Lista badge con stats | **MVP** |
| Form creazione con condizioni base (counter, streak) | **MVP** |
| Attiva/disattiva badge | **MVP** |
| Upload icona | **MVP** |
| Builder visuale condizioni | **v1.1** |
| Condizioni composite (AND/OR) | **v1.2** |
| Simulazione condizione | **v1.2** |
| Preview badge | **v1.1** |
| Storico assegnazioni nel tempo | **v1.3** |

---

## 10. ANALYTICS (`/admin/analytics`)

### 10.1 — Panoramica Analytics

```
+----------------------------------------------------------------------+
|  Admin > Analytics                                                   |
|                    Periodo: [Ultimi 30 giorni v]  [Esporta Dati]    |
+----------------------------------------------------------------------+
|                                                                      |
|  +-- TAB NAVIGATION ---------------------------------------------+  |
|  | [Panoramica] [Retention] [Revenue] [Content] [Conversione]    |  |
|  +----------------------------------------------------------------+  |
|                                                                      |
|  ... contenuto del tab selezionato ...                               |
+----------------------------------------------------------------------+
```

### 10.2 — Tab Retention (Cohort Analysis)

```
+----------------------------------------------------------------------+
|  RETENTION COHORT ANALYSIS                                           |
|                                                                      |
|  Cohort: [Settimana di registrazione v]                              |
|                                                                      |
|  +-----------+------+------+------+------+------+------+------+     |
|  | Coorte    |Utenti| D1   | D3   | D7   | D14  | D21  | D30  |     |
|  +-----------+------+------+------+------+------+------+------+     |
|  | 24-30 Mar |  89  | 72%  | 58%  |  --  |  --  |  --  |  --  |     |
|  | 17-23 Mar | 112  | 68%  | 55%  | 42%  |  --  |  --  |  --  |     |
|  | 10-16 Mar |  98  | 71%  | 56%  | 44%  | 31%  |  --  |  --  |     |
|  | 03-09 Mar | 105  | 65%  | 52%  | 40%  | 29%  | 24%  |  --  |     |
|  | 24-28 Feb |  94  | 69%  | 54%  | 43%  | 30%  | 25%  | 21%  |     |
|  | 17-23 Feb | 101  | 67%  | 53%  | 41%  | 28%  | 23%  | 19%  |     |
|  | 10-16 Feb |  88  | 70%  | 55%  | 45%  | 32%  | 26%  | 22%  |     |
|  +-----------+------+------+------+------+------+------+------+     |
|                                                                      |
|  Codifica colore:                                                    |
|  Verde >= 50%  |  Giallo 30-49%  |  Arancio 15-29%  |  Rosso < 15% |
|                                                                      |
|  Insight automatici:                                                 |
|  - La coorte 10-16 Feb ha la migliore retention D30 (22%)          |
|  - Drop piu significativo tra D7 e D14 (-12pp in media)            |
|  - Trend D1 stabile: media 69% nelle ultime 8 settimane            |
|                                                                      |
+----------------------------------------------------------------------+
```

### 10.3 — Tab Revenue

```
+----------------------------------------------------------------------+
|  REVENUE ANALYTICS                                                   |
|                                                                      |
|  +---------+ +---------+ +---------+ +---------+                    |
|  | MRR     | | ARPU    | | LTV     | | Churn   |                    |
|  | E4.230  | | E3.67   | | E42.80  | | Revenue |                    |
|  | +8%     | | +2%     | | +5%     | | E380    |                    |
|  +---------+ +---------+ +---------+ +---------+                    |
|                                                                      |
|  MRR BREAKDOWN                                                       |
|  +----------------------------------------------------------------+  |
|  | Nuove subscription:      +E230    (46 nuovi premium)           |  |
|  | Rinnovi:                 +E4.100  (820 rinnovi)                |  |
|  | Upgrade (mensile->annuale): +E120 (8 upgrade)                 |  |
|  | Cancellazioni:           -E180    (36 cancellazioni)           |  |
|  | Downgrade:               -E40     (4 downgrade)                |  |
|  | ---------------------------------------------------------------+  |
|  | MRR Netto:               E4.230                                |  |
|  +----------------------------------------------------------------+  |
|                                                                      |
|  CHURN PER COORTE                                                    |
|  +-------------+--------+--------+--------+--------+                |
|  | Mese isc.   | Mese 1 | Mese 2 | Mese 3 | Mese 6 |                |
|  +-------------+--------+--------+--------+--------+                |
|  | Gen 2026    |  8%    |  5%    |  3%    |  --    |                |
|  | Feb 2026    |  7%    |  4%    |  --    |  --    |                |
|  | Mar 2026    |  6%    |  --    |  --    |  --    |                |
|  +-------------+--------+--------+--------+--------+                |
|                                                                      |
|  REVENUE TREND (grafico a linee, ultimi 6 mesi)                     |
|  (grafico)                                                           |
|                                                                      |
+----------------------------------------------------------------------+
```

### 10.4 — Tab Content Performance

```
+----------------------------------------------------------------------+
|  CONTENT PERFORMANCE                                                 |
|                                                                      |
|  Performance per tipo di gioco:                                      |
|  +-----------------+--------+--------+--------+----------+--------+ |
|  | Tipo            | Plays  | Rating | Compl. | Avg Time | Ret.   | |
|  +-----------------+--------+--------+--------+----------+--------+ |
|  | Sudoku          | 45.2k  | 94%    | 78%    | 7:30     | 85%    | |
|  | Logic Grid      | 28.1k  | 88%    | 65%    | 12:15    | 72%    | |
|  | Word Chain      | 32.5k  | 91%    | 82%    | 5:45     | 80%    | |
|  | Crossword       | 22.3k  | 86%    | 60%    | 15:00    | 68%    | |
|  | Quiz Generale   | 38.7k  | 89%    | 90%    | 4:20     | 76%    | |
|  | Quiz Tematico   | 18.9k  | 92%    | 88%    | 5:10     | 82%    | |
|  +-----------------+--------+--------+--------+----------+--------+ |
|                                                                      |
|  Insight:                                                            |
|  - Sudoku ha il rating piu alto (94%) e ottima retention (85%)      |
|  - Logic Grid ha il tempo medio piu lungo -- valutare se troppo     |
|  - I Quiz Tematici hanno retention migliore dei Quiz Generali       |
|                                                                      |
|  Performance per difficolta:                                         |
|  +--------+--------+--------+--------+                              |
|  | Diff.  | Plays  | Compl. | Rating |                              |
|  +--------+--------+--------+--------+                              |
|  | 1      | 12.3k  | 95%    | 82%    |  <-- troppo facile?          |
|  | 2      | 38.5k  | 85%    | 90%    |  <-- sweet spot              |
|  | 3      | 42.1k  | 72%    | 92%    |  <-- sweet spot              |
|  | 4      | 18.7k  | 55%    | 88%    |                              |
|  | 5      |  8.2k  | 32%    | 78%    |  <-- troppo difficile?       |
|  +--------+--------+--------+--------+                              |
|                                                                      |
+----------------------------------------------------------------------+
```

### 10.5 — Tab Funnel Conversione

```
+----------------------------------------------------------------------+
|  FUNNEL DI CONVERSIONE                                               |
|                                                                      |
|  Periodo: [Ultimi 30 giorni v]                                       |
|                                                                      |
|  ========================================  Registrazione    2.340    |
|  =============================             Primo gioco      1.872 80%|
|  =====================                     Primo daily      1.404 60%|
|  ===============                           Streak 3gg         936 40%|
|  ==========                                Streak 7gg         585 25%|
|  =====                                     Conv. Premium      234 10%|
|                                                                      |
|  Drop-off principali:                                                |
|  - Registrazione -> Primo gioco: 20% drop (468 utenti persi)       |
|  - Primo daily -> Streak 3gg: 33% drop (468 utenti persi)          |
|  - Streak 7gg -> Premium: 60% drop (351 utenti persi)              |
|                                                                      |
|  Tempo medio per fase:                                               |
|  Reg. -> Primo gioco: 2 min | Primo gioco -> Primo daily: 1.2 gg  |
|  Primo daily -> Streak 7: 8.5 giorni | Streak 7 -> Premium: 4 gg  |
|                                                                      |
|  Trigger di conversione (cosa facevano gli utenti prima di pagare): |
|  - 68% aveva streak attivo >= 5 giorni                              |
|  - 45% ha provato a giocare un gioco premium-only                  |
|  - 31% ha visto il paywall sulla classifica completa               |
|  - 22% ha ricevuto l'offerta dopo 7 giorni                         |
|                                                                      |
+----------------------------------------------------------------------+
```

### 10.6 — API Endpoints Analytics

```
GET /api/admin/analytics/retention
  Query: ?cohortBy=week&startDate=2026-02-01&endDate=2026-03-26
  Response: {
    cohorts: [{
      label: '24-30 Mar',
      users: 89,
      retention: { d1: 72, d3: 58, d7: null, d14: null, d21: null, d30: null }
    }, ...]
  }

GET /api/admin/analytics/revenue
  Query: ?period=30d
  Response: {
    mrr: { value: 4230, trend: 8 },
    arpu: { value: 3.67, trend: 2 },
    ltv: { value: 42.80, trend: 5 },
    churnRevenue: { value: 380 },
    breakdown: { newSubs: 230, renewals: 4100, upgrades: 120, cancellations: -180, downgrades: -40 },
    churnByCohort: [...],
    trend: [{ month: '2025-10', mrr: 2800 }, ...]
  }

GET /api/admin/analytics/content
  Query: ?period=30d&groupBy=gameType
  Response: {
    byGameType: [{ type: 'SUDOKU', plays: 45200, rating: 94, ... }],
    byDifficulty: [{ difficulty: 1, plays: 12300, completion: 95, rating: 82 }],
    insights: string[]
  }

GET /api/admin/analytics/funnel
  Query: ?period=30d
  Response: {
    steps: [
      { name: 'registration', count: 2340 },
      { name: 'first_game', count: 1872, rate: 80 },
      { name: 'first_daily', count: 1404, rate: 60 },
      ...
    ],
    triggers: [{ trigger: 'active_streak_5d', percentage: 68 }, ...],
    averageTime: { regToFirstGame: '2min', ... }
  }

POST /api/admin/analytics/export
  Body: { report: 'retention' | 'revenue' | 'content' | 'funnel', period, format: 'csv' | 'json' }
  Response: { jobId: string }
```

### 10.7 — Priorita MVP

| Elemento | Priorita |
|---|---|
| Retention cohort (tabella base) | **MVP** |
| Revenue: MRR, ARPU, trend | **MVP** |
| Funnel conversione base | **MVP** |
| Content performance per tipo gioco | **v1.1** |
| Content performance per difficolta | **v1.1** |
| Churn per coorte | **v1.1** |
| MRR breakdown dettagliato | **v1.1** |
| Trigger conversione | **v1.2** |
| Insight automatici | **v1.2** |
| Export dati | **v1.1** |
| LTV calculation | **v1.2** |

---

## 11. MODERAZIONE (`/admin/moderation`)

### 11.1 — Layout Moderazione

```
+----------------------------------------------------------------------+
|  Admin > Moderazione                                                 |
+----------------------------------------------------------------------+
|                                                                      |
|  +-- TAB ---------------------------------------------------------+  |
|  | [Segnalazioni (5)] [Username Review (3)] [Giochi Basso Rating] |  |
|  +----------------------------------------------------------------+  |
|                                                                      |
|  === SEGNALAZIONI IN ATTESA ===                                      |
|                                                                      |
|  +----------------------------------------------------------------+  |
|  | [!] #1 -- Username inappropriato                               |  |
|  | Utente: "BadWord123" (id: xxx)                                 |  |
|  | Segnalato da: 3 utenti | Prima segnalazione: 24/03/2026       |  |
|  | Motivo: "Nome offensivo"                                        |  |
|  |                                                                |  |
|  | [Profilo]  [Ignora]  [Warn + Forza cambio]  [Ban]              |  |
|  +----------------------------------------------------------------+  |
|                                                                      |
|  +----------------------------------------------------------------+  |
|  | [!] #2 -- Username sospetto                                    |  |
|  | Utente: "Admin_Gameflix" (id: xxx)                              |  |
|  | Segnalato da: sistema (pattern matching) | 25/03/2026          |  |
|  | Motivo: "Impersonation: contiene 'admin' o 'gameflix'"         |  |
|  |                                                                |  |
|  | [Profilo]  [Ignora]  [Warn + Forza cambio]  [Ban]              |  |
|  +----------------------------------------------------------------+  |
|                                                                      |
|  === GIOCHI CON RATING BASSO ===                                     |
|                                                                      |
|  +----------------------------------------------------------------+  |
|  | Logic Grid -- BrainLab                                         |  |
|  | Rating: 41% (da 65% la settimana scorsa)                       |  |
|  | Play count ultimo 7gg: 180 | Completion rate: 28%              |  |
|  | Feedback: "Troppo difficile", "Istruzioni confuse", "Bug"      |  |
|  |                                                                |  |
|  | [Dettaglio Stats]  [Modifica Gioco]  [Ritira]                  |  |
|  +----------------------------------------------------------------+  |
|                                                                      |
|  === LOG AZIONI MODERAZIONE ===                                      |
|                                                                      |
|  | 25/03 10:30 -- Luca: Warn a "TrollUser" per username          |  |
|  | 24/03 15:00 -- Luca: Ban 7gg a "SpamBot" per comportamento    |  |
|  | 22/03 09:15 -- Luca: Ignorata segnalazione su "NormalUser"    |  |
|  | ...                                                            |  |
|                                                                      |
|  Totale segnalazioni: In attesa: 5 | Risolte (30gg): 23            |
|  Tempo medio risoluzione: 4.2 ore                                   |
+----------------------------------------------------------------------+
```

### 11.2 — Flusso Moderazione

```
Flusso Segnalazione Username:
1. Utente segnala un username (o sistema rileva pattern)
2. Segnalazione appare in coda moderazione
3. Moderatore esamina e decide:
   a. [Ignora] -> segnalazione chiusa, nessuna azione
   b. [Warn + Forza cambio] -> email all'utente, username resettato a "User_xxxx",
      utente obbligato a scegliere nuovo username al prossimo login
   c. [Ban] -> ban temporaneo o permanente (con dialog di conferma)
4. Audit log registra l'azione
5. Se warn raggiunge soglia (3 warn), suggerisce ban automatico

Flusso Rating Basso:
1. Sistema identifica giochi con rating < 50% negli ultimi 7 giorni
2. Appaiono nella sezione moderazione
3. Admin puo:
   a. Esaminare i feedback e decidere di modificare il gioco
   b. Ritirare il gioco temporaneamente per fix
   c. Ignorare (il gioco resta, verra ri-segnalato se il rating non migliora)
```

### 11.3 — API Endpoints Moderazione

```
GET    /api/admin/moderation/reports
  Query: ?status=pending&type=username
  Response: {
    data: [{
      id, type: 'username' | 'behavior',
      targetUserId, targetUsername,
      reportedBy: string[] | 'system',
      reason, createdAt, status: 'pending' | 'resolved'
    }]
  }

POST   /api/admin/moderation/reports/:id/resolve
  Body: {
    action: 'ignore' | 'warn' | 'force_rename' | 'ban',
    banType?: 'TEMPORARY' | 'PERMANENT',
    banDurationDays?: number,
    note?: string
  }
  Side effects: audit_log, azione sull'utente, email

GET    /api/admin/moderation/low-rated-games
  Query: ?threshold=50&days=7
  Response: {
    data: [{
      gameId, title, world, currentRating, previousRating,
      recentPlayCount, completionRate, feedbackSummary: string[]
    }]
  }

GET    /api/admin/moderation/log
  Query: ?page=1&perPage=20
  Response: { data: ModerationAction[] }
```

### 11.4 — Priorita MVP

| Elemento | Priorita |
|---|---|
| Coda segnalazioni username | **MVP** |
| Azioni: ignora, warn, ban | **MVP** |
| Log azioni moderazione | **MVP** |
| Pattern matching automatico username | **v1.1** |
| Giochi con rating basso | **v1.1** |
| Statistiche moderazione | **v1.2** |

---

## 12. IMPOSTAZIONI PIATTAFORMA (`/admin/settings`)

### 12.1 — Piani e Prezzi (`/admin/settings/plans`)

```
+----------------------------------------------------------------------+
|  Admin > Impostazioni > Piani e Prezzi                               |
|                                                                      |
|  [!] Le modifiche ai prezzi si applicano solo ai NUOVI abbonamenti. |
|  Gli abbonamenti esistenti mantengono il prezzo originale fino al    |
|  prossimo rinnovo (configurabile).                                   |
|                                                                      |
|  +-- PIANO FREE -------------------------------------------------+  |
|  |                                                                |  |
|  |  Nome piano:      [Free                           ]           |  |
|  |                                                                |  |
|  |  Limiti:                                                       |  |
|  |  Daily games/giorno:        [3  ]                              |  |
|  |  Giochi catalogo/giorno:    [1  ]                              |  |
|  |  Accesso classifiche:       ( ) Completa  (*) Top 10 only     |  |
|  |  Accesso serie:             ( ) Completo  (*) Primo episodio  |  |
|  |  Pubblicita:                [x] Mostra ads tra le partite      |  |
|  |                                                                |  |
|  +----------------------------------------------------------------+  |
|                                                                      |
|  +-- PIANO PREMIUM MENSILE --------------------------------------+  |
|  |                                                                |  |
|  |  Nome piano:      [Premium                        ]           |  |
|  |  Stripe Price ID: [price_xxxxxxxxxxxxx            ] [Sync]    |  |
|  |  Prezzo:          [E4.99  ] /mese                              |  |
|  |                                                                |  |
|  |  Include:                                                      |  |
|  |  Daily games/giorno:        [Illimitati]                       |  |
|  |  Giochi catalogo/giorno:    [Illimitati]                       |  |
|  |  Accesso classifiche:       (*) Completa                      |  |
|  |  Accesso serie:             (*) Completo                      |  |
|  |  Pubblicita:                [ ] No ads                         |  |
|  |  Badge esclusivi:           [x]                                |  |
|  |  Statistiche avanzate:      [x]                                |  |
|  |                                                                |  |
|  +----------------------------------------------------------------+  |
|                                                                      |
|  +-- PIANO PREMIUM ANNUALE --------------------------------------+  |
|  |                                                                |  |
|  |  Nome piano:      [Premium Annuale                ]           |  |
|  |  Stripe Price ID: [price_yyyyyyyyyyyyy            ] [Sync]    |  |
|  |  Prezzo:          [E39.99 ] /anno  (= E3.33/mese, -33%)      |  |
|  |                                                                |  |
|  |  Include: tutto Premium Mensile + sconto                       |  |
|  |                                                                |  |
|  +----------------------------------------------------------------+  |
|                                                                      |
|  Trial period:  [7  ] giorni (0 = nessun trial)                     |
|                                                                      |
|                                             [Salva Modifiche]        |
|                                                                      |
|  Ultimo sync con Stripe: 26/03/2026 14:30 [Sincronizza Ora]        |
+----------------------------------------------------------------------+
```

### 12.2 — Feature Flags (`/admin/settings/features`)

```
+----------------------------------------------------------------------+
|  Admin > Impostazioni > Feature Flags                                |
+----------------------------------------------------------------------+
|                                                                      |
|  +----------------------------------------------------------------+  |
|  | Flag                     | Stato | Descrizione        | Target |  |
|  +--------------------------+-------+--------------------+--------+  |
|  | streak_notifications     | ON    | Notifiche streak   | Tutti  |  |
|  | daily_reminders          | ON    | Reminder giornalieri| Tutti |  |
|  | social_sharing           | OFF   | Condivisione social|  --   |  |
|  | multiplayer_mode         | OFF   | Modalita multiplayer| --   |  |
|  | ai_generated_puzzles     | BETA  | Puzzle generati AI | 10%   |  |
|  | new_onboarding_flow      | BETA  | Nuovo onboarding   | 25%   |  |
|  | achievement_v2           | OFF   | Nuovo sistema badge|  --   |  |
|  | dark_mode                | ON    | Tema scuro         | Tutti  |  |
|  +----------------------------------------------------------------+  |
|                                                                      |
|  Per ogni flag, click per espandere:                                 |
|  +----------------------------------------------------------------+  |
|  | ai_generated_puzzles                                     [Edit]|  |
|  |                                                                |  |
|  | Stato: (*) ON  ( ) OFF  ( ) Beta                              |  |
|  |                                                                |  |
|  | Se Beta, percentuale rollout: [10 ]%                          |  |
|  | Target:  ( ) Tutti  (*) Percentuale  ( ) Lista utenti         |  |
|  |                                                                |  |
|  | Descrizione interna: Puzzle generati via AI per BrainLab      |  |
|  | Creato: 15/03/2026 | Modificato: 20/03/2026 da Luca          |  |
|  |                                                                |  |
|  | [Salva]  [Elimina Flag]                                        |  |
|  +----------------------------------------------------------------+  |
|                                                                      |
|  [+ Nuovo Feature Flag]                                              |
+----------------------------------------------------------------------+
```

### 12.3 — Configurazione Notifiche (`/admin/settings/notifications`)

```
+----------------------------------------------------------------------+
|  Admin > Impostazioni > Notifiche                                    |
+----------------------------------------------------------------------+
|                                                                      |
|  +-- EMAIL TEMPLATES --------------------------------------------+  |
|  |                                                                |  |
|  |  +--------------------------+--------+--------------------+   |  |
|  |  | Template                 | Attivo | Ultimo invio       |   |  |
|  |  +--------------------------+--------+--------------------+   |  |
|  |  | Welcome Email            | ON     | 25/03/26           |   |  |
|  |  | Streak a rischio (2gg)   | ON     | 26/03/26           |   |  |
|  |  | Streak perso             | ON     | 26/03/26           |   |  |
|  |  | Nuovo gioco disponibile  | OFF    | --                 |   |  |
|  |  | Offerta Premium          | ON     | 24/03/26           |   |  |
|  |  | Rinnovo in scadenza      | ON     | 22/03/26           |   |  |
|  |  | Win-back (inattivo 14gg) | OFF    | --                 |   |  |
|  |  +--------------------------+--------+--------------------+   |  |
|  |                                                                |  |
|  |  Click su template per modificare:                             |  |
|  |  - Oggetto email                                               |  |
|  |  - Corpo (editor WYSIWYG con variabili: {{username}},         |  |
|  |    {{streak_count}}, {{game_title}}, etc.)                     |  |
|  |  - Trigger (quando viene inviata)                              |  |
|  |  - Test: invia email di prova al proprio indirizzo             |  |
|  |                                                                |  |
|  +----------------------------------------------------------------+  |
|                                                                      |
|  +-- TRIGGER NOTIFICHE ------------------------------------------+  |
|  |                                                                |  |
|  |  Streak a rischio dopo:     [2  ] giorni di inattivita        |  |
|  |  Win-back email dopo:       [14 ] giorni di inattivita        |  |
|  |  Offerta Premium dopo:      [7  ] giorni dalla registrazione  |  |
|  |  Reminder rinnovo:          [3  ] giorni prima della scadenza |  |
|  |                                                                |  |
|  |  Orario invio email:        [09:00] (timezone utente)         |  |
|  |  Max email/utente/settimana: [3  ]                            |  |
|  |                                                                |  |
|  +----------------------------------------------------------------+  |
|                                                                      |
|  [Salva Modifiche]                                                   |
+----------------------------------------------------------------------+
```

### 12.4 — Manutenzione (`/admin/settings/maintenance`)

```
+----------------------------------------------------------------------+
|  Admin > Impostazioni > Manutenzione                                 |
+----------------------------------------------------------------------+
|                                                                      |
|  +-- MODALITA MANUTENZIONE --------------------------------------+  |
|  |                                                                |  |
|  |  Stato attuale: Operativo                                     |  |
|  |                                                                |  |
|  |  [Attiva Manutenzione]                                        |  |
|  |                                                                |  |
|  |  Se attivata:                                                  |  |
|  |  Messaggio utenti: [Gameflix e in manutenzione. Torniamo...]   |  |
|  |  Durata stimata:   [30 ] minuti                                |  |
|  |  Schedulata:        ( ) Adesso  ( ) Programma: [data] [ora]   |  |
|  |  Permetti accesso admin: [x]                                   |  |
|  |                                                                |  |
|  |  [!] Attenzione: attivare la manutenzione interrompera tutte  |  |
|  |  le sessioni di gioco attive. Gli utenti vedranno il banner.  |  |
|  |                                                                |  |
|  +----------------------------------------------------------------+  |
|                                                                      |
|  +-- BACKUP E DATI ----------------------------------------------+  |
|  |                                                                |  |
|  |  Ultimo backup automatico: 26/03/2026 03:00                   |  |
|  |  Frequenza: Ogni 24 ore                                        |  |
|  |  Retention: 30 giorni                                          |  |
|  |                                                                |  |
|  |  [Esegui Backup Manuale]                                       |  |
|  |  [Esporta Tutti i Dati (GDPR)]                                |  |
|  |                                                                |  |
|  +----------------------------------------------------------------+  |
|                                                                      |
|  +-- INFORMAZIONI SISTEMA ----------------------------------------+  |
|  |                                                                |  |
|  |  Versione app:     v1.2.3                                      |  |
|  |  Ultimo deploy:    26/03/2026 14:30                            |  |
|  |  Ambiente:         Production                                  |  |
|  |  Database:         PostgreSQL 16 -- 2.3 GB usati              |  |
|  |  Storage (S3):     1.2 GB usati                                |  |
|  |  Uptime:           99.8% (ultimi 30 giorni)                    |  |
|  |                                                                |  |
|  +----------------------------------------------------------------+  |
+----------------------------------------------------------------------+
```

### 12.5 — API Endpoints Impostazioni

```
# Piani
GET    /api/admin/settings/plans
PATCH  /api/admin/settings/plans/:planId
POST   /api/admin/settings/plans/sync-stripe      # Sincronizza con Stripe

# Feature Flags
GET    /api/admin/settings/features
POST   /api/admin/settings/features
PATCH  /api/admin/settings/features/:flagId
DELETE /api/admin/settings/features/:flagId

# Notifiche
GET    /api/admin/settings/notifications/templates
PATCH  /api/admin/settings/notifications/templates/:templateId
POST   /api/admin/settings/notifications/templates/:templateId/test    # Invia email di prova
PATCH  /api/admin/settings/notifications/triggers

# Manutenzione
GET    /api/admin/settings/maintenance
POST   /api/admin/settings/maintenance/activate
POST   /api/admin/settings/maintenance/deactivate

# Sistema
GET    /api/admin/settings/system-info
POST   /api/admin/settings/backup
POST   /api/admin/settings/export-all-data
```

### 12.6 — Permessi Impostazioni

Tutte le impostazioni sono riservate al **SUPER_ADMIN**. Nessun altro ruolo ha accesso a questa sezione.

### 12.7 — Priorita MVP

| Elemento | Priorita |
|---|---|
| Configurazione piani (limiti free vs premium) | **MVP** |
| Sync prezzi con Stripe | **MVP** |
| Feature flags base (on/off) | **MVP** |
| Modalita manutenzione | **MVP** |
| Info sistema | **MVP** |
| Template email (editor) | **v1.1** |
| Trigger notifiche configurabili | **v1.1** |
| Feature flags con rollout percentuale | **v1.2** |
| Backup manuale | **v1.2** |
| Export GDPR | **v1.2** |

---

## 13. PRIORITA MVP E ROADMAP

### 13.1 — Riepilogo Priorita per Release

#### MVP (Lancio)
Il minimo necessario per operare la piattaforma quotidianamente.

```
Dashboard:
  - KPI Cards (DAU, MAU, Registrazioni, MRR, Churn, Partite, Streak)
  - Alert content pipeline
  - Grafici DAU e MRR
  - Quick actions

Giochi:
  - Lista con filtri, ricerca, paginazione
  - Form creazione completo
  - Upload thumbnail
  - Cambio stato (Bozza -> Pubblicato)
  - Dettaglio con stats base

Serie:
  - Lista serie
  - Form creazione
  - Aggiunta episodi

Releases:
  - Calendario settimanale
  - Form scheduling
  - Buffer indicator

Daily:
  - Calendario per mondo
  - Buffer status
  - Upload manuale
  - Override daily

Utenti:
  - Lista con ricerca e filtri
  - Dettaglio con stats
  - Cronologia pagamenti
  - Ban e reset password

Badge:
  - Lista con stats
  - Form creazione (counter, streak)
  - Attiva/disattiva
  - Upload icona

Analytics:
  - Retention cohort base
  - Revenue (MRR, ARPU, trend)
  - Funnel conversione base

Moderazione:
  - Coda segnalazioni
  - Azioni (ignora, warn, ban)
  - Log

Impostazioni:
  - Piani e limiti
  - Sync Stripe
  - Feature flags (on/off)
  - Manutenzione
  - Info sistema
```

#### v1.1 (Settimana 2-4 post-lancio)
Miglioramenti operativi e analytics.

```
  - Scheduling pubblicazione con data/ora
  - JSON editor per config giochi
  - Grafico utilizzo giochi nel tempo
  - Drag-and-drop releases
  - Quick Schedule
  - Vista calendario mensile
  - Generazione automatica puzzle
  - Form manuale quiz
  - Preview daily
  - Gift premium
  - Modifica ruolo utenti
  - Export CSV utenti
  - Builder visuale condizioni badge
  - Preview badge
  - Content performance analytics
  - Churn per coorte
  - MRR breakdown
  - Export analytics
  - Pattern matching username
  - Giochi rating basso in moderazione
  - Template email editor
  - Trigger notifiche
  - Retention D1/D7/D14/D30 grafici
  - Distribuzione per Mondo
  - Top 5 giochi
  - Riordinamento episodi drag-and-drop
```

#### v1.2 (Mese 2)
Ottimizzazione e feature avanzate.

```
  - Distribuzione punteggi per gioco
  - Classifica nel dettaglio gioco
  - Bulk actions giochi
  - Log modifiche visuale
  - Banner upload
  - Retention serie (inter-episodio)
  - Cadenza pubblicazione automatica serie
  - Notifiche push/email al rilascio
  - Featured release in home
  - Pattern difficolta automatico daily
  - Upload CSV bulk daily
  - Attivita recente utenti
  - Condizioni badge composite (AND/OR)
  - Simulazione condizioni badge
  - Trigger conversione analytics
  - Insight automatici analytics
  - LTV calculation
  - Statistiche moderazione
  - Feature flags rollout percentuale
  - Backup manuale
  - Export GDPR
  - Alert rating basso dashboard
  - Alert churn utenti dashboard
```

#### v1.3 (Mese 3+)
Feature nice-to-have.

```
  - Preview gioco in admin
  - Difficolta progressiva automatica serie
  - Segmenti utenti salvabili
  - Storico assegnazioni badge nel tempo
  - A/B testing integrato
  - Dashboard personalizzabile (widget drag-and-drop)
```

### 13.2 — Stima Effort Sviluppo MVP

| Sezione | Giorni dev stimati | Note |
|---|---|---|
| Admin Shell (layout, auth, sidebar) | 2 | shadcn/ui + middleware auth |
| Dashboard | 3 | KPI + 2 grafici + alerts |
| Gestione Giochi | 5 | CRUD completo + upload + form |
| Gestione Serie | 3 | CRUD + gestione episodi |
| Content Scheduler | 4 | Calendario + scheduling |
| Daily Content | 4 | Calendario + upload + buffer |
| Gestione Utenti | 4 | Lista + dettaglio + azioni |
| Gestione Badge | 3 | CRUD + condizioni base |
| Analytics | 5 | 3 tab con grafici e tabelle |
| Moderazione | 2 | Coda + azioni base |
| Impostazioni | 3 | Piani + flags + manutenzione |
| **TOTALE MVP** | **38 giorni** | ~8 settimane con 1 dev full-time |

### 13.3 — Schema Database Admin-Specific

```sql
-- Tabelle specifiche per l'area admin (oltre alle tabelle core dell'app)

-- Audit log delle azioni admin
CREATE TABLE admin_audit_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id   UUID NOT NULL REFERENCES users(id),
  action          VARCHAR(100) NOT NULL,
  entity_type     VARCHAR(50) NOT NULL,
  entity_id       UUID,
  changes         JSONB,
  ip_address      INET,
  user_agent      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_audit_admin ON admin_audit_log(admin_user_id, created_at DESC);
CREATE INDEX idx_audit_entity ON admin_audit_log(entity_type, entity_id, created_at DESC);

-- Feature flags
CREATE TABLE feature_flags (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key             VARCHAR(100) UNIQUE NOT NULL,
  name            VARCHAR(200) NOT NULL,
  description     TEXT,
  status          VARCHAR(20) NOT NULL DEFAULT 'off',  -- 'on', 'off', 'beta'
  rollout_pct     INT DEFAULT 0,                       -- 0-100 per beta
  target_type     VARCHAR(20) DEFAULT 'all',           -- 'all', 'percentage', 'user_list'
  target_users    UUID[],                              -- per target_type = 'user_list'
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Segnalazioni moderazione
CREATE TABLE moderation_reports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type            VARCHAR(50) NOT NULL,                -- 'username', 'behavior'
  target_user_id  UUID NOT NULL REFERENCES users(id),
  reported_by     UUID REFERENCES users(id),           -- NULL se sistema
  reason          TEXT NOT NULL,
  status          VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'resolved'
  resolution      VARCHAR(50),                         -- 'ignored', 'warned', 'banned'
  resolved_by     UUID REFERENCES users(id),
  resolved_at     TIMESTAMPTZ,
  note            TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_mod_status ON moderation_reports(status, created_at DESC);

-- Scheduled releases
CREATE TABLE scheduled_releases (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id         UUID NOT NULL REFERENCES games(id),
  scheduled_at    TIMESTAMPTZ NOT NULL,
  featured        BOOLEAN DEFAULT false,
  announcement    TEXT,
  notify_push     BOOLEAN DEFAULT false,
  notify_email    BOOLEAN DEFAULT false,
  status          VARCHAR(20) NOT NULL DEFAULT 'scheduled', -- 'scheduled', 'published', 'cancelled'
  published_at    TIMESTAMPTZ,
  created_by      UUID NOT NULL REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_releases_date ON scheduled_releases(scheduled_at, status);

-- Daily content buffer
CREATE TABLE daily_content (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world           VARCHAR(20) NOT NULL,
  game_type       VARCHAR(50) NOT NULL,
  date            DATE,                                -- NULL se nel buffer (non schedulato)
  difficulty      INT NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
  configuration   JSONB NOT NULL,
  status          VARCHAR(20) NOT NULL DEFAULT 'draft', -- 'draft', 'scheduled', 'published'
  generated_by    VARCHAR(20) DEFAULT 'manual',        -- 'manual', 'auto', 'ai'
  reviewed_by     UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX idx_daily_world_date ON daily_content(world, date) WHERE date IS NOT NULL;
CREATE INDEX idx_daily_buffer ON daily_content(world, status) WHERE date IS NULL;

-- Notification templates
CREATE TABLE notification_templates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key             VARCHAR(100) UNIQUE NOT NULL,
  name            VARCHAR(200) NOT NULL,
  subject         TEXT NOT NULL,
  body_html       TEXT NOT NULL,
  trigger_event   VARCHAR(100) NOT NULL,
  is_active       BOOLEAN DEFAULT true,
  variables       JSONB,                               -- lista variabili disponibili
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Platform settings (key-value)
CREATE TABLE platform_settings (
  key             VARCHAR(100) PRIMARY KEY,
  value           JSONB NOT NULL,
  description     TEXT,
  updated_by      UUID REFERENCES users(id),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

Questo documento costituisce la blueprint completa dell'Area Admin di Gameflix. Ogni sezione e stata definita con layout, componenti, API, permessi e priorita di implementazione. Il documento serve come riferimento per lo sviluppo e puo essere usato direttamente come specifica tecnica dal team di sviluppo.
