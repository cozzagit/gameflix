# GAMEFLIX -- Product Blueprint UX/UI

## Documento di Riferimento per lo Sviluppo della Piattaforma

---

# 1. STRUTTURA PIATTAFORMA -- Navigazione e Layout

---

## 1.1 Layout Shell Globale

L'architettura della shell segue il pattern "app shell" con tre varianti responsive. L'obiettivo e' garantire che il contenuto di gioco occupi sempre il massimo spazio disponibile, mentre la navigazione resti accessibile senza essere invasiva.

### Desktop (>= 1280px)

```
+----------------------------------------------------------------------+
|  TOP BAR (h: 64px, fixed top, z-50)                                  |
|  [Logo]  [Search]           [Streak] [XP Bar] [Bell] [Avatar v]     |
+----------------+-----------------------------------------------------+
|  SIDEBAR       |  MAIN CONTENT AREA                                  |
|  (w: 260px)    |  (flex-grow, scroll-y)                              |
|  (fixed left)  |                                                     |
|                |  +---------------------------------------------+    |
|  [Nav Items]   |  |                                             |    |
|  [Mondi]       |  |    Page Content                             |    |
|  [Filtri]      |  |    (max-w: 1200px, mx-auto)                |    |
|  [Trending]    |  |                                             |    |
|                |  |                                             |    |
|                |  +---------------------------------------------+    |
|                |                                                     |
|                |  +---------------------------------------------+    |
|                |  |  FOOTER (statico, in-flow)                  |    |
|                |  +---------------------------------------------+    |
+----------------+-----------------------------------------------------+
|  (nessuna bottom bar su desktop)                                     |
+----------------------------------------------------------------------+
```

### Tablet (768px -- 1279px)

```
+----------------------------------------------------------------------+
|  TOP BAR (h: 56px, fixed top)                                        |
|  [hamburger] [Logo]        [streak] [Bell] [Avatar]                  |
+----------------------------------------------------------------------+
|  MAIN CONTENT AREA (full width, scroll-y)                            |
|                                                                      |
|  +----------------------------------------------------------+       |
|  |  Page Content (px: 24px)                                  |       |
|  +----------------------------------------------------------+       |
|                                                                      |
|  FOOTER (in-flow)                                                    |
+----------------------------------------------------------------------+
|  BOTTOM NAV (h: 56px, fixed bottom, 5 icone)                        |
|  [Home] [Esplora] [Daily] [Classifica] [Profilo]                    |
+----------------------------------------------------------------------+

SIDEBAR -> Drawer overlay da sinistra (triggered da hamburger)
           Backdrop semi-trasparente, swipe-to-close
```

### Mobile (< 768px)

```
+----------------------------------+
|  TOP BAR (h: 48px, fixed top)    |
|  [hamburger] [Logo]  [streak] [Bell] |
+----------------------------------+
|  MAIN CONTENT (full width)       |
|  (padding: 16px)                 |
|                                  |
|  Page Content                    |
|  (scroll-y, safe-area-inset)     |
|                                  |
|  FOOTER (in-flow, compatto)      |
+----------------------------------+
|  BOTTOM NAV (h: 56px + safe)     |
|  [Home] [Esplora] [Daily] [Class.] [Tu] |
+----------------------------------+

SIDEBAR -> Drawer full-width overlay
SEARCH -> Pagina dedicata /search (non inline)
```

---

## 1.2 Top Bar -- Componente `<TopBar />`

### Props e Struttura

```
TopBar
|-- LogoLink                -> click -> /
|-- SearchBar (desktop)     -> click -> focus input / (mobile) -> /search
|-- StreakCounter            -> display streak corrente
|-- XPBar (desktop/tablet)  -> mini progress bar livello corrente
|-- NotificationBell        -> click -> dropdown notifiche
|-- UserMenu                -> click -> dropdown profilo
+-- HamburgerButton (mobile/tablet) -> click -> apre sidebar drawer
```

### Componente `<StreakCounter />`

```typescript
interface StreakCounterProps {
  currentStreak: number;        // giorni consecutivi
  isActiveToday: boolean;       // ha giocato oggi
  streakAtRisk: boolean;        // non ha giocato oggi E sono > le 18:00
}
```

**Stati visivi:**
- `isActiveToday = true` -> fiamma arancione piena, numero in grassetto, lieve glow
- `isActiveToday = false, streakAtRisk = false` -> fiamma grigia, numero visibile
- `isActiveToday = false, streakAtRisk = true` -> fiamma rossa pulsante, tooltip "Gioca ora per non perdere la streak!"
- `currentStreak = 0` -> fiamma spenta, nessun numero (solo icona neutra)
- Al raggiungimento di milestone (7, 30, 100, 365) -> animazione celebrativa con particelle

**Interazione:** click/tap apre un tooltip/popover che mostra:
- Streak attuale e record personale
- Calendario mini degli ultimi 7 giorni (pallini verdi/grigi)
- Messaggio motivazionale contestuale

### Componente `<XPBar />`

```typescript
interface XPBarProps {
  currentXP: number;
  xpForCurrentLevel: number;   // XP accumulati nel livello corrente
  xpToNextLevel: number;       // XP totali richiesti per il prossimo livello
  level: number;
}
```

**Layout (desktop):** barra orizzontale sottile (h: 6px, w: 120px) con badge livello a sinistra.
**Tablet:** solo badge livello numerico, no barra.
**Mobile:** nascosto dalla top bar, visibile nel drawer profilo.

**Interazione:** click apre un popover con dettagli XP, prossimo livello, e prossimi badge sbloccabili.

### Componente `<NotificationBell />`

```typescript
interface NotificationBellProps {
  unreadCount: number;         // badge rosso con numero
  notifications: Notification[];
}

interface Notification {
  id: string;
  type: 'achievement' | 'leaderboard' | 'newRelease' | 'streak' | 'social' | 'system';
  title: string;
  body: string;
  iconUrl?: string;
  actionUrl: string;
  read: boolean;
  createdAt: string;           // ISO datetime
}
```

**Dropdown notifiche (desktop):** pannello (w: 380px, max-h: 480px, scroll-y) con lista notifiche raggruppate per oggi/ieri/precedenti. Ogni notifica ha icona tipo, testo, timestamp relativo, e indicatore non letta (pallino blu). In fondo: link "Vedi tutte" che porta a /notifications.

**Mobile:** il bell naviga a pagina /notifications (full page).

**Badge contatore:** cerchio rosso con numero bianco, max "9+". Se 0, nessun badge.

### Componente `<UserMenu />`

**Stato autenticato -- dropdown:**
```
+-------------------------+
|  [Avatar] NomeUtente    |
|  @username              |
|  Livello 12 - Premium   |
|-------------------------|
|  Il mio profilo         |  -> /profile/:username
|  Impostazioni           |  -> /settings
|  Le mie stats           |  -> /profile/:username/stats
|  I miei badge           |  -> /profile/:username/badges
|-------------------------|
|  Passa a Premium        |  -> /pricing (solo se free)
|-------------------------|
|  Esci                   |
+-------------------------+
```

**Stato non autenticato:** al posto di avatar e dropdown, due bottoni:
- "Accedi" (ghost/outline) -> apre modal login
- "Registrati" (primary/filled) -> apre modal registrazione

---

## 1.3 Sidebar -- Componente `<Sidebar />`

### Struttura Contenuti

```
SIDEBAR (w: 260px, bg: surface, border-right)
|
|-- SEZIONE: Navigazione principale
|   |-- Home                       -> /
|   |-- Esplora                    -> /explore
|   |-- Sfide di oggi              -> /daily        (badge: "3" se non completate)
|   |-- Classifiche                -> /leaderboard
|   +-- Calendario uscite          -> /releases
|
|-- DIVIDER
|
|-- SEZIONE: I Mondi (label "I MONDI" uppercase, 11px, letter-spacing)
|   |-- BrainLab                   -> /worlds/brainlab
|   |    (sottotitolo: "Logica e ragionamento")
|   |-- WordForge                  -> /worlds/wordforge
|   |    (sottotitolo: "Parole e linguaggio")
|   +-- QuizArena                  -> /worlds/quizarena
|        (sottotitolo: "Quiz e cultura")
|
|-- DIVIDER
|
|-- SEZIONE: Per te (solo se autenticato)
|   |-- Continua a giocare         -> ultimo gioco
|   |-- Le tue serie               -> /series/following
|   +-- Preferiti                   -> /favorites
|
|-- DIVIDER
|
|-- SEZIONE: Trending
|   |-- 1. Sudoku Master           -> /games/sudoku-master
|   |-- 2. Word Chain              -> /games/word-chain
|   +-- 3. Quiz Lampo              -> /games/quiz-lampo
|   +-- Vedi tutti ->              -> /explore?sort=trending
|
|-- SPACER (flex-grow)
|
|-- SEZIONE: Footer sidebar
|   |-- [Passa a Premium]          (card colorata, solo free)
|   |    "Giochi illimitati, zero ads"
|   |    [Scopri ->]               -> /pricing
|   +-- [Tema scuro/chiaro]        (toggle dark/light mode)
|
+-- BOTTOM
    |-- Versione app: v1.0.0
    +-- [Feedback] [Help]
```

### Comportamento Sidebar

**Desktop:** sempre visibile, posizione fixed left. Scroll interno indipendente dal contenuto principale. Possibilita' di collapse a w: 72px (solo icone) con bottone chevron. Stato collapse salvato in localStorage.

**Sidebar collapsed (desktop):**
```
+--------+
| [Logo] |
|  Home  |  tooltip "Home" on hover
|  Espl  |  tooltip "Esplora" on hover
|  Daily |  (con badge "3")
|  Class |
|  Cal   |
|--------|
|  BL    |  tooltip "BrainLab" on hover
|  WF    |
|  QA    |
|--------|
|  Cont  |
|  Serie |
|  Fav   |
|        |
|  PRO   |  (icona premium)
|  Tema  |
+--------+
```

**Tablet/Mobile -- Drawer:** overlay da sinistra con backdrop scuro (opacity 0.5). Animazione slide-in 250ms ease-out. Chiusura con: click su backdrop, swipe left, bottone X, o navigazione a qualsiasi link. Il drawer contiene la stessa struttura della sidebar desktop non collapsed.

### Differenze Free vs Premium nella Sidebar

| Elemento | Free | Premium |
|----------|------|---------|
| Card "Passa a Premium" | Visibile, prominente | Nascosta |
| Badge "PRO" accanto al nome | Assente | Presente, colore oro |
| Sezione Trending | Identica | Identica |
| Voce "Sfide di oggi" badge | "3" (sfide rimanenti) | "3" (sfide rimanenti) |

---

## 1.4 Bottom Navigation Bar (Mobile/Tablet) -- `<BottomNav />`

```typescript
interface BottomNavItem {
  icon: ReactNode;
  label: string;
  href: string;
  badge?: number | 'dot';
  isActive: boolean;
}
```

**Voci:**
```
[Home] [Esplora] [Daily] [Classifiche] [Tu]
  /      /explore   /daily  /leaderboard  /profile/me
```

