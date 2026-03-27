# GAMEFLIX — Documento di Progettazione Prodotto

> Documento prodotto dal team Discovery (business-analyst, solution-architect, mkt-strategist)
> Data: 26 Marzo 2026 | Fase: 0 — Discovery

---

## INDICE

- [SEZIONE A — Visione e Modello di Business](#sezione-a--visione-e-modello-di-business)
- [SEZIONE B — Prodotto, Retention, Community, Release Model](#sezione-b--prodotto-retention-community-release-model)
- [SEZIONE C — Categorie di Giochi e Struttura Contenutistica](#sezione-c--categorie-di-giochi-e-struttura-contenutistica)
- [SEZIONE D — MVP e Roadmap](#sezione-d--mvp-e-roadmap)
- [SEZIONE E — Architettura Tecnica](#sezione-e--architettura-tecnica)
- [SEZIONE F — Rischi, Opportunità e Decisioni Aperte](#sezione-f--rischi-opportunità-e-decisioni-aperte)
- [Proposta Iniziale Raccomandata](#proposta-iniziale-raccomandata)
- [Le Prossime 10 Decisioni Operative](#le-prossime-10-decisioni-operative-da-prendere)

---

# SEZIONE A — Visione e Modello di Business

## 1. Executive Summary

Gameflix è una piattaforma web in abbonamento per giochi casual, puzzle, logica, quiz, idle e farm, pensata per funzionare come un **servizio di intrattenimento a rilascio continuo** — non un catalogo statico di giochi.

Il concetto fondamentale è questo: Netflix non ha successo perché ha un catalogo di film, ma perché **ogni settimana c'è un motivo per tornare**. Gameflix applica lo stesso principio ai giochi browser-based. L'utente non paga per "accesso a X giochi", ma per un'**esperienza in evoluzione** fatta di nuove uscite, sfide quotidiane, classifiche sociali e meccaniche di progressione che creano abitudine.

**Perché può funzionare:**
- Il mercato casual gaming è enorme (3.2 miliardi di giocatori casual nel mondo) e frammentato — non esiste un "Netflix dei giochi casual" browser-based dominante
- I costi di sviluppo per giochi casual/puzzle sono ordini di grandezza inferiori rispetto ai giochi AAA
- Il modello browser-based elimina la frizione dell'installazione
- Le meccaniche di retention (streak, classifiche, rilasci settimanali) sono collaudate e replicabili

**Rischi principali da affrontare subito:**
- La quantità di contenuto necessaria per sostenere un modello a rilascio continuo è il vincolo critico. Senza un pipeline di produzione costante, il modello crolla
- Il churn nel primo mese è il killer numero uno delle piattaforme in abbonamento con contenuto limitato
- La percezione di valore: "perché pagare per giochi browser quando ce ne sono migliaia gratis?" — la risposta deve essere chiarissima nella value proposition

---

## 2. Analisi del Modello di Prodotto

Esistono tre archetipi di piattaforma di giochi. Capire le differenze è fondamentale per non costruire la cosa sbagliata.

### A) Catalogo statico di giochi

**Come funziona:** L'utente paga e ha accesso a N giochi. I giochi ci sono tutti dal giorno uno. Vengono aggiunti occasionalmente, senza fanfara.

**Problemi critici:**
- Zero motivo per tornare domani se oggi ho già giocato a quello che mi interessava
- L'utente valuta il catalogo una volta sola: "ci sono giochi che mi piacciono? Sì/No". Se la risposta è no, non torna mai più
- Nessun senso di urgenza o anticipazione
- Il valore percepito si erode nel tempo ("ho già giocato a tutto")
- Churn altissimo dopo il primo mese

**Verdetto:** Questo modello è morto per una piattaforma in abbonamento.

### B) Piattaforma a rilascio continuo

**Come funziona:** Nuovi contenuti vengono rilasciati su un calendario prevedibile. Gli utenti sanno che ogni settimana/giorno c'è qualcosa di nuovo.

**Punti di forza:** Crea abitudine e routine, genera anticipazione e hype, dà un motivo concreto per mantenere l'abbonamento, crea momenti di conversazione.

**Problemi:** Richiede un pipeline di produzione costante e affidabile. Se il contenuto nuovo delude, l'utente non ha alternative.

### C) Piattaforma community-driven

**Come funziona:** Il valore non sta solo nei giochi ma nell'ecosistema sociale: classifiche, sfide tra amici, achievement, streak, competizioni stagionali.

**Punti di forza:** La competizione sociale è il motore di retention più potente. Gli utenti creano valore per altri utenti. Riduce la dipendenza dalla produzione di contenuto nuovo.

**Problemi:** Richiede massa critica di utenti. All'inizio le classifiche sono vuote — effetto "ristorante vuoto".

### Raccomandazione: ibrido B+C con peso variabile nel tempo

Gameflix deve partire come **piattaforma a rilascio continuo (B)** con **elementi community (C) integrati fin dall'MVP**, e poi spostare gradualmente il peso verso le meccaniche community.

| Fase | Peso Rilasci | Peso Community | Focus |
|------|-------------|----------------|-------|
| MVP (mesi 1-3) | 80% | 20% | Calendario rilasci solido, classifiche base per-gioco |
| Crescita (mesi 4-8) | 60% | 40% | Streak, sfide settimanali, classifiche globali, profili |
| Maturità (mesi 9+) | 40% | 60% | Sfide tra amici, tornei, stagioni, eventi community |

**Perché in quest'ordine:** All'MVP non hai utenti — le meccaniche community sono vuote. Un nuovo gioco ogni settimana funziona anche con 1 solo utente. Il contenuto scala linearmente, la community scala esponenzialmente.

---

## 3. Modello di Business Consigliato

### Analisi dei modelli

| Modello | Pro | Contro | Verdict |
|---------|-----|--------|---------|
| **Pure Subscription** | Revenue prevedibile, semplicità | Barriera all'ingresso altissima per un brand sconosciuto | No per MVP |
| **Freemium** | Barriera zero, funnel misurabile | Equilibrio free/paid difficile | **Sì — modello MVP** |
| **Hybrid** (freemium + ads + acquisti) | Massimizza monetizzazione | Complessità, confusione, ads degradano UX | Evoluzione futura |

### Struttura Freemium consigliata

**Tier Free:**
- Accesso a una selezione limitata di giochi (5-8 giochi)
- Sfida giornaliera (1 al giorno, come Wordle)
- Classifica base (solo per i giochi free)
- Pubblicità non invasive (banner, non interstitial)
- Nessun limite di tempo (i limiti di tempo sono frustranti — meglio limitare il contenuto)

**Tier Premium:**
- Tutti i giochi, incluse le nuove uscite settimanali
- Tutte le sfide giornaliere (multiple per giorno)
- Classifiche globali e stagionali
- Sistema di progressione completo (XP, livelli, badge)
- Zero pubblicità
- Accesso anticipato alle nuove uscite (12-24h prima)
- Streak protection (1 gratis a settimana)

**Logica del funnel:** L'utente free deve sentire: (1) "Questo è divertente" e (2) "Mi sto perdendo qualcosa". La sfida giornaliera nel tier free crea l'abitudine di tornare ogni giorno, e ogni giorno l'utente vede il teaser del nuovo gioco premium che non può giocare.

### Revenue Streams

| Stream | MVP | Fase 2 | Note |
|--------|-----|--------|------|
| Abbonamento premium | Sì | Sì | Revenue primaria, 70-80% del totale |
| Ads (tier free) | Sì (leggere) | Sì | Banner non invasivi, 10-15% del totale |
| Acquisti singoli giochi | No | Valutare | Aggiunge complessità |
| Partnership/sponsorship | No | Sì | Giochi sponsorizzati, eventi brandizzati |
| Tornei a pagamento | No | Fase 3 | Entry fee per tornei con premi |

### Unit Economics di riferimento

- **CAC:** 2-5 EUR per utente registrato, 8-15 EUR per utente pagante (conversion rate 3-5%)
- **ARPU free tier:** 0.30-0.80 EUR/mese per utente attivo (ads)
- **ARPU premium:** 4-7 EUR/mese
- **Churn mensile target:** Sotto il 10% è buono, sotto il 5% è eccellente
- **LTV premium:** Con churn 8%, LTV = ~5 EUR / 0.08 = ~62 EUR. Rapporto LTV/CAC deve essere almeno 3:1

**Attenzione:** All'MVP il churn sarà probabilmente 15-20%. Focus su **ridurre il churn** prima di **scalare l'acquisizione**.

---

## 4. Struttura Abbonamenti

### Tre opzioni analizzate

#### Opzione 1 — Abbonamento piattaforma unico (RACCOMANDATA PER MVP)

| | Prezzo | Cosa include |
|---|--------|-------------|
| Free | 0 EUR | Catalogo base, 1 sfida/giorno, ads |
| Premium | 4.99 EUR/mese | Tutto: tutti i giochi, tutte le sfide, classifiche complete, zero ads |
| Premium Annuale | 39.99 EUR/anno (3.33/mese) | Uguale a Premium, sconto 33% |

**Pro:** Semplicità estrema, zero confusione, facile da comunicare, facile da implementare.
**Contro:** Non cattura chi pagherebbe di più.

#### Opzione 2 — Abbonamento per categoria (SCARTATA PER MVP)

| | Prezzo |
|---|--------|
| Singola categoria | 2.99 EUR/mese |
| Tutte le categorie | 6.99 EUR/mese |

**Rischio alto:** All'MVP non hai abbastanza contenuto per rendere credibile un abbonamento per categoria.

#### Opzione 3 — Ibrido con tier intermedio (FASE 2)

| | Prezzo |
|---|--------|
| Gamer | 3.49 EUR/mese |
| Gamer Pro | 6.99 EUR/mese |

Funziona per piattaforme mature. All'MVP è over-engineering.

### Raccomandazione finale

**Opzione 1 per l'MVP. Due tier: Free e Premium a 4.99 EUR/mese (39.99/anno).**

Perché 4.99 EUR:
- **2.99 EUR** sembra "troppo poco per valere qualcosa" e non copre i costi
- **4.99 EUR** è un impulso d'acquisto, non una decisione ponderata
- **7.99 EUR** compete con Netflix/Spotify — a quel prezzo servono centinaia di giochi

**Offerta di lancio:** Primo mese gratuito per i primi 500 iscritti, oppure primi 3 mesi a 1.99 EUR/mese.

---

# SEZIONE B — Prodotto, Retention, Community, Release Model

## 5. Meccaniche di Retention Fondamentali

### 5.1 — Streak System (MVP — Priorità massima)

L'utente che gioca almeno una partita al giorno mantiene il suo streak. Lo streak è visibile nel profilo e nelle classifiche.

**Design per Gameflix:**
- Lo streak si mantiene giocando qualsiasi gioco per almeno 2 minuti
- Milestone con badge visivi: 7gg (bronzo), 30gg (argento), 90gg (oro), 180gg (platino), 365gg (diamante)
- **Streak Freeze:** Per utenti premium, 1 freeze gratuito a settimana (incentivo all'upgrade)
- Notifica se lo streak sta per scadere
- Sistema di "miglior streak" che rimane nel profilo anche dopo la perdita

### 5.2 — Sfida Giornaliera (MVP — Priorità massima)

Ogni giorno, una nuova sfida uguale per tutti gli utenti (tipo Wordle).

- Free tier: 1 sfida al giorno
- Premium: 3 sfide al giorno (una per categoria diversa)
- Classifica giornaliera per la sfida
- Risultato condivisibile sui social (immagine generata automaticamente)
- La sfida scade a mezzanotte — FOMO naturale

### 5.3 — Sistema di Progressione XP/Livelli (MVP — Priorità alta)

| Azione | XP |
|--------|-----|
| Completare una partita | 10 XP |
| Completare la sfida giornaliera | 25 XP |
| Primo posto nella sfida giornaliera | 50 XP bonus |
| Provare un gioco per la prima volta | 15 XP |
| Mantenere lo streak (per giorno) | 5 XP |
| Streak milestone (ogni 7 giorni) | 50 XP bonus |
| Completare una sfida settimanale | 100 XP |

**Curva di livellamento:** Progressione logaritmica. Livello 1: 50 XP, Livello 5: 300 XP, Livello 10: 800 XP, Livello 20: 2500 XP.

**Cosa sbloccano i livelli:** Badge, titoli (Novizio → Giocatore → Esperto → Maestro → Leggenda), cornici per l'avatar. Mai bloccare giochi dietro livelli per utenti premium.

### 5.4 — Meccaniche future (Fase 2-3)

- Sfide settimanali (3-5 obiettivi che si resettano ogni lunedì)
- Leghe tipo Duolingo (gruppi di 20-30 utenti, promozione/retrocessione settimanale — +17% DAU documentato)
- Stagioni di 3 mesi con tema, sfide esclusive, classifica stagionale
- Sfide tra amici

### Riepilogo priorità

| Meccanica | MVP? | Impatto Retention | Costo Implementazione |
|-----------|------|-------------------|----------------------|
| Streak | Sì | Altissimo | Basso |
| Sfida giornaliera | Sì | Altissimo | Medio |
| XP/Livelli | Sì | Alto | Medio |
| Classifiche base | Sì | Medio-Alto | Basso |
| Teaser/Countdown | Sì | Medio | Basso |
| Sfide settimanali | Fase 2 | Alto | Medio |
| Leghe/Gruppi | Fase 2 | Altissimo | Alto |
| Stagioni | Fase 3 | Altissimo | Alto |
| Sfide tra amici | Fase 3 | Alto | Alto |

---

## 6. Sistema Community e Ranking

### 6.1 — Sistema Like/Voto (MVP)

- Dopo ogni partita: Pollice Su / Pollice Giù (non stelle 1-5 — distribuzione bimodale, meno actionable)
- Rating come percentuale: "87% positivo"
- Fase 2: Tag di feedback opzionali ("Troppo facile", "Divertente", "Originale")

### 6.2 — Indicatori di popolarità (MVP)

- "Giocato da X persone" (contatore totale — meglio del real-time con pochi utenti)
- Badge "Trending", "Nuovo", "Gioco della settimana"
- Non mostrare contatori real-time fino a soglia minima raggiunta

### 6.3 — Classifiche (MVP base)

- Top 10 per ogni gioco + propria posizione sempre visibile
- Mostrare sempre i giocatori immediatamente sopra e sotto (motivazione "devo superare quell'utente")
- Classifica settimanale per XP (reset lunedì)
- Fase 2: Classifiche mensili, stagionali, all-time, leghe

### 6.4 — Commenti: NO nell'MVP

- Moderazione costosa
- Con pochi utenti, commenti deserti
- Fase 2: "Mini-review" strutturata con tag predefiniti
- Fase 3: Forum/commenti con reputazione, solo utenti premium, solo dopo aver giocato

### 6.5 — Profilo e social (MVP base)

- Profilo pubblico con: livello, badge, streak, giochi preferiti
- Condivisione risultato sfida giornaliera sui social
- Fase 2: Lista amici, "I tuoi amici stanno giocando a...", notifiche sociali
- Fase 3: Sfide 1v1 tra amici

---

## 7. Sistema di Uscite / Release Model

### Modelli confrontati

| Modello | Pro | Contro | Sostenibilità MVP |
|---------|-----|--------|-------------------|
| **A) 1 gioco globale/settimana** | Concentra attenzione, 50 giochi/anno | Se non piace, niente di nuovo per 7gg | Medio |
| **B) 1 gioco per categoria/settimana** | Varietà | 200 giochi/anno — impossibile per startup | Insostenibile |
| **C) Daily challenge + weekly premium** | Ritorno quotidiano + evento settimanale | Sfide daily devono essere buone | **Migliore** |
| **D) Stagioni/Collezioni** | Narrativa e coerenza | Cosa tiene l'utente tra le stagioni? | Sovrastruttura |
| **E) Drop limitati** | FOMO potente | Non è un modello primario | Supplementare |

### Raccomandazione: Modello C come base + elementi di D ed E

**Struttura settimanale:**

| Giorno | Contenuto |
|--------|-----------|
| Lunedì | Sfida giornaliera + Teaser del gioco della settimana |
| Martedì | Sfida giornaliera + Secondo teaser |
| Mercoledì | Sfida giornaliera + **RILASCIO nuovo gioco** (accesso anticipato Premium) |
| Giovedì | Sfida giornaliera + Il gioco diventa disponibile per tutti |
| Venerdì | Sfida giornaliera + Classifica settimanale prende forma |
| Sabato | Sfida giornaliera + Weekend Challenge (bonus XP) |
| Domenica | Sfida giornaliera + Riepilogo settimana, anticipazione prossima |

**Perché questo modello è il migliore per l'MVP:**
1. 1 gioco nuovo/settimana è sostenibile con un piccolo team
2. Le sfide giornaliere riempiono i giorni "vuoti"
3. L'accesso anticipato premium di 24h crea valore tangibile
4. Il calendario è prevedibile — crea abitudine
5. I teaser creano anticipazione con costo zero

**Meccaniche di hype:**
- Pagina "Prossimamente" con countdown
- Notifica "Domani su Gameflix: un nuovo puzzle di logica!"
- Condivisione "Indovina il gioco" sui social
- "Wishlist" per giochi annunciati

**Evoluzione:**

| Fase | Rilascio | Aggiunta |
|------|----------|----------|
| MVP (mesi 1-3) | 1 gioco/settimana + sfide giornaliere | — |
| Fase 2 (mesi 4-6) | 1-2 giochi/settimana | Evento mensile speciale (drop 48h) |
| Fase 3 (mesi 7-12) | 2 giochi/settimana | Stagioni trimestrali con ricompense esclusive |
| Fase 4 (anno 2) | 2-3 giochi/settimana | Marketplace per sviluppatori terzi |

---

# SEZIONE C — Categorie di Giochi e Struttura Contenutistica

## 8. I 7 Mondi di Gameflix

Ogni categoria è un **Mondo** con brand autonomo, identità visiva e community propria. L'obiettivo è che un utente possa dire "gioco su BrainLab" e non solo "gioco su Gameflix".

---

### MONDO 1 — BrainLab
*"Il tuo laboratorio mentale quotidiano"*

- **Posizionamento:** Logica pura, ragionamento deduttivo, sfida intellettuale. Tono serio ma accessibile.
- **Giochi:** Sudoku varianti, nonogrammi, logica a griglia, rompicapo spaziali, sequenze numeriche, puzzle di percorso.
- **Presentazione:** Serie settimanali con difficoltà crescente. Classifiche per tempo e completamento.
- **Visual:** Palette blu/bianco, estetica minimale, icone geometriche.

### MONDO 2 — WordForge
*"Dove le parole prendono forma"*

- **Posizionamento:** Lettere, parole, linguaggio. Forte potenziale multilingue. Appello trasversale (giovani → over 50).
- **Giochi:** Cruciverba tematici, anagrammi a tempo, wordle-like, catene di parole, quiz etimologici, rebus.
- **Presentazione:** "Cruciverba del giorno" come ancora. Serie tematiche ("WordForge: Cinema").
- **Visual:** Palette calda (ambra/crema), estetica tipografica, riferimenti carta e inchiostro.

### MONDO 3 — QuizArena
*"Metti alla prova quello che sai (e quello che credi di sapere)"*

- **Posizionamento:** Cultura generale, trivia. L'area più sociale — la competizione è il motore. Tono vivace, provocatorio.
- **Giochi:** Quiz a risposta multipla, vero/falso a catena, quiz a eliminazione, quiz fotografici, timeline.
- **Presentazione:** Tornei settimanali con bracket. "Quiz del giorno". Serie stagionali.
- **Visual:** Rosso/oro, estetica game show, dinamica e competitiva.

### MONDO 4 — TinkerFarm *(Fase 2)*
*"Coltiva, costruisci, lascia crescere"*

- **Posizionamento:** Idle/incrementale/gestionale. Rilassante e progressivo. Forte retention (vuoi tornare a vedere cosa è cresciuto).
- **Giochi:** Idle farm, gestione risorse, clicker evoluti, simulatori di crescita, giochi merge.
- **Presentazione:** Ogni gioco è una "stagione" con obiettivi a lungo termine (4-8 settimane).
- **Visual:** Verde/terra, illustrazioni morbide, animazioni lente e soddisfacenti.

### MONDO 5 — MatchBox *(Fase 2)*
*"Collega, combina, cancella — ripeti"*

- **Posizionamento:** Puzzle visuale — il comfort food del gaming. Semplice, gratificazione immediata, profondità opzionale.
- **Giochi:** Match-3 con varianti, puzzle di connessione, bubble shooter, pattern recognition, sorting.
- **Presentazione:** Serie con progressione livelli. Modalità zen vs sfida.
- **Visual:** Palette vivace multicolor, estetica giocosa, effetti particellari soddisfacenti.

### MONDO 6 — Mysterium *(Fase 2)*
*"Ogni dettaglio è un indizio"*

- **Posizionamento:** Narrativo, investigativo, di osservazione. Differenziatore forte. Le storie creano attesa per il capitolo successivo.
- **Giochi:** Hidden object con trama, puzzle investigativi a episodi, escape room testuali, enigmi crittografici.
- **Presentazione:** Serie a episodi settimanali (tipo serie TV). Community che discute teorie.
- **Visual:** Viola scuro/ambra, estetica noir/mystery.

### MONDO 7 — SparkPlay *(Fase 3)*
*"Il parco giochi delle idee folli"*

- **Posizionamento:** Wild card — giochi sperimentali, ibridi, game jam, collaborazioni, stagionali. Valvola creativa.
- **Giochi:** Minigame originali, game jam results, giochi stagionali, prototipi votati dalla community.
- **Presentazione:** Rotazione frequente. Sistema di voto community. Etichetta "Sperimentale".
- **Visual:** Neon/elettrico, estetica arcade moderna, caos controllato.

---

## 9. Struttura Contenutistica

### Gerarchia dei contenuti

```
MONDO (es. BrainLab)
  └── SERIE (es. "Logica Spaziale — Stagione 2")
       └── EPISODIO / LIVELLO (es. "Episodio 3: Il Labirinto Rotante")
```

**Serie** = raggruppamento tematico con inizio e fine (4-8 episodi). Come stagioni TV.
**Standalone** = giochi singoli per daily content.

### Tier di difficoltà

| Tier | Nome | Significato | Icona |
|------|------|-------------|-------|
| 1 | **Chill** | Rilassante, accessibile a tutti | Foglia / nuvola |
| 2 | **Sharp** | Richiede attenzione, sfida moderata | Fulmine / lama |
| 3 | **Brutal** | Per esperti, alta difficoltà | Teschio / fiamma |

### Volume di contenuto necessario

Con 3 Mondi attivi al lancio:
- **Daily:** 3 giochi/giorno = ~90/mese
- **Serie:** 6-9 episodi/settimana
- **Sfide settimanali:** 3/settimana
- **Totale: ~100-120 unità di contenuto al mese**

Sostenibile solo con: generazione procedurale (puzzle, anagrammi), template riutilizzabili, AI-assist per quiz.

---

# SEZIONE D — MVP e Roadmap

## 10. MVP — Funzionalità da Costruire per Prime

### Principio guida

L'MVP deve dimostrare una sola cosa: **che le persone tornano ogni giorno a giocare e sono disposte a pagare per continuare a farlo.**

### Categorie di lancio: BrainLab + WordForge + QuizArena

| Mondo | Perché sì |
|-------|-----------|
| **BrainLab** | Contenuto generabile proceduralmente. Forte domanda dimostrata (NYT Games). |
| **WordForge** | Generazione semi-automatica. Cultura cruciverba radicata in Italia. |
| **QuizArena** | Database domande scalabile. Categoria più sociale e virale. |

Perché NON le altre: TinkerFarm richiede sistemi persistenti complessi; MatchBox è mercato saturo; Mysterium richiede scrittura professionale; SparkPlay è per dopo.

### Core Features MVP

**A. Piattaforma base**
- [ ] Registrazione/login (email + Google OAuth)
- [ ] Profilo utente con avatar, username, statistiche
- [ ] Homepage con contenuto del giorno e serie in corso
- [ ] Player di gioco browser-based
- [ ] Navigazione per Mondo
- [ ] Responsive design (mobile-first)

**B. Sistema di contenuto**
- [ ] 3 Mondi attivi
- [ ] Daily puzzle/quiz per ciascun Mondo (3/giorno)
- [ ] Almeno 1 serie attiva per Mondo (3 serie, 5 episodi ciascuna)
- [ ] Tier di difficoltà (Chill / Sharp / Brutal)
- [ ] Catalogo con filtri

**C. Gamification minima**
- [ ] Streak counter
- [ ] Punteggio per gioco
- [ ] Classifica giornaliera per ogni Daily (top 50)
- [ ] 10-15 achievement iniziali
- [ ] Profilo pubblico con badge e statistiche

**D. Community minima**
- [ ] Classifica globale e per Mondo
- [ ] Condivisione risultato su social (tipo Wordle)
- [ ] Like/dislike sui giochi

**E. Monetizzazione**
- [ ] Paywall freemium
- [ ] Pagina pricing
- [ ] Stripe integration
- [ ] Trial gratuito (7 giorni)

**F. Infrastruttura**
- [ ] Analytics base (retention, conversione)
- [ ] Content scheduler
- [ ] CMS admin semplice

### Cosa può essere semplificato nell'MVP

- Classifiche calcolate in batch (ogni ora) invece che real-time
- Feed attività come elenco cronologico senza algoritmo
- Achievement verificati con job periodico
- CMS admin base senza drag-and-drop
- Avatar predefiniti (no upload)
- Ricerca come filtro base, no full-text

### Cosa NON costruire nell'MVP

- Chat/messaggistica tra utenti
- Sfide 1v1 real-time
- Editor UGC
- App nativa mobile
- TinkerFarm, MatchBox, Mysterium, SparkPlay
- Notifiche push (email di reminder basta)
- Abbonamento annuale (prima validare il mensile)
- Sistema referral strutturato
- Localizzazione multilingua
- Tornei con bracket

---

## 11. Funzionalità Fase 2/3

| Priorità | Feature | Impatto | Sforzo | Fase |
|-----------|---------|---------|--------|------|
| 1 | Mysterium (puzzle narrativi) | Alto | Medio-Alto | 2 |
| 2 | Sfida 1v1 asincrona | Alto | Alto | 2 |
| 3 | TinkerFarm (idle) | Alto | Alto | 2 |
| 4 | Notifiche push | Medio | Basso | 2 |
| 5 | Tornei settimanali | Alto | Medio | 2 |
| 6 | PWA installabile | Alto | Basso | 2 |
| 7 | Piano annuale + gift | Medio | Basso | 2 |
| 8 | Sistema referral | Medio | Medio | 2 |
| 9 | MatchBox (match/visual) | Medio | Medio | 2-3 |
| 10 | SparkPlay + game jam | Medio | Medio | 3 |
| 11 | Editor UGC | Alto potenziale | Molto Alto | 3 |
| 12 | App nativa (wrapper) | Medio | Alto | 3 |
| 13 | Multilingua (EN) | Alto | Medio | 3 |
| 14 | API per sviluppatori indie | Alto potenziale | Alto | 3 |
| 15 | Verticale educational | Alto potenziale | Alto | 3+ |

---

## 12. Roadmap Consigliata

*Stime basate su team di 2-3 sviluppatori full-stack + 1 content creator + founder come product owner.*

### FASE 1 — MVP (12-16 settimane)

**Settimane 1-4: Fondazione**
- Architettura tecnica (Next.js + NestJS + PostgreSQL + auth + deploy)
- Design system e identità visiva
- Prototipo game engine browser-based
- CMS per caricamento contenuti
- Pipeline generazione automatica puzzle

**Settimane 5-8: Core product**
- 3 tipologie di gioco (1 per Mondo)
- Sistema daily content con classifica
- Registrazione, profilo, streak tracking
- Homepage e navigazione
- Responsive design

**Settimane 9-12: Completamento**
- 2 tipologie aggiuntive per Mondo (totale 9)
- Sistema serie con episodi
- Achievement base
- Stripe integration + paywall
- Landing page di conversione

**Settimane 13-16: Pre-lancio**
- Almeno 2 settimane di daily content pre-caricato
- 3 serie complete (5 episodi ciascuna)
- Beta chiusa con 50-100 tester
- Fix bug, performance, setup analytics
- Preparazione campagna lancio

**Target:** 500-1.000 utenti registrati, 50-100 abbonati paganti.

### FASE 2 — Crescita (Mesi 5-9)

- Mysterium (puzzle narrativi a episodi)
- PWA installabile + notifiche push web
- Piano annuale + referral base
- Sfide 1v1 asincrone
- Tornei settimanali
- TinkerFarm (primo idle)
- Email automation (onboarding, win-back)
- MatchBox (primi giochi match)

**Target:** 5.000-10.000 registrati, 500-1.000 paganti, D30 retention >20%.

### FASE 3 — Scala (Mesi 10-18)

- SparkPlay + esperimenti UGC
- Localizzazione inglese
- App nativa (wrapper Capacitor)
- API per sviluppatori indie
- Esplorazione verticale educational e white-label B2B
- Ottimizzazione SEO

**Target:** 50.000+ registrati, 3.000-5.000 paganti, breakeven o profittabilità.

---

# SEZIONE E — Architettura Tecnica

## 13. Stack Tecnico Consigliato

### Frontend: Next.js 14+ (App Router)

**Motivazione:**
- SSR/SSG nativi per SEO sulle pagine pubbliche
- App Router con layout annidati: la "shell piattaforma + contenuto gioco" si mappa naturalmente
- React Server Components per ridurre JS al client
- Route Handlers per API leggere nell'MVP
- Middleware nativo per controllo accessi subscription

**Librerie chiave:**
- Tailwind CSS 4 per styling
- shadcn/ui come base componenti
- Zustand per stato globale leggero
- TanStack Query per cache e sincronizzazione dati
- Framer Motion per animazioni

### Backend: NestJS

**Motivazione:**
- Architettura modulare nativa (`UsersModule`, `GamesModule`, `SubscriptionsModule`, `LeaderboardModule`)
- Dependency Injection per testing
- Guards e decoratori per auth/subscription: `@UseGuards(SubscriptionGuard)`
- WebSocket gateway integrato per real-time
- CQRS e EventEmitter per eventi ("partita completata", "badge sbloccato")

**Struttura NestJS:**
```
src/
  modules/
    auth/           -- registrazione, login, JWT, OAuth
    users/          -- profili, preferenze, progressione
    subscriptions/  -- piani, pagamenti Stripe, accesso
    games/          -- catalogo, metadata, moduli gioco
    scores/         -- punteggi, leaderboard, classifiche
    gamification/   -- XP, streak, badge
    social/         -- like, segnalazioni
    scheduling/     -- rilascio contenuti, programmazione
    admin/          -- pannello gestione
    notifications/  -- in-app, email
  common/
    guards/         -- AuthGuard, SubscriptionGuard, AdminGuard
    interceptors/   -- logging, caching
    pipes/          -- validazione input
    decorators/     -- @CurrentUser, @RequiresPlan
```

### Database: PostgreSQL 16

- JSONB per metadata flessibili dei giochi
- Materialized Views per leaderboard aggregate
- Full-text search nativo per ricerca giochi
- pg_cron per job schedulati

**ORM: Prisma** (preferito a TypeORM per schema dichiarativo, type-safety, migrazioni auto-generate, manutenzione attiva).

### Autenticazione: JWT + OAuth 2.0

- **MVP:** JWT con access token (15 min) + refresh token (7 giorni, rotazione). bcrypt con salt 12.
- **Post-MVP:** OAuth con Google e Discord (via Passport.js)
- **Crescita:** Valutare Auth.js v5 o Clerk

```
JWT payload: {
  sub: "user_uuid",
  email: "user@example.com",
  plan: "premium",
  categories: ["puzzle", "logic", "quiz"],
  role: "user" | "admin"
}
```

### Pagamenti: Stripe

- **Stripe Checkout** per pagamenti (zero gestione carte lato Gameflix)
- **Stripe Customer Portal** per gestione autonoma fatturazione
- **Stripe Webhooks** per sync stato subscription
- Idempotenza tramite `event.id` in tabella `stripe_events`

### Real-time: Socket.io via NestJS Gateway

- Leaderboard live, player count, notifiche in-app
- Room per gioco (`game:{gameId}`) e per utente (`user:{userId}`)
- MVP: Socket.io su singola istanza. Crescita: Redis adapter

### Hosting

- **MVP:** Vercel (frontend) + Railway/VPS Hetzner (backend + PostgreSQL)
- **Crescita:** AWS/GCP con ECS/Cloud Run, RDS, CloudFront

---

## 14. Architettura Modulare dei Giochi

### Approccio: Component-based con Game SDK

| Approccio | Verdict |
|-----------|---------|
| Iframe isolation | Scartato (comunicazione complessa, UX frammentata) |
| Micro-frontend (Module Federation) | Scartato (overkill) |
| **Componente React con SDK** | **Scelto per MVP** (integrazione nativa, stato condiviso, semplice) |

Strategia ibrida: MVP con componenti React + supporto iframe futuro per giochi di terze parti.

### Game SDK — Contratto di Interfaccia

```typescript
// @gameflix/game-sdk

interface GameModule {
  component: React.ComponentType<GameProps>;
  manifest: GameManifest;
}

interface GameProps {
  user: {
    id: string;
    displayName: string;
    avatarUrl: string;
  };
  platform: {
    submitScore: (score: number, metadata?: Record<string, any>) => Promise<void>;
    trackEvent: (event: string, data?: Record<string, any>) => void;
    completeGame: (result: GameResult) => Promise<void>;
    showAchievement: (badgeId: string) => void;
    getLeaderboard: (period: 'daily' | 'weekly' | 'alltime') => Promise<LeaderboardEntry[]>;
  };
  config: Record<string, any>;
}

interface GameManifest {
  id: string;                        // "word-scramble"
  version: string;                   // "1.2.0"
  title: string;
  description: string;
  category: GameCategory;
  difficulty: 1 | 2 | 3 | 4 | 5;
  estimatedDuration: number;         // minuti
  thumbnailUrl: string;
  tags: string[];
  supportsDaily: boolean;
  scoringType: 'points' | 'time' | 'moves' | 'completion';
}
```

### Come si aggiunge un nuovo gioco

1. Creare directory `games/nuovo-gioco/` con `index.tsx` + `manifest.json` + assets
2. Aggiornare `games/registry.ts` con dynamic import
3. Inserire record nel database tramite admin

**Nessuna modifica a shell, layout o backend.** Solo: directory, registry, record DB.

### Game Registry

```typescript
// games/registry.ts
export const gameRegistry: Record<string, () => Promise<GameModule>> = {
  'word-scramble': () => import('./word-scramble').then(m => m.default),
  'sudoku':        () => import('./sudoku').then(m => m.default),
  'nuovo-gioco':   () => import('./nuovo-gioco').then(m => m.default),
};
```

### Platform Shell

```
+------------------------------------------+
|  Navbar (logo, ricerca, profilo, notif)  |
+--------+---------------------------------+
|        |  [Breadcrumb: Puzzle > Sudoku]  |
| Side   |  +---------------------------+ |
| bar    |  |                           | |
| (cat,  |  |    AREA DEL GIOCO         | |
| filtri |  |    (componente dinamico)   | |
| )      |  |                           | |
|        |  +---------------------------+ |
|        |  [Tab: Classifica | Info ]     |
|        |  +---------------------------+ |
|        |  |  Leaderboard              | |
|        |  +---------------------------+ |
+--------+---------------------------------+
```

---

## 15. Schema Entità/Dati ad Alto Livello

### Diagramma relazioni

```
Users ──1:N──> Subscriptions ──N:1──> Plans
  |                                     |
  |──1:N──> GameSessions ──N:1──> Games ──N:1──> Categories
  |              |                  |
  |              └──1:N──> Scores   |──1:N──> GameReleases
  |                                 |
  |──1:N──> UserBadges              |──1:N──> Likes
  |              |
  |              └──N:1──> Badges
  |
  |──1:N──> UserStreaks
  |──1:N──> XPTransactions
  |──1:N──> Likes
```

### Tabelle principali

**users**
```sql
id              UUID PRIMARY KEY
email           VARCHAR(255) UNIQUE NOT NULL
password_hash   VARCHAR(255)
display_name    VARCHAR(50) NOT NULL
avatar_url      VARCHAR(500)
role            ENUM('user','admin')
oauth_provider  VARCHAR(20)
oauth_id        VARCHAR(255)
total_xp        INTEGER DEFAULT 0      -- denormalizzato
current_level   INTEGER DEFAULT 1
created_at      TIMESTAMPTZ DEFAULT NOW()
updated_at      TIMESTAMPTZ DEFAULT NOW()
last_login_at   TIMESTAMPTZ
```

**plans**
```sql
id              UUID PRIMARY KEY
name            VARCHAR(50) NOT NULL
slug            VARCHAR(50) UNIQUE NOT NULL
price_monthly   DECIMAL(6,2)
price_yearly    DECIMAL(6,2)
stripe_price_id_monthly  VARCHAR(100)
stripe_price_id_yearly   VARCHAR(100)
features        JSONB
is_active       BOOLEAN DEFAULT TRUE
created_at      TIMESTAMPTZ DEFAULT NOW()
```

**plan_categories** — quale piano sblocca quali categorie
```sql
plan_id         UUID REFERENCES plans(id)
category_id     UUID REFERENCES categories(id)
PRIMARY KEY (plan_id, category_id)
```

**subscriptions**
```sql
id                  UUID PRIMARY KEY
user_id             UUID REFERENCES users(id)
plan_id             UUID REFERENCES plans(id)
stripe_customer_id  VARCHAR(100)
stripe_subscription_id VARCHAR(100)
status              ENUM('active','past_due','canceled','trialing')
billing_period      ENUM('monthly','yearly')
current_period_start TIMESTAMPTZ
current_period_end   TIMESTAMPTZ
cancel_at_period_end BOOLEAN DEFAULT FALSE
created_at          TIMESTAMPTZ DEFAULT NOW()
updated_at          TIMESTAMPTZ DEFAULT NOW()
```

**categories**
```sql
id              UUID PRIMARY KEY
name            VARCHAR(50) NOT NULL
slug            VARCHAR(50) UNIQUE NOT NULL
description     TEXT
icon_url        VARCHAR(500)
display_order   INTEGER DEFAULT 0
is_active       BOOLEAN DEFAULT TRUE
created_at      TIMESTAMPTZ DEFAULT NOW()
```

**games**
```sql
id              UUID PRIMARY KEY
slug            VARCHAR(100) UNIQUE NOT NULL
title           VARCHAR(200) NOT NULL
description     TEXT
category_id     UUID REFERENCES categories(id)
difficulty      SMALLINT CHECK (difficulty BETWEEN 1 AND 5)
thumbnail_url   VARCHAR(500)
banner_url      VARCHAR(500)
estimated_duration_min  INTEGER
scoring_type    ENUM('points','time','moves','completion')
supports_daily  BOOLEAN DEFAULT FALSE
config          JSONB                   -- config specifica del gioco
version         VARCHAR(20) DEFAULT '1.0.0'
is_published    BOOLEAN DEFAULT FALSE
published_at    TIMESTAMPTZ
-- Denormalizzati per performance
total_plays     INTEGER DEFAULT 0
total_likes     INTEGER DEFAULT 0
avg_rating      DECIMAL(3,2) DEFAULT 0
active_players  INTEGER DEFAULT 0
created_at      TIMESTAMPTZ DEFAULT NOW()
updated_at      TIMESTAMPTZ DEFAULT NOW()
```

**game_releases** — sistema rilascio schedulato
```sql
id              UUID PRIMARY KEY
game_id         UUID REFERENCES games(id)
scheduled_at    TIMESTAMPTZ NOT NULL
released_at     TIMESTAMPTZ
release_type    ENUM('new','update','event')
announcement    TEXT
is_featured     BOOLEAN DEFAULT FALSE
status          ENUM('scheduled','released','canceled')
created_by      UUID REFERENCES users(id)
created_at      TIMESTAMPTZ DEFAULT NOW()
```

**game_sessions**
```sql
id              UUID PRIMARY KEY
user_id         UUID REFERENCES users(id)
game_id         UUID REFERENCES games(id)
started_at      TIMESTAMPTZ DEFAULT NOW()
ended_at        TIMESTAMPTZ
duration_sec    INTEGER
completed       BOOLEAN DEFAULT FALSE
session_data    JSONB
```

**scores**
```sql
id              UUID PRIMARY KEY
user_id         UUID REFERENCES users(id)
game_id         UUID REFERENCES games(id)
session_id      UUID REFERENCES game_sessions(id)
score           INTEGER NOT NULL
score_metadata  JSONB
is_daily        BOOLEAN DEFAULT FALSE
daily_date      DATE
created_at      TIMESTAMPTZ DEFAULT NOW()
```

**likes**
```sql
user_id         UUID REFERENCES users(id)
game_id         UUID REFERENCES games(id)
created_at      TIMESTAMPTZ DEFAULT NOW()
PRIMARY KEY (user_id, game_id)
```

**user_streaks**
```sql
id              UUID PRIMARY KEY
user_id         UUID REFERENCES users(id)
streak_type     ENUM('daily_login','daily_play','weekly_challenge')
current_count   INTEGER DEFAULT 0
longest_count   INTEGER DEFAULT 0
last_activity   DATE
UNIQUE (user_id, streak_type)
```

**badges**
```sql
id              UUID PRIMARY KEY
slug            VARCHAR(100) UNIQUE NOT NULL
name            VARCHAR(100) NOT NULL
description     TEXT
icon_url        VARCHAR(500)
category        ENUM('achievement','streak','social','special')
condition       JSONB
xp_reward       INTEGER DEFAULT 0
is_active       BOOLEAN DEFAULT TRUE
```

**user_badges**
```sql
user_id         UUID REFERENCES users(id)
badge_id        UUID REFERENCES badges(id)
earned_at       TIMESTAMPTZ DEFAULT NOW()
PRIMARY KEY (user_id, badge_id)
```

**xp_transactions**
```sql
id              UUID PRIMARY KEY
user_id         UUID REFERENCES users(id)
amount          INTEGER NOT NULL
source          ENUM('game_complete','badge','streak','daily','bonus')
source_id       UUID
created_at      TIMESTAMPTZ DEFAULT NOW()
```

**stripe_events** — idempotenza webhook
```sql
event_id        VARCHAR(100) PRIMARY KEY
event_type      VARCHAR(100) NOT NULL
processed_at    TIMESTAMPTZ DEFAULT NOW()
```

### Materialized Views per Leaderboard

```sql
-- Classifica all-time per gioco
CREATE MATERIALIZED VIEW mv_leaderboard_alltime AS
SELECT game_id, user_id,
  MAX(score) as best_score,
  COUNT(*) as total_plays,
  RANK() OVER (PARTITION BY game_id ORDER BY MAX(score) DESC) as rank
FROM scores GROUP BY game_id, user_id;

-- Classifica settimanale
CREATE MATERIALIZED VIEW mv_leaderboard_weekly AS
SELECT game_id, user_id,
  MAX(score) as best_score,
  RANK() OVER (PARTITION BY game_id ORDER BY MAX(score) DESC) as rank
FROM scores
WHERE created_at >= date_trunc('week', NOW())
GROUP BY game_id, user_id;

-- Ricalcolo ogni 5 minuti
```

---

## 16. Sistemi Chiave

### Content Release System

Pannello admin custom (no CMS esterno — il contenuto è strutturato, non editoriale).

Flusso: admin crea game (is_published=false) → crea game_release con scheduled_at → cron job NestJS ogni minuto pubblica → evento GameReleasedEvent → notifiche.

### Score Tracking e Leaderboard

Scrittura real-time + lettura cached:
- Gioco chiama `platform.submitScore()` → `POST /api/scores` → salva score, incrementa total_plays, emette ScoreSubmittedEvent
- Event handler verifica: nuovo record? Top 100? Badge sbloccato?
- Lettura da materialized view con cache (TTL 60s)

### Event-Driven Architecture

```
ScoreSubmitted → aggiorna total_plays, verifica record, verifica badge, calcola XP, aggiorna streak, WebSocket

GameReleased → notifica push, email, aggiorna feed

SubscriptionChanged → rigenera JWT, log analytics, email conferma
```

### Scalabilità: da MVP a crescita

```
MVP (monolite):
  [Browser] → [Vercel: Next.js] → [Railway: NestJS] → [PostgreSQL]

Crescita:
  [Browser] → [Vercel edge] → [Redis cache] → [NestJS x2+] → [PostgreSQL + read replica]

  + BullMQ per job asincroni
  + Redis per sessioni WebSocket
```

---

# SEZIONE F — Rischi, Opportunità e Decisioni Aperte

## 17. Rischi Principali

### RISCHIO 1 — Produzione contenuto insostenibile ⚠️ CRITICO

100-120 unità di contenuto al mese è il requisito con 3 Mondi attivi.

**Mitigazione:**
- Generazione procedurale per BrainLab e WordForge
- Database 5.000+ domande per QuizArena prima del lancio
- Template riutilizzabili, buffer di 4 settimane
- AI per generare domande quiz
- UGC in Fase 2 come moltiplicatore

### RISCHIO 2 — Chicken-and-egg: community vuota ⚠️ ALTO

Classifiche con 12 persone non motivano.

**Mitigazione:**
- Classifiche top 10 (non top 100)
- Statistiche aggregate ("1.234 puzzle completati oggi")
- Beta chiusa ad invito (scarsità)
- Il valore iniziale è il gioco, non la community

### RISCHIO 3 — Subscription fatigue ⚠️ ALTO

Ennesimo abbonamento.

**Mitigazione:**
- Prezzo aggressivamente basso (4.99 EUR)
- Freemium generoso
- "Meno di un caffè per ore di intrattenimento"
- Mai penalizzare chi non paga — limitare quantità, non qualità

### RISCHIO 4 — Qualità inconsistente dei giochi ⚠️ MEDIO-ALTO

**Mitigazione:** Meglio 5 giochi ottimi che 15 mediocri. Playtest interno obbligatorio. Rating utenti → ritiro giochi con rating basso. 20% tempo sviluppo a polish.

### RISCHIO 5 — Performance browser ⚠️ MEDIO

**Mitigazione:** Canvas 2D conservativo. Test su dispositivi low-end. Lazy loading. Target: caricamento <3s su 4G.

### RISCHIO 6 — Founder risk (bus factor = 1) ⚠️ MEDIO

**Mitigazione:** Documentare tutto. Automatizzare rilascio daily. Buffer 4+ settimane. Freelancer di backup.

---

## 18. Opportunità Non Ovvie

1. **UGC (User-Generated Content):** Il vero game changer. Iniziare con editor quiz in Fase 2 (formato più semplice), poi espandere.

2. **Partnership sviluppatori indie:** Gameflix come piattaforma di distribuzione. Revenue share 70/30. Fase 3.

3. **White-label per aziende:** Team building, formazione gamificata. B2B paga molto più di B2C. Dal Mese 12.

4. **Verticale educativo:** Quiz e puzzle per scuole. Enorme potenziale in Italia. Richiede partner EdTech.

5. **AI per generazione contenuti:** GPT per quiz/trivia, non per game design. Strumento interno, non feature visibile. 50 domande quiz in 5 minuti.

6. **Eventi stagionali:** Halloween, Natale, Mondiali. Contenuto tematico limitato nel tempo. Pianificare con 3 mesi di anticipo.

7. **PWA per mobile store:** Capacitor wrapper per App Store/Play Store. 70%+ del casual gaming è mobile. PWA in Fase 1, store in Fase 3.

8. **"Gameflix for Seniors":** Over 60 = mercato enorme e sottovalutato per cruciverba/Sudoku. Basta "modalità comfort" con UX adattata.

9. **Podcast "Il Puzzle della Settimana":** Zero costo, potenziale virale, funnel acquisizione organica. + Canale TikTok con puzzle visuali.

10. **Corporate wellness:** Gameflix come benefit aziendale per benessere mentale. Piano aziendale con dashboard. Posizionamento "brain training".

---

## 19. Scelte Strategiche da Prendere Subito

1. **Modello freemium vs paywall puro** → Raccomandazione: freemium con 3 giochi gratis/giorno
2. **Prezzo abbonamento** → Raccomandazione: 3.99 EUR early adopter, poi 4.99 EUR
3. **Mercato geografico** → Raccomandazione forte: solo Italia all'inizio
4. **Stack tecnologico** → Raccomandazione: Next.js + NestJS + PostgreSQL + Vercel/Railway
5. **Game engine** → Raccomandazione: DOM + CSS per Fase 1, Phaser.js da Fase 2
6. **Content pipeline** → Mix: generazione algoritmica + template + AI-assist + game designer part-time dal Mese 3
7. **Posizionamento brand** → "Palestra mentale quotidiana", NON "sito di giochini"
8. **Acquisizione iniziale** → SEO + community enigmisti + viral loop (condivisione risultati)

---

# Proposta Iniziale Raccomandata

## Come partiremmo noi

**Gameflix lancia come "la tua palestra mentale quotidiana"** — non come "sito di giochi". Posizionamento: 5-15 minuti al giorno di sfide per la mente, ogni giorno qualcosa di nuovo, con una community che ti stimola a migliorare.

### I Mondi iniziali
**BrainLab + WordForge + QuizArena.** Tre pilastri: logica, linguaggio, conoscenza. Tutti con alta automatizzabilità di contenuto.

### Il modello di business
**Freemium con soglia generosa:**
- **Gratis:** 3 giochi/giorno (1 daily per Mondo), primo episodio di ogni serie, profilo base
- **Premium (3.99 EUR/mese lancio, poi 4.99 EUR):** Tutto illimitato, zero ads, accesso anticipato, badge "Premium"
- **Early Adopter (primi 500):** 2.99 EUR/mese "per sempre"

### La cadenza di rilascio
- **Quotidiano:** 3 daily (uno per Mondo, ore 00:00)
- **Settimanale:** 1 nuovo gioco (mercoledì), 1 sfida speciale (venerdì)
- **Mensile:** 1 nuova serie per almeno 1 Mondo

### L'MVP concreto
Web app responsive (mobile-first) con:
- 9 tipologie di gioco (3 per Mondo)
- Daily automatizzato + 3 serie lancio (5 episodi)
- Profilo con streak, punteggi, achievement
- Classifiche giornaliere
- Pagamento Stripe
- Condivisione social risultati

**Timeline:** 14-16 settimane sviluppo + 2 settimane beta.

### La metrica nord star
**DAU attivi (utenti che completano almeno 1 gioco al giorno).** Non registrazioni, non pageviews, non revenue. Se le persone tornano ogni giorno, tutto il resto seguirà.

### L'onestà brutale

Gameflix ha un problema strutturale: **il contenuto è il prodotto, e il contenuto costa.** A differenza di un SaaS, qui devi produrre continuamente. La sostenibilità dipende dalla macchina di produzione contenuti (automazione + template + AI + UGC). Se funziona, vantaggio competitivo enorme. Se non funziona, burnout e churn inevitabili.

Il secondo rischio: non si compete con altri "siti di puzzle" — si compete con TikTok, Instagram, YouTube per 15 minuti di tempo libero. Il prodotto deve essere **così soddisfacente** da far scegliere un puzzle invece di uno scroll infinito.

Se si parte con queste consapevolezze, con un MVP snello, con posizionamento chiaro, e pipeline contenuti robusta, **Gameflix ha le carte per diventare il NYT Games italiano.** Il mercato c'è, la domanda c'è, e in Italia non c'è nessuno che lo stia facendo bene.

---

# Le Prossime 10 Decisioni Operative da Prendere

1. **Definire budget e runway** — Quanti soldi e per quanti mesi? Senza questa risposta, ogni piano è fantasia.

2. **Validare lo stack con un prototipo** — Costruire un Sudoku giocabile con Next.js + NestJS in 1 settimana. Se non funziona, cambiare prima di investire mesi.

3. **Definire il modello freemium esatto** — Quanti giochi gratis/giorno? Quali feature free vs paid? Le serie: primo episodio gratis? Queste decisioni impattano codice e design.

4. **Creare la pipeline di generazione contenuti** — Prima di costruire la piattaforma, assicurarsi di poter produrre. Generatore Sudoku, sistema cruciverba, database quiz. Se il contenuto è un collo di bottiglia, tutto il resto è inutile.

5. **Progettare lo schema dati** — Schema PostgreSQL per tutte le entità. Farlo bene ora evita migrazioni dolorose.

6. **Decidere strategia di beta/lancio** — Beta chiusa con waitlist? Lancio aperto? Product Hunt? Community enigmisti?

7. **Stabilire metriche di successo MVP** — Numeri concreti: D7 retention >30%, conversion >5%, 500+ registrazioni mese 1.

8. **Definire calendario editoriale primi 2 mesi** — Quali giochi escono e quando. 2 mesi di contenuto pronti prima del lancio.

9. **Impostare framework legale** — Privacy policy, ToS, GDPR, cookie banner. Noioso ma obbligatorio.

10. **Decidere se cercare un co-founder** — Fare tutto da solo (lento, bus factor 1) o trovare un partner tecnico che condivida la visione.

---

*Documento prodotto dal team Discovery di Gameflix. Ogni raccomandazione è pensata per un team piccolo con risorse limitate che deve validare rapidamente e iterare. Tutti i numeri sono benchmark di settore da validare con dati reali post-lancio.*
