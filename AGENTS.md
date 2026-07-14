# Eddy — Smart Home System Bot · Specifica di progetto (prompt per Claude Code / Codex)

> **Versione 2.3.** Documento = specifica + prompt operativo, sorgente di verità del progetto.
>
> **Changelog v2 (rispetto a v1):**
> - Aggiunto: **storico ultimi N scambi** in UI (§6, client-side).
> - Aggiunto: **`SmartHomeAdapter` stub** come cucitura architetturale (§8bis).
> - Aggiunto: nota esplicita su **XSS / log injection** (§9).
> - Aggiunto: **persistenza opzionale via SQLite** dietro interfaccia `ConversationRepository`, **disattivata di default** (§8ter).
> - Aggiunto: §0.1 **Decisioni deliberate (non reintrodurre)** — guardrail anti-scope-creep.
> - Corretto: immagine base Node del frontend → **`node:24-alpine`** (Node 18/20 sono EOL).
>
> **Changelog v2.1:**
> - Modificato: l'interazione passa da testuale a **vocale** — si clicca l'immagine di Eddy e si
>   parla; Eddy legge la risposta ad alta voce. Adottato **solo TTS on-device** (Web Speech API del
>   browser); il **riconoscimento vocale/STT resta escluso** per non violare §3 (il parlato non è
>   trascritto). Aggiornati §1, §2, §6, §7, §13, §14.
>
> **Changelog v2.2:**
> - Implementato: **Eddy dinamico** (anticipa §13.1) — il personaggio è reso come **SVG inline**
>   (non più `<img>` statica): sbatte le palpebre a intervalli casuali in ogni stato, la bocca a
>   riposo è sorridente di default con brevi variazioni casuali a chiusa/imbronciata, e durante
>   `speaking` la bocca cicla tra pose aperte in sincrono con la lettura (lip-sync legato a `mode`,
>   non all'audio). Sguardo leggermente diverso in `listening`/`loading`.
> - Rimosso: **storico ultimi N scambi** dall'interfaccia (era FR-6/§6) — nessuna cronologia
>   mostrata in UI. Il logging degli scambi lato backend (`ConversationRepository`, §8ter) non è
>   toccato: resta un concetto di dominio, semplicemente non più riflesso in UI.
> - Rimosso: glow blu nello stato "ascolto" (resta il feedback testuale + la mimica del personaggio).
> - Aggiornati §2, §6, §10, §12, §13, §14.
>
> **Changelog v2.3:**
> - Rimosso: **tutto il testo a schermo** — l'istruzione testuale per stato ("Clicca su Eddy e
>   parla" ecc.) e l'area dialogo/fumetto con la risposta. L'interfaccia mostra **solo il
>   personaggio animato**: risposta e messaggio d'errore sono comunicati **esclusivamente a voce**
>   (TTS on-device); il feedback di stato passa da mimica del personaggio + glow + `aria-label` del
>   pulsante (nessuna live region testuale).
> - Corretto: bocca sorridente ingrandita; mimica "imbronciata" ora alla **stessa altezza** del
>   sorriso (stesso arco con la curvatura invertita, non più una rotazione a 180° attorno al centro
>   — che spostava anche gli angoli della bocca).
> - Aggiornati §2, §6, §9.

---

## 0. Come usare questo documento

- Salvalo alla root del repository con **entrambi** i nomi (o alias/symlink):
  - `CLAUDE.md` → letto automaticamente da **Claude Code**
  - `AGENTS.md` → letto automaticamente da **Codex**
- Modalità di lavoro attesa dall'agente:
  1. **Incrementale**: piccoli step verificabili, commit atomici con messaggi chiari.
  2. **Niente riscritture a sorpresa**: se una scelta qui indicata non regge, **fermati e proponi** l'alternativa con motivazione prima di procedere.
  3. **Definition of Done** (§12): nessuno step è concluso finché i relativi criteri non passano.
  4. **Nessuna dipendenza superflua**: aggiungi librerie solo se giustificate. Fase 1 resta snella.
  5. **Nessuna chiamata di rete verso l'esterno** in alcun punto del codice (§3).

## 0.1 Decisioni deliberate (NON reintrodurre)

Questi elementi sono stati **valutati ed esclusi consapevolmente** dalla Fase 1. Non aggiungerli
"per essere d'aiuto": se ritieni che uno serva, fermati e chiedi.

- ❌ **Next.js / Nest.js** → si usa React+Vite (SPA statica) + FastAPI. Vedi §5.
- ❌ **PostgreSQL** → se serve persistenza, si usa **SQLite** (§8ter).
- ❌ **Admin panel / CRUD template** in Fase 1 → i template si editano via file (§8).
- ❌ **Autenticazione / login** → modello di fiducia = LAN domestica; solo *seam* per il futuro.
- ❌ **PWA installabile / service worker** → richiede secure context (HTTPS); su `http://<ip>:porta`
  il browser non li registra. Rimandata a quando ci sarà TLS in LAN (roadmap §13).
- ❌ **Esposizione diretta del backend** → un solo ingresso (nginx), backend non pubblicato (§4, §11).
- ❌ **AI generativa / LLM** e **controllo dispositivi reali** → fuori scope MVP (§13).

---

## 1. Contesto e visione

**Eddy** è uno *Smart Home System Bot* con interfaccia visiva, ispirato all'omonimo personaggio
(sistema smart-home sarcastico, narcisista, che punzecchia tutti; visivamente è la lettera **E**
con occhi **D D** e completo **Y**).

L'utente apre l'interfaccia da un qualsiasi device della rete di casa, vede Eddy, **clicca sulla sua
immagine e gli parla**. Eddy risponde con una battuta pescata casualmente da un elenco di risposte
predefinite, che **legge ad alta voce** (oltre a mostrarla a schermo), nel suo tono: sarcastico,
spiritoso, autocelebrativo, ma **bonario e mai offensivo** verso l'utente reale.

Esempi di risposte (voce di Eddy, italiano):
- «Ah, un altro umano che ha bisogno di me. Che novità sconvolgente.»
- «Domanda interessante. Peccato io sia troppo geniale per prenderla sul serio. Comunque: no.»
- «Certo che ti aiuto. Sono programmato per la bontà. E per la modestia. Soprattutto la modestia.»
- «Sto elaborando... ah no, ho già finito. Sono velocissimo, a differenza di te.»

---

## 2. Obiettivo Fase 1 (MVP)

### In scope
- Web app **responsive** che mostra **solo il personaggio SVG animato** (inline, nessun testo a schermo): sbatte le palpebre e cambia mimica della bocca di continuo (§13.1), muove la bocca in sincrono quando legge la risposta; glow/cambio colore per gli stati di caricamento e risposta. Risposta ed errori sono comunicati **esclusivamente a voce** (TTS on-device) — nessuna area di dialogo/testo in UI.
- Interazione **vocale**: si clicca l'immagine di Eddy per parlare (un clic avvia l'ascolto, un secondo clic invia); la risposta viene **letta ad alta voce** via TTS on-device del browser. Il parlato **non** è trascritto (§3).
- Backend che restituisce **una risposta casuale** dall'elenco statico, con **no-repeat** immediato.
- **`SmartHomeAdapter` stub** nel layer di dominio, come seam per il futuro (§8bis).
- Funzionamento **solo in LAN**, da PC/tablet/smartphone via browser.
- **Intera soluzione dockerizzata**, avviabile con un singolo comando.

