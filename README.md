# Eddy — Smart Home System Bot

Eddy è uno Smart Home System Bot con interfaccia visiva: fai una domanda, Eddy risponde con una
battuta sarcastica (ma bonaria) pescata da un elenco predefinito. Funziona solo in LAN, dockerizzato,
avviabile con un singolo comando.

Specifica completa di progetto: [AGENTS.md](AGENTS.md) (= [CLAUDE.md](CLAUDE.md)).

## Avvio

Richiede solo Docker e Docker Compose.

```bash
cp .env.example .env
docker compose up --build -d      # avvia la stack
docker compose down                # ferma e rilascia
```

L'app è raggiungibile da questo stesso PC su `http://localhost:8080`.

## Accesso da altri device della LAN

1. Trova l'IP LAN dell'host che esegue Docker (es. `192.168.1.20`).
2. Da qualsiasi altro device (PC, tablet, smartphone) sulla stessa rete, apri:
   `http://192.168.1.20:8080`

Solo il servizio `web` (nginx) pubblica una porta sull'host; il backend (`api`) resta raggiungibile
solo tramite la rete Docker interna `eddy-net` e non è mai esposto direttamente.

## Sicurezza e perimetro di rete

Il modello di fiducia di Fase 1 è la LAN domestica: **non c'è autenticazione**. L'app riduce la
superficie d'attacco (nessuna chiamata di rete in uscita, asset serviti localmente, CORS non
necessario perché same-origin, header `X-Content-Type-Options` / `X-Frame-Options` /
`Referrer-Policy` impostati da nginx), ma **non può da sola garantire** di non essere raggiungibile
da fuori la LAN: dipende dal perimetro di rete. Responsabilità operative:

- **Non fare port-forwarding** sul router verso la porta 8080.
- Preferibile pubblicare la porta legata all'IP LAN dell'host invece che su tutte le interfacce:
  imposta nel file `.env`
  ```
  HOST_BIND_IP=192.168.1.20   # sostituisci con l'IP reale dell'host
  ```
- Configura il firewall dell'host per consentire la porta solo dalla subnet locale.

## Come editare le risposte di Eddy

Le risposte sono data-driven, in [backend/app/data/responses.json](backend/app/data/responses.json):

```json
{
  "version": 1,
  "responses": [
    { "id": "r_001", "text": "Testo della risposta, nel tono sarcastico di Eddy." }
  ]
}
```

Regole: `id` univoci e non vuoti, `text` non vuoto, almeno una risposta presente (validazione
fail-fast all'avvio del backend). Non serve toccare il codice: basta modificare il file e riavviare
il container `api` (`docker compose up --build -d api`).

## Storico conversazioni

Lo storico degli ultimi N scambi (default **N=10**, configurabile con `VITE_HISTORY_SIZE` in `.env`)
è mantenuto **solo lato client** (stato React in memoria) e si azzera al refresh della pagina. Non
c'è sincronizzazione tra device né persistenza server-side attiva in Fase 1.

## Persistenza (opzionale, disattivata di default)

Il backend usa di default `InMemoryConversationRepository` (nessun database, nessun volume dati).
È predisposta, ma **non implementata**, un'alternativa SQLite dietro la stessa interfaccia
`ConversationRepository` (vedi AGENTS.md §8ter), attivabile in futuro con `EDDY_PERSISTENCE=sqlite`
e un volume Docker dedicato (`eddy-data`) — da aggiungere solo quando effettivamente richiesto.

## Sviluppo locale (senza Docker)

**Backend** (Python 3.12+):
```bash
cd backend
python -m venv .venv
.venv/Scripts/activate   # Linux/Mac: source .venv/bin/activate
pip install -e ".[dev]"
pytest                    # test
ruff check app tests      # lint
black app tests           # format
uvicorn app.main:app --reload --port 8000
```

**Frontend** (Node 24+):
```bash
cd frontend
npm install
npm test                  # Vitest + Testing Library
npm run lint               # eslint
npm run dev                 # dev server su :5173, proxy /api -> localhost:8000
npm run build                # build statica di produzione (dist/)
```

## Contratto API (sintesi)

Base path `/api`, same-origin via nginx. Dettagli completi in [AGENTS.md §7](AGENTS.md).

- `GET /api/health` → `200 { "status": "ok" }`
- `POST /api/ask` con `{ "question": "...", "last_response_id": "r_017" }` →
  `200 { "id": "r_042", "text": "..." }`. `422` se `question` manca o è fuori dal range 1–500
  caratteri; `500 { "error": "internal_error" }` per errori interni.

## Roadmap

Fuori scope in Fase 1 (vedi AGENTS.md §13): Eddy dinamico/animato, PWA + TLS, voce (TTS/STT),
risposte generate da un LLM locale, persistenza SQLite attiva, real-time multi-device, integrazione
smart-home reale dietro `SmartHomeAdapter`.
