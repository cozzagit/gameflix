# GAMEFLIX — Product Blueprint

> Documento prodotto dal Product Designer (ux-ui-designer + art-director)
> Data: 26 Marzo 2026 | Versione: 1.0
> Riferimento: GAMEFLIX-Product-Design-Document.md (Fase 0 — Discovery)

---

## INDICE

- [1. Pagina Singolo Gioco](#1-pagina-singolo-gioco)
- [2. Profilo Utente](#2-profilo-utente)
- [3. Sistema Badge / Streak / Progressione](#3-sistema-badge--streak--progressione)

---

# 1. PAGINA SINGOLO GIOCO

**Route:** `/games/:game-slug` (es. `/games/sudoku-master`)

Questa pagina NON e il player. E la vetrina informativa del gioco: il punto in cui l'utente decide se giocare, confronta i propri risultati, esplora contenuti correlati.

---

## 1.1 Header del Gioco

### Layout

```
+------------------------------------------------------------------------+
|  [Banner/Thumbnail — 16:9 — 100% larghezza]                           |
|                                                                         |
|    +--[Overlay gradient dal basso]----------------------------------+  |
|    |  [Icona Mondo] BrainLab                                        |  |
|    |  SUDOKU MASTER                                                  |  |
|    |  [Badge: NEW] [Badge: TRENDING] [Badge: PREMIUM]               |  |
|    |  [Tier: Chill/Sharp/Brutal — icona + label]                    |  |
|    +----------------------------------------------------------------+  |
+------------------------------------------------------------------------+
|  [CTA: "Gioca Ora" — bottone primario pieno]     [Icona Condividi]     |
|                                                                         |
|  87% positivo  |  12.4K partite  |  ~8 min  |  Rilasciato 12 Mar 2026  |
+------------------------------------------------------------------------+
```

### Componenti

| Componente | Specifiche | Dati API |
|------------|-----------|----------|
| **Banner/Thumbnail** | Immagine 16:9, `object-fit: cover`, con overlay gradient nero 60% dal basso. Altezza: 280px desktop, 200px mobile | `game.banner_url` oppure fallback su `game.thumbnail_url` |
| **Icona Mondo** | Cerchio 28px con icona del Mondo + nome (es. icona geometrica blu + "BrainLab") | `game.category.name`, `game.category.icon_url` |
| **Titolo** | `<h1>`, font-weight 800, dimensione 32px desktop / 24px mobile, colore bianco sopra overlay | `game.title` |
| **Badge** | Chip colorati inline. NEW = verde, TRENDING = arancione, PREMIUM = gradiente oro, DAILY = rosso. Max 3 visibili | Calcolati: NEW se `published_at` < 7 giorni; TRENDING se `total_plays` ultimi 7gg > soglia; PREMIUM se `game.is_premium`; DAILY se `game.supports_daily && is_today_daily` |
| **Tier difficolta** | Icona + label colorata. Chill = foglia verde, Sharp = fulmine giallo, Brutal = teschio rosso | `game.difficulty` mappato: 1-2 = Chill, 3 = Sharp, 4-5 = Brutal |
| **CTA principale** | Bottone full-width su mobile, 240px su desktop. Colore primario piattaforma. Testo dinamico (vedi sezione Stati) | Stato calcolato da `user.subscription`, `game.is_premium`, `game.release_status` |
| **Icona Condividi** | Bottone icona a destra del CTA. Apre bottom sheet / dropdown con opzioni | N/A |
| **Metriche inline** | Riga orizzontale con separatori. Icone piccole + testo. Font 14px, colore secondario | `game.avg_rating` (convertito in %), `game.total_plays`, `game.estimated_duration_min`, `game.published_at` |

### CTA principale — Testo dinamico per stato

| Stato | Testo CTA | Stile | Azione |
|-------|-----------|-------|--------|
| Gioco free, utente qualsiasi | "Gioca Ora" | Bottone primario pieno | Naviga a `/play/:slug` |
| Gioco premium, utente premium | "Gioca Ora" | Bottone primario pieno | Naviga a `/play/:slug` |
| Gioco premium, utente free | "Sblocca con Premium" | Bottone con icona lucchetto, colore oro | Apre modal upgrade / naviga a `/pricing` |
| Gioco daily, non ancora giocato oggi | "Sfida del Giorno — Gioca" | Bottone primario + badge pulsante | Naviga a `/play/:slug?daily=true` |
| Gioco daily, gia completato oggi | "Completato! Vedi Risultato" | Bottone outline, icona check | Scroll a sezione risultato/classifica |
| Gioco non ancora rilasciato | "Disponibile tra 2g 14h 32m" | Bottone disabilitato con countdown live | Mostra countdown. Sotto: link "Avvisami" |
| Limite free raggiunto (3 giochi/giorno) | "Limite giornaliero raggiunto" | Bottone disabilitato, sotto testo "Sblocca giochi illimitati con Premium" | Testo-link a `/pricing` |

### Dati API necessari

```
GET /api/games/:slug
Response:
{
  data: {
    id, slug, title, description,
    category: { id, name, slug, icon_url, color },
    difficulty, thumbnail_url, banner_url,
    estimated_duration_min, scoring_type,
    supports_daily, is_premium,
    total_plays, avg_rating, active_players,
    published_at, version,
    tags: string[],
    how_to_play: string,         // regole brevi in markdown
    screenshots: string[],       // array URL immagini
    series: {                    // null se non parte di serie
      id, title, slug,
      total_episodes, current_episode,
      episodes: [{ id, title, order, status }]
    },
    badges: string[],            // ["NEW", "TRENDING", "DAILY"]
    release_status: "released" | "scheduled" | "early_access",
    scheduled_at?: string,       // ISO date se non ancora rilasciato
    daily_info?: {               // presente se supports_daily
      date: string,
      expires_at: string,
      user_completed: boolean,
      user_score?: number,
      user_rank?: number
    }
  },
  meta: { user_plays: number, user_best_score: number, user_liked: boolean | null }
}
```

### Responsive

- **Desktop (>1024px):** Banner piena larghezza del content area, metriche su una riga, CTA a destra del titolo.
- **Tablet (768-1024px):** Identico a desktop, metriche su una riga.
- **Mobile (<768px):** Banner piena larghezza, titolo sotto il banner (non overlay), CTA full-width sticky in basso, metriche in griglia 2x2.

---

## 1.2 Sezione Gameplay Info

### Layout

```
+------------------------------------------------------------------------+
|  COME SI GIOCA                                                         |
|                                                                         |
|  [Descrizione — 2-3 paragrafi, con "Leggi tutto" se > 150 parole]     |
|                                                                         |
|  +--------------------+  +--------------------+  +------------------+  |
|  | Regola 1           |  | Regola 2           |  | Regola 3         |  |
|  | Icona + testo      |  | Icona + testo      |  | Icona + testo    |  |
|  +--------------------+  +--------------------+  +------------------+  |
|                                                                         |
|  [Screenshot carousel — 3-5 immagini, swipeable]                       |
|                                                                         |
|  Tags: [Rilassante] [Strategico] [Logica] [Singleplayer]              |
+------------------------------------------------------------------------+
```

### Componenti

| Componente | Specifiche |
|------------|-----------|
| **Titolo sezione** | "Come si Gioca" — `<h2>`, font 20px bold, margine top 32px |
| **Descrizione** | Testo markdown renderizzato. Troncato a 150 parole con link "Leggi tutto" che espande con animazione. Font 16px, line-height 1.6, colore testo secondario |
| **Regole brevi** | 3-5 card orizzontali (scroll su mobile). Ogni card: icona 32px + titolo regola (bold, 14px) + descrizione (regular, 13px). Background card: `surface-secondary`. Border-radius 12px. Padding 16px |
| **Screenshot carousel** | Carousel orizzontale. Immagini con aspect ratio 16:9, border-radius 12px, ombra leggera. Indicatori dot sotto. Desktop: 3 visibili. Mobile: 1 visibile con peek destro (20px del prossimo). Swipe su mobile, frecce su desktop. Click apre lightbox fullscreen |
| **Tags** | Chip non cliccabili. Background `surface-tertiary`, border-radius 20px, font 13px, padding 6px 14px. Separati da 8px di gap |

### Dati API

Contenuti nel payload principale del gioco: `game.description`, `game.how_to_play`, `game.screenshots[]`, `game.tags[]`.

### Responsive

- **Desktop:** Regole in riga orizzontale (flexbox wrap). Carousel 3 colonne.
- **Mobile:** Regole in scroll orizzontale (overflow-x). Carousel singolo con peek. Tags wrap su piu righe.

---

## 1.3 Sezione Classifica del Gioco

### Layout

```
+------------------------------------------------------------------------+
|  CLASSIFICA                                                             |
|                                                                         |
|  [Oggi] [Settimana] [Sempre]        ← Tab attivi/inattivi              |
|                                                                         |
|  +------------------------------------------------------------------+  |
|  |  IL TUO RISULTATO                                                 |  |
|  |  #47  |  LucaCozza  |  1.280 punti  |  Miglior: 1.450           |  |
|  +------------------------------------------------------------------+  |
|                                                                         |
|  +------------------------------------------------------------------+  |
|  |  #1  [Avatar] GiuliaP       2.340 punti   [corona oro]           |  |
|  |  #2  [Avatar] MarcoR        2.180 punti   [corona argento]       |  |
|  |  #3  [Avatar] SaraB         2.050 punti   [corona bronzo]        |  |
|  |  ----                                                             |  |
|  |  #4  [Avatar] AndreaM       1.920 punti                          |  |
|  |  #5  [Avatar] LuigiT        1.870 punti                          |  |
|  |  ...                                                              |  |
|  |  #10 [Avatar] PaoloN        1.540 punti                          |  |
|  +------------------------------------------------------------------+  |
|                                                                         |
|  VICINO A TE                                                           |
|  +------------------------------------------------------------------+  |
|  |  #45 [Avatar] FrancescaD    1.310 punti                          |  |
|  |  #46 [Avatar] RobertoC      1.295 punti                          |  |
|  |  #47 [Avatar] LucaCozza     1.280 punti   ← TU (evidenziato)    |  |
|  |  #48 [Avatar] ElenaV        1.260 punti                          |  |
|  |  #49 [Avatar] DavideG       1.245 punti                          |  |
|  +------------------------------------------------------------------+  |
|                                                                         |
|  [Vedi classifica completa →]                                          |
+------------------------------------------------------------------------+
```

### Componenti

| Componente | Specifiche |
|------------|-----------|
| **Titolo sezione** | "Classifica" — `<h2>`, come sopra |
| **Tab filtro periodo** | 3 tab inline: "Oggi", "Settimana", "Sempre". Tab attivo: testo bold + underline colore primario + background leggero. Cambio tab con transizione fade 200ms. Default: "Oggi" se gioco daily, "Settimana" altrimenti |
| **Card "Il tuo risultato"** | Sfondo con bordo primario leggero (2px), border-radius 12px. Mostra: posizione attuale, avatar mini, display_name, punteggio attuale, miglior punteggio di sempre. Visibile SOLO se l'utente ha giocato almeno una volta. Se non ha giocato: "Gioca per entrare in classifica!" con CTA |
| **Lista Top 10** | Righe con altezza 52px. Posizioni 1-3: icona corona (oro/argento/bronzo) a sinistra del numero. Avatar 32px cerchio. Nome troncato con ellipsis a 120px. Punteggio allineato a destra. Font monospace per numeri. Riga hover: background `surface-secondary`. Click su riga: naviga a profilo utente |
| **Separatore** | Linea tratteggiata tra posizione 3 e 4 per enfatizzare il podio |
| **Sezione "Vicino a te"** | Stessa struttura della Top 10, ma mostra 2 giocatori sopra + l'utente + 2 sotto. Riga dell'utente: sfondo evidenziato con colore primario al 10%, bordo sinistro 3px colore primario. Label "TU" a destra. Visibile solo se utente non e nel Top 10 |
| **Link classifica completa** | Testo-link a `/leaderboard/:game-slug`. Font 14px, colore primario, con freccia destra |

### Dati API

```
GET /api/games/:slug/leaderboard?period=today|week|alltime&limit=10
Response:
{
  data: {
    top: [
      { rank, user: { id, display_name, avatar_url }, score, plays }
    ],
    user_entry: {
      rank, score, best_score, total_plays,
      neighbors: [
        { rank, user: { id, display_name, avatar_url }, score }
      ]
    },
    total_players: number
  }
}
```

### Stati

| Stato | Comportamento |
|-------|--------------|
| Utente non autenticato | Top 10 visibile. "Il tuo risultato" sostituito da "Accedi per entrare in classifica" con CTA login |
| Utente autenticato, mai giocato | Top 10 visibile. Card utente: "Gioca la tua prima partita!" |
| Utente autenticato, nel Top 10 | "Vicino a te" nascosto, riga utente evidenziata nella Top 10 |
| Utente autenticato, fuori Top 10 | Top 10 + "Vicino a te" entrambi visibili |
| Classifica vuota (gioco nuovo) | Messaggio: "Sii il primo a entrare in classifica!" con illustrazione vuota |
| Gioco con scoring_type "time" | Punteggio mostrato come tempo (mm:ss). Ordinamento crescente (meno tempo = migliore) |
| Gioco con scoring_type "completion" | Nessuna classifica per tempo/punti. Mostra solo "X giocatori hanno completato" |

### Responsive

- **Desktop:** Sezione in colonna, larghezza piena del content area.
- **Mobile:** Identica struttura. Tab scroll orizzontale se necessario. Nomi troncati piu aggressivamente (80px max).

---

## 1.4 Sezione Sociale

### Layout

```
+------------------------------------------------------------------------+
|  +-------------------+  +-------------------+  +-------------------+   |
|  | [Pollice Su] 342  |  | [Pollice Giu] 41  |  | [Condividi]       |  |
|  +-------------------+  +-------------------+  +-------------------+   |
|                                                                         |
|  [Icona utenti] 47 persone stanno giocando ora                         |
+------------------------------------------------------------------------+
```

### Componenti

| Componente | Specifiche |
|------------|-----------|
| **Like/Dislike** | Due bottoni affiancati. Icona pollice + contatore numerico. Stato: neutro (outline), attivo-like (pieno verde), attivo-dislike (pieno rosso). Click su like quando gia dislike: switcha (e viceversa). Animazione: bounce 300ms sull'icona al click. Contatori aggiornati ottimisticamente (senza aspettare risposta API) |
| **Condividi** | Bottone con icona share. Click apre bottom sheet (mobile) o dropdown (desktop) con opzioni: "Copia link", "WhatsApp", "Twitter/X", "Facebook", "Telegram". Il link condiviso genera una preview OpenGraph con immagine del gioco, titolo, e breve descrizione |
| **Player count** | Testo con icona utenti. Se `active_players >= 10`: "X persone stanno giocando ora" (numero live via WebSocket). Se `active_players < 10`: "Giocato X volte" (contatore statico da `total_plays`). Se `total_plays < 100`: non mostrare nulla per evitare effetto "ristorante vuoto" |

### Dati API

```
POST /api/games/:slug/like    — body: { value: "like" | "dislike" | "none" }
GET  /api/games/:slug/social  — response: { likes, dislikes, user_vote, active_players }
WebSocket room: game:{gameId} — evento: "player_count_update"
```

### Comportamento autenticazione

- Utente non autenticato che clicca like/dislike: mostra toast "Accedi per votare" con link login.
- Utente non autenticato: condivisione comunque disponibile.

---

## 1.5 Sezione Serie (condizionale)

Visibile SOLO se `game.series !== null`.

### Layout

```
+------------------------------------------------------------------------+
|  SERIE: LOGICA SPAZIALE — STAGIONE 2                                   |
|  Progresso: [=======>          ] 3/8 episodi completati                |
|                                                                         |
|  +------------------------------------------------------------------+  |
|  |  [Check verde] Ep. 1 — Il Cubo Rotante      [Completato] 1.280  |  |
|  |  [Check verde] Ep. 2 — Specchi Infiniti      [Completato] 1.450  |  |
|  |  [Play blu]    Ep. 3 — Il Labirinto           ← CORRENTE         |  |
|  |  [Lucchetto]   Ep. 4 — Gravita Inversa       [Premium]           |  |
|  |  [Lucchetto]   Ep. 5 — Dimensione Parallela  [Premium]           |  |
|  |  [Lucchetto]   Ep. 6 — Il Paradosso          [Bloccato]          |  |
|  |  [Lucchetto]   Ep. 7 — Convergenza           [Bloccato]          |  |
|  |  [Lucchetto]   Ep. 8 — Finale                [Bloccato]          |  |
|  +------------------------------------------------------------------+  |
+------------------------------------------------------------------------+
```

### Componenti

| Componente | Specifiche |
|------------|-----------|
| **Titolo serie** | `<h2>` con nome della serie. Link cliccabile a `/series/:series-slug` |
| **Progress bar** | Barra orizzontale. Sfondo `surface-tertiary`. Fill colore primario con animazione di ingresso. Label "X/Y episodi completati" a destra. Altezza 8px, border-radius 4px |
| **Lista episodi** | Lista verticale. Ogni riga: icona stato (24px) + "Ep. N" (bold) + titolo + stato/punteggio a destra. Altezza riga 48px. Righe cliccabili navigano alla pagina del gioco dell'episodio |

### Stati episodio

| Stato | Icona | Stile riga | Azione click |
|-------|-------|-----------|-------------|
| Completato | Cerchio check verde | Testo normale, punteggio visibile | Naviga a pagina gioco (per rigiocare) |
| Corrente | Cerchio play blu pulsante | Testo bold, sfondo evidenziato leggermente | Naviga a pagina gioco |
| Premium (utente free) | Lucchetto oro | Testo opacita 60%, badge "Premium" | Naviga a pagina gioco (con CTA upgrade) |
| Bloccato (sequenziale) | Lucchetto grigio | Testo opacita 40% | Toast "Completa l'episodio precedente" |
| Non ancora rilasciato | Orologio grigio | Testo opacita 40%, data rilascio | Non cliccabile |

### Dati API

Inclusi nel payload principale del gioco (`game.series`).

### Responsive

- **Desktop:** Lista completa, tutti gli episodi visibili.
- **Mobile:** Se > 6 episodi, mostra i primi 4 + "Mostra tutti" che espande con animazione slide-down.

---

## 1.6 Sezione Giochi Simili

### Layout

```
+------------------------------------------------------------------------+
|  POTREBBE PIACERTI ANCHE                                               |
|                                                                         |
|  +----------+  +----------+  +----------+  +----------+               |
|  | [Thumb]  |  | [Thumb]  |  | [Thumb]  |  | [Thumb]  |               |
|  | Titolo   |  | Titolo   |  | Titolo   |  | Titolo   |               |
|  | BrainLab |  | BrainLab |  | WordForge|  | BrainLab |               |
|  | Sharp    |  | Chill    |  | Chill    |  | Brutal   |               |
|  | 92% pos  |  | 88% pos  |  | 95% pos  |  | 78% pos  |               |
|  +----------+  +----------+  +----------+  +----------+               |
+------------------------------------------------------------------------+
```

### Componenti

| Componente | Specifiche |
|------------|-----------|
| **Titolo sezione** | "Potrebbe piacerti anche" — `<h2>` |
| **Card gioco** | 4 card su desktop (griglia 4 colonne), 2 colonne su tablet, scroll orizzontale su mobile. Ogni card: thumbnail 4:3 (border-radius 12px top), titolo (16px bold, 1 riga max con ellipsis), nome Mondo (13px, colore Mondo), tier difficolta (13px, chip colorato), rating percentuale (13px, colore secondario). Card intere cliccabili. Hover: scala 1.02 con ombra. Transizione 200ms |
| **Logica selezione** | Algoritmo: stessa categoria (peso 3) + stessi tag (peso 2) + stesso tier (peso 1). Escludere il gioco corrente. Max 6 risultati, mostrarne 4 su desktop. Se < 4 risultati nella stessa categoria, completare con giochi popolari di altre categorie |

### Dati API

```
GET /api/games/:slug/similar?limit=6
Response:
{
  data: [
    { id, slug, title, thumbnail_url, category: { name, color }, difficulty, avg_rating }
  ]
}
```

---

## 1.7 Stati della Pagina — Riepilogo Globale

La pagina `/games/:slug` ha 6 varianti principali che influenzano layout e CTA:

### Stato 1: Gioco Free Accessibile

- Qualsiasi utente (autenticato o meno) puo giocare.
- CTA: "Gioca Ora" primario.
- Nessun banner di upsell.
- Se utente non autenticato: toast al completamento "Registrati per salvare i tuoi progressi!".

### Stato 2: Gioco Premium — Utente Free

- Pagina completamente visibile (non gated — l'utente deve VEDERE cosa si perde).
- CTA: "Sblocca con Premium — 4.99 EUR/mese" con icona lucchetto.
- Banner sottile sotto l'header: "Questo gioco e riservato agli abbonati Premium. [Scopri Premium]".
- Classifica visibile, ma posizione utente non calcolata.
- Screenshots e descrizione al 100% visibili (no blur, no paywall sul contenuto informativo).

### Stato 3: Gioco Premium — Utente Premium

- Identico allo Stato 1. CTA "Gioca Ora".
- Badge "Premium" nel profilo utente visibile nella navbar come conferma.

### Stato 4: Gioco Non Ancora Rilasciato

- Banner con countdown grande e animato (giorni:ore:minuti:secondi).
- CTA: "Avvisami al Rilascio" — input email (se non autenticato) o toggle notifica (se autenticato).
- Descrizione e screenshot (teaser) visibili.
- Classifica: sezione nascosta, sostituita da "Classifica disponibile dopo il rilascio".
- Sezione social nascosta.
- Se accesso anticipato Premium: CTA cambia a "Accesso Anticipato — Gioca Ora" 24h prima del rilascio pubblico.

### Stato 5: Gioco Daily — Sfida del Giorno

- Badge "SFIDA DEL GIORNO" prominente nell'header, con colore rosso pulsante.
- Timer countdown "Scade tra Xh Ym" visibile sotto il banner.
- CTA: "Sfida del Giorno — Gioca" se non completata.
- Se completata: CTA cambia in "Completato!" con punteggio e posizione.
- Classifica mostra solo il tab "Oggi" con tab attivo di default.
- Sotto la classifica: "Condividi il tuo risultato" con card social pre-generata.

### Stato 6: Limite Free Raggiunto

- Utente free che ha gia giocato 3 partite oggi.
- CTA: "Limite Giornaliero Raggiunto" (disabilitato).
- Sotto CTA: "Hai usato 3/3 partite gratuite oggi. Torna domani o [Passa a Premium] per giocare senza limiti".
- Tutta la pagina informativa resta visibile.
- Classifica visibile.

---

## 1.8 Il Player — Vista di Gioco

**Route:** `/play/:game-slug` (es. `/play/sudoku-master`)

Quando l'utente clicca "Gioca Ora", transizione alla vista player.

### Transizione

- Animazione: fade-out della pagina gioco (300ms) + fade-in del player (300ms).
- URL cambia da `/games/:slug` a `/play/:slug`.
- Back button del browser riporta a `/games/:slug`.
- Navbar della piattaforma RESTA visibile (versione compatta) su desktop.
- Su mobile: navbar nascosta, player full-screen.

### Layout Desktop

```
+------------------------------------------------------------------------+
|  [Logo Gameflix compatto]  Sudoku Master  |  02:34  |  480pt  | [Pausa]|
+-----------------------------------------------------+------------------+
|                                                      |                  |
|                                                      |  CLASSIFICA LIVE |
|                                                      |  #1 GiuliaP 2340 |
|                                                      |  #2 MarcoR  2180 |
|                    AREA DEL GIOCO                    |  #3 SaraB   2050 |
|                  (componente React)                  |  ...              |
|                    min 600x400px                     |  #47 Tu     ---   |
|                                                      |                  |
|                                                      |  SUGGERIMENTO    |
|                                                      |  [Usa sugger.]   |
|                                                      |  2 rimasti       |
|                                                      |                  |
+-----------------------------------------------------+------------------+
```

### Layout Mobile

```
+----------------------------------+
|  SUDOKU MASTER                   |
|  02:34  |  480pt  |  [Pausa]    |
+----------------------------------+
|                                  |
|                                  |
|         AREA DEL GIOCO           |
|        (full-width, flex)        |
|                                  |
|                                  |
|                                  |
+----------------------------------+
|  [Sugger.]  [Classif.]  [Pausa] |
+----------------------------------+
```

### Componenti del Player

| Componente | Desktop | Mobile |
|------------|---------|--------|
| **Barra superiore** | Inline: Logo compatto (24px) + titolo gioco + timer (contatore mm:ss, font monospace, aggiornamento ogni secondo) + punteggio live + bottone pausa | Titolo gioco su riga 1, timer + punteggio + pausa su riga 2 |
| **Area gioco** | Centrata, dimensione adattiva (min 600x400, max 900x600). Sfondo neutro per non interferire coi colori del gioco. Padding 24px | Full-width, full-height disponibile (100vw x altezza rimanente). No padding laterale |
| **Sidebar classifica** | Pannello fisso 280px a destra. Top 5 + posizione utente. Aggiornamento live via WebSocket. Collassabile con bottone freccia. Stato collapsed: solo icona trofeo con posizione utente | Nascosta. Accessibile da bottone "Classif." nella bottom bar che apre bottom sheet (50% altezza schermo) |
| **Suggerimenti** | Nella sidebar sotto la classifica. Bottone "Usa Suggerimento" + contatore "X rimasti". Premium: 3 suggerimenti/partita. Free: 1 suggerimento. Esauriti: bottone disabilitato | Nella bottom bar, icona lampadina con badge contatore |
| **Bottom bar mobile** | N/A | Barra fissa in basso, altezza 56px, 3 icone: Suggerimento, Classifica, Pausa. Sfondo `surface`, bordo superiore sottile, safe area bottom |

### Pausa

- Click su pausa: overlay scuro 80% sopra il gioco.
- Al centro: "Gioco in Pausa" + timer fermo + due CTA: "Riprendi" (primario) e "Esci" (secondario).
- Timer si ferma. Punteggio non cambia.
- Il gioco sottostante e offuscato (CSS `filter: blur(8px)`) per prevenire "pausa strategica" su puzzle visivi.

### Schermata Risultato (Post-Partita)

Appare al completamento del gioco. Overlay full-screen con animazione slide-up (400ms).

```
+------------------------------------------------------------------------+
|                                                                         |
|                    [Icona celebrativa / animazione]                     |
|                                                                         |
|                         PARTITA COMPLETATA!                            |
|                                                                         |
|               +--------------------------------------------+           |
|               |  Punteggio:     1.280 punti                |           |
|               |  Tempo:         4:32                        |           |
|               |  Posizione:     #47 su 234 giocatori       |           |
|               +--------------------------------------------+           |
|                                                                         |
|               XP GUADAGNATI                                            |
|               +--------------------------------------------+           |
|               |  Partita completata      +10 XP            |           |
|               |  Daily completato        +25 XP            |           |
|               |  Streak giorno 14        +5 XP             |           |
|               |  TOTALE                  +40 XP            |           |
|               +--------------------------------------------+           |
|               [Progress bar livello: Livello 11 =======> 12]           |
|                                                                         |
|               CONFRONTO                                                |
|               +--------------------------------------------+           |
|               |  vs Media:  +12%  [barra comparativa]      |           |
|               |  vs Record: -8%   [barra comparativa]      |           |
|               +--------------------------------------------+           |
|                                                                         |
|  [Condividi Risultato]  [Gioca Ancora]  [Prossimo Gioco →]            |
|                                                                         |
+------------------------------------------------------------------------+
```

### Componenti Schermata Risultato

| Componente | Specifiche |
|------------|-----------|
| **Animazione celebrativa** | Confetti leggeri (canvas, 2 secondi) per punteggi nel Top 10. Stella animata per nuovo record personale. Icona neutra per completamento standard. Libreria: canvas-confetti (~3KB) |
| **Punteggio** | Font grande (40px) bold. Se nuovo record: label "NUOVO RECORD!" con colore oro e icona stella |
| **Posizione classifica** | "#N su X giocatori". Se Top 3: icona corona con colore corrispondente. Se miglioramento: freccia verde "salito di Y posizioni" |
| **XP guadagnati** | Lista dettagliata con breakdown per fonte. Ogni riga: descrizione + "+N XP" allineato a destra. Totale bold con separatore sopra. Animazione: numeri contano da 0 al valore finale (400ms, easing out) |
| **Progress bar livello** | Mostra livello corrente a sinistra, livello successivo a destra. Barra che si riempie con animazione. Se level-up avvenuto: animazione speciale (vedi sezione 3.2) |
| **Confronto** | Barra orizzontale che mostra il punteggio dell'utente vs la media di tutti i giocatori e vs il suo record personale. Colore verde se sopra, rosso se sotto |
| **CTA "Condividi"** | Genera immagine social (OG image) con punteggio, posizione, gioco, streak. Apre share sheet nativo su mobile, dropdown con opzioni su desktop |
| **CTA "Gioca Ancora"** | Bottone secondario. Riavvia la stessa partita (nuova sessione) |
| **CTA "Prossimo Gioco"** | Bottone primario. Naviga al prossimo gioco suggerito (stessa categoria, tier simile). Se daily: naviga al prossimo daily non completato. Se serie: naviga al prossimo episodio |

### Dati API (Post-Partita)

```
POST /api/games/:slug/complete
Body: { score, duration_sec, session_data, is_daily }
Response:
{
  data: {
    score, duration_sec,
    rank: number,
    total_players: number,
    is_new_record: boolean,
    previous_best: number | null,
    xp_breakdown: [
      { source: string, label: string, amount: number }
    ],
    total_xp_earned: number,
    new_level: number | null,        // se level-up avvenuto
    new_title: string | null,        // se titolo cambiato
    badges_earned: [                 // badge sbloccati con questa partita
      { id, slug, name, icon_url, xp_reward }
    ],
    streak: {
      current: number,
      is_new_milestone: boolean,
      milestone_badge: { ... } | null
    },
    comparison: {
      vs_average_pct: number,        // +12 o -8
      vs_personal_best_pct: number
    },
    next_game: {                     // suggerimento prossimo gioco
      slug, title, thumbnail_url, category_name
    }
  }
}
```

### Differenze Free/Premium nel Player

| Aspetto | Free | Premium |
|---------|------|---------|
| Suggerimenti per partita | 1 | 3 |
| Ads | Banner discreto sotto il gioco (non overlay, non interstitial) | Nessuna pubblicita |
| XP guadagnati | 100% | 100% (stesso) |
| Classifica | Visibile ma limitata a Top 10 | Completa |
| Condivisione risultato | Si, con watermark "Gameflix" | Si, senza watermark, con badge Premium |
| Post-partita | Banner "Vuoi giocare senza limiti? [Prova Premium]" | Nessun banner upsell |

---

# 2. PROFILO UTENTE

---

## 2.1 Pagina Profilo Pubblico

**Route:** `/profile/:username`

Il profilo e l'identita sociale dell'utente su Gameflix. E pubblico di default (con opzione per renderlo privato nelle impostazioni).

### Layout Completo Desktop

```
+------------------------------------------------------------------------+
|  HEADER PROFILO                                                         |
|  +------------------------------------------------------------------+  |
|  |  [Avatar 96px]   LucaCozza                                       |  |
|  |                  Esperto — Livello 12                             |  |
|  |                  [Badge Premium oro]                               |  |
|  |                  [=======>     ] 680/800 XP per Liv. 13           |  |
|  |                  Membro da marzo 2026                             |  |
|  |                                          [Modifica Profilo]       |  |
|  +------------------------------------------------------------------+  |
|                                                                         |
|  STATISTICHE                                                           |
|  +----------+ +----------+ +----------+ +----------+ +----------+     |
|  | Streak   | | Giochi   | | XP       | | Classif. | | Mondo    |     |
|  | 14 gg    | | 247      | | 3.480    | | #47      | | BrainLab |     |
|  | Best: 28 | | completat| | totali   | | globale  | | preferito|     |
|  +----------+ +----------+ +----------+ +----------+ +----------+     |
|                                                                         |
|  BADGE (12/28 sbloccati)                  [Vedi tutti →]               |
|  +------+ +------+ +------+ +------+ +------+ +------+               |
|  |Badge1| |Badge2| |Badge3| |Badge4| |Badge5| |Badge6|               |
|  +------+ +------+ +------+ +------+ +------+ +------+               |
|                                                                         |
|  ATTIVITA RECENTE                                                      |
|  +------------------------------------------------------------------+  |
|  |  Oggi 14:23  Ha completato BrainLab Daily in 2:34     +25 XP    |  |
|  |  Oggi 14:20  Nuovo record in Sudoku Master: 1.450pt   +10 XP    |  |
|  |  Ieri 22:15  Ha raggiunto il Livello 12!                         |  |
|  |  Ieri 21:50  Badge sbloccato: "Settimana di Fuoco"    +50 XP    |  |
|  |  2gg fa      Ha completato WordForge Daily in 1:12     +25 XP    |  |
|  +------------------------------------------------------------------+  |
|                                                                         |
|  CLASSIFICHE                                                           |
|  +------------------------------------------------------------------+  |
|  |  Globale:   #47 (+5 dalla settimana scorsa)            [^verde]  |  |
|  |  BrainLab:  #12 (-3)                                   [v rosso] |  |
|  |  WordForge: #89 (=)                                     [= grig] |  |
|  |  QuizArena: #156 (+22)                                  [^verde] |  |
|  +------------------------------------------------------------------+  |
|                                                                         |
|  GIOCHI PREFERITI                                                      |
|  +----------+ +----------+ +----------+ +----------+ +----------+     |
|  | [Thumb]  | | [Thumb]  | | [Thumb]  | | [Thumb]  | | [Thumb]  |     |
|  | Sudoku   | | Cruci    | | Quiz Geo | | Nonogram | | Anagramm |     |
|  | Master   | | verba    | | grafia   | | mi       | | i        |     |
|  | Best:    | | Best:    | | Best:    | | Best:    | | Best:    |     |
|  | 1.450    | | 2.100    | | 890      | | 1.200    | | 1.780    |     |
|  | 34 part. | | 28 part. | | 22 part. | | 18 part. | | 15 part. |     |
|  +----------+ +----------+ +----------+ +----------+ +----------+     |
|                                                                         |
|  SERIE                                                                 |
|  +------------------------------------------------------------------+  |
|  |  Logica Spaziale S2    [===========>    ] 5/8 completati         |  |
|  |  WordForge Cinema      [======>         ] 3/6 completati         |  |
|  |  Quiz Italia           [================] Completata!             |  |
|  +------------------------------------------------------------------+  |
+------------------------------------------------------------------------+
```

---

### 2.1.1 Header Profilo

| Componente | Specifiche | Dati API |
|------------|-----------|----------|
| **Avatar** | Cerchio 96px desktop, 72px mobile. Bordo 3px colore tier titolo (bronzo/argento/oro/platino/diamante). Se nessun avatar: iniziali su sfondo colore generato da hash username | `user.avatar_url` oppure fallback generato |
| **Display name** | `<h1>`, font 28px bold desktop, 22px mobile | `user.display_name` |
| **Titolo corrente** | Testo sotto il nome. Colore del tier: Novizio (grigio), Giocatore (verde), Esperto (blu), Maestro (viola), Leggenda (oro). Con icona piccola accanto | Calcolato da `user.current_level` |
| **Livello** | "Livello N" — stessa riga del titolo, separato da " — " | `user.current_level` |
| **Badge Premium** | Chip dorato con testo "Premium" e icona stella. Visibile SOLO se utente ha abbonamento attivo | `user.has_premium` |
| **Progress bar XP** | Barra orizzontale, larghezza 240px desktop / full-width mobile. Sfondo `surface-tertiary`, fill colore primario. Label: "X/Y XP per Livello N+1". Altezza 6px, border-radius 3px | `user.total_xp`, livello corrente, soglia prossimo livello (calcolata) |
| **Data iscrizione** | "Membro da [mese anno]" — testo piccolo (13px), colore terziario | `user.created_at` formattato |
| **CTA** | Se proprio profilo: "Modifica Profilo" (bottone secondario, naviga a `/settings`). Se profilo altrui: "Segui" (bottone primario) / "Seguendo" (bottone outline, click unfollows con conferma) | Stato follow: API dedicata |

### 2.1.2 Statistiche Principali

5 card numeriche in riga orizzontale (scroll su mobile).

| Card | Contenuto | Icona | Nota |
|------|-----------|-------|------|
| **Streak attuale** | Numero giorni + icona fuoco. Sotto: "Migliore: N" in testo piccolo | Fiamma | Se streak = 0: mostra "0" con icona grigia. Se > 0: icona animata (flame flicker CSS) |
| **Giochi completati** | Numero totale di partite completate | Gamepad | Contatore statico |
| **XP totali** | Numero formattato (es. 3.480) | Stella | Abbreviato se > 100K (es. "124K") |
| **Posizione globale** | "#N" nella classifica globale XP | Trofeo | Se classifica non disponibile: "—" |
| **Mondo preferito** | Nome del Mondo con piu partite giocate + icona colorata del Mondo | Icona Mondo | Se parita: mostra il primo in ordine alfabetico |

**Stile card:** Sfondo `surface-secondary`, border-radius 12px, padding 20px, min-width 140px. Numero grande (28px bold), label sotto (13px, colore secondario). Hover su desktop: leggero sollevamento con ombra.

### 2.1.3 Sezione Badge/Achievement

| Componente | Specifiche |
|------------|-----------|
| **Titolo** | "Badge" + contatore "(X/Y sbloccati)" + link "Vedi tutti" a destra che naviga a `/achievements` |
| **Griglia badge** | Griglia 6 colonne desktop, 4 tablet, 3 mobile. Ogni cella: icona badge 56px + nome sotto (12px, 1 riga max). Badge sbloccati: icona piena con colore. Badge non sbloccati: icona in scala di grigi con opacita 30%. Hover su badge sbloccato: tooltip con nome completo + data ottenimento. Hover su badge non sbloccato: tooltip con condizione (o "???" se segreto) |
| **Selezione mostrata** | Nel profilo mostrare max 12 badge: prima i badge rari sbloccati, poi i piu recenti. I restanti visibili in `/achievements` |
| **Badge rari** | I primi 3 badge con minor percentuale di giocatori che li hanno: bordo luminoso (glow CSS) e label "Raro" o "Leggendario" |

### 2.1.4 Sezione Attivita Recente

| Componente | Specifiche |
|------------|-----------|
| **Titolo** | "Attivita Recente" |
| **Timeline** | Lista verticale con linea laterale sinistra (2px, colore `border`). Ogni elemento: dot sulla linea (8px cerchio pieno) + timestamp + descrizione attivita + XP (se applicabile). Max 10 elementi. Ultimi 7 giorni |
| **Tipi di attivita** | `game_completed`: "Ha completato [NomeGioco] in [tempo]" + XP. `level_up`: "Ha raggiunto il Livello N!" con icona celebrativa. `badge_earned`: "Badge sbloccato: [NomeBadge]" con icona badge mini. `streak_milestone`: "Streak di N giorni!" con icona fuoco. `new_record`: "Nuovo record in [NomeGioco]: X punti" |
| **Timestamp** | "Oggi HH:MM", "Ieri HH:MM", "Xgg fa", data completa se > 7gg. Font 12px, colore terziario |
| **Vuoto** | Se nessuna attivita: "Nessuna attivita recente. Gioca una partita per iniziare!" con illustrazione |

### 2.1.5 Sezione Classifiche

| Componente | Specifiche |
|------------|-----------|
| **Titolo** | "Classifiche" |
| **Lista** | Una riga per classifica attiva. Ogni riga: icona Mondo (o icona globale) + nome classifica + posizione "#N" + trend. Border-bottom 1px su ogni riga tranne l'ultima |
| **Trend** | Calcolato confrontando posizione corrente con posizione della settimana scorsa. Salito: freccia verde su + "+" + numero posizioni. Sceso: freccia rossa giu + "-" + numero posizioni. Stabile: "=" grigio. Nuovo: "NEW" badge blu (prima settimana) |
| **Click** | Ogni riga cliccabile: naviga alla classifica corrispondente con utente evidenziato |

### 2.1.6 Sezione Giochi Preferiti

| Componente | Specifiche |
|------------|-----------|
| **Titolo** | "Giochi Preferiti" |
| **Card** | 5 card in riga (scroll su mobile). Ogni card: thumbnail 1:1 (80px, border-radius 8px) + titolo (14px bold) + miglior punteggio + numero partite giocate. Card cliccabili: navigano a `/games/:slug` |
| **Selezione** | Top 5 per numero di partite giocate. Se < 5 giochi giocati: mostra tutti quelli disponibili |

### 2.1.7 Sezione Serie

| Componente | Specifiche |
|------------|-----------|
| **Titolo** | "Serie" |
| **Lista** | Ogni riga: nome serie (cliccabile a `/series/:slug`) + progress bar inline + "X/Y completati" o "Completata!" con check verde. Serie in corso prima, completate dopo. Max 5 visibili, poi "Mostra tutte" |

### Dati API — Profilo Completo

```
GET /api/users/:username/profile
Response:
{
  data: {
    id, display_name, avatar_url,
    current_level, total_xp,
    title: "Esperto",
    has_premium: boolean,
    created_at,

    stats: {
      current_streak: number,
      best_streak: number,
      games_completed: number,
      total_xp: number,
      global_rank: number | null,
      favorite_world: { name, slug, icon_url, color } | null
    },

    badges: [
      { id, slug, name, icon_url, category, earned_at, rarity_pct }
    ],                              // solo sbloccati, ordinati per rarita
    total_badges_available: number,

    recent_activity: [
      { type, description, xp_earned, game_slug?, badge_slug?, created_at }
    ],

    rankings: [
      { scope: "global" | "world", world_slug?, rank, trend: number, trend_label: "up"|"down"|"stable"|"new" }
    ],

    favorite_games: [
      { slug, title, thumbnail_url, category_name, best_score, total_plays }
    ],

    series_progress: [
      { series_slug, series_title, completed_episodes, total_episodes, is_completed }
    ],

    is_own_profile: boolean,
    is_following: boolean | null,  // null se non autenticato
    privacy: "public" | "private"
  }
}
```

### Responsive

- **Desktop (>1024px):** Layout a colonna singola, larghezza max 800px centrata. Stat cards in riga.
- **Tablet (768-1024px):** Stessa struttura, stat cards in riga con scroll se necessario.
- **Mobile (<768px):** Stat cards in scroll orizzontale. Badge griglia 3 colonne. Giochi preferiti in scroll orizzontale. Header profilo con avatar sopra il nome (layout centrato verticale).

---

## 2.2 Differenze "Mio Profilo" vs "Profilo Altrui"

| Elemento | Mio Profilo | Profilo Altrui |
|----------|-------------|----------------|
| CTA header | "Modifica Profilo" → `/settings` | "Segui" / "Seguendo" |
| Badge non sbloccati | Mostrati in grigio con condizione visibile (incentivo) | Nascosti — mostra solo i badge ottenuti |
| Sezione extra | "I Tuoi Obiettivi" — i prossimi 3 badge piu vicini allo sblocco con progress bar | Non presente |
| Attivita recente | Completa con tutti i tipi | Solo attivita "pubbliche" (no XP dettagliato) |
| Classifiche | Tutte con trend dettagliato | Stesso, ma senza confronto diretto |
| Streak | Miglior streak visibile | Solo streak corrente (miglior streak e dato privato) |
| Settings | Link a `/settings` nel dropdown menu | Non presente |
| Profilo privato | N/A (e sempre il proprio) | Mostra solo: avatar, nome, titolo, livello, badge Premium. Tutto il resto: "Questo profilo e privato" |

### Sezione "I Tuoi Obiettivi" (solo mio profilo)

```
+------------------------------------------------------------------------+
|  I TUOI OBIETTIVI                                                       |
|                                                                         |
|  +------------------------------------------------------------------+  |
|  |  [Icona badge grigia] Maratoneta                                  |  |
|  |  Gioca 100 partite                                                |  |
|  |  [====================>        ] 78/100                           |  |
|  +------------------------------------------------------------------+  |
|  |  [Icona badge grigia] Esploratore dei Mondi                       |  |
|  |  Gioca almeno 1 gioco in ogni Mondo                               |  |
|  |  [===========>                 ] 2/3 Mondi                        |  |
|  +------------------------------------------------------------------+  |
|  |  [Icona badge grigia] Settimana di Fuoco                          |  |
|  |  Mantieni uno streak di 7 giorni                                  |  |
|  |  [==================>          ] 5/7 giorni                        |  |
|  +------------------------------------------------------------------+  |
+------------------------------------------------------------------------+
```

Mostra i 3 badge non ancora sbloccati che sono piu vicini al completamento (in percentuale). Per ogni obiettivo: icona badge in scala di grigi, nome, condizione, progress bar con contatore numerico.

---

## 2.3 Pagina Impostazioni

**Route:** `/settings`

Accessibile SOLO dal proprio profilo. Redirect a `/login` se non autenticato.

### Layout

```
+------------------------------------------------------------------------+
|  IMPOSTAZIONI                                                           |
|                                                                         |
|  +--- Sidebar ---+  +--- Contenuto --------------------------------+  |
|  | Profilo       |  |                                               |  |
|  | Account       |  |  PROFILO                                      |  |
|  | Abbonamento   |  |                                               |  |
|  | Notifiche     |  |  Display Name                                 |  |
|  | Privacy       |  |  [LucaCozza________________] [Salva]           |  |
|  | Aspetto       |  |                                               |  |
|  |               |  |  Avatar                                       |  |
|  |               |  |  [Avatar attuale 64px]                        |  |
|  |               |  |  [grid 6x4 di avatar predefiniti]             |  |
|  |               |  |  Click per selezionare. Bordo primario        |  |
|  |               |  |  sull'avatar selezionato.                     |  |
|  |               |  |                                               |  |
|  +---------------+  +-----------------------------------------------+  |
+------------------------------------------------------------------------+
```

### Sezioni

#### Profilo
| Campo | Tipo | Validazione | Note |
|-------|------|-------------|------|
| Display Name | Text input | 3-20 caratteri, alfanumerico + underscore, unico | Cambio max 1 volta ogni 30 giorni. Se tentativo prima dei 30gg: messaggio con data disponibile |
| Avatar | Griglia selezione | N/A | 24 avatar predefiniti (illustrazioni coerenti con brand Gameflix). Organizzati in 4 righe da 6. Click seleziona, bordo primario 3px. Salvataggio immediato (no bottone salva per avatar). Premium: 8 avatar extra esclusivi (segnalati con stella dorata) |

#### Account
| Campo | Tipo | Note |
|-------|------|------|
| Email | Text input (readonly) + "Cambia email" link | Cambia email richiede conferma via email. Non modificabile direttamente. Mostra email con asterischi parziali |
| Password | Link "Cambia password" | Apre form: password attuale + nuova password + conferma. Validazione: min 12 caratteri. Dopo cambio: invalida tutte le sessioni tranne quella corrente |
| Provider OAuth | Info readonly | Se registrato con Google: mostra "Collegato con Google [email]". Opzione "Scollega" solo se ha una password impostata |

#### Abbonamento
| Stato | Cosa mostra |
|-------|-------------|
| Free | Card: "Piano Free" + "Passa a Premium per 4.99 EUR/mese" + CTA "Scopri Premium" (naviga a `/pricing`) + lista 3 vantaggi principali |
| Premium attivo | Card: "Piano Premium" + "Prossimo rinnovo: [data]" + "Gestisci abbonamento" (link a Stripe Customer Portal) + "Annulla abbonamento" (link a Stripe Customer Portal). Badge Premium mostrato |
| Premium annullato ma ancora attivo | Card: "Piano Premium — Scade il [data]" + "Il tuo abbonamento non si rinnova. Riattiva." + CTA "Riattiva" (link a Stripe Customer Portal) |
| Periodo trial | Card: "Trial Premium — X giorni rimanenti" + "Il trial scade il [data]. Dopo verrai addebitato 4.99 EUR/mese." + link gestione |

#### Notifiche
| Notifica | Tipo | Default |
|----------|------|---------|
| Daily reminder | Toggle on/off | On |
| Nuove uscite settimanali | Toggle on/off | On |
| Il tuo streak sta per scadere | Toggle on/off | On |
| Riepilogo settimanale | Toggle on/off | Off |
| Email marketing/promo | Toggle on/off | Off |

Tutte le notifiche sono via email (MVP: no push notifications). Ogni toggle salva automaticamente (debounce 500ms).

#### Privacy
| Impostazione | Tipo | Default | Note |
|--------------|------|---------|------|
| Profilo pubblico | Toggle | On | Off = profilo privato, visibili solo avatar, nome, titolo, livello |
| Mostra in classifiche | Toggle | On | Off = risultati registrati ma nome nascosto nelle classifiche (mostra "Anonimo") |
| Mostra attivita recente | Toggle | On | Off = sezione attivita nascosta dal profilo pubblico |

#### Aspetto
| Impostazione | Tipo | Default |
|--------------|------|---------|
| Tema | Selector: Chiaro / Scuro / Sistema | Sistema |

Cambio tema: transizione CSS 300ms. Persistenza in localStorage + database (sync).

#### Zona Pericolosa (fondo pagina)
| Azione | Comportamento |
|--------|--------------|
| Elimina Account | Testo rosso. Click apre modale di conferma: "Sei sicuro? Questa azione e irreversibile. Tutti i tuoi dati, progressi, badge e abbonamento verranno eliminati." + input "Scrivi ELIMINA per confermare" + bottone rosso "Elimina Account Definitivamente". Se abbonamento attivo: prima avvisa "Hai un abbonamento attivo. Verra annullato immediatamente senza rimborso." |

### Dati API — Settings

```
GET  /api/users/me/settings
Response: { display_name, avatar_url, email, email_masked, oauth_provider,
            subscription: { plan, status, current_period_end, cancel_at_period_end },
            notifications: { daily_reminder, new_releases, streak_warning, weekly_recap, marketing },
            privacy: { public_profile, show_in_leaderboards, show_activity },
            theme: "light" | "dark" | "system" }

PATCH /api/users/me/settings
Body:  (qualsiasi subset dei campi sopra)

PATCH /api/users/me/display-name
Body:  { display_name }
Response: { success, next_change_available_at }

PATCH /api/users/me/avatar
Body:  { avatar_id }

POST  /api/users/me/change-password
Body:  { current_password, new_password }

DELETE /api/users/me
Body:  { confirmation: "ELIMINA" }
```

### Responsive — Settings

- **Desktop:** Sidebar sinistra (200px) + contenuto a destra. Sidebar fissa.
- **Mobile:** Sidebar sostituita da lista navigabile (full-width). Click su sezione: transizione slide-right al contenuto. Back button per tornare alla lista. Pattern: navigation drill-down.

---

# 3. SISTEMA BADGE / STREAK / PROGRESSIONE

---

## 3.1 Sistema Streak

### Regole di Funzionamento

| Regola | Specifica |
|--------|----------|
| **Come si mantiene** | L'utente deve completare almeno 1 partita da almeno 2 minuti di durata in un giorno solare (00:00 — 23:59, timezone dell'utente). NON basta aprire un gioco — bisogna completarlo |
| **Quando si incrementa** | Alla mezzanotte del giorno successivo, se il giorno corrente ha almeno 1 partita valida. In pratica: il contatore si aggiorna visivamente in tempo reale alla prima partita del giorno, ma il giorno e "confermato" solo a mezzanotte |
| **Quando si perde** | Se alle 23:59:59 di un giorno il contatore di partite del giorno e 0 (e non c'e Streak Freeze attiva). Reset a 0 alle 00:00 del giorno successivo |
| **Streak Freeze** | Solo utenti Premium. 1 freeze gratuita a settimana (si rigenera ogni lunedi alle 00:00). La freeze si attiva AUTOMATICAMENTE se il giorno finisce senza partite. L'utente NON deve attivarla manualmente. Viene notificato: "Il tuo Streak Freeze ti ha salvato! Hai ancora X freeze questa settimana." |
| **Miglior streak** | Salvato nel profilo per sempre. Aggiornato quando il contatore corrente supera il record |
| **Timezone** | Basata sulla timezone impostata nel browser dell'utente. Determinata al primo login, modificabile in settings (Fase 2) |

### Visualizzazione — Navbar

Lo streak e SEMPRE visibile nella navbar, accanto all'avatar utente.

```
[Icona Fuoco] 14
```

| Stato | Visualizzazione |
|-------|----------------|
| Streak 0 | Icona fuoco grigia + "0". Nessuna animazione |
| Streak 1-6 | Icona fuoco arancione statica + numero |
| Streak 7-29 | Icona fuoco arancione con animazione flicker leggera (CSS animation, 2s loop) + numero |
| Streak 30-89 | Icona fuoco rossa con animazione flicker + numero + sfondo circolare leggero |
| Streak 90-179 | Icona fuoco rossa con particelle (CSS pseudo-elements) + numero + glow effect |
| Streak 180-364 | Icona fuoco viola con particelle + numero bold + glow oro |
| Streak 365+ | Icona fuoco diamante (blu iridescente) con animazione premium + numero + sfondo speciale |

### Animazione Incremento Streak

Quando il numero cresce (prima partita del giorno):

1. Numero vecchio: slide-up + fade-out (200ms)
2. Numero nuovo: slide-up da sotto + bounce in (300ms, easing spring)
3. Flash luminoso circolare attorno all'icona (200ms)
4. Se milestone raggiunto: popup badge automatico (vedi sezione 3.5)

### Notifica "Streak in Pericolo"

| Quando | Canale | Contenuto |
|--------|--------|-----------|
| 20:00 ora locale (se nessuna partita quel giorno) | Notifica in-app (banner top) | "Il tuo streak di X giorni sta per scadere! Gioca una partita veloce per mantenerlo." + CTA "Gioca Ora" → naviga alla daily piu veloce |
| 21:00 ora locale (se ancora nessuna partita) | Email (se notifica abilitata) | Subject: "Il tuo streak di X giorni sta per scadere!" Body: reminder + link diretto alla daily. Tono: urgente ma amichevole |
| Al login (se streak perso il giorno prima) | Modal in-app | Popup empatico (vedi sotto) |

### Popup Perdita Streak

```
+------------------------------------------+
|                                          |
|  [Illustrazione: fiamma che si spegne]   |
|                                          |
|  Oh no! Il tuo streak e finito           |
|                                          |
|  Avevi raggiunto 14 giorni consecutivi.  |
|  Il tuo record resta 28 giorni!          |
|                                          |
|  Non preoccuparti — ricomincia oggi      |
|  e vedrai che lo supererai!              |
|                                          |
|  [Ricomincia Ora — Gioca]               |
|                                          |
|  Suggerimento: con Premium hai la        |
|  Streak Freeze automatica!              |
|  [Scopri Premium]                        |
|                                          |
+------------------------------------------+
```

- Tono: empatico, mai punitivo. Mai usare "hai perso" — dire "e finito" o "si e interrotto".
- Se utente free: mostra suggerimento Premium.
- Se utente Premium (aveva usato tutte le freeze): tono rassicurante senza upsell.
- Il popup appare UNA sola volta (al primo login dopo la perdita). Mai ripetuto.

### Calendario Streak (nel profilo)

Griglia tipo GitHub contribution graph. Ultimi 90 giorni di default (toggle per 30/90/365).

```
+------------------------------------------------------------------------+
|  CALENDARIO STREAK                          [30gg] [90gg] [365gg]      |
|                                                                         |
|  Gen  Feb  Mar                                                          |
|  L . . . . . .  . . . . . . .  . . . . . . .                          |
|  M . . . . . .  . . . . . . .  . . . . . . .                          |
|  M . . . . . .  . . . . . . .  . . . . . . .                          |
|  G . . . . . .  . . . . . . .  . . . . . . .                          |
|  V . . . . . .  . . . . . . .  . . . . . . .                          |
|  S . . . . . .  . . . . . . .  . . . . . . .                          |
|  D . . . . . .  . . . . . . .  . . . . . . .                          |
|                                                                         |
|  [Grigio chiaro] = nessuna partita                                     |
|  [Verde chiaro]  = 1 partita                                           |
|  [Verde medio]   = 2-3 partite                                         |
|  [Verde scuro]   = 4+ partite                                          |
|  [Blu/Freeze]    = Streak Freeze usata                                 |
+------------------------------------------------------------------------+
```

- Hover su un quadrato: tooltip con data, numero partite, se streak freeze usata.
- Il giorno corrente: bordo pulsante se nessuna partita ancora (reminder visivo).
- Responsive mobile: scroll orizzontale, mostra solo 30gg.

### Milestone Streak e Badge Associati

| Giorni | Nome Badge | Icona | XP Reward | Rarita |
|--------|-----------|-------|-----------|--------|
| 7 | "Settimana di Fuoco" | Fiamma bronzo | 50 XP | Comune |
| 14 | "Due Settimane Infernali" | Fiamma argento | 75 XP | Comune |
| 30 | "Mese di Fiamme" | Fiamma oro | 150 XP | Non comune |
| 60 | "Fiamma Inestinguibile" | Fiamma con aura | 250 XP | Raro |
| 90 | "Trimestre di Fuoco" | Fiamma platino | 400 XP | Raro |
| 180 | "Semestre Leggendario" | Fiamma con corona | 750 XP | Epico |
| 365 | "Un Anno di Fuoco" | Fiamma diamante iridescente | 1.500 XP | Leggendario |

---

## 3.2 Sistema XP e Livelli

### Tabella XP per Azione

| Azione | XP | Condizione | Note |
|--------|-----|-----------|------|
| Completare una partita | 10 XP | Partita di almeno 2 minuti, completata | Base. Stesso valore per tutti i giochi |
| Completare la sfida giornaliera (Daily) | 25 XP | Completare un gioco contrassegnato come daily del giorno | Bonus rispetto alla partita base (totale: 10+25 = 35 XP per daily) |
| Primo posto nella sfida giornaliera | 50 XP bonus | Essere #1 nella classifica daily a fine giornata | Assegnato a mezzanotte. Se gia assegnato e qualcuno supera: ricalcolo |
| Top 3 nella sfida giornaliera | 25 XP bonus | Essere #2 o #3 nella classifica daily a fine giornata | Incentivo a competere |
| Provare un gioco per la prima volta | 15 XP | Completare un gioco mai giocato prima | Incentiva esplorazione |
| Mantenere lo streak (giornaliero) | 5 XP | Ogni giorno con streak attivo | Accumulativo: giorno 14 = 70 XP totali da streak |
| Milestone streak (ogni 7 giorni) | 50 XP bonus | Raggiungere 7, 14, 21, 28... giorni | Si somma al badge XP se applicabile |
| Completare una sfida settimanale | 100 XP | Completare un obiettivo settimanale (Fase 2) | Non presente in MVP, riservato |
| Sbloccare un badge | Variabile | Ottenere un badge qualsiasi | XP definito per ogni badge (vedi sezione 3.3) |
| Completare tutti i daily del giorno | 30 XP bonus | Completare 3/3 daily (uno per Mondo) | Solo Premium (free ha 1 daily/giorno) |
| Nuovo record personale in un gioco | 20 XP | Superare il proprio miglior punteggio | Max 1 volta al giorno per gioco |
| Completare un episodio di serie | 15 XP | Completare un episodio | Si somma ai 10 XP della partita |
| Completare una serie intera | 100 XP bonus | Completare tutti gli episodi di una serie | Una tantum per serie |
| Primo gioco dopo la registrazione | 25 XP bonus | Completare il primo gioco in assoluto | Onboarding |

### Curva di Livellamento

Progressione logaritmica: i primi livelli si raggiungono rapidamente per gratificazione immediata, poi rallenta per dare senso di traguardo.

| Livello | XP Richiesti (cumulativo) | XP per questo livello | Titolo | Tempo stimato |
|---------|--------------------------|----------------------|--------|---------------|
| 1 | 0 | — | Novizio | Inizio |
| 2 | 50 | 50 | Novizio | ~1 giorno |
| 3 | 120 | 70 | Novizio | ~2 giorni |
| 4 | 210 | 90 | Novizio | ~3 giorni |
| 5 | 330 | 120 | Giocatore | ~5 giorni |
| 6 | 480 | 150 | Giocatore | ~1 settimana |
| 7 | 660 | 180 | Giocatore | ~1.5 settimane |
| 8 | 880 | 220 | Giocatore | ~2 settimane |
| 9 | 1.140 | 260 | Giocatore | ~2.5 settimane |
| 10 | 1.450 | 310 | Esperto | ~3 settimane |
| 11 | 1.810 | 360 | Esperto | ~1 mese |
| 12 | 2.230 | 420 | Esperto | ~1.5 mesi |
| 13 | 2.720 | 490 | Esperto | ~2 mesi |
| 14 | 3.280 | 560 | Esperto | ~2.5 mesi |
| 15 | 3.920 | 640 | Maestro | ~3 mesi |
| 16 | 4.650 | 730 | Maestro | ~3.5 mesi |
| 17 | 5.470 | 820 | Maestro | ~4 mesi |
| 18 | 6.400 | 930 | Maestro | ~5 mesi |
| 19 | 7.450 | 1.050 | Maestro | ~6 mesi |
| 20 | 8.630 | 1.180 | Leggenda | ~7 mesi |
| 21 | 9.960 | 1.330 | Leggenda | ~8 mesi |
| 22 | 11.460 | 1.500 | Leggenda | ~9 mesi |
| 23 | 13.160 | 1.700 | Leggenda | ~10 mesi |
| 24 | 15.080 | 1.920 | Leggenda | ~11 mesi |
| 25 | 17.250 | 2.170 | Leggenda | ~1 anno |
| 26 | 19.700 | 2.450 | Leggenda | ~1.2 anni |
| 27 | 22.470 | 2.770 | Leggenda | ~1.4 anni |
| 28 | 25.600 | 3.130 | Leggenda | ~1.6 anni |
| 29 | 29.140 | 3.540 | Leggenda | ~1.8 anni |
| 30 | 33.140 | 4.000 | Leggenda | ~2 anni |

**Formula:** `XP_per_livello(n) = floor(50 * n^1.35)` (arrotondata per coerenza).

**Dopo livello 30:** Formula continua. Nessun cap. Il titolo resta "Leggenda" ma il numero livello continua a salire.

**Tempo stimato:** Basato su un utente che gioca 1-2 partite al giorno + daily + streak.

### Titoli per Livello

| Range Livello | Titolo | Colore | Icona |
|---------------|--------|--------|-------|
| 1-4 | Novizio | Grigio (#9CA3AF) | Scudo semplice |
| 5-9 | Giocatore | Verde (#22C55E) | Scudo con stella |
| 10-14 | Esperto | Blu (#3B82F6) | Scudo con 2 stelle |
| 15-19 | Maestro | Viola (#8B5CF6) | Scudo con corona |
| 20+ | Leggenda | Oro (#F59E0B) | Scudo dorato con corona fiammeggiante |

### Visualizzazione XP — Navbar

```
[Avatar 28px] LucaCozza  [Fuoco]14  [Barra XP mini]Lv.12
```

- Barra XP mini: larghezza 60px, altezza 4px, nella navbar accanto al livello.
- Visibile solo su desktop. Su mobile: solo il numero livello.
- Hover sulla barra: tooltip "680/800 XP per Livello 13".

### Animazione Level-Up

Quando l'utente raggiunge un nuovo livello, popup celebrativo full-screen (overlay):

```
+------------------------------------------+
|                                          |
|  [Animazione: cerchio di luce che        |
|   esplode dal centro, particelle         |
|   del colore del nuovo titolo]           |
|                                          |
|         LIVELLO 10 RAGGIUNTO!            |
|                                          |
|  [Icona scudo Esperto — grande, animato] |
|                                          |
|         Sei ora un ESPERTO               |
|  (se il titolo e cambiato — altrimenti   |
|   mostra solo "Livello N!")              |
|                                          |
|  [Continua]                              |
|                                          |
+------------------------------------------+
```

- Durata totale animazione: 2.5 secondi.
- Particelle: colore del nuovo titolo.
- Se il titolo cambia (es. Giocatore -> Esperto): animazione piu elaborata con zoom sull'icona del nuovo titolo + testo "Sei ora un [TITOLO]".
- Se il titolo NON cambia (level up entro lo stesso range): animazione piu breve, solo "Livello N!" senza cambio titolo.
- Bottone "Continua" chiude il popup.
- Il popup appare DOPO la schermata risultato post-partita, se il level-up e avvenuto durante quella partita.

### XP nel Contesto Post-Partita

Nella schermata risultato (sezione 1.8), il breakdown XP mostra:

```
XP GUADAGNATI
+--------------------------------------------+
|  Partita completata         +10 XP         |
|  Daily completato           +25 XP         |
|  Streak giorno 14           +5 XP          |
|  Primo gioco di QuizArena   +15 XP         |
|  Nuovo record personale     +20 XP         |
|  ——————————————————————————————————         |
|  TOTALE                     +75 XP         |
+--------------------------------------------+
[===============================>     ] 680/800 XP per Livello 13
```

- Ogni riga appare con animazione sequenziale (stagger 200ms per riga).
- Il numero XP appare con contatore animato (da 0 al valore, 300ms).
- La progress bar si riempie con animazione dopo che il totale e visualizzato.
- Se level-up: la barra si riempie al 100%, flash, poi si resetta con il nuovo livello — e il popup level-up appare.

---

## 3.3 Sistema Badge/Achievement — Catalogo Completo MVP

### Categoria: Primi Passi (6 badge)

| # | Nome | Icona | Condizione | XP | Rarita |
|---|------|-------|-----------|-----|--------|
| 1 | "Benvenuto su Gameflix" | Mano che saluta | Completa il tutorial / prima partita | 25 XP | Comune (100% dei giocatori) |
| 2 | "Prima Vittoria" | Stella singola | Ottieni un punteggio in un qualsiasi gioco | 10 XP | Comune |
| 3 | "Collezionista" | Tre carte | Gioca 3 giochi diversi | 15 XP | Comune |
| 4 | "Esploratore Curioso" | Bussola | Gioca almeno 1 gioco in ogni Mondo (3/3) | 50 XP | Non comune |
| 5 | "Primo Podio" | Podio bronzo | Entra nella Top 10 di una classifica qualsiasi | 30 XP | Non comune |
| 6 | "Social Player" | Cuore | Metti il primo Like a un gioco | 10 XP | Comune |

### Categoria: Streak (7 badge)

| # | Nome | Icona | Condizione | XP | Rarita |
|---|------|-------|-----------|-----|--------|
| 7 | "Settimana di Fuoco" | Fiamma bronzo | Streak di 7 giorni | 50 XP | Comune |
| 8 | "Due Settimane Infernali" | Fiamma argento | Streak di 14 giorni | 75 XP | Comune |
| 9 | "Mese di Fiamme" | Fiamma oro | Streak di 30 giorni | 150 XP | Non comune |
| 10 | "Fiamma Inestinguibile" | Fiamma con aura | Streak di 60 giorni | 250 XP | Raro |
| 11 | "Trimestre di Fuoco" | Fiamma platino | Streak di 90 giorni | 400 XP | Raro |
| 12 | "Semestre Leggendario" | Fiamma con corona | Streak di 180 giorni | 750 XP | Epico |
| 13 | "Un Anno di Fuoco" | Fiamma diamante | Streak di 365 giorni | 1.500 XP | Leggendario |

### Categoria: Maestria (6 badge)

| # | Nome | Icona | Condizione | XP | Rarita |
|---|------|-------|-----------|-----|--------|
| 14 | "Mente Acuta" | Cervello | Completa 10 partite in BrainLab | 30 XP | Comune |
| 15 | "Paroliere" | Lettera A stilizzata | Completa 10 partite in WordForge | 30 XP | Comune |
| 16 | "Tuttologia" | Lampadina | Completa 10 partite in QuizArena | 30 XP | Comune |
| 17 | "Difficile Non Vuol Dire Impossibile" | Teschio sorridente | Completa 5 giochi a difficolta Brutal | 100 XP | Non comune |
| 18 | "Speedrunner" | Cronometro | Completa un qualsiasi gioco in meno della meta del tempo medio | 75 XP | Raro |
| 19 | "Perfezione" | Diamante | Ottieni il punteggio massimo possibile in un gioco | 150 XP | Raro |

### Categoria: Esplorazione (4 badge)

| # | Nome | Icona | Condizione | XP | Rarita |
|---|------|-------|-----------|-----|--------|
| 20 | "Maratoneta" | Scarpa da corsa | Completa 100 partite (totale) | 100 XP | Non comune |
| 21 | "Campione della Serie" | Trofeo con nastro | Completa una serie intera (tutti gli episodi) | 100 XP | Non comune |
| 22 | "Collezionista Seriale" | Scaffale di trofei | Completa 3 serie intere | 200 XP | Raro |
| 23 | "Daily Devoto" | Calendario con check | Completa 30 sfide giornaliere (non consecutive) | 100 XP | Non comune |

### Categoria: Sociale (2 badge)

| # | Nome | Icona | Condizione | XP | Rarita |
|---|------|-------|-----------|-----|--------|
| 24 | "Critico" | Megafono | Vota (Like o Dislike) 10 giochi diversi | 30 XP | Comune |
| 25 | "Influencer" | Onda radio | Condividi un risultato sui social (click su condividi — non verifica la pubblicazione) | 20 XP | Comune |

### Categoria: Speciali (3 badge)

| # | Nome | Icona | Condizione | XP | Rarita |
|---|------|-------|-----------|-----|--------|
| 26 | "Early Adopter" | Razzo | Registrato durante il primo mese dal lancio | 100 XP | Epico (una tantum, non piu ottenibile dopo) |
| 27 | "Nottambulo" | Luna | Completa una partita tra le 00:00 e le 05:00 | 25 XP | Non comune |
| 28 | "Re del Weekend" | Corona con sole | Completa 5 partite in un singolo weekend (sabato+domenica) | 50 XP | Non comune |

### Sistema Rarita

| Rarita | Colore bordo badge | Glow effect | Significato |
|--------|-------------------|-------------|-------------|
| Comune | Grigio (#9CA3AF) | Nessuno | Ottenuto dal 50%+ dei giocatori |
| Non comune | Verde (#22C55E) | Nessuno | Ottenuto dal 20-50% |
| Raro | Blu (#3B82F6) | Leggero glow blu | Ottenuto dal 5-20% |
| Epico | Viola (#8B5CF6) | Glow viola pulsante | Ottenuto dall'1-5% |
| Leggendario | Oro (#F59E0B) | Glow oro con particelle | Ottenuto da meno dell'1% |

La rarita e DINAMICA: viene ricalcolata settimanalmente in base alla percentuale effettiva di giocatori che l'hanno ottenuto. I colori e i glow cambiano di conseguenza.

---

## 3.4 Pagina Achievement

**Route:** `/achievements` (oppure sezione espandibile nel profilo)

### Layout

```
+------------------------------------------------------------------------+
|  I TUOI ACHIEVEMENT                                                     |
|  [============================>       ] 18/28 sbloccati (64%)          |
|                                                                         |
|  Filtro: [Tutti] [Primi Passi] [Streak] [Maestria] [Esplorazione]     |
|          [Sociale] [Speciali] [Solo sbloccati] [Solo da sbloccare]     |
|                                                                         |
+------------------------------------------------------------------------+
|                                                                         |
|  PRIMI PASSI  (5/6)                                                    |
|  +------+ +------+ +------+ +------+ +------+ +------+               |
|  |[IMG] | |[IMG] | |[IMG] | |[IMG] | |[IMG] | |[???] |               |
|  |Benv. | |Prima | |Colle.| |Espl. | |Primo | |???   |               |
|  |check | |check | |check | |check | |check | |SEGR. |               |
|  +------+ +------+ +------+ +------+ +------+ +------+               |
|                                                                         |
|  STREAK  (4/7)                                                         |
|  +------+ +------+ +------+ +------+ +------+ +------+ +------+      |
|  |[IMG] | |[IMG] | |[IMG] | |[IMG] | |[grey]| |[grey]| |[grey]|      |
|  |7gg   | |14gg  | |30gg  | |60gg  | |90gg  | |180gg | |365gg |      |
|  |check | |check | |check | |check | |lock  | |lock  | |lock  |      |
|  +------+ +------+ +------+ +------+ +------+ +------+ +------+      |
|                                                                         |
|  MAESTRIA  (3/6)                                                       |
|  ...                                                                    |
|                                                                         |
+------------------------------------------------------------------------+
```

### Componenti

| Componente | Specifiche |
|------------|-----------|
| **Progress bar globale** | Barra orizzontale piena larghezza. "X/Y sbloccati (Z%)". Fill colore primario. Animazione di ingresso |
| **Filtri** | Chip selezionabili (multi-select). "Tutti" e il default. I filtri per categoria mostrano/nascondono le sezioni. "Solo sbloccati" / "Solo da sbloccare" sono toggle esclusivi |
| **Sezione per categoria** | Titolo categoria + contatore "(X/Y)" + griglia badge |
| **Badge sbloccato** | Icona piena a colori (64px), bordo colore rarita con glow se raro+. Nome sotto (12px). Click: apre dettaglio modal |
| **Badge non sbloccato (condizione nota)** | Icona in scala di grigi, opacita 30%. Nome visibile. Sotto: progress bar se badge a soglia (es. "34/100 partite"). Click: apre dettaglio con condizione completa |
| **Badge non sbloccato (segreto)** | Icona "?" su sfondo scuro. Nome: "???". Testo: "Badge Segreto — Continua a giocare per scoprirlo!". Nessun hint sulla condizione |

### Modal Dettaglio Badge

```
+------------------------------------------+
|  [Icona badge grande 96px]               |
|                                          |
|  SETTIMANA DI FUOCO                      |
|  Categoria: Streak                       |
|  Rarita: Comune (78% dei giocatori)      |
|                                          |
|  "Mantieni uno streak di 7 giorni"       |
|                                          |
|  Sbloccato il 15 Marzo 2026             |
|  Ricompensa: +50 XP                      |
|                                          |
|  [Chiudi]                                |
+------------------------------------------+
```

Per badge non sbloccati: stessa struttura ma icona grigia, data sostituita da progress bar (se applicabile) o "Non ancora sbloccato".

### Dati API

```
GET /api/users/me/achievements
Response:
{
  data: {
    total_earned: number,
    total_available: number,
    categories: [
      {
        slug: "streak",
        name: "Streak",
        earned: number,
        total: number,
        badges: [
          {
            id, slug, name, description, icon_url,
            category, rarity: "common"|"uncommon"|"rare"|"epic"|"legendary",
            rarity_pct: number,    // 78.5
            xp_reward: number,
            is_earned: boolean,
            earned_at: string | null,
            is_secret: boolean,
            progress: {            // null se non a soglia
              current: number,
              target: number
            }
          }
        ]
      }
    ]
  }
}
```

### Responsive

- **Desktop:** Griglia 6 colonne per badge.
- **Tablet:** 4 colonne.
- **Mobile:** 3 colonne. Filtri in scroll orizzontale. Modal dettaglio = bottom sheet.

---

## 3.5 Popup e Notifiche di Gamification

### Gerarchia e Priorita delle Notifiche

Quando un utente completa una partita, possono scattare multiple notifiche contemporaneamente. L'ordine di visualizzazione e:

| Priorita | Notifica | Tipo | Durata |
|----------|----------|------|--------|
| 1 (piu alta) | Level-up | Modal full-screen (overlay) | Fino a click "Continua" |
| 2 | Cambio titolo | Parte dell'animazione level-up | Parte del level-up |
| 3 | Badge sbloccato | Modal centrato | Fino a click "Continua" o 5s auto-dismiss |
| 4 | Streak milestone | Toast grande (top) | 4 secondi, auto-dismiss |
| 5 | Nuovo record personale | Toast medio (top) | 3 secondi, auto-dismiss |
| 6 (piu bassa) | XP guadagnati | Inline nella schermata risultato | Sempre visibile |

### Regole di Stacking

- **Mai piu di 1 modal contemporaneamente.** Se level-up + badge nello stesso momento: prima level-up, poi badge (sequenziale, con 500ms di pausa tra i due).
- **Toast possono stackarsi:** max 3 toast visibili contemporaneamente, impilati dall'alto. Il quarto toast spinge il primo fuori con animazione slide-up.
- **XP e sempre inline:** mai un popup per gli XP, sempre nella schermata risultato.
- **Badge durante il gioco vs post-partita:** I badge vengono verificati SOLO al completamento della partita (mai durante). Il check e lato server alla chiamata `POST /api/games/:slug/complete`. I badge sbloccati arrivano nella response e vengono mostrati nella schermata post-partita, dopo gli XP.

### Toast Notification

```
+--------------------------------------------------+
|  [Icona]  Testo breve                     [X]   |
|           Sotto-testo (opzionale)                |
+--------------------------------------------------+
```

- Posizione: top-right su desktop, top-center full-width su mobile.
- Animazione ingresso: slide-in da destra (desktop) / slide-down (mobile), 300ms.
- Animazione uscita: fade-out + slide-up, 200ms.
- Sfondo: `surface` con bordo sinistro 4px colorato (verde per successo, oro per achievement, rosso per streak perso).
- Auto-dismiss: timer configurabile (3-5s). Hover su toast: pausa timer.
- Click su toast: naviga alla sezione pertinente (es. click su badge toast → `/achievements`).

### Badge Popup (Modal)

```
+------------------------------------------+
|  [Animazione: cerchio che si apre]       |
|                                          |
|  BADGE SBLOCCATO!                        |
|                                          |
|  [Icona badge 80px con glow animato]     |
|                                          |
|  SETTIMANA DI FUOCO                      |
|  Mantieni uno streak di 7 giorni         |
|                                          |
|  +50 XP                                  |
|                                          |
|  [Fantastico!]                            |
+------------------------------------------+
```

- Overlay scuro 60%.
- Animazione: l'icona del badge appare con effetto "sblocco" (scala da 0 a 1 con bounce, 600ms).
- Se badge raro+: particelle colorate attorno all'icona.
- Suono: un "ding" sottile e soddisfacente (opzionale, rispetta impostazione mute del browser).
- Bottone "Fantastico!" chiude il modal.
- Se multipli badge contemporaneamente: mostrati uno alla volta con 500ms di pausa. Bottone diventa "Prossimo" per i non-ultimi, "Fantastico!" per l'ultimo.

### Streak Milestone Toast

```
+--------------------------------------------------+
|  [Fiamma animata]  Streak di 14 giorni!           |
|                    Continua cosi!          [X]   |
+--------------------------------------------------+
```

- Bordo sinistro: colore della fiamma corrispondente al milestone.
- Icona fuoco: animata con lo stile del milestone raggiunto.
- Durata: 4 secondi.

### Dove si Accumulano le Notifiche Non Lette

Le notifiche persistono in un "Centro Notifiche" accessibile dalla navbar.

```
Navbar: [Logo]  [Ricerca]  [Fuoco 14]  [Campanella (3)]  [Avatar]
```

| Componente | Specifiche |
|------------|-----------|
| **Icona campanella** | Nella navbar. Badge rosso con numero di notifiche non lette (max "9+"). Nascosto se 0 |
| **Dropdown notifiche** | Click sulla campanella: dropdown 360px larghezza, max-height 480px con scroll. Header: "Notifiche" + "Segna tutte come lette". Lista cronologica inversa |
| **Elemento notifica** | Icona tipo (badge/streak/level/record) + testo + timestamp relativo. Non letto: sfondo leggermente evidenziato. Click: naviga alla destinazione (profilo, achievement, gioco). Swipe left (mobile): "Segna come letto" |

### Dati API — Notifiche

```
GET /api/notifications?unread_only=true&limit=20
Response:
{
  data: [
    {
      id, type: "badge_earned"|"level_up"|"streak_milestone"|"new_record"|"streak_lost"|"new_release",
      title: string,
      body: string,
      icon_url: string,
      action_url: string,     // "/achievements" o "/games/sudoku-master"
      is_read: boolean,
      created_at: string
    }
  ],
  meta: { unread_count: number }
}

PATCH /api/notifications/:id/read
PATCH /api/notifications/read-all
```

### Riepilogo Flusso Completo Post-Partita

L'utente completa una partita. Ecco la sequenza completa degli eventi UI:

```
1. Gioco chiama platform.completeGame(result)
2. POST /api/games/:slug/complete → risposta con tutti i dati
3. Transizione a schermata risultato (slide-up, 400ms)
4. Animazione punteggio (contatore da 0, 400ms)
5. Animazione posizione classifica (fade-in, 300ms)
6. Animazione breakdown XP (stagger 200ms per riga)
7. Animazione progress bar livello (fill, 500ms)
8. Se level-up: barra raggiunge 100% → flash → popup level-up
9. Dopo chiusura level-up (o se no level-up): popup badge (se sbloccati)
10. Toast streak milestone (se raggiunto) — appare sopra la schermata
11. Toast nuovo record (se applicabile) — stack sotto streak toast
12. Utente vede i 3 CTA: Condividi / Gioca Ancora / Prossimo Gioco
```

Tempo totale animazioni (caso completo con level-up + badge + streak): ~6-7 secondi.
Tempo totale animazioni (caso base senza eventi speciali): ~2-3 secondi.

---

## Appendice A — Riepilogo Endpoint API

### Pagina Gioco
| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | `/api/games/:slug` | Dettaglio gioco + meta utente |
| GET | `/api/games/:slug/leaderboard` | Classifica con filtro periodo |
| GET | `/api/games/:slug/similar` | Giochi simili |
| GET | `/api/games/:slug/social` | Like/dislike + player count |
| POST | `/api/games/:slug/like` | Vota like/dislike |
| POST | `/api/games/:slug/complete` | Completa partita (post-game) |

### Profilo
| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | `/api/users/:username/profile` | Profilo pubblico completo |
| GET | `/api/users/me/settings` | Impostazioni proprie |
| PATCH | `/api/users/me/settings` | Aggiorna impostazioni |
| PATCH | `/api/users/me/display-name` | Cambia display name |
| PATCH | `/api/users/me/avatar` | Cambia avatar |
| POST | `/api/users/me/change-password` | Cambia password |
| DELETE | `/api/users/me` | Elimina account |

### Achievement e Gamification
| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | `/api/users/me/achievements` | Tutti i badge con progresso |
| GET | `/api/users/me/streak` | Dettaglio streak + calendario |
| GET | `/api/notifications` | Lista notifiche |
| PATCH | `/api/notifications/:id/read` | Segna notifica letta |
| PATCH | `/api/notifications/read-all` | Segna tutte lette |

### WebSocket Events
| Evento | Room | Payload |
|--------|------|---------|
| `player_count_update` | `game:{gameId}` | `{ active_players }` |
| `leaderboard_update` | `game:{gameId}` | `{ entries, updated_at }` |
| `notification` | `user:{userId}` | `{ notification }` |
| `streak_warning` | `user:{userId}` | `{ hours_remaining }` |

---

## Appendice B — Riepilogo Differenze Free vs Premium

| Aspetto | Free | Premium |
|---------|------|---------|
| Partite al giorno | 3 | Illimitate |
| Daily per Mondo | 1 (un solo Mondo) | 3 (tutti i Mondi) |
| Giochi premium | Bloccati | Sbloccati |
| Pubblicita | Banner discreti | Zero ads |
| Suggerimenti per partita | 1 | 3 |
| Streak Freeze | Non disponibile | 1/settimana automatica |
| Accesso anticipato | No | 24h prima del rilascio pubblico |
| Avatar esclusivi | 24 base | 24 base + 8 premium |
| Condivisione risultato | Con watermark | Senza watermark + badge Premium |
| XP e progressione | Completa (stessa di Premium) | Completa |
| Classifiche | Visibili (Top 10) | Complete |
| Badge Premium | No | Si (chip oro nel profilo) |
| Serie | Solo primo episodio free | Tutti gli episodi |

---

*Documento prodotto dal Product Designer di Gameflix. Ogni specifica e pensata per essere direttamente traducibile in user stories e task di sviluppo. Tutti i layout sono schematici — il design visivo finale sara definito dall'art-director in collaborazione con il front-end developer.*