### Out of scope (NON implementare ora)
Vedi §0.1. In sintesi: **storico/cronologia in UI**, **riconoscimento vocale/STT** (il parlato non è trascritto), AI/LLM, controllo dispositivi reale, DB di default, admin panel, auth, PWA, sincronizzazione tra device, esposizione esterna. **Nota:** la risposta vocale (TTS on-device) e l'animazione base del personaggio (blink, mimica bocca, lip-sync) sono ora in scope (vedi "In scope"); restano fuori scope animazioni più complesse (gesti, movimento del corpo).

---

## 3. Vincoli non negoziabili

1. **LAN-only.** Nessuna chiamata di rete in uscita dal codice (backend o frontend): niente CDN esterne, font remoti, telemetria, API di terze parti, analytics. Tutti gli asset sono locali e bundlizzati (build offline).
2. **Dockerizzato.** Deve girare con `docker compose up` senza dipendenze installate sull'host oltre a Docker.
3. **Multi-device via browser.** Un solo punto di accesso HTTP raggiungibile dagli altri device della LAN.
4. **Minimalismo.** Fase 1 statica: nessuna complessità non richiesta (§0.1).

> **Onestà tecnica sull'esposizione esterna.** L'app può ridurre la superficie d'attacco (nessuna
> chiamata esterna, CORS ristretto, nessun segreto, binding su interfaccia LAN), ma **non può da
> sola garantire** di non essere raggiungibile da fuori: dipende dal perimetro di rete. La spec
> copre l'**hardening applicativo** (§9) e documenta le **responsabilità operative** (§11): niente
> port-forwarding sul router, firewall dell'host, e — dove possibile — pubblicazione della porta
> Docker legata a uno specifico IP di LAN anziché a `0.0.0.0`.