**Comportamento:**
- L'icona attiva ha colore primario (brand color) e label visibile.
- Le icone inattive sono in grigio, label visibile su tablet, nascosta su mobile (solo icone).
- Badge numerico su "Daily" se ci sono sfide non completate.
- Badge "dot" rosso su "Tu" se ci sono notifiche non lette.
- La barra si nasconde con scroll-down durante il gameplay (dentro /play/*) per massimizzare lo spazio. Riappare con scroll-up o tap sulla zona safe-area.
- Rispetta safe-area-inset-bottom per dispositivi con notch/barra gesti.

**Stato non autenticato:** la voce "Tu" diventa "Accedi" con icona login e porta alla modal di accesso.

---

## 1.5 Footer -- Componente `<Footer />`

Il footer e' in-flow (non fixed), appare dopo il contenuto della pagina. Non e' visibile durante il gameplay (/play/*).

### Layout Desktop (3 colonne + riga copyright)

```
+----------------------------------------------------------------------+
|                         FOOTER                                       |
|                                                                      |
|  GAMEFLIX                  PIATTAFORMA          SUPPORTO              |
|  Gioca, sfida, migliora.  Esplora              Centro assistenza     |
|                           Mondi                FAQ                    |
|  [App Store badge]        Classifiche          Contattaci             |
|  [Google Play badge]      Calendario uscite    Community              |
|  (fase futura)            Prezzi               Bug report             |
|                                                                      |
|  LEGALE                   SOCIAL               LINGUA                 |
|  Privacy Policy           Twitter/X            [Italiano v]           |
|  Termini di Servizio      Instagram                                   |
|  Cookie Policy            Discord                                     |
|  Gestisci preferenze      TikTok                                      |
|                                                                      |
|----------------------------------------------------------------------|
|  (c) 2026 Gameflix Srl -- P.IVA 12345678901 -- Tutti i diritti riservati |
+----------------------------------------------------------------------+
```

### Layout Mobile (accordion/stacked)

Ogni sezione e' un accordion collassabile. Solo i link essenziali sono visibili: Privacy, Termini, social icons, copyright.

---

## 1.6 Sistema Overlay/Modal

### Architettura Modale

Tutte le modali usano un componente `<Modal />` centralizzato con le seguenti varianti:

```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  size: 'sm' | 'md' | 'lg' | 'xl' | 'fullscreen';
  closeOnBackdrop: boolean;        // default true
  closeOnEscape: boolean;          // default true
  showCloseButton: boolean;        // default true
  preventScroll: boolean;          // default true, blocca scroll body
  className?: string;
}
```

**Dimensioni:**
- `sm`: max-w 400px (conferme, alert)
- `md`: max-w 540px (login, registrazione, achievement)
- `lg`: max-w 720px (dettaglio gioco, upgrade)
- `xl`: max-w 960px (tutorial, onboarding)
- `fullscreen`: 100vw x 100vh (gameplay su mobile, onboarding)

**Su mobile:** tutte le modali tranne `sm` diventano bottom-sheet (slide-up dal basso, con handle per drag-to-dismiss). Le `sm` restano centrate.

### Modali Specifiche

**1. Modal Login / Registrazione -- `<AuthModal />`**

```
+--------------------------------------+
|                                  [X] |
|         [Logo Gameflix]              |
|                                      |
|  Tab: [Accedi] [Registrati]          |
|                                      |
|  -- Accedi --                        |
|  Email      [________________]       |
|  Password   [________________] [eye] |
|  [_ Ricordami]   [Password dimenticata?]|
|                                      |
|  [   Accedi   ] (primary, full-w)    |
|                                      |
|  --- oppure ---                      |
|  [G] Continua con Google             |
|  [f] Continua con Facebook           |
|  [Apple] Continua con Apple          |
|                                      |
|  Non hai un account? Registrati      |
+--------------------------------------+
```

La tab "Registrati" mostra: username, email, password, conferma password, checkbox termini, bottone registrati, oppure OAuth.

**2. Modal Upgrade Premium -- `<UpgradeModal />`**

Trigger: click su contenuto bloccato, raggiungimento limite 3 giochi/giorno, click su "Passa a Premium" ovunque.

```
+------------------------------------------+
|                                      [X] |
|          Passa a Premium                 |
|                                          |
|  +------------------------------------+  |
|  |  FREE (attuale)  |  PREMIUM       |  |
|  |                  |  4,99 EUR/mese  |  |
|  |  v 3 giochi/g   |  v Illimitato   |  |
|  |  v 1 daily/mondo |  v Tutto        |  |
|  |  x Con pubblicita|  v Zero ads     |  |
|  |  x No accesso    |  v Accesso      |  |
|  |    anticipato    |    anticipato    |  |
|  +------------------------------------+  |
|                                          |
|  [  Prova gratis 7 giorni  ] (primary)   |
|  Poi 4,99 EUR/mese. Cancella quando vuoi.|
|                                          |
|  "Da quando ho Premium gioco ogni        |
|     giorno senza limiti" -- @user123     |
+------------------------------------------+
```

**Logica di trigger contestuale:**
- Se triggerata dal limite giochi: "Hai esaurito i 3 giochi gratuiti di oggi. Passa a Premium per giocare senza limiti."
- Se triggerata da contenuto bloccato: "Questo [gioco/episodio] e' riservato agli utenti Premium."
- Se triggerata da ads: "Stanco delle pubblicita'? Con Premium giochi senza interruzioni."

**3. Modal Achievement -- `<AchievementModal />`**

```
+--------------------------------------+
|                                      |
|         Congratulazioni!             |
|                                      |
|         [Badge animato 96x96]        |
|                                      |
|     "Maratoneta delle Parole"        |
|   Completa 50 giochi in WordForge    |
|                                      |
|          +250 XP guadagnati          |
|                                      |
|  [  Condividi  ] [  Continua  ]      |
+--------------------------------------+
```

Appare automaticamente, animazione scale-in con confetti. Si chiude dopo 5 secondi o al click su "Continua". Il bottone "Condividi" apre il native share o copia un link.

**4. Modal Paywall Soft -- `<PaywallModal />`**

Appare quando l'utente free tenta di giocare il 4o gioco del giorno.

```
+--------------------------------------+
|                                      |
|    Hai raggiunto il limite           |
|       giornaliero                    |
|                                      |
|  Hai giocato 3/3 giochi oggi.        |
|  Torna domani oppure...              |
|                                      |
|  [Passa a Premium -- 4,99 EUR/mese]  |
|                                      |
|  Oppure guarda un annuncio per       |
|  sbloccare 1 gioco extra:            |
|  [> Guarda annuncio (30s)]           |
|                                      |
|  [Torna domani]  (link grigio)       |
+--------------------------------------+
```

---

## 1.7 Stato Autenticato vs Non Autenticato

### Differenze Globali

| Elemento | Non Autenticato | Autenticato |
|----------|----------------|-------------|
| Top Bar destra | [Accedi] [Registrati] | [Streak] [XP] [Bell] [Avatar] |
| Sidebar "Per te" | Nascosta | Visibile |
| Sidebar Trending | Visibile (uguale) | Visibile (uguale) |
| Bottom Nav "Tu" | "Accedi" (-> auth modal) | "Tu" (-> /profile/me) |
| Homepage | Landing page pubblica | Dashboard personalizzata |
| Gioco /play/* | Giocabile ma punteggio non salvato, banner "Registrati per salvare" | Punteggio salvato, XP guadagnati |
| Classifiche | Visibili in read-only, "Registrati per partecipare" | Partecipazione attiva |
| Daily challenges | Giocabili ma no streak/XP | Streak e XP tracciati |

### Differenze Free vs Premium (Autenticato)

| Elemento | Free | Premium |
|----------|------|---------|
| Limite giochi/giorno | 3 (counter visibile "2/3 rimasti") | Illimitato (nessun counter) |
| Pubblicita' | Banner tra sezioni, interstitial post-gioco | Nessuna |
| Badge profilo | Nessun badge piano | Badge "PRO" dorato |
| Giochi nuovi (mercoledi') | Disponibili da mercoledi' | Accesso anticipato da martedi' (24h prima) |
| Episodi serie | 1 episodio gratis, poi lock | Tutti sbloccati |
| Temi/personalizzazione | Tema base | Temi esclusivi, avatar premium |
| Sidebar | Card "Passa a Premium" | Nessuna card upsell |
| Header gioco nella griglia | Nessun lock | Nessun lock |
| Contenuto premium nella griglia | Icona lucchetto + overlay "PRO" | Nessun overlay |

**Indicatore visivo "PRO" nel catalogo:**
Sui giochi/episodi che richiedono Premium, appare un piccolo badge in alto a destra della card con sfondo dorato e testo "PRO". Per gli utenti premium questo badge non appare (tutti i contenuti sono uniformi).

---

## 1.8 Mappa Completa delle Rotte

```
ROTTE PUBBLICHE (accessibili senza autenticazione)
--------------------------------------------------
/                           -> Homepage (versione pubblica se non autenticato)
/explore                    -> Catalogo completo giochi
/explore?world=brainlab     -> Catalogo filtrato per mondo
/explore?sort=trending      -> Catalogo ordinato per trending
/explore?difficulty=easy    -> Catalogo filtrato per difficolta'
/worlds/brainlab            -> Pagina Mondo BrainLab
/worlds/wordforge           -> Pagina Mondo WordForge
/worlds/quizarena           -> Pagina Mondo QuizArena
/games/:slug                -> Pagina dettaglio gioco (info, regole, classifica)
/play/:slug                 -> Player gioco (giocabile, ma senza salvataggio se non auth)
/play/:slug/:episodeId      -> Player episodio serie
/daily                      -> Pagina sfide giornaliere
/leaderboard                -> Classifiche globali
/leaderboard?world=brainlab -> Classifiche per mondo
/leaderboard?game=:slug     -> Classifica per gioco specifico
/releases                   -> Calendario uscite
/pricing                    -> Piani e prezzi
/about                      -> Chi siamo
/help                       -> Centro assistenza
/help/:articleSlug          -> Articolo help specifico
/privacy                    -> Privacy policy
/terms                      -> Termini di servizio
/cookies                    -> Cookie policy

ROTTE AUTENTICATE (redirect a / con modal login se non autenticato)
-------------------------------------------------------------------
/profile/:username          -> Profilo pubblico utente
/profile/:username/stats    -> Statistiche dettagliate
/profile/:username/badges   -> Collezione badge
/profile/:username/history  -> Storico giochi
/settings                   -> Impostazioni account
/settings/account           -> Dati account (email, password)
/settings/subscription      -> Gestione abbonamento
/settings/notifications     -> Preferenze notifiche
/settings/privacy           -> Preferenze privacy
/settings/appearance        -> Tema, lingua
/notifications              -> Pagina notifiche (mobile)
/favorites                  -> Giochi preferiti
/series/following           -> Serie seguite
/search                     -> Pagina ricerca (mobile)

ROTTE ADMIN (richiede ruolo admin)
----------------------------------
/admin                      -> Dashboard admin
/admin/games                -> Gestione giochi
/admin/games/new            -> Creazione gioco
/admin/games/:id/edit       -> Modifica gioco
/admin/users                -> Gestione utenti
/admin/analytics            -> Analytics piattaforma
/admin/releases             -> Gestione calendario uscite
/admin/content              -> Gestione contenuti (banner, annunci)

ROTTE ONBOARDING
----------------
/onboarding                 -> Flusso onboarding post-registrazione
/onboarding/worlds          -> Scelta mondi preferiti
/onboarding/difficulty      -> Scelta difficolta' preferita
/onboarding/tutorial        -> Tutorial primo gioco

ROTTE AUTH (gestite da pagine dedicate o modali)
------------------------------------------------
/auth/login                 -> Pagina login (fallback se modal non funziona)
/auth/register              -> Pagina registrazione
/auth/forgot-password       -> Recupero password
/auth/reset-password/:token -> Reset password
/auth/verify-email/:token   -> Verifica email
/auth/callback/:provider    -> Callback OAuth (Google, Facebook, Apple)

ROTTE LEGALI/MARKETING
----------------------
/blog                       -> Blog (fase futura)
/blog/:slug                 -> Articolo blog
/invite/:code               -> Referral link
```

---

## 1.9 Sistema di Routing -- Logica Condizionale

```typescript
// Middleware di routing (Next.js middleware.ts)

// Pattern di protezione rotte:
const publicRoutes = ['/', '/explore', '/worlds/*', '/games/*', '/play/*',
  '/daily', '/leaderboard', '/releases', '/pricing', '/about', '/help/*',
  '/privacy', '/terms', '/cookies', '/auth/*', '/blog/*', '/invite/*'];

const authenticatedRoutes = ['/profile/*', '/settings/*', '/notifications',
  '/favorites', '/series/*', '/search'];

const adminRoutes = ['/admin/*'];

// Logica:
// 1. Se rotta pubblica -> accesso diretto
// 2. Se rotta autenticata + utente non auth -> redirect a / con ?redirect=originalUrl + apri modal login
// 3. Se rotta admin + utente non admin -> 404 (non 403, per non rivelare l'esistenza della rotta)
// 4. Se rotta /play/* + utente non auth -> accesso con banner "Registrati per salvare"
// 5. Se rotta /play/* + utente free + limite raggiunto -> modal paywall
```

---

---

# 2. HOMEPAGE

---

## 2.1 Homepage Autenticata -- Dashboard Personalizzata

L'homepage autenticata e' la "mission control" del giocatore. Deve rispondere in 3 secondi alla domanda: "cosa faccio oggi su Gameflix?" Il layout e' un feed verticale di sezioni, ciascuna con scroll orizzontale per le card dove applicabile.

### Wireframe Strutturale (Desktop)

```
+----------------------------------------------------------------------+
|  TOP BAR                                                             |
+------------+--------------------------------------------------------+
|  SIDEBAR   |                                                        |
|            |  +------------------------------------------------+    |
|            |  |  SEZIONE 1: Welcome Banner                     |    |
|            |  |  "Buongiorno, Luca!" + stats giornaliere       |    |
|            |  +------------------------------------------------+    |
|            |                                                        |
|            |  +------------------------------------------------+    |
|            |  |  SEZIONE 2: Le tue sfide di oggi               |    |
|            |  |  [Daily BrainLab] [Daily WordForge] [Daily QA] |    |
|            |  +------------------------------------------------+    |
|            |                                                        |
|            |  +------------------------------------------------+    |
|            |  |  SEZIONE 3: Continua a giocare                 |    |
|            |  +------------------------------------------------+    |
|            |                                                        |
|            |  +------------------------------------------------+    |
|            |  |  SEZIONE 4: Nuovo questa settimana             |    |
|            |  +------------------------------------------------+    |
|            |                                                        |
|            |  +------------------------------------------------+    |
|            |  |  SEZIONE 5: Prossimamente                      |    |
|            |  +------------------------------------------------+    |
|            |                                                        |
|            |  +------------------------------------------------+    |
|            |  |  SEZIONE 6: Trending                           |    |
|            |  |  [Card] [Card] [Card] [Card] ->                |    |
|            |  +------------------------------------------------+    |
|            |                                                        |
|            |  +------------------------------------------------+    |
|            |  |  SEZIONE 7: Le tue classifiche                 |    |
|            |  +------------------------------------------------+    |
|            |                                                        |
|            |  +------------------------------------------------+    |
|            |  |  SEZIONE 8: Serie in corso                     |    |
|            |  +------------------------------------------------+    |
|            |                                                        |
|            |  +------------------------------------------------+    |
|            |  |  SEZIONE 9: Consigliati per te                 |    |
|            |  |  [Card] [Card] [Card] [Card] ->                |    |
|            |  +------------------------------------------------+    |
|            |                                                        |
|            |  +------------------------------------------------+    |
|            |  |  SEZIONE 10: Community                         |    |
|            |  +------------------------------------------------+    |
|            |                                                        |
|            |  [FOOTER]                                              |
+------------+--------------------------------------------------------+
```

---

### SEZIONE 1: Welcome Banner -- `<WelcomeBanner />`

```typescript
interface WelcomeBannerProps {
  username: string;
  greeting: string;              // "Buongiorno" / "Buon pomeriggio" / "Buonasera"
  streak: number;
  dailiesCompleted: number;      // 0-3
  dailiesTodo: number;           // 3 - dailiesCompleted
  xpToday: number;
  gamesPlayedToday: number;
  isPremium: boolean;
  remainingFreeGames?: number;   // solo per free users (3 - gamesPlayedToday, min 0)
}
```

**Layout Desktop:**
```
+------------------------------------------------------------------+
|                                                                  |
|  Buongiorno, Luca!                                               |
|                                                                  |
|  +----------+  +----------+  +----------+  +------------------+ |
|  |  fire 12 |  |  bolt 0/3|  |  star 340|  |  pad 1 giocato   | |
|  |  giorni  |  |  Daily   |  |  XP oggi |  |  oggi            | |
|  |  streak  |  |  da fare |  |          |  |  (2/3 rimasti)   | |
|  +----------+  +----------+  +----------+  +------------------+ |
|                                                 ^ solo free     |
|                                                                  |
+------------------------------------------------------------------+
```

**Background:** gradiente leggero brand, differente per momento della giornata (caldo mattina, neutro pomeriggio, scuro sera). Il gradiente usa colori del tema corrente.

**Layout Mobile:** le 4 stat card diventano una riga scrollabile orizzontale con card compatte.

**Stato streak a rischio:** se `streak > 0` e `dailiesCompleted === 0` e ora > 18:00, il box streak pulsa con bordo rosso e mostra "Completa una sfida per mantenere la streak!".

**Differenze Free vs Premium:**
- Free: il 4o box mostra "X/3 rimasti" con barra di esaurimento. Quando 0/3 rimasti, sfondo rosso tenue e testo "Passa a Premium per continuare a giocare."
- Premium: il 4o box mostra solo "X giocati oggi" senza limite, sfondo neutro.

**API necessaria:**
```
GET /api/v1/users/me/daily-stats
Response: {
  data: {
    streak: number,
    dailiesCompleted: number,
    xpToday: number,
    gamesPlayedToday: number,
    remainingFreeGames: number | null,  // null se premium
    streakAtRisk: boolean
  }
}
```

---

### SEZIONE 2: Le tue sfide di oggi -- `<DailyChallenges />`

```typescript
interface DailyChallengeCardProps {
  worldSlug: string;            // 'brainlab' | 'wordforge' | 'quizarena'
  worldName: string;
  worldIcon: string;            // URL icona
  worldColor: string;           // colore tema mondo
  challengeTitle: string;       // es. "Sudoku del giorno"
  difficulty: 'facile' | 'medio' | 'difficile';
  status: 'not_started' | 'in_progress' | 'completed';
  score?: number;               // presente se completed
  bestScore?: number;           // miglior punteggio storico
  xpReward: number;
  timeEstimate: string;         // es. "~5 min"
  slug: string;                 // per URL /play/:slug
}
```

**Layout Desktop (3 card affiancate):**

```
Le tue sfide di oggi                                    [Vedi tutte ->]
Completa tutte e 3 per il bonus giornaliero (+100 XP)

+------------------+  +------------------+  +------------------+
|  BrainLab        |  |  WordForge       |  |  QuizArena       |
|  --------------- |  |  --------------- |  |  --------------- |
|                  |  |                  |  |                  |
|  Sudoku del      |  |  Anagramma       |  |  Quiz Lampo      |
|  giorno          |  |  del giorno      |  |  del giorno      |
|                  |  |                  |  |                  |
|  Difficolta':    |  |  Difficolta':    |  |  Difficolta':    |
|  ooX Medio       |  |  oXX Facile      |  |  ooo Difficile   |
|                  |  |                  |  |                  |
|  ~5 min - 50 XP  |  |  ~3 min - 30 XP  |  |  ~7 min - 70 XP  |
|                  |  |                  |  |                  |
|  [ > Gioca ]     |  |  [ > Gioca ]     |  |  [ > Gioca ]     |
+------------------+  +------------------+  +------------------+
```

**Stati della card:**

1. **not_started:** bordo sinistro colorato (colore mondo), bottone "Gioca" primario, sfondo neutro.
2. **in_progress:** bordo sinistro colorato + badge "In corso" giallo, bottone "Continua", sfondo lieve giallo.
3. **completed:** bordo sinistro verde, sfondo verde tenue, checkmark grande, punteggio mostrato, bottone "Vedi risultato". XP mostrati come "+50 XP guadagnati".

**Bonus completamento:** sopra le 3 card appare una progress bar "Completa tutte e 3 per il bonus giornaliero (+100 XP)". La barra si riempie (0%, 33%, 66%, 100%). Al 100%, animazione celebrativa e popup "+100 XP Bonus!".

```
Bonus giornaliero: [========----] 2/3 completate - Manca 1!
```

**Layout Mobile:** le 3 card diventano uno stack verticale, ciascuna a full-width con altezza ridotta (layout orizzontale: icona mondo a sinistra, info al centro, bottone a destra).

```
+-----------------------------------------+
|  BrainLab  Sudoku del giorno            |
|      ooX Medio - ~5 min     [ Gioca ]   |
+-----------------------------------------+
+-----------------------------------------+
|  WordForge  Anagramma del giorno  v 850 |
|      oXX Facile - Completato            |
+-----------------------------------------+
+-----------------------------------------+
|  QuizArena  Quiz Lampo del giorno       |
|      ooo Difficile - ~7 min  [ Gioca ]  |
+-----------------------------------------+
```

**API necessaria:**
```
GET /api/v1/daily-challenges?date=2026-03-26
Response: {
  data: {
    challenges: DailyChallenge[],
    bonusXP: number,
    allCompleted: boolean,
    completedCount: number
  }
}
```

---

### SEZIONE 3: Continua a giocare -- `<ContinuePlaying />`

Mostra gli ultimi giochi non completati o quelli in cui l'utente ha una sessione interrotta. Massimo 4 card, ordinate per ultimo accesso (piu' recente prima).

```typescript
interface ContinuePlayingCardProps {
  gameSlug: string;
  gameTitle: string;
  worldSlug: string;
  worldName: string;
  thumbnailUrl: string;
  lastPlayedAt: string;         // "2 ore fa", "ieri"
  progress: number;             // 0-100 percentuale completamento
  isSeries: boolean;
  episodeNumber?: number;
  episodeTitle?: string;
}
```

**Layout Desktop:**

```
Continua a giocare

+----------------------+  +----------------------+  +------------------+
|  [Thumbnail 16:9]    |  |  [Thumbnail 16:9]    |  |  [Thumbnail 16:9]|
|  ------------------- |  |  ------------------- |  |  --------------- |
|  Sudoku Master       |  |  Word Chain S1E3     |  |  Quiz Europa     |
|  BrainLab            |  |  WordForge           |  |  QuizArena       |
|  ========-- 78%      |  |  ======---- 55%      |  |  ==-------- 20%  |
|  Giocato 2 ore fa    |  |  Giocato ieri        |  |  Giocato 3gg fa  |
|  [ > Continua ]      |  |  [ > Continua ]      |  |  [ > Continua ]  |
+----------------------+  +----------------------+  +------------------+
```

**Stato vuoto:** se non ci sono giochi in corso, la sezione non appare.

**Layout Mobile:** carousel orizzontale con snap scrolling. Card compatte (w: 200px).

**Interazione:** click su card o bottone -> navigazione diretta a /play/:slug con ripresa dallo stato salvato.

**API necessaria:**
```
GET /api/v1/users/me/continue-playing?limit=4
Response: {
  data: ContinuePlayingGame[]
}
```

---

### SEZIONE 4: Nuovo questa settimana -- `<NewThisWeek />`

Mostra il gioco rilasciato nell'ultima finestra di rilascio (ogni mercoledi').

```typescript
interface NewThisWeekProps {
  game: {
    slug: string;
    title: string;
    description: string;
    worldSlug: string;
    worldName: string;
    thumbnailUrl: string;
    bannerUrl: string;           // immagine grande hero
    difficulty: string;
    releaseDate: string;
    isNew: boolean;              // true se rilasciato da < 7 giorni
    hasEarlyAccess: boolean;     // true se premium puo' gia' giocare (martedi')
    playCount: number;
    avgRating: number;
    tags: string[];
  };
  userState: {
    hasPlayed: boolean;
    isPremium: boolean;
    canPlay: boolean;            // false se early access + free user
  };
}
```

**Layout Desktop -- Card Hero larga:**

```
Nuovo questa settimana [NEW]

+------------------------------------------------------------------+
|                                                                  |
|  [Banner Image -- 16:9 ratio, h: 280px]                         |
|                                                                  |
|  +--------------------------------------------------------------+|
|  |  BrainLab                                                    ||
|  |                                                              ||
|  |  Pattern Logic 2                                ooX Medio    ||
|  |  Trova il pattern nascosto nelle sequenze di                 ||
|  |  numeri e forme. 20 livelli di difficolta'                   ||
|  |  crescente con meccaniche uniche!                            ||
|  |                                                              ||
|  |  1.2K giocatori - 4.7 stars - Rilasciato 25 mar             ||
|  |                                                              ||
|  |  [  > Gioca ora  ]  [  i Dettagli  ]                        ||
|  +--------------------------------------------------------------+|
+------------------------------------------------------------------+
```

**Stato "Early Access" (martedi', solo per premium):**
- Badge "Accesso anticipato" dorato sulla card
- Per utenti free: overlay semitrasparente con "Disponibile domani -- oppure gioca ora con Premium" e bottone upgrade

**Stato "Gia' giocato":**
- Badge "Giocato" con checkmark
- Bottone diventa "Gioca ancora"

**Layout Mobile:** card a full-width, banner piu' basso (h: 180px), testo sotto.

**API necessaria:**
```
GET /api/v1/releases/current-week
Response: {
  data: {
    game: GameDetail,
    userState: { hasPlayed, canPlay }
  }
}
```

---

### SEZIONE 5: Prossimamente -- `<ComingSoon />`

Teaser per il prossimo gioco in uscita.

```typescript
interface ComingSoonProps {
  game: {
    slug: string;
    title: string;
    teaser: string;              // breve descrizione criptica/intrigante
    worldSlug: string;
    worldName: string;
    thumbnailUrl: string;        // puo' essere un'immagine teaser/silhouette
    releaseDate: string;
    daysUntilRelease: number;
  };
  isNotifyEnabled: boolean;      // utente ha attivato notifica
}
```

**Layout Desktop:**

```
Prossimamente

+------------------------------------------------------------------+
|  +--------------+                                                |
|  |  [Teaser Img] |   QuizArena                                   |
|  |  (oscurata/   |                                               |
|  |   stylized)   |   "Un quiz che sfida la tua conoscenza        |
|  |  140x140      |    della storia dell'arte..."                  |
|  |               |                                               |
|  +--------------+   Esce mercoledi' 1 aprile                     |
|                                                                  |
|                     Countdown: 5g 14h 32m                        |
|                                                                  |
|                     [bell Avvisami]  (toggle)                    |
|                                                                  |
|                     Premium: accesso anticipato martedi' 31      |
+------------------------------------------------------------------+
```

**Countdown:** aggiornato in tempo reale (client-side, ogni minuto). Quando mancano < 24h, il countdown diventa rosso e pulsante.

**Bottone "Avvisami":** toggle. Se attivo, icona piena + testo "Ti avviseremo". Invia notifica push/email quando il gioco esce. Richiede autenticazione.

**Layout Mobile:** card verticale, immagine teaser in alto, info sotto.

**API necessaria:**
```
GET /api/v1/releases/upcoming?limit=1
Response: {
  data: {
    game: UpcomingGame,
    isNotifyEnabled: boolean
  }
}

POST /api/v1/releases/:slug/notify  (toggle notifica)
```

---

### SEZIONE 6: Trending -- `<TrendingGames />`

Giochi piu' giocati negli ultimi 7 giorni. Scroll orizzontale su tutte le viewport.

```typescript
interface TrendingGameCardProps {
  rank: number;                  // 1, 2, 3...
  gameSlug: string;
  gameTitle: string;
  worldSlug: string;
  worldName: string;
  worldColor: string;
  thumbnailUrl: string;
  playCount7d: number;           // giocatori ultimi 7 giorni
  avgRating: number;             // 1-5
  difficulty: string;
  isNew: boolean;                // badge NEW se rilasciato < 14 giorni
  isTrending: boolean;           // badge TRENDING se in salita
  trendDirection: 'up' | 'down' | 'stable';
  positionsChanged: number;      // es. "+3" posizioni rispetto a settimana scorsa
}
```

**Layout Desktop (carousel orizzontale, 4 card visibili + peek):**

```
Trending questa settimana                                [Vedi tutti ->]

+-------------+ +-------------+ +-------------+ +-------------+ +---
| #1 UP       | | #2 UP       | | #3 DOWN     | | #4 STABLE   | | #5
| [Thumbnail] | | [Thumbnail] | | [Thumbnail] | | [Thumbnail] | | [Th
|             | |             | |             | |             | |
| Sudoku      | | Word Chain  | | Quiz Lampo  | | Logic Grid  | | Cro
| Master      | |             | |             | |             | | wor
| BrainLab    | | WordF.      | | QuizA.      | | BrainLab    | | Wor
| 4.8 stars   | | 4.6 stars   | | 4.5 stars   | | 4.3 stars   | | 4.1
| 3.2K plays  | | 2.8K plays  | | 2.1K plays  | | 1.9K plays  | | 1.
| ooX Medio   | | oXX Facile  | | ooo Diff.   | | ooX Medio   | | oX
+-------------+ +-------------+ +-------------+ +-------------+ +---
[<-]                                                              [->]
```

**Card Trending -- stati:**
- Rank #1, #2, #3: badge dorato/argento/bronzo
- Trend up (verde): "+N posizioni" tooltip
- Trend down (rosso): "-N posizioni" tooltip
- Trend stable (grigio): "stabile"
- Badge "NEW" sovrapposto al thumbnail se isNew
- Badge "TRENDING" se il gioco e' salito di 3+ posizioni

**Interazione:** click su card -> /games/:slug. Hover (desktop): lieve scale-up (1.03), ombra aumentata. Scroll orizzontale con drag, touch-swipe, o frecce laterali.

**Layout Mobile:** stesse card ma w: 160px, 2 visibili + peek. Scroll con snap.

**API necessaria:**
```
GET /api/v1/games/trending?limit=10&period=7d
Response: {
  data: TrendingGame[]
}
```

---

### SEZIONE 7: Le tue classifiche -- `<MyLeaderboards />`

Mostra le classifiche dove l'utente e' attivo, con la sua posizione attuale.

```typescript
interface MyLeaderboardEntryProps {
  leaderboardType: 'global' | 'world' | 'game';
  leaderboardName: string;       // "Classifica Globale", "BrainLab", "Sudoku Master"
  worldSlug?: string;
  gameSlug?: string;
  myPosition: number;
  totalPlayers: number;
  myScore: number;
  positionChange: number;        // +2 (salito), -1 (sceso), 0 (stabile)
  topPlayerUsername: string;
  topPlayerScore: number;
  gapToNext: number;             // punti che mancano per salire di 1 posizione
}
```

**Layout Desktop (lista compatta, max 4 righe):**

```
Le tue classifiche                                       [Tutte le classifiche ->]

+--------------------------------------------------------------------+
|  trophy  Classifica Globale   |  #42 di 1.2K  |  UP+3  |  12.450 pt |
|  brain   BrainLab             |  #15 di 890   |  UP+1  |   8.200 pt |
|  word    WordForge            |  #78 di 1.1K  |  DN-2  |   3.100 pt |
|  game    Sudoku Master        |  #5 di 340    |  STBL  |   2.800 pt |
+--------------------------------------------------------------------+

Tip: Ti mancano 120 punti per salire al #4 in Sudoku Master!
```

**Messaggio motivazionale:** sotto la tabella, un messaggio dinamico che mostra la classifica dove l'utente e' piu' vicino a salire di posizione. Calcolo: min(gapToNext) tra tutte le classifiche attive.

**Layout Mobile:** stessa tabella ma scrollabile orizzontalmente se necessario, o card stack verticale.

**Interazione:** click su riga -> /leaderboard?scope=world&world=brainlab (o scope appropriato).

**API necessaria:**
```
GET /api/v1/users/me/leaderboard-positions
Response: {
  data: {
    positions: LeaderboardPosition[],
    motivationalTip: {
      leaderboardName: string,
      gapToNext: number,
      nextPosition: number
    }
  }
}
```

---

### SEZIONE 8: Serie in corso -- `<ActiveSeries />`

Mostra le serie che l'utente sta seguendo, con progress e prossimi episodi.

```typescript
interface ActiveSeriesCardProps {
  seriesSlug: string;
  seriesTitle: string;
  worldSlug: string;
  worldName: string;
  thumbnailUrl: string;
  totalEpisodes: number;
  releasedEpisodes: number;
  completedEpisodes: number;
  nextEpisodeNumber: number;
  nextEpisodeTitle: string;
  nextEpisodeSlug: string;
  isNextEpisodeLocked: boolean;  // true se premium-only e utente free
  nextEpisodeReleaseDate?: string; // se non ancora rilasciato
}
```

**Layout Desktop:**

```
Le tue serie                                              [Tutte le serie ->]

+------------------------------+  +------------------------------+
|  [Thumbnail Serie]           |  |  [Thumbnail Serie]           |
|  --------------------------  |  |  --------------------------  |
|  Logic Puzzles S1            |  |  Word Adventures S1          |
|  BrainLab                    |  |  WordForge                   |
|  Episodi: 5/8 completati    |  |  Episodi: 2/6 completati    |
|  ============----  62%       |  |  =====----------  33%       |
|                              |  |                              |
|  Prossimo: Ep. 6 "Labirinto"|  |  Prossimo: Ep. 3 "Sinonimi" |
|  [ > Gioca Ep. 6 ]          |  |  [ lock Premium ] (se locked)|
+------------------------------+  +------------------------------+
```

**Stato episodio locked (utente free):**
- Bottone "Sblocca con Premium" con icona lucchetto, colore oro
- Click apre UpgradeModal con contesto "Sblocca tutti gli episodi delle serie"

**Stato prossimo episodio non ancora rilasciato:**
- Testo "Ep. 7 in arrivo il 2 aprile" con icona calendario
- Bottone "Avvisami" al posto di "Gioca"

**Layout Mobile:** card stack verticale, immagine a sinistra (80x80), info a destra.

**API necessaria:**
```
GET /api/v1/users/me/active-series?limit=4
Response: {
  data: ActiveSeries[]
}
```

---

### SEZIONE 9: Consigliati per te -- `<RecommendedForYou />`

Basato su: mondi preferiti, giochi giocati, difficolta' media scelta, pattern di gioco.

```typescript
interface RecommendedGameCardProps {
  gameSlug: string;
  gameTitle: string;
  worldSlug: string;
  worldName: string;
  worldColor: string;
  thumbnailUrl: string;
  difficulty: string;
  avgRating: number;
  playCount: number;
  reason: string;               // "Perche' ti piace BrainLab" / "Simile a Sudoku Master"
  matchScore: number;           // 0-100, usato per ordinamento (non mostrato)
  isNew: boolean;
  isPremiumOnly: boolean;
}
```

**Layout Desktop (carousel orizzontale):**

```
Consigliati per te                                       [Vedi tutti ->]

+-----------------+ +-----------------+ +-----------------+ +---------
| [Thumbnail]     | | [Thumbnail]     | | [Thumbnail] PRO | | [Thumbn
| --------------  | | --------------  | | --------------  | | -------
| Logic Grid      | | Crossword ITA   | | Quiz Cinema     | | Hanjie
| BrainLab        | | WordForge       | | QuizArena       | | BrainLa
| 4.5 - ooX       | | 4.7 - oXX       | | 4.6 - ooX       | | 4.4
|                 | |                 | |    PRO          | |
| Perche' ti      | | Simile a        | | Perche' ti      | | I gioca
| piace BrainLab  | | Word Chain      | | piace QuizArena | | come te
+-----------------+ +-----------------+ +-----------------+ +---------
```

**Logica "reason":** ogni card mostra una riga di testo che spiega perche' e' stata consigliata. Questo aumenta la fiducia nel sistema di raccomandazione e la probabilita' di click. Possibili ragioni:
- "Perche' ti piace [NomeMondo]"
- "Simile a [NomeGiocoGiocato]"
- "I giocatori come te lo adorano"
- "Popolare in [NomeMondo]"
- "Nuova sfida per il tuo livello"

**Card con lock (isPremiumOnly + utente free):** badge "PRO" dorato in alto a destra del thumbnail. Click apre UpgradeModal.

**Layout Mobile:** carousel orizzontale, card w: 160px.

**API necessaria:**
```
GET /api/v1/users/me/recommendations?limit=8
Response: {
  data: RecommendedGame[]
}
```

---

### SEZIONE 10: Community -- `<CommunityFeed />`

Feed leggero di attivita' social che crea senso di community e competizione.

```typescript
interface CommunityActivityProps {
  activities: Activity[];
}

interface Activity {
  id: string;
  type: 'record_broken' | 'achievement_unlocked' | 'streak_milestone' | 'new_player' | 'leaderboard_change';
  actorUsername: string;
  actorAvatarUrl: string;
  description: string;           // "ha battuto il tuo record in Sudoku Master"
  gameSlug?: string;
  gameName?: string;
  timestamp: string;
  isAboutMe: boolean;            // true se l'attivita' riguarda l'utente corrente
}
```

**Layout Desktop:**

```
Community                                                 [Vedi tutto ->]

+------------------------------------------------------------------+
|  [av] @marco_92 ha battuto il tuo record in Sudoku Master!      |
|       Nuovo record: 2.450 pt (il tuo: 2.380 pt)   - 2h fa      |
|       [Sfidalo ->]                                               |
|------------------------------------------------------------------|
|  [av] @lucia_gamer ha sbloccato "Maestro delle Parole"          |
|       Badge leggendario in WordForge               - 5h fa      |
|------------------------------------------------------------------|
|  [av] @alex_quiz ha raggiunto una streak di 30 giorni!          |
|                                                    - 8h fa      |
|------------------------------------------------------------------|
|  [av] @new_player_42 si e' unito a Gameflix!                    |
|       Dagli il benvenuto                           - 12h fa     |
+------------------------------------------------------------------+
```

**Evidenziazione:** le attivita' con `isAboutMe = true` (es. "ha battuto il TUO record") hanno sfondo leggermente colorato (giallo tenue) e testo in grassetto. Questo crea urgenza competitiva.

**Bottone "Sfidalo":** appare solo su attivita' di tipo `record_broken` dove qualcuno ha battuto il record dell'utente. Porta a /play/:gameSlug.

**Stato vuoto (piattaforma nuova, poche attivita'):** mostra attivita' aggregate ("42 giocatori si sono uniti oggi", "128 puzzle completati oggi") per evitare l'effetto vuoto.

**Layout Mobile:** stessa lista, padding ridotto, nessun bordo tra items (solo divider sottile).

**API necessaria:**
```
GET /api/v1/community/feed?limit=5
Response: {
  data: Activity[]
}
```

---

## 2.2 Homepage NON Autenticata -- Landing Page Pubblica

Per gli utenti non registrati, la homepage e' una landing page di conversione. Obiettivo: registrazione.

### Wireframe Strutturale

```
+----------------------------------------------------------------------+
|  TOP BAR: [Logo]                              [Accedi] [Registrati]  |
+----------------------------------------------------------------------+
|                                                                      |
|  ================================================================    |
|  SEZIONE 1: HERO                                                     |
|  ================================================================    |
|                                                                      |
|  Il tuo nuovo passatempo                                             |
|  intelligente.                                                       |
|                                                                      |
|  Puzzle, quiz e giochi di logica per allenare                        |
|  la mente ogni giorno. Gratis, dal browser.                          |
|                                                                      |
|  [  Inizia gratis  ]   [  Scopri i giochi  ]                        |
|                                                                      |
|  [Screenshot/mockup del gioco in azione -- 16:9, animato]            |
|                                                                      |
|  ================================================================    |
|  SEZIONE 2: I MONDI                                                  |
|  ================================================================    |
|                                                                      |
|  Tre mondi, infinite sfide                                           |
|                                                                      |
|  +--------------+  +--------------+  +--------------+               |
|  | BrainLab     |  | WordForge    |  | QuizArena    |               |
|  |              |  |              |  |              |               |
|  | Sudoku,      |  | Anagrammi,   |  | Quiz cultura,|               |
|  | logic grid,  |  | cruciverba,  |  | trivia,      |               |
|  | pattern...   |  | word chain...|  | vero/falso...|               |
|  |              |  |              |  |              |               |
|  | [Esplora ->] |  | [Esplora ->] |  | [Esplora ->] |               |
|  +--------------+  +--------------+  +--------------+               |
|                                                                      |
|  ================================================================    |
|  SEZIONE 3: SHOWCASE GIOCHI                                          |
|  ================================================================    |
|                                                                      |
|  I giochi piu' amati                                                 |
|                                                                      |
|  [Card] [Card] [Card] [Card] [Card] [Card]  (carousel)              |
|  (cliccabili -> /games/:slug con possibilita' di provare)            |
|                                                                      |
|  ================================================================    |
|  SEZIONE 4: SOCIAL PROOF                                             |
|  ================================================================    |
|                                                                      |
|     12.000+          450.000+         98%                            |
|     giocatori        puzzle           tasso di                       |
|     attivi           completati       soddisfazione                  |
|                                                                      |
|  ================================================================    |
|  SEZIONE 5: COME FUNZIONA                                            |
|  ================================================================    |
|                                                                      |
|  1. Scegli il tuo Mondo    2. Gioca ogni giorno    3. Scala la      |
|     preferito                  sfide nuove             classifica    |
|  [Illustrazione]           [Illustrazione]         [Illustrazione]  |
|                                                                      |
|  ================================================================    |
|  SEZIONE 6: PRICING                                                  |
|  ================================================================    |
|                                                                      |
|  +-------------+  +---------------------+                            |
|  | FREE        |  | PREMIUM             |                            |
|  | 0 EUR       |  | 4,99 EUR/mese       |                            |
|  |             |  |                     |                            |
|  | v 3 giochi/ |  | v Giochi illimitati |                            |
|  |   giorno    |  | v Zero pubblicita'  |                            |
|  | v Daily     |  | v Accesso anticip.  |                            |
|  | v Classifiche| | v Tutte le serie    |                            |
|  | Con ads     |  | v Temi esclusivi    |                            |
|  |             |  |                     |                            |
|  | [Gratis]    |  | [Prova 7gg gratis]  |                            |
|  +-------------+  +---------------------+                            |
|                                                                      |
|  ================================================================    |
|  SEZIONE 7: CTA FINALE                                               |
|  ================================================================    |
|                                                                      |
|  Pronto a sfidare la tua mente?                                      |
|  [  Registrati gratis  ]                                             |
|                                                                      |
|  ================================================================    |
|  FOOTER                                                              |
+----------------------------------------------------------------------+
```

**Mobile:** tutte le sezioni diventano a singola colonna. Le card mondo diventano stack verticale. Il pricing diventa swipeable (Free | Premium) con indicator dots. Hero con testo ridotto, CTA full-width.

**Interazione speciale:** se un utente non autenticato prova a giocare (click su un gioco dal showcase), viene portato a /play/:slug. Puo' giocare MA alla fine della partita appare una modal: "Bravo! Il tuo punteggio e' stato di 1.250 pt. Registrati per salvare il tuo progresso e scalare la classifica!" con bottone registrazione. Il punteggio viene salvato temporaneamente nel localStorage e associato all'account alla registrazione.

---

## 2.3 Banner Pubblicitari per Utenti Free

Posizionamento ads nella homepage autenticata per utenti free:

1. **Tra sezione 2 e sezione 3:** banner orizzontale (728x90 desktop, 320x50 mobile) con label "Pubblicita'" piccola in alto a destra. Stile integrato con il design (non deve sembrare un corpo estraneo).
2. **Tra sezione 6 e sezione 7:** secondo banner, stesse specifiche.
3. **Massimo 2 banner per pagina homepage.**
4. **Per utenti premium:** nessun banner, nessuno spazio vuoto al suo posto (le sezioni sono adiacenti).

---

---

# 3. PAGINA CATEGORIA (MONDO)

---

## 3.1 Struttura Generale

Ogni Mondo ha un'identita' visiva unica ma segue la stessa struttura. I 3 Mondi al lancio:

| Mondo | Colore Primario | Colore Secondario | Icona | Atmosfera |
|-------|----------------|-------------------|-------|-----------|
| BrainLab | #6C5CE7 (viola) | #A29BFE (viola chiaro) | brain | Laboratorio, scientifico, geometrico |
| WordForge | #00B894 (verde) | #55EFC4 (verde chiaro) | pen | Officina letteraria, tipografico, caldo |
| QuizArena | #E17055 (arancione) | #FAB1A0 (arancione chiaro) | question | Arena, competitivo, vivace |

### Wireframe Pagina Mondo (Desktop)

```
+----------------------------------------------------------------------+
|  TOP BAR                                                             |
+------------+---------------------------------------------------------+
|  SIDEBAR   |                                                         |
|            |  +-------------------------------------------------+    |
|            |  |  MONDO HEADER (bg: gradiente colore mondo)      |    |
|            |  |  h: 200px desktop, 140px mobile                 |    |
|            |  |                                                 |    |
|            |  |  BrainLab                                       |    |
|            |  |  Logica, ragionamento e pensiero critico        |    |
|            |  |                                                 |    |
|            |  |  [Stat] [Stat] [Stat] [Stat]                   |    |
|            |  +-------------------------------------------------+    |
|            |                                                         |
|            |  +-------------------------------------------------+    |
|            |  |  DAILY DI OGGI (per questo mondo)               |    |
|            |  +-------------------------------------------------+    |
|            |                                                         |
|            |  +-------------------------------------------------+    |
|            |  |  SERIE ATTIVE                                   |    |
|            |  +-------------------------------------------------+    |
|            |                                                         |
|            |  +-------------------------------------------------+    |
|            |  |  CATALOGO GIOCHI (griglia + filtri)             |    |
|            |  |  [Filtri: Difficolta' | Tipo | Ordina per]      |    |
|            |  |  [Card] [Card] [Card] [Card]                   |    |
|            |  |  [Card] [Card] [Card] [Card]                   |    |
|            |  |  [Carica altri]                                 |    |
|            |  +-------------------------------------------------+    |
|            |                                                         |
|            |  +-------------------------------------------------+    |
|            |  |  CLASSIFICA DEL MONDO                           |    |
|            |  +-------------------------------------------------+    |
|            |                                                         |
|            |  +-------------------------------------------------+    |
|            |  |  PROSSIMAMENTE (per questo mondo)               |    |
|            |  +-------------------------------------------------+    |
|            |                                                         |
|            |  FOOTER                                                 |
+------------+---------------------------------------------------------+
```

---

## 3.2 Header del Mondo -- `<WorldHeader />`

```typescript
interface WorldHeaderProps {
  worldSlug: string;
  worldName: string;
  worldDescription: string;
  worldIcon: string;
  worldGradient: [string, string];  // colori gradiente
  stats: {
    totalGames: number;
    gamesPlayed: number;         // dall'utente
    xpEarned: number;            // dall'utente in questo mondo
    worldRank: number;           // posizione utente classifica mondo
    totalPlayers: number;
  };
  isAuthenticated: boolean;
}
```

**Layout Desktop:**

```
+------------------------------------------------------------------+
| ################  GRADIENTE MONDO  ############################## |
|                                                                  |
|  brain  BrainLab                                                 |
|  Logica, ragionamento e pensiero critico.                        |
|  Metti alla prova le tue capacita' analitiche con                |
|  puzzle e sfide che stimolano il pensiero laterale.              |
|                                                                  |
|  +----------+  +----------+  +----------+  +----------+         |
|  |  pad 12  |  |  star 2.4K|  | trophy #15|  |  chart 18|       |
|  |  giochi  |  |  XP       |  |  rank    |  |  giochi  |        |
|  |  nel     |  |  guadagnati| |  su 890  |  |  dispo-  |        |
|  |  mondo   |  |           |  |          |  |  nibili  |        |
|  +----------+  +----------+  +----------+  +----------+         |
|                                                                  |
+------------------------------------------------------------------+
```

**Utente non autenticato:** le stat card "giochi giocati", "XP" e "rank" non appaiono. Al loro posto: stat aggregate del mondo ("4.5K giocatori attivi", "120K puzzle completati").

**Layout Mobile:** altezza ridotta (140px), solo nome + descrizione breve (1 riga). Stats in riga scrollabile sotto il header.

---

## 3.3 Daily di Oggi -- `<WorldDailyChallenge />`

Singola card daily specifica per questo Mondo (la stessa che appare in homepage, ma qui in evidenza e piu' grande).

```
La sfida di oggi in BrainLab

+------------------------------------------------------------------+
|  brain  Sudoku del giorno -- 26 marzo 2026                       |
|                                                                  |
|  Difficolta': ooX Medio    Tempo stimato: ~5 min    Ricompensa: 50 XP |
|                                                                  |
|  [  > Gioca ora  ]              timer 2.340 giocatori oggi       |
|                                                                  |
|  trophy Miglior punteggio oggi: 3.200 pt (@speed_solver)         |
|  chart Il tuo miglior daily BrainLab: 2.890 pt                   |
+------------------------------------------------------------------+
```

**Se completato:** sfondo verde tenue, checkmark, punteggio ottenuto, posizione nella classifica giornaliera di questo daily. Bottone "Vedi classifica giornaliera".

**API necessaria:**
```
GET /api/v1/worlds/:worldSlug/daily?date=2026-03-26
Response: {
  data: {
    challenge: DailyChallenge,
    topScore: { score, username },
    playersToday: number,
    userResult?: { score, rank }
  }
}
```

---

## 3.4 Serie Attive -- `<WorldActiveSeries />`

Lista delle serie disponibili in questo Mondo, con progresso utente.

```typescript
interface WorldSeriesCardProps {
  seriesSlug: string;
  seriesTitle: string;
  description: string;
  thumbnailUrl: string;
  totalEpisodes: number;
  releasedEpisodes: number;
  userCompletedEpisodes: number;   // 0 se non iniziata o non autenticato
  difficulty: string;
  isCompleted: boolean;            // utente ha finito tutti gli episodi
  isNew: boolean;                  // serie iniziata da < 14 giorni
  nextEpisodeAvailable: boolean;
  premiumOnlyEpisodes: number[];   // numeri episodi solo premium (es. [3,4,5,6])
}
```

**Layout Desktop (2 card per riga):**

```
Serie in BrainLab

+------------------------------------+  +------------------------------------+
|  [Thumbnail]                       |  |  [Thumbnail]                       |
|  --------------------------------  |  |  --------------------------------  |
|  Logic Puzzles -- Stagione 1       |  |  Pattern Challenge                 |
|  "Esplora il mondo della logica    |  |  "Trova il pattern in             |
|   con 8 sfide progressive"        |  |   sequenze sempre piu' complesse" |
|                                    |  |                                    |
|  8 episodi - ooX Medio             |  |  6 episodi - ooo Difficile        |
|  Il tuo progresso: 5/8            |  |  Il tuo progresso: 0/6 -- Nuova!  |
|  ================----  62%        |  |  --------------------  0%          |
|                                    |  |                                    |
|  [> Ep. 6 -- Labirinto]           |  |  [> Inizia]                        |
|                                    |  |  Ep. 1 gratis, poi PRO            |
+------------------------------------+  +------------------------------------+
```

**Logica episodi Free vs Premium:**
- Episodio 1 di ogni serie: sempre gratuito (hook)
- Episodi 2+: solo Premium
- Per utenti free: la progress bar mostra il limite e un lucchetto sul prossimo episodio locked. Testo: "Ep. 1 gratis, poi PRO".
- Per utenti premium: nessun lucchetto, tutti gli episodi disponibili.

**Stato "Serie completata":** badge "Completata" con checkmark, sfondo celebrativo leggero. Bottone "Rigioca" o "Vedi le tue stats".

**Layout Mobile:** card a full-width, stack verticale.

**API necessaria:**
```
GET /api/v1/worlds/:worldSlug/series
Response: {
  data: WorldSeries[]
}
```

---

## 3.5 Catalogo Giochi del Mondo -- `<WorldGameCatalog />`

Griglia di tutti i giochi disponibili nel Mondo, con sistema di filtri.

### Barra Filtri -- `<CatalogFilters />`

```typescript
interface CatalogFiltersProps {
  currentFilters: {
    difficulty: 'all' | 'facile' | 'medio' | 'difficile';
    type: 'all' | 'puzzle' | 'quiz' | 'wordgame' | 'logic';
    sort: 'popular' | 'recent' | 'rating' | 'alphabetical';
    status: 'all' | 'played' | 'not_played';   // solo autenticati
  };
  availableTypes: string[];      // dipende dal mondo
  onFilterChange: (filters) => void;
}
```

**Layout Desktop:**

```
Tutti i giochi (18 giochi)

Difficolta': [Tutte v]  Tipo: [Tutti v]  Ordina: [Piu' popolari v]  Stato: [Tutti v]

+-------------+ +-------------+ +-------------+ +-------------+
| [Thumbnail] | | [Thumbnail] | | [Thumbnail] | | [Thumbnail] |
|  NEW        | |  TRENDING   | |             | |  PRO        |
| ----------- | | ----------- | | ----------- | | ----------- |
| Sudoku      | | Logic Grid  | | Nonogramma  | | Hanjie Pro  |
| Master      | |             | |             | |             |
| 4.8 stars   | | 4.5 stars   | | 4.3 stars   | | 4.7 stars   |
| ooX Medio   | | oXX Facile  | | ooo Diff.   | | ooX Medio   |
| 3.2K plays  | | 1.9K plays  | | 890 plays   | | 1.2K plays  |
+-------------+ +-------------+ +-------------+ +-------------+
+-------------+ +-------------+ +-------------+ +-------------+
|    ...       | |    ...       | |    ...       | |    ...       |
+-------------+ +-------------+ +-------------+ +-------------+

[Carica altri giochi]  (se paginazione)
```

**Layout Mobile:** griglia 2 colonne, card piu' compatte. Filtri in riga scrollabile orizzontale con chip selezionabili.

### Game Card nella Griglia -- `<GameCard />`

```typescript
interface GameCardProps {
  slug: string;
  title: string;
  thumbnailUrl: string;
  difficulty: 'facile' | 'medio' | 'difficile';
  avgRating: number;
  playCount: number;
  isNew: boolean;                // rilasciato < 14 giorni fa
  isTrending: boolean;           // in top 10 trending
  isPremiumOnly: boolean;
  hasBeenPlayed: boolean;        // dall'utente corrente
  userBestScore?: number;
  worldColor: string;
}
```

**Dimensioni:**
- Desktop: w: 220px, h: ~280px (thumbnail 220x140 + info 140px)
- Tablet: w: 200px
- Mobile: w: calc(50% - 12px), h: auto

**Badge (sovrapposti al thumbnail, angolo alto-destro):**
- "NEW" (sfondo verde, testo bianco) -- se rilasciato < 14 giorni
- "TRENDING" (sfondo arancione, testo bianco) -- se in top 10
- "PRO" (sfondo dorato, testo bianco) -- se premium only E utente free
- I badge si impilano verticalmente se ce n'e' piu' di uno.

**Indicatore "Giocato":** se hasBeenPlayed, piccolo checkmark verde nell'angolo basso-sinistro del thumbnail.

**Indicatore Difficolta':**
- Facile: (1/3 dots) + testo verde
- Medio: (2/3 dots) + testo giallo
- Difficile: (3/3 dots) + testo rosso

**Rating:** stelle (1-5) con una cifra decimale, es. "4.8".

**Play Count:** formattato con K per migliaia (es. "3.2K"), icona joystick.

**Interazione:**
- Hover (desktop): scale 1.03, ombra elevata, leggero reveal di un bottone "Gioca" sovrapposto al thumbnail.
- Click: navigazione a /games/:slug (pagina dettaglio gioco).
- Long-press/right-click (futuro): menu contestuale con "Aggiungi ai preferiti".

**API necessaria:**
```
GET /api/v1/worlds/:worldSlug/games?difficulty=all&type=all&sort=popular&page=1&limit=12
Response: {
  data: Game[],
  meta: {
    total: number,
    page: number,
    perPage: number,
    totalPages: number
  }
}
```

---

## 3.6 Classifica del Mondo -- `<WorldLeaderboard />`

Preview compatta della classifica di questo Mondo. Top 5 + posizione dell'utente.

```
Classifica BrainLab                                     [Classifica completa ->]

+------------------------------------------------------------------+
|  #1 gold  @speed_solver     12.450 pt  fire 28gg streak         |
|  #2 silver @logic_queen     11.890 pt  fire 15gg streak         |
|  #3 bronze @puzzle_master   10.200 pt  fire 42gg streak         |
|  4.  @brain_gamer            9.870 pt  fire 7gg streak          |
|  5.  @think_fast             9.340 pt  fire 12gg streak         |
|------------------------------------------------------------------|
|  ...                                                            |
|  15. @tu (TU)                8.200 pt  fire 12gg streak  UP+1   |
|  ...                                                            |
+------------------------------------------------------------------+
```

**Utente non autenticato:** la sezione "la tua posizione" non appare. In fondo: "Registrati per entrare in classifica."

**Interazione:** click su "Classifica completa" -> /leaderboard?world=brainlab. Click su username -> /profile/:username.

---

## 3.7 Prossimamente nel Mondo -- `<WorldUpcoming />`

Identico alla sezione "Prossimamente" dell'homepage, ma filtrato per il mondo corrente.

```
In arrivo in BrainLab

+------------------------------------------------------------------+
|  [Teaser Img]    Hanjie Extreme                                  |
|                  "Il nonogramma piu' impegnativo mai creato..."  |
|                  cal Esce mercoledi' 1 aprile                    |
|                  timer Tra 5 giorni                               |
|                  [bell Avvisami]                                  |
+------------------------------------------------------------------+
```

Se non ci sono uscite previste per questo mondo nelle prossime 3 settimane, la sezione non appare.

---

---

# 4. SISTEMA CLASSIFICHE

---

## 4.1 Pagina Principale `/leaderboard`

### Wireframe Desktop

```
+----------------------------------------------------------------------+
|  TOP BAR                                                             |
+------------+---------------------------------------------------------+
|  SIDEBAR   |                                                         |
|            |  +-------------------------------------------------+    |
|            |  |  HEADER CLASSIFICHE                             |    |
|            |  |  trophy Classifiche                             |    |
|            |  |  Competi con giocatori di tutto il mondo        |    |
|            |  +-------------------------------------------------+    |
|            |                                                         |
|            |  +-------------------------------------------------+    |
|            |  |  TAB SCOPE                                      |    |
|            |  |  [Globale] [BrainLab] [WordForge] [QuizArena]  |    |
|            |  +-------------------------------------------------+    |
|            |                                                         |
|            |  +-------------------------------------------------+    |
|            |  |  TAB PERIODO                                    |    |
|            |  |  [Oggi] [Settimana] [Mese] [Sempre]            |    |
|            |  +-------------------------------------------------+    |
|            |                                                         |
|            |  +-------------------------------------------------+    |
|            |  |  PODIO TOP 3 (animato)                          |    |
|            |  |       #1 gold                                   |    |
|            |  |     [Avatar]                                    |    |
|            |  |     @user1                                      |    |
|            |  |     15.230 pt                                   |    |
|            |  |  #2 silver      #3 bronze                      |    |
|            |  |  [Av]           [Av]                            |    |
|            |  |  @user2         @user3                          |    |
|            |  |  14.100 pt      13.890 pt                      |    |
|            |  +-------------------------------------------------+    |
|            |                                                         |
|            |  +-------------------------------------------------+    |
|            |  |  TABELLA CLASSIFICA (dal #4 in giu')            |    |
|            |  |  -----------------------------------------------  |  |
|            |  |  #  Avatar  Username      Punti  Streak  Trend |    |
|            |  |  4  [av]    @player4      13.200  fire14g  UP+2 |   |
|            |  |  5  [av]    @player5 PRO  12.890  fire21g  DN-1 |   |
|            |  |  6  [av]    @player6      12.340  fire 8g  STBL |   |
|            |  |  ...                                            |    |
|            |  |  ----------------------------------------------- |   |
|            |  |  LA TUA POSIZIONE (sticky/evidenziata)          |    |
|            |  |  42 [av]    @tu (TU)       8.200  fire12g  UP+3 |   |
|            |  |  ----------------------------------------------- |   |
|            |  |  ...                                            |    |
|            |  |  [Carica altri]                                 |    |
|            |  +-------------------------------------------------+    |
|            |                                                         |
|            |  +-------------------------------------------------+    |
|            |  |  SEZIONE "VICINO A TE"                          |    |
|            |  +-------------------------------------------------+    |
|            |                                                         |
|            |  +-------------------------------------------------+    |
|            |  |  COME FUNZIONA IL PUNTEGGIO                     |    |
|            |  +-------------------------------------------------+    |
|            |                                                         |
|            |  FOOTER                                                 |
+------------+---------------------------------------------------------+
```

---

## 4.2 Navigazione Classifiche

### Tab Scope -- `<LeaderboardScopeTabs />`

```typescript
interface LeaderboardScopeTabsProps {
  activeScope: 'global' | 'brainlab' | 'wordforge' | 'quizarena';
  onScopeChange: (scope: string) => void;
}
```

**Layout:** tabs orizzontali con icona mondo + nome. Tab attiva con underline colore mondo (o colore brand per globale). Su mobile: scroll orizzontale se necessario.

### Tab Periodo -- `<LeaderboardPeriodTabs />`

```typescript
interface LeaderboardPeriodTabsProps {
  activePeriod: 'daily' | 'weekly' | 'monthly' | 'alltime';
  onPeriodChange: (period: string) => void;
}
```

**Layout:** pills/chip selezionabili sotto il tab scope. Pill attiva: sfondo primario, testo bianco. Pill inattiva: sfondo grigio chiaro, testo grigio scuro.

**URL sincronizzati:** i filtri si riflettono nell'URL per condivisibilita'.
```
/leaderboard?scope=global&period=weekly
/leaderboard?scope=brainlab&period=daily
```

---

## 4.3 Podio Top 3 -- `<LeaderboardPodium />`

```typescript
interface PodiumPlayerProps {
  position: 1 | 2 | 3;
  username: string;
  avatarUrl: string;
  score: number;
  streak: number;
  badges: string[];              // badge piu' significativi (max 3)
  isPremium: boolean;
}
```

**Layout Desktop:**

```
              +-----------------+
              |    #1 gold      |
              |   +------+      |
              |   |Avatar|      |
              |   | 64x64|      |
              |   +------+      |
              |   @speed_solver |
              |   15.230 pt     |
              |   fire 28gg     |
              |   [bdg][bdg][bd]|
    +---------+                 +---------+
    |   #2    |                 |    #3   |
    |  +----+ |                 |  +----+ |
    |  | Av | |                 |  | Av | |
    |  |48x48||                 |  |48x48||
    |  +----+ |                 |  +----+ |
    |  @user2 |                 |  @user3 |
    |  14.1K  |                 |  13.9K  |
    |  fire15g|                 |  fire42g|
    +---------+-----------------+---------+
```

**Animazione (al caricamento pagina):** i tre pedestal emergono dal basso con stagger animation (prima il 3o, poi il 2o, infine il 1o). Gli avatar hanno una leggera animazione di bounce. L'effetto e' sobrio e veloce (600ms totali).

**Badge Premium:** se il giocatore e' premium, il suo username ha un piccolo badge dorato "PRO" accanto.

**Interazione:** click su un giocatore del podio -> /profile/:username.

**Layout Mobile:** podio piu' compatto, avatar 40px, info ridotte (nome + punteggio). Disposizione identica ma proporzionata.

---

## 4.4 Tabella Classifica -- `<LeaderboardTable />`

```typescript
interface LeaderboardEntry {
  position: number;
  username: string;
  avatarUrl: string;
  score: number;
  streak: number;
  level: number;
  badges: Badge[];               // mostra le prime 3
  isPremium: boolean;
  trendDirection: 'up' | 'down' | 'stable' | 'new';
  positionsChanged: number;
  isCurrentUser: boolean;
}
```

**Layout Desktop:**

```
+----+--------+------------------+----------+--------+------+-------+
| #  | Avatar | Giocatore        | Punteggio| Streak | Liv. | Trend |
+----+--------+------------------+----------+--------+------+-------+
| 4  | [av]   | @player4         | 13.200   | fire14g| 18   | UP +2 |
| 5  | [av]   | @player5 PRO     | 12.890   | fire21g| 22   | DN -1 |
| 6  | [av]   | @player6         | 12.340   | fire 8g| 15   | STBL  |
| 7  | [av]   | @player7         | 11.900   | fire 3g| 12   | UP +5 |
| 8  | [av]   | @player8         | 11.450   | fire45g| 28   | NEW   |
| ...|        |                  |          |        |      |       |
|====|========|==================|==========|========|======|=======|
| 42 | [TU]   | @tu (TU)  <- TU  |  8.200   | fire12g| 14   | UP +3 |
|====|========|==================|==========|========|======|=======|
| ...|        |                  |          |        |      |       |
+----+--------+------------------+----------+--------+------+-------+
```

**Riga utente corrente (isCurrentUser = true):**
- Sfondo evidenziato (colore brand chiaro, border-left colorato)
- Testo "TU" accanto al nome
- Se non in viewport: riga sticky in basso alla tabella, sempre visibile, con separatore

**Colonna Trend:**
- UP verde + numero (salito N posizioni rispetto al periodo precedente)
- DN rosso + numero (sceso)
- STBL grigio (stabile)
- "NEW" badge blu (appena entrato in classifica)

**Paginazione:** caricamento incrementale (infinite scroll o bottone "Carica altri 20"). Inizialmente 20 righe + riga utente.

**Layout Mobile:** tabella semplificata, colonne: #, Avatar+Nome, Punteggio, Trend. Streak e Livello nascosti (visibili in un expand on-tap della riga).

```
+----------------------------------------+
|  #4   [av] @player4      13.200  UP +2 |
|  #5   [av] @player5 PRO  12.890  DN -1 |
|  #6   [av] @player6      12.340  STBL  |
|  --------------------------------------|
|  #42  [av] @tu (TU)       8.200  UP +3 |  <- evidenziato
|  --------------------------------------|
|  #7   [av] @player7      11.900  UP +5 |
+----------------------------------------+
```

---

## 4.5 Sezione "Vicino a Te" -- `<NearbyPlayers />`

Mostra i giocatori immediatamente sopra e sotto l'utente nella classifica. Utile per la motivazione competitiva diretta.

```typescript
interface NearbyPlayersProps {
  above: LeaderboardEntry[];     // 3 giocatori sopra
  currentUser: LeaderboardEntry;
  below: LeaderboardEntry[];     // 3 giocatori sotto
  gapToAbove: number;            // punti necessari per superare quello sopra
  gapFromBelow: number;          // punti di vantaggio su quello sotto
}
```

**Layout:**

```
Vicino a te

+------------------------------------------------------------------+
|                                                                  |
|  #39  [av]  @challenger_1      8.620 pt    UP +1                |
|  #40  [av]  @close_rival       8.480 pt    STBL                 |
|  #41  [av]  @almost_there      8.310 pt    DN -2                |
|                                                                  |
|  --- ^ Ti mancano 110 pt per superare @almost_there ^ ---       |
|                                                                  |
|  #42  [TU]  @tu (TU)           8.200 pt    UP +3    <- TU       |
|                                                                  |
|  --- v @pursuer e' a 80 pt da te v ---                           |
|                                                                  |
|  #43  [av]  @pursuer           8.120 pt    UP +1                |
|  #44  [av]  @catching_up       7.980 pt    UP +4                |
|  #45  [av]  @newcomer          7.850 pt    NEW                  |
|                                                                  |
+------------------------------------------------------------------+
```

**Messaggi motivazionali dinamici:**
- "Ti mancano X pt per superare @username" -- sopra la tua posizione
- "@username e' a X pt da te" -- sotto la tua posizione (senso di urgenza)
- Se il gap e' piccolo (< 50 pt): testo rosso pulsante "Attento! @username e' vicinissimo!"

---

## 4.6 Classifica della Sfida Giornaliera -- `<DailyLeaderboard />`

Visibile sia nella pagina /leaderboard (tab "Oggi") sia come componente integrato nel post-game della sfida giornaliera.

```typescript
interface DailyLeaderboardProps {
  date: string;
  worldSlug?: string;            // se filtrato per mondo
  entries: DailyLeaderboardEntry[];
  currentUserEntry?: DailyLeaderboardEntry;
  totalParticipants: number;
}

interface DailyLeaderboardEntry {
  position: number;
  username: string;
  avatarUrl: string;
  score: number;
  completionTime: number;        // in secondi
  isPremium: boolean;
}
```

**Layout:** identico alla tabella classifica principale, ma con colonna aggiuntiva "Tempo" (tempo di completamento, formato mm:ss). Ordine: score DESC, poi completionTime ASC (a parita' di punteggio vince chi e' stato piu' veloce).

---

## 4.7 Mini-Classifica per Gioco -- `<GameMiniLeaderboard />`

Componente integrato nella pagina /games/:slug. Top 10 del gioco specifico.

```typescript
interface GameMiniLeaderboardProps {
  gameSlug: string;
  gameTitle: string;
  period: 'alltime' | 'weekly';
  entries: LeaderboardEntry[];   // max 10
  currentUserEntry?: LeaderboardEntry;
  totalPlayers: number;
}
```

**Layout (sidebar destra nella pagina gioco, o sezione sotto le info):**

```
Classifica -- Sudoku Master               [Tab: Sempre | Settimana]

 #1  [av]  @speed_solver     3.200 pt
 #2  [av]  @sudoku_king      3.150 pt
 #3  [av]  @logic_queen      2.980 pt
 #4  [av]  @puzzlefan        2.890 pt
 #5  [av]  @numbers_pro      2.750 pt
 -------------------------------------
 #28 [av]  @tu (TU)          1.450 pt
 -------------------------------------
 340 giocatori totali

 [Classifica completa ->]
```

---

## 4.8 Come Funziona il Punteggio -- `<ScoringExplainer />`

Sezione educativa in fondo alla pagina classifiche.

```
Come funziona il punteggio

+------------------------------------------------------------------+
|                                                                  |
|  Il tuo punteggio e' la somma dei punti guadagnati in ogni       |
|  gioco, sfida giornaliera e bonus.                               |
|                                                                  |
|  chart Punteggio gioco                                           |
|     Basato su: accuratezza, velocita', difficolta'               |
|     Giochi piu' difficili = piu' punti                           |
|                                                                  |
|  bolt Bonus sfida giornaliera                                    |
|     Completa la sfida = punti base                               |
|     Completa tutte e 3 = bonus +100 XP                           |
|                                                                  |
|  fire Moltiplicatore streak                                      |
|     7+ giorni consecutivi = x1.2                                 |
|     30+ giorni consecutivi = x1.5                                |
|     100+ giorni consecutivi = x2.0                               |
|                                                                  |
|  trophy Classifiche                                              |
|     Giornaliera: reset ogni giorno alle 00:00 CET               |
|     Settimanale: reset ogni lunedi' alle 00:00 CET              |
|     Mensile: reset il 1o del mese alle 00:00 CET                |
|     Sempre: punteggio cumulativo totale                          |
|                                                                  |
+------------------------------------------------------------------+
```

Layout: accordion su mobile (ogni sezione e' collassabile).

---

## 4.9 Gestione "Ristorante Vuoto"

Nelle prime fasi della piattaforma, le classifiche potrebbero avere pochi utenti. Strategie per evitare l'effetto vuoto:

**Classifica con < 20 utenti:**
- Non mostrare il totale giocatori se < 20
- Il podio mostra solo le posizioni occupate (se 2 giocatori, solo oro e argento)
- Messaggi incoraggianti: "Sei tra i primi giocatori! La classifica cresce ogni giorno."
- Mostrare proiezioni: "Al tuo ritmo, sarai nella top 10 entro fine settimana"

**Classifica con 0 utenti (nessuno ha giocato oggi):**
- Messaggio: "Nessuno ha ancora completato questa sfida oggi. Sii il primo!"
- Mostrare la classifica del giorno precedente come riferimento: "Ieri: @user con 3.200 pt"

**Classifica gioco nuovo (< 7 giorni):**
- Badge "Classifica nuova" con icona stellina
- "Gioca ora per conquistare il primo posto!"

---

## 4.10 Preview per Utenti Non Registrati

Gli utenti non registrati possono vedere le classifiche in modalita' read-only.

**Differenze:**
- Nessuna riga "TU" evidenziata
- Nessuna sezione "Vicino a te"
- In fondo alla tabella: CTA "Registrati per entrare in classifica e competere!" con bottone registrazione
- La sezione "Come funziona il punteggio" e' sempre visibile (incentivo: "Ogni gioco che completi ti fa guadagnare punti")

**API classifiche:**
```
GET /api/v1/leaderboard?scope=global&period=weekly&page=1&limit=20
Response: {
  data: {
    podium: LeaderboardEntry[],       // top 3
    entries: LeaderboardEntry[],      // dal #4 in giu'
    currentUser?: LeaderboardEntry,   // null se non autenticato
    nearby?: {
      above: LeaderboardEntry[],
      below: LeaderboardEntry[],
      gapToAbove: number,
      gapFromBelow: number
    },
    totalPlayers: number,
    lastUpdated: string               // ISO datetime
  },
  meta: {
    page: number,
    perPage: number,
    totalPages: number
  }
}

GET /api/v1/leaderboard/daily?date=2026-03-26&world=brainlab
GET /api/v1/games/:slug/leaderboard?period=alltime&limit=10
```

---

---

# 5. RELEASE CALENDAR

---

## 5.1 Pagina `/releases`

### Wireframe Desktop

```
+----------------------------------------------------------------------+
|  TOP BAR                                                             |
+------------+---------------------------------------------------------+
|  SIDEBAR   |                                                         |
|            |  +-------------------------------------------------+    |
|            |  |  HEADER                                         |    |
|            |  |  cal Calendario Uscite                          |    |
|            |  |  Scopri cosa c'e' di nuovo e cosa sta arrivando |    |
|            |  +-------------------------------------------------+    |
|            |                                                         |
|            |  +-------------------------------------------------+    |
|            |  |  FILTRI                                          |    |
|            |  |  Mondo: [Tutti] [BrainLab] [WordForge] [QuizAr]|    |
|            |  +-------------------------------------------------+    |
|            |                                                         |
|            |  +-------------------------------------------------+    |
|            |  |  PROSSIMA USCITA (hero/highlight)               |    |
|            |  +-------------------------------------------------+    |
|            |                                                         |
|            |  +-------------------------------------------------+    |
|            |  |  VISTA CALENDARIO (settimana corrente)          |    |
|            |  |  + 2 settimane future                           |    |
|            |  +-------------------------------------------------+    |
|            |                                                         |
|            |  +-------------------------------------------------+    |
|            |  |  USCITE PASSATE (storico scrollabile)           |    |
|            |  +-------------------------------------------------+    |
|            |                                                         |
|            |  FOOTER                                                 |
+------------+---------------------------------------------------------+
```

---

## 5.2 Filtro per Mondo -- `<ReleaseWorldFilter />`

```typescript
interface ReleaseWorldFilterProps {
  activeWorld: 'all' | 'brainlab' | 'wordforge' | 'quizarena';
  onWorldChange: (world: string) => void;
}
```

**Layout:** chip/pill orizzontali. "Tutti" + un chip per mondo con icona colorata. Chip attivo ha sfondo colore mondo, testo bianco. Sincronizzato con URL: `/releases?world=brainlab`.

---

## 5.3 Prossima Uscita -- Hero Card -- `<NextReleaseHero />`

```typescript
interface NextReleaseHeroProps {
  game: {
    slug: string;
    title: string;
    description: string;
    worldSlug: string;
    worldName: string;
    bannerUrl: string;
    thumbnailUrl: string;
    difficulty: string;
    releaseDate: string;
    tags: string[];
    isTeaser: boolean;            // true se non ancora rivelato completamente
  };
  countdown: {
    days: number;
    hours: number;
    minutes: number;
  };
  isNotifyEnabled: boolean;
  isPremium: boolean;
  earlyAccessDate?: string;       // data accesso anticipato premium
}
```

**Layout Desktop:**

```
Prossima uscita

+------------------------------------------------------------------+
|  +------------------------------------------------------------+  |
|  |                                                            |  |
|  |              [Banner Image -- grande, h: 300px]            |  |
|  |                                                            |  |
|  |  +- overlay gradiente scuro dal basso -----------------+ |  |
|  |  |                                                     | |  |
|  |  |  brain BrainLab                                     | |  |
|  |  |                                                     | |  |
|  |  |  Hanjie Extreme                                     | |  |
|  |  |  Il nonogramma piu' impegnativo mai creato.         | |  |
|  |  |  20 livelli con meccaniche mai viste prima.         | |  |
|  |  |                                                     | |  |
|  |  |  ooo Difficile - Puzzle - Logica                    | |  |
|  |  |                                                     | |  |
|  |  +-----------------------------------------------------+ |  |
|  +------------------------------------------------------------+  |
|                                                                  |
|  +----------+  +----------+  +----------+                        |
|  |  5       |  |  14      |  |  32      |  cal Esce mercoledi'   |
|  |  GIORNI  |  |  ORE     |  |  MINUTI  |     1 aprile 2026     |
|  +----------+  +----------+  +----------+                        |
|                                                                  |
|  [bell Avvisami quando esce]    [i Dettagli]                     |
|                                                                  |
|  star Premium: accesso anticipato da martedi' 31 marzo           |
|     (se utente free) [Scopri Premium ->]                         |
|                                                                  |
+------------------------------------------------------------------+
```

**Countdown:** i 3 box (giorni, ore, minuti) si aggiornano in tempo reale. Quando mancano < 24h:
- I box giorni scompare
- Ore e minuti diventano rossi con animazione pulse
- Appare anche il box secondi
- Testo: "Esce OGGI!" o "Esce DOMANI!"

**Stato "Teaser" (isTeaser = true):**
- L'immagine banner e' oscurata/sfocata
- Il titolo potrebbe essere parzialmente rivelato ("H????? E??????")
- La descrizione e' un teaser criptico
- Badge "Coming Soon" con effetto misterioso

**Stato "Rilasciato":**
- Nessun countdown
- Badge "DISPONIBILE ORA" verde
- Bottone diventa "Gioca ora"
- Il banner non e' piu' oscurato

**Accesso anticipato Premium:**
- Per utenti free: riga informativa con link a /pricing
- Per utenti premium il giorno dell'accesso anticipato: badge "Accesso anticipato" dorato, bottone "Gioca in anteprima"

**Layout Mobile:** banner piu' basso (h: 200px), countdown sotto, bottoni full-width.

---

## 5.4 Vista Calendario -- `<ReleaseCalendar />`

### Desktop: Vista a Griglia Settimanale

```typescript
interface ReleaseCalendarProps {
  weeks: CalendarWeek[];          // 3-4 settimane
  releases: Release[];
  activeWorldFilter: string;
}

interface CalendarWeek {
  weekNumber: number;
  startDate: string;
  endDate: string;
  days: CalendarDay[];
}

interface CalendarDay {
  date: string;
  dayOfWeek: string;
  isToday: boolean;
  isPast: boolean;
  releases: Release[];            // giochi rilasciati/previsti per questo giorno
}

interface Release {
  id: string;
  slug: string;
  title: string;
  worldSlug: string;
  worldName: string;
  worldColor: string;
  thumbnailUrl: string;
  difficulty: string;
  releaseDate: string;
  status: 'released' | 'upcoming' | 'teaser';
  type: 'new_game' | 'daily' | 'episode' | 'event';
  isEarlyAccess: boolean;        // true se disponibile in anteprima premium
  earlyAccessDate?: string;
  isNotifyEnabled: boolean;
}
```

**Layout Desktop -- Griglia a 7 colonne:**

```
Calendario uscite

              <- Settimana precedente | Settimana corrente | Settimana prossima ->

+---------+---------+---------+---------+---------+---------+---------+
|  LUN    |  MAR    |  MER    |  GIO    |  VEN    |  SAB    |  DOM    |
|  23 mar |  24 mar |  25 mar |  26 mar |  27 mar |  28 mar |  29 mar |
+---------+---------+---------+---------+---------+---------+---------+
|         |         | +-----+ |  OGGI   |         |         |         |
|  Daily  |  Daily  | | NEW | |         |  Daily  |  Daily  |  Daily  |
|  x3     |  x3     | |GAME | |  Daily  |  x3     |  x3     |  x3    |
|         |  *EA    | |     | |  x3     |         |         |         |
|         |  Hanjie | |Patt.| |         |         |         |         |
|         |  Extr.  | |Logic| |         |         |         |         |
|         |  (prem.)| | 2   | |         |         |         |         |
|         |         | +-----+ |         |         |         |         |
|         |         |  + Ep.4 |         |         |         |         |
|         |         |  Logic  |         |         |         |         |
|         |         |  Series |         |         |         |         |
+---------+---------+---------+---------+---------+---------+---------+

Settimana prossima (30 mar -- 5 apr)
+---------+---------+---------+---------+---------+---------+---------+
|  LUN    |  MAR    |  MER    |  GIO    |  VEN    |  SAB    |  DOM    |
|  30 mar |  31 mar |  1 apr  |  2 apr  |  3 apr  |  4 apr  |  5 apr  |
+---------+---------+---------+---------+---------+---------+---------+
|         |  *EA    | +-----+ |         |         |         |         |
|  Daily  |  Quiz   | |TEASR| |  Daily  |  Daily  |  Daily  |  Daily  |
|  x3     |  Cinema | | ??? | |  x3     |  x3     |  x3     |  x3    |
|         |  (prem.)| |     | |         |         |         |         |
|         |         | |Quiz | |         |         |         |         |
|         |         | |Cine.| |         |         |         |         |
|         |         | +-----+ |         |         |         |         |
+---------+---------+---------+---------+---------+---------+---------+
```

**Cella giorno:**
- Header: giorno settimana + numero + mese
- "OGGI": evidenziato con bordo colore brand
- Giorni passati: sfondo grigio chiaro, opacita' ridotta
- Ogni release e' un mini-card dentro la cella

**Mini-card release dentro la cella:**

```typescript
// In una cella del calendario
interface ReleaseMiniCardProps {
  title: string;
  worldColor: string;             // bordo sinistro colorato
  type: 'new_game' | 'daily' | 'episode' | 'event';
  status: 'released' | 'upcoming' | 'teaser';
  isEarlyAccess: boolean;
}
```

Visualizzazione mini-card:
- **Daily x3:** indicatore piccolo "3 daily" con icona fulmine. Non cliccabile nel calendario (sono sempre 3, sempre li').
- **New Game:** card piu' prominente con bordo colorato (mondo), titolo, badge "NEW" o "TEASER". Cliccabile -> /games/:slug.
- **Episode:** card con indicatore "Ep. N -- Serie Title". Cliccabile -> /games/:seriesSlug.
- **Early Access (martedi'):** card con bordo dorato e icona stella, "EA" badge. Visibile solo se utente premium, altrimenti "Disponibile domani per tutti".
- **Event:** card con bordo speciale, icona evento. Per eventi futuri (tornei, sfide speciali).

### Mobile: Vista Timeline Verticale

Su mobile, la griglia a 7 colonne non e' leggibile. Si usa una timeline verticale.

```
cal Calendario Uscite

Mondo: [Tutti v]

--- OGGI -- Giovedi' 26 marzo ------------------

   bolt 3 sfide giornaliere                           [Gioca ->]

--- Ieri -- Mercoledi' 25 marzo -----------------

   NEW Pattern Logic 2                                [Gioca ->]
      brain BrainLab - ooX Medio
      check Rilasciato

   tv Logic Puzzles S1 -- Ep. 4                       [Gioca ->]
      brain BrainLab - Nuovo episodio

   bolt 3 sfide giornaliere                           [Fatto v]

--- Martedi' 24 marzo --------------------------

   star Accesso anticipato Premium
      Pattern Logic 2 (per utenti Premium)

   bolt 3 sfide giornaliere                           [Fatto v]

--- PROSSIMA SETTIMANA -------------------------

--- Mercoledi' 1 aprile ------------------------

   NEW Quiz Cinema                            timer Tra 5 giorni
      question QuizArena - ooX Medio
      [bell Avvisami]

--- Martedi' 31 marzo --------------------------

   star Quiz Cinema -- Accesso anticipato Premium
      timer Tra 4 giorni

--- SETTIMANA DEL 6 APRILE ---------------------

   question Gioco in arrivo (teaser)          timer Tra ~12 giorni
      Mondo e dettagli saranno rivelati presto...
      [bell Avvisami]
```

**Scroll:** la timeline si estende verso il basso per le settimane future e verso l'alto per lo storico. Load-more in entrambe le direzioni.

**Snap:** la timeline si apre con "OGGI" gia' in viewport, con un indicatore visivo "^ Passato | v Futuro".

---

## 5.5 Release Card (formato espanso, per dettagli) -- `<ReleaseCard />`

Usata quando si clicca su una mini-card nel calendario o nella timeline.

```typescript
interface ReleaseCardProps {
  slug: string;
  title: string;
  description: string;
  worldSlug: string;
  worldName: string;
  worldColor: string;
  thumbnailUrl: string;
  bannerUrl?: string;
  difficulty: string;
  releaseDate: string;
  status: 'released' | 'upcoming' | 'teaser';
  type: 'new_game' | 'episode' | 'event';
  tags: string[];
  isEarlyAccess: boolean;
  earlyAccessDate?: string;
  isNotifyEnabled: boolean;
  playCount?: number;             // se rilasciato
  avgRating?: number;             // se rilasciato
  episodeInfo?: {
    seriesTitle: string;
    episodeNumber: number;
    totalEpisodes: number;
  };
  isPremiumOnly: boolean;
}
```

**Layout (card espansa, inline nel calendario o in modal):**

```
+------------------------------------------------------------------+
|  +-----------------+                                             |
|  |  [Thumbnail]    |   brain BrainLab                            |
|  |  180x120        |                                             |
|  |                 |   Pattern Logic 2                           |
|  |                 |   ooX Medio - Puzzle - Logica               |
|  +-----------------+                                             |
|                                                                  |
|  Trova il pattern nascosto nelle sequenze di numeri              |
|  e forme. 20 livelli di difficolta' crescente con               |
|  meccaniche uniche!                                              |
|                                                                  |
|  cal Rilasciato: 25 marzo 2026                                   |
|  pad 1.2K giocatori - star 4.7                                   |
|                                                                  |
|  [ > Gioca ora ]   [ i Pagina gioco ]                            |
|                                                                  |
|  star Premium: accesso anticipato disponibile dal 24 marzo       |
|                                                                  |
+------------------------------------------------------------------+
```

**Per status 'upcoming':** nessun playCount/rating. Bottone "Gioca ora" sostituito da countdown + "Avvisami".

**Per status 'teaser':** immagine sfocata, titolo parziale o "???", descrizione teaser. Solo bottone "Avvisami".

**Badge "Accesso anticipato Premium":**
- Per giochi in arrivo con `isEarlyAccess = true`:
  - Utenti premium: badge "Gioca in anteprima il [earlyAccessDate]" (o "Gioca ora in anteprima" se la data e' oggi/passata)
  - Utenti free: badge "Premium: accesso anticipato [earlyAccessDate]" con link a /pricing

---

## 5.6 Toggle "Avvisami" -- `<NotifyMeToggle />`

```typescript
interface NotifyMeToggleProps {
  releaseSlug: string;
  isEnabled: boolean;
  onToggle: (slug: string, enabled: boolean) => void;
  isAuthenticated: boolean;
}
```

**Stati:**
1. **Non attivato (default):** icona campana outline, testo "Avvisami". Colore neutro.
2. **Attivato:** icona campana piena, testo "Ti avviseremo!", colore brand, lieve animazione shake della campana al click.
3. **Non autenticato:** click apre modal login con messaggio "Accedi per ricevere notifiche sulle nuove uscite."

**Notifica inviata:** quando il gioco esce, l'utente riceve:
- Notifica in-app (bell notification)
- Email (se attivata nelle preferenze)
- Push notification (se il browser lo supporta e l'utente ha accettato)

**API:**
```
POST /api/v1/releases/:slug/notify
Body: { enabled: boolean }
Response: { data: { enabled: boolean } }
```

---

## 5.7 Storico Uscite Passate -- `<PastReleases />`

Lista delle uscite passate, ordinate per data discendente. Utile per scoprire giochi che l'utente potrebbe aver perso.

```typescript
interface PastReleasesProps {
  releases: Release[];
  hasMore: boolean;
  onLoadMore: () => void;
  userPlayedSlugs: string[];     // per mostrare "Giocato" su quelli gia' provati
}
```

**Layout Desktop:**

```
Uscite passate                                          [Mostra: Tutti v]

--- Marzo 2026 ---------------------------------------------------

+--------+------------------------------------------------------------+
| 25 mar | brain Pattern Logic 2 - ooX Medio - 1.2K plays - 4.7 star |
|  MER   | [Gioca ->]                                                 |
+--------+------------------------------------------------------------+
| 18 mar | pen Crossword ITA - oXX Facile - 2.1K plays - 4.6 star    |
|  MER   | check Giocato - [Rigioca ->]                               |
+--------+------------------------------------------------------------+
| 11 mar | question Quiz Geografia - ooX Medio - 1.8K plays - 4.4 star|
|  MER   | [Gioca ->]                                                 |
+--------+------------------------------------------------------------+
|  4 mar | brain Hanjie Classic - ooo Difficile - 950 plays - 4.8 star|
|  MER   | check Giocato - [Rigioca ->]                               |
+--------+------------------------------------------------------------+

[Carica mesi precedenti]
```

**Indicatore "Giocato":** checkmark verde accanto al titolo se l'utente ha giocato questo gioco almeno una volta.

**Layout Mobile:** stessa lista, ma data a sinistra piu' compatta (solo numero + giorno abbreviato).

**API necessaria:**
```
GET /api/v1/releases/past?world=all&page=1&limit=12
Response: {
  data: Release[],
  meta: {
    total: number,
    page: number,
    perPage: number,
    totalPages: number
  }
}

GET /api/v1/releases/calendar?startDate=2026-03-23&endDate=2026-04-12&world=all
Response: {
  data: {
    weeks: CalendarWeek[]
  }
}
```

---

## 5.8 Pagina Releases -- Differenze Free vs Premium

| Elemento | Free | Premium |
|----------|------|---------|
| Visualizzazione calendario | Completa | Completa |
| Accesso anticipato (martedi') | Card con "Disponibile domani" + CTA Premium | Card con "Gioca in anteprima" attivo |
| Notifiche release | Attivabili | Attivabili |
| Early access badge nel calendario | "PRO" badge dorato sulla card martedi' | "Gioca ora" sulla card martedi' |
| Storico uscite | Completo | Completo |
| Giochi premium-only nello storico | Badge "PRO" + lock | Nessun badge, giocabili |

**Nudge Premium nella pagina releases:**
Sotto la prossima uscita, per utenti free: banner sottile "Con Premium giochi ogni nuova uscita 24h prima di tutti. Provalo gratis per 7 giorni." con bottone "Scopri Premium ->".

---

---

# APPENDICE: Riepilogo Componenti Condivisi

Per facilitare lo sviluppo, ecco l'elenco dei componenti UI riutilizzabili che emergono da questa blueprint:

### Shell e Navigation
- `<TopBar />`
- `<Sidebar />`
- `<BottomNav />`
- `<Footer />`
- `<Modal />` (base)
- `<BottomSheet />` (mobile modal variant)

### Auth e User
- `<AuthModal />` (login/register)
- `<UserMenu />`
- `<StreakCounter />`
- `<XPBar />`
- `<NotificationBell />`

### Cards
- `<GameCard />` (griglia catalogo)
- `<DailyChallengeCard />` (sfide giornaliere)
- `<ContinuePlayingCard />`
- `<TrendingGameCard />`
- `<RecommendedGameCard />`
- `<SeriesCard />`
- `<ReleaseCard />`
- `<ReleaseMiniCard />` (cella calendario)

### Content Sections
- `<WelcomeBanner />`
- `<DailyChallenges />`
- `<ContinuePlaying />`
- `<NewThisWeek />`
- `<ComingSoon />`
- `<TrendingGames />`
- `<MyLeaderboards />`
- `<ActiveSeries />`
- `<RecommendedForYou />`
- `<CommunityFeed />`

### Leaderboard
- `<LeaderboardScopeTabs />`
- `<LeaderboardPeriodTabs />`
- `<LeaderboardPodium />`
- `<LeaderboardTable />`
- `<NearbyPlayers />`
- `<GameMiniLeaderboard />`
- `<DailyLeaderboard />`
- `<ScoringExplainer />`

### Release Calendar
- `<ReleaseCalendar />` (vista griglia desktop)
- `<ReleaseTimeline />` (vista timeline mobile)
- `<NextReleaseHero />`
- `<PastReleases />`
- `<NotifyMeToggle />`
- `<ReleaseWorldFilter />`

### Paywall e Upgrade
- `<UpgradeModal />`
- `<PaywallModal />`
- `<AchievementModal />`
- `<PremiumBadge />`

### Shared UI Primitives
- `<CatalogFilters />`
- `<DifficultyIndicator />` (1/3, 2/3, 3/3 dots)
- `<RatingStars />`
- `<PlayCountBadge />`
- `<CountdownTimer />`
- `<WorldBadge />` (icona + nome mondo colorato)
- `<TrendIndicator />` (UP / DN / STBL)
- `<ProgressBar />`
- `<Carousel />` (scroll orizzontale con snap)

---

Questo documento fornisce la base per la progettazione e l'implementazione di tutte le aree coperte. Ogni componente ha i suoi props tipizzati, i suoi stati, le sue interazioni, e le differenze free/premium specificate. Il passo successivo sara' tradurre questa blueprint in wireframe ad alta fedelta' e poi in componenti React implementati.
