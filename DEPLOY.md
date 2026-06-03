# AquaMind — Production Deployment (office server + Cloudflare Tunnel)

Runs the whole stack — including a self-hosted MQTT broker — on your office
machine and publishes it through a **Cloudflare Tunnel**: **no port forwarding,
no public IP, no inbound firewall rules.** The Raspberry Pi publishes sensor
data over **MQTT-over-WebSocket (wss)** through the same tunnel.

```
Web:   browser ─▶ Cloudflare (https://wqmscloud.com) ──tunnel──▶ cloudflared ─▶ nginx ─┬─ /api ─▶ backend ─▶ db/redis
                                                                                        └─ /*   ─▶ React app
MQTT:  Raspberry Pi ──wss://mqtt.wqmscloud.com──▶ Cloudflare ──tunnel──▶ cloudflared ─▶ Mosquitto (ws :9001)
                                                  (TLS here)                                  ▲
                                                                  backend subscribes via mqtt:1883 (internal)
```

## Containers
| Service     | Purpose                                   | Published |
|-------------|-------------------------------------------|-----------|
| cloudflared | Outbound tunnel to Cloudflare             | none (outbound) |
| frontend    | Nginx: serves the app + proxies `/api`    | none |
| backend     | API, Prisma, Puppeteer; MQTT subscriber   | none |
| mqtt        | Mosquitto broker (native :1883 + ws :9001)| none |
| database    | PostgreSQL + TimescaleDB                  | none |
| redis       | cache                                     | none |

**Nothing is published on the host.** No `ufw`/router/security-group changes.

---

## 1. One-time: push this code to git (from your PC)
```powershell
cd "WQS-Aquamind"
git init
git add .
git commit -m "Add Docker production deployment"
git branch -M main
git remote add origin git@github.com:<you>/aquamind.git
git push -u origin main
```
> ⚠️ This repo is in OneDrive — set `src/assets/` to "Always keep on this
> device" before committing, or images commit as empty cloud placeholders.

## 2. On the office server: install Docker + git
```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER     # then log out & back in
docker --version && docker compose version
```

## 3. Cloudflare Tunnel — create it and add TWO public hostnames
1. Cloudflare → **Zero Trust → Networks → Tunnels → Create a tunnel** → type **Cloudflared**.
2. Name it (e.g. `aquamind`) and **copy the token** (the long `eyJ...` string after `--token`). → goes in `.env.prod`.
3. Add **Public Hostname #1** (the web app):
   - Subdomain: *(blank)*  Domain: **wqmscloud.com**  Type: **HTTP**  URL: **frontend:80**
4. Add **Public Hostname #2** (MQTT over WebSocket):
   - Subdomain: **mqtt**  Domain: **wqmscloud.com**  Type: **HTTP**  URL: **mqtt:9001**
5. Both auto-create their (proxied) DNS records — you don't add A records manually.

## 4. Clone the code & configure secrets
```bash
git clone git@github.com:<you>/aquamind.git
cd aquamind                        # the repo root (was WQS-Aquamind/)
cp .env.prod.example .env.prod
nano .env.prod
```
Fill in: `DOMAIN`, `CLOUDFLARE_TUNNEL_TOKEN`, `DB_PASSWORD`, `JWT_SECRET`,
`JWT_REFRESH_SECRET`, `INTERNAL_API_SECRET`. (Leave the `MQTT_*` values as-is —
the backend talks to the broker internally.)
```bash
openssl rand -hex 48   # JWT_SECRET (run again for JWT_REFRESH_SECRET)
openssl rand -hex 32   # INTERNAL_API_SECRET
```

## 5. Create the device login for the Pi (before first start)
The Pi authenticates with a username/password. **Name the login exactly the
device's MQTT identifier** — the ACL ([mqtt/acl](mqtt/acl)) restricts each login
to publishing only to `aquamind/<its-username>`. So for a device id `UNIMAP01`:
```bash
docker run --rm -v "$PWD/mqtt:/cfg" eclipse-mosquitto:2 \
  mosquitto_passwd -c -b /cfg/passwd UNIMAP01 'a-strong-device-password'
```
Repeat **without** `-c` to add more devices (one login per device id). This
writes `mqtt/passwd` (git-ignored). The broker won't start without it.

## 6. Build & start
```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build
```
First run builds images and runs DB migrations automatically. Check:
```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f backend cloudflared mqtt
```
In `cloudflared` logs look for `Registered tunnel connection`; in `backend`,
`✅ MQTT connected to broker`.

## 7. Seed the first admin user (one time)
```bash
docker compose -f docker-compose.prod.yml exec backend npx ts-node prisma/seed.ts
```

Visit **https://wqmscloud.com** — done.

## 8. Point the Raspberry Pi at the broker
The Pi connects over WebSocket-Secure through the tunnel (port 443, outbound —
no ports to open on the Pi's network either). Example with Python `paho-mqtt`:
```python
import paho.mqtt.client as mqtt

c = mqtt.Client(transport="websockets")
c.ws_set_options(path="/mqtt")
c.tls_set()                                   # validates Cloudflare's public cert
c.username_pw_set("UNIMAP01", "a-strong-device-password")
c.connect("mqtt.wqmscloud.com", 443)
c.publish("aquamind/UNIMAP01", '{"ph":7.2,"do":6.5}')
```
The username, the topic segment, and the device's `mqtt_identifier` in the app
must **all be the same value** (`UNIMAP01` here) — that's what the ACL enforces
and what attributes readings to the right station.

---

## Updating after a code change
```bash
git pull
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build
```

## Backups
```bash
docker compose -f docker-compose.prod.yml exec database \
  pg_dump -U aquamind aquamind_db | gzip > backup_$(date +%F).sql.gz
```

## Notes
- **Building needs ~2 GB RAM** (the frontend bundle is large). Add swap on a small box.
- **The office machine must stay powered on with internet** for the site and
  data ingestion. `restart: unless-stopped` brings the stack back after reboots.
- **If the Pi can't connect over `wss`**, try WebSocket path `/` instead of
  `/mqtt`, and confirm Public Hostname #2 points at `mqtt:9001` (HTTP).
- **Build on the server** (same CPU arch) so the Prisma engine binary matches.