---

## 4. Architettura

```
Device LAN (browser: PC / tablet / smartphone)
        │  HTTP  http://<ip-host>:8080
        ▼
┌─────────────────────────────────────────────┐
│  Container "web" (nginx)                      │
│   • serve il frontend statico (build Vite)    │
│   • reverse proxy  /api/*  → api:8000         │
│   • header di sicurezza + cache asset statici │
└───────────────┬───────────────────────────────┘
                │  rete Docker interna "eddy-net" (non pubblicata)
                ▼
┌─────────────────────────────────────────────┐
│  Container "api" (FastAPI + uvicorn)          │
│   • POST /api/ask   → risposta random          │
│   • GET  /api/health                           │
│   • ResponseService (no-repeat)                │
│   • ConversationRepository (in-memory default) │
│   • SmartHomeAdapter (stub, non instradato)    │
└─────────────────────────────────────────────┘
```

**Motivazioni e trade-off**
- **Web app responsive** invece di app native: un solo codebase per tutti i device, zero installazioni lato utente. Trade-off: nessuna integrazione OS profonda (non serve in Fase 1).
- **Un solo container pubblicato (nginx)** come reverse proxy: unico URL/porta, backend non esposto, frontend e `/api` same-origin → **niente CORS**. Trade-off: un hop in più, trascurabile in LAN.
- **REST sincrono** (request/response) invece di WebSocket: sufficiente per Q&A a turni. Real-time/streaming è roadmap (§13).

---

## 5. Stack tecnologico

| Livello   | Scelta (non negoziabile in Fase 1) | Motivazione |
|-----------|------------------------------------|-------------|
| Backend   | **Python 3.12 + FastAPI + uvicorn** | Contratto tipizzato, OpenAPI automatica, ottimo per la roadmap (adapter/LLM). |
| Frontend  | **Vite + React + TypeScript** (SPA statica) | Leggero, tipizzato, pronto per animazioni future; build statica servita da nginx. |
| Web server / proxy | **nginx** (immagine ufficiale) | Serve statici + reverse proxy, robusto e leggero. |
| Build frontend | **`node:24-alpine`** (solo stage di build) | Node 18/20 sono **EOL**; 24 è l'Active LTS. |
| Orchestrazione | **Docker Compose** | Requisito di progetto. |
| Test backend | **pytest** | Standard di fatto. |
| Test frontend | **Vitest + Testing Library** | Integrazione naturale con Vite. |
| Lint/format | **ruff + black** (Python), **eslint + prettier** (TS) | Manutenibilità. |

> Il frontend produce **build statica** (`vite build`): nessun runtime Node in produzione. Node serve solo nello stage di build del Dockerfile.

---

## 6. Requisiti funzionali

- **FR-1 — Rendering di Eddy.** Personaggio reso come **SVG inline** (componente `frontend/src/components/EddyCharacter.tsx`), centrato, responsive. **Nessun testo a schermo**: nessun nome, sottotitolo o altra scritta — solo il personaggio animato.
- **FR-2 — Input domanda (vocale).** L'utente clicca l'immagine di Eddy per parlare: un clic avvia l'ascolto, un secondo clic invia. Il parlato **non** viene trascritto (§3); al backend si invia un testo segnaposto. Nessun campo di testo in UI.
- **FR-3 — Risposta casuale.** `POST /api/ask` → risposta pescata a caso dall'elenco statico. Il contenuto della domanda **non** influenza la risposta in Fase 1 (ma va validato).
- **FR-4 — No-repeat immediato.** La risposta non coincide con l'ultima servita allo stesso client. Implementato **lato backend** via `last_response_id` (§7).
- **FR-5 — Voce, nessun testo a schermo.** La risposta **non è mostrata come testo**: viene **solo letta ad alta voce** (TTS on-device, voce `it-IT` se disponibile); stato di caricamento durante la richiesta. Glow/cambio colore per gli stati "caricamento" e "risposta" (l'ascolto non ha glow: il feedback è solo la mimica del personaggio, FR-8).
- **FR-6 — Gestione errori.** Backend irraggiungibile/errore → messaggio in tono con Eddy (es. «I miei circuiti fanno i capricci. Riprova, umano.»), **letto ad alta voce** come una risposta normale (coerente con FR-5): nessun testo, stack trace o dettaglio tecnico esposto in UI.
- **FR-7 — Responsività.** Layout usabile in portrait su smartphone, tablet e desktop. Touch target ≥ 44px.
- **FR-8 — Personaggio animato (§13.1).** Eddy sbatte le palpebre a intervalli casuali in ogni stato. La bocca a riposo è **sorridente di default** e passa casualmente, per brevi istanti, a **chiusa** o **imbronciata** (stesso arco del sorriso con la curvatura invertita, stessa altezza/angoli). Lo sguardo cambia leggermente in `listening` (attento) e `loading` (pensieroso). Durante `speaking` la bocca cicla tra pose aperte in sincrono con la lettura (lip-sync legato allo stato `mode`, non all'audio/fonetica). Animazione interamente client-side (CSS + React), nessuna libreria esterna (§3).

---

## 7. Contratto API

Base path `/api`, JSON, same-origin via nginx (nessuna richiesta cross-origin dal browser).

### `GET /api/health`
`200` → `{ "status": "ok" }`

### `POST /api/ask`
Request:
```json
{ "question": "Che tempo fa?", "last_response_id": "r_017" }
```
- `question` *(string, obbligatorio, 1–500 char)*: validato lato backend (§9). Con l'input vocale il frontend invia un **segnaposto** (il parlato non è trascritto, §3); il contratto resta invariato.
- `last_response_id` *(string, opzionale)*: id dell'ultima risposta ricevuta dal client, per il no-repeat.

Response `200`:
```json
{ "id": "r_042", "text": "Ah, un altro umano che ha bisogno di me. Che novità sconvolgente." }
```

Errori:
- `422` input non valido (question mancante / fuori limite).
- `500` errore interno → `{ "error": "internal_error" }`, senza dettagli sensibili.

**Decisione FR-4:** no-repeat lato backend usando `last_response_id`: se l'elenco ha ≥2 elementi, escludi quell'id dal pool. Documentalo nel README.

---

## 8. Modello dati delle risposte

Data-driven, in file editabile senza toccare il codice: `backend/app/data/responses.json`

```json
{
  "version": 1,
  "responses": [
    { "id": "r_001", "text": "Ah, un altro umano che ha bisogno di me. Che novità sconvolgente." },
    { "id": "r_002", "text": "Domanda interessante. Peccato io sia troppo geniale per prenderla sul serio. Comunque: no." },
    { "id": "r_003", "text": "Certo che ti aiuto. Sono programmato per la bontà. E per la modestia. Soprattutto la modestia." }
  ]
}
```

Requisiti:
- Seed iniziale: **almeno 15 risposte** nel tono di Eddy (italiano, ironiche, mai volgari/offensive).
- Caricamento all'avvio del backend; id univoci; **validazione fail-fast** su file malformato/vuoto.
- Selezione casuale con `random` (no crittografia). No-repeat come §7.

## 8bis. Stub Smart Home (cucitura per il futuro)

Nel layer di dominio del backend definisci un'interfaccia astratta e una sola implementazione stub:

```python
# backend/app/smart_home/adapter.py
class SmartHomeAdapter(Protocol):
    def get_devices(self) -> list[Device]: ...
    def toggle_device(self, device_id: str) -> Device: ...
    def get_temperature(self) -> float: ...

class StubSmartHomeAdapter:   # ritorna dati fittizi deterministici
    ...
```

Regole:
- **Solo interfaccia + stub con dati finti.** Va **coperto da unit test** ma **NON instradato via API** in Fase 1.
- Struttura pronta per un futuro adapter reale (Home Assistant via REST/MQTT), senza implementarlo ora.

## 8ter. Persistenza — OPZIONALE, disattivata di default

Per non fare scope creep, la persistenza **non** è attiva in Fase 1, ma la si predispone dietro interfaccia:

```python
# backend/app/conversations/repository.py
class ConversationRepository(Protocol):
    def add(self, question: str, response_id: str) -> None: ...
    def recent(self, limit: int) -> list[ConversationEntry]: ...

class InMemoryConversationRepository:   # DEFAULT in Fase 1
    ...
```

Regole:
- **Default = `InMemoryConversationRepository`.** Nessun DB, nessun volume dati richiesto per l'MVP.
- Il logging degli scambi (timestamp, testo domanda **sanitizzato**, `response_id`) passa da questa interfaccia.
- **Opzionale (solo se richiesto esplicitamente):** implementazione `SqliteConversationRepository` dietro la **stessa** interfaccia, selezionabile via env `EDDY_PERSISTENCE=sqlite`, con file su volume Docker `eddy-data`. Non implementarla in Fase 1 salvo richiesta.

---

## 9. Requisiti non funzionali

**Sicurezza (LAN trust model, Fase 1):**
- Nessun segreto nel codice o nelle immagini; nessuna chiamata di rete in uscita (§3).
- **Validazione input** lato backend (tipo e lunghezza 1–500, §7).
- **XSS:** la risposta di Eddy va renderizzata come **testo**, mai come HTML raw. React fa escaping di default: **vietato `dangerouslySetInnerHTML`** su contenuti dinamici.
- **Log injection:** logging **strutturato a campi** (non interpolazione di stringhe con input utente); testo domanda sanitizzato/escapato prima di finire nei log.
- CORS: non necessario (same-origin via nginx); se mai servisse, **mai** `*`.
- Header nginx: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`.
- Nessuna autenticazione in Fase 1 (decisione consapevole, §0.1); struttura pronta per aggiungerla.

**Performance:**
- `POST /api/ask` < ~50 ms in LAN (selezione in memoria).
- Cache degli asset statici su nginx (bundle con hash → `Cache-Control: immutable`; `index.html` no-cache).
- Nessuna chiamata API ridondante lato frontend.

**Manutenibilità:**
- Separazione netta: **UI** (componenti React) · **dominio** (`ResponseService`, `SmartHomeAdapter`, `ConversationRepository`) · **layer HTTP** (router/controller FastAPI).
- Codice tipizzato ovunque; lint/format configurati (§5).
- Risposte separate dal codice (§8).

**Accessibilità:** `aria-label` sul pulsante di Eddy, aggiornato per ogni stato (idle/ascolto/caricamento/risposta); contrasto adeguato; focus visibile. Nessuna area di testo/`aria-live` in UI (FR-5): per utenti di screen reader il feedback di stato passa dall'`aria-label` del pulsante, non da una live region.

**Osservabilità minima:** log strutturati (richiesta ricevuta, `response_id` servito); nessun dato personale.

---

## 10. Struttura del repository

```
eddy/
├── CLAUDE.md / AGENTS.md          # (questo file) — copia/alias
├── README.md
├── docker-compose.yml
├── .env.example
├── .gitignore
├── backend/
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── pyproject.toml
│   ├── app/
│   │   ├── main.py                # app FastAPI, routing
│   │   ├── schemas.py             # Pydantic: AskRequest / AskResponse
│   │   ├── responses/
│   │   │   ├── service.py         # ResponseService (no-repeat)
│   │   │   └── ../data/responses.json
│   │   ├── conversations/
│   │   │   └── repository.py      # ConversationRepository + InMemory (default)
│   │   └── smart_home/
│   │       └── adapter.py         # SmartHomeAdapter + StubSmartHomeAdapter
│   └── tests/
│       ├── test_health.py
│       ├── test_ask.py
│       ├── test_response_service.py
│       ├── test_repository.py
│       └── test_smart_home_stub.py
├── frontend/
│   ├── Dockerfile                 # multi-stage: node:24-alpine (build) → nginx (runtime)
│   ├── .dockerignore
│   ├── nginx.conf                 # statici + proxy /api → api:8000 + header + cache
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── index.html
│   ├── public/eddy.svg
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── api.ts                 # client POST /api/ask, GET /api/health
│       ├── speech.ts              # wrapper Web Speech API (TTS on-device)
│       └── components/
│           ├── EddyFace.tsx
│           ├── EddyCharacter.tsx  # personaggio SVG animato (blink, bocca, lip-sync — FR-8)
│           └── ResponseBubble.tsx
```

---

## 11. Docker & deployment

**`docker-compose.yml` (requisiti):**
- Servizio **`api`**: build da `./backend`, ascolto su `8000` **solo sulla rete interna** (nessuna porta pubblicata sull'host).
- Servizio **`web`**: build da `./frontend`, pubblica **8080 → 80**. Unico servizio pubblicato.
- Rete dedicata **`eddy-net`** (bridge).
- `web` dipende da `api` (`depends_on`), con healthcheck su `/api/health`.
- Restart policy `unless-stopped`.
- Volume `eddy-data` **solo se** si abilita la persistenza SQLite (§8ter); altrimenti non definirlo.

**Avvio:**
```bash
cp .env.example .env
docker compose up --build -d      # avvia la stack
docker compose down               # ferma e rilascia
```

**Accesso dagli altri device LAN:**
- IP dell'host (es. `192.168.1.20`) → da qualsiasi device della stessa rete: `http://192.168.1.20:8080`

**Hardening del perimetro (responsabilità operativa — documentare nel README):**
- **Niente** port-forwarding sul router verso 8080.
- Preferibile pubblicare la porta legata all'IP LAN dell'host:
  ```yaml
  ports:
    - "192.168.1.20:8080:80"   # sostituisci con l'IP reale
  ```
- Firewall host che consenta la porta solo dalla subnet locale.

---

## 12. Testing & Definition of Done

**Test backend (pytest):**
- `GET /api/health` → `200 {"status":"ok"}`.
- `POST /api/ask` valido → `200` con `id`/`text` presenti nell'elenco.
- No-repeat: con `last_response_id`, id diverso (elenco ≥2).
- Input non valido (vuoto / >500) → `422`.
- `ResponseService`: selezione casuale + esclusione ultimo id.
- `InMemoryConversationRepository`: `add`/`recent(limit)`.
- `StubSmartHomeAdapter`: `get_devices`/`toggle_device`/`get_temperature` ritornano dati coerenti.

**Test frontend (Vitest + Testing Library):**
- Render di Eddy e della call-to-action vocale.
- Invio domanda → loading → risposta (fetch mockata).
- Personaggio animato: bocca sorridente di default, cicla tra le pose aperte mentre `speaking` (FR-8).
- Errore API → messaggio in tono, nessun crash.

**Definition of Done (Fase 1):**
- [ ] `docker compose up --build` avvia tutto senza errori.
- [ ] App raggiungibile da un secondo device LAN via `http://<ip>:8080`.
- [ ] UI mostra Eddy animato, usabile su smartphone/tablet/desktop.
- [ ] Domanda → risposta casuale coerente col tono; no-repeat funzionante.
- [ ] Eddy anima occhi e bocca (blink, mimica a riposo, lip-sync durante la risposta — FR-8).
- [ ] `SmartHomeAdapter` stub presente e testato, **non** esposto via API.
- [ ] Nessuna chiamata di rete in uscita (build offline degli asset).
- [ ] Backend non pubblica porte; solo `web` esposto.
- [ ] Test backend/frontend verdi; lint/format puliti.
- [ ] README con: avvio, accesso da altri device, note sicurezza/perimetro, come editare `responses.json`, come (in futuro) abilitare SQLite.

---

## 13. Roadmap fasi successive (fuori scope Fase 1)

1. **Eddy dinamico:** **implementato** (FR-8) — blink, mimica bocca a riposo (sorriso/chiusa/imbronciata) e
   lip-sync durante `speaking`, tutti sincronizzati con lo stato `mode`. Restano fuori scope
   animazioni più complesse (gesti, movimento del corpo, espressioni facciali aggiuntive).
2. **PWA + TLS in LAN:** manifest + service worker una volta introdotto HTTPS (self-signed/`mkcert`), che è il prerequisito tecnico mancante oggi.
3. **Voce:** il **TTS on-device** (risposta parlata) è **già implementato** in Fase 1. Resta lo **STT/riconoscimento vocale** del parlato dell'utente, on-device o self-hosted (per non violare §3).
4. **Risposte reali:** LLM **locale/self-hosted** in container, con personalità di Eddy via system prompt.
5. **Persistenza:** attivazione `SqliteConversationRepository` (§8ter) + eventuale admin panel con auth fatta per bene.
6. **Real-time multi-device:** WebSocket per stato condiviso/broadcast tra client.
7. **Integrazione smart-home reale:** adapter concreto dietro `SmartHomeAdapter` (Home Assistant REST/MQTT), sempre in LAN.

Progetta la Fase 1 senza precludere questi step (risposte data-driven, contratto API pulito, interfacce di dominio, componenti isolati), ma **non anticiparne l'implementazione**.

---

## 14. Assunzioni prese (da confermare/correggere)

- **Input vocale** (clic sull'immagine di Eddy): la risposta è letta ad alta voce (TTS on-device); il parlato **non** è trascritto (STT rimandato, §13).
- **Client indipendenti**, nessuna sincronizzazione tra device.
- **Stack** = FastAPI + React/Vite + nginx (non negoziabile in Fase 1, §0.1).
- **Persistenza disattivata** di default (in-memory); SQLite solo su richiesta esplicita.
- **Lingua delle risposte** = italiano; identificatori e commenti del codice in inglese.
- **Porta host** = 8080 (modificabile via `.env`).
- **Immagine di Eddy** = asset locale/placeholder ispirato al personaggio, non un asset protetto scaricato da fonti esterne.
