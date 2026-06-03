# AquaMind — Production Deployment (office server + Cloudflare Tunnel + HiveMQ)

Runs the whole app on your office machine and publishes it to the internet with
a **Cloudflare Tunnel** — **no port forwarding, no public IP, no inbound firewall
rules.** Remote field sensors publish to **HiveMQ Cloud**, and the backend
subscribes to it outbound. Everything is outbound-only, which is why this works
behind an office network you don't control.

```
Web:   browser ─▶ Cloudflare (https://wqmscloud.com) ──tunnel──▶ cloudflared
                                                                     │
                                                  frontend (nginx) ◀─┘ ─┬─ /api ─▶ backend ─▶ db / redis
                                                                        └─ /*   ─▶ React app
MQTT:  remote sensors ──mqtts──▶ HiveMQ Cloud ◀──outbound subscribe── backend
```

## Containers
| Service     | Purpose                                   | Published |
|-------------|-------------------------------------------|-----------|
| cloudflared | Outbound tunnel to Cloudflare             | none (outbound) |
| frontend    | Nginx: serves the app + proxies `/api`    | none |
| backend     | API, Prisma, Puppeteer; HiveMQ subscriber | none |
| database    | PostgreSQL + TimescaleDB                  | none |
| redis       | cache                                     | none |

**Nothing is published on the host.** No `ufw`/security-group/router changes.

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
> ⚠️ This repo is in OneDrive — before committing, set `src/assets/` to "Always
> keep on this device" so images aren't committed as cloud placeholders.

## 2. On the office server: install Docker + git
```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER     # then log out & back in
docker --version && docker compose version
```

## 3. HiveMQ Cloud (the MQTT broker)
1. Sign up at **https://www.hivemq.com/cloud/** and create a **free Serverless cluster**.
2. From **Overview**, note the **host** (e.g. `abc123.s1.eu.hivemq.cloud`) and port **8883**.
3. Under **Access Management → Credentials**, create logins:
   - one for the backend (e.g. `aquamind-backend` / strong password) — goes in `.env.prod`.
   - one (or more) for your field sensors (e.g. `sensor1`).
4. Point your field sensors at: `mqtts://<host>:8883`, their username/password,
   publishing to topic `aquamind/<device-mqtt-identifier>`.

## 4. Cloudflare Tunnel (publishes the web app)
1. Cloudflare dashboard → **Zero Trust → Networks → Tunnels → Create a tunnel** → type **Cloudflared**.
2. Name it (e.g. `aquamind`) and **copy the token** (the long string after `--token`). This goes in `.env.prod`.
3. Add a **Public Hostname**:
   - Subdomain: *(blank)*  Domain: **wqmscloud.com**
   - Type: **HTTP**   URL: **frontend:80**
   - (This auto-creates the proxied DNS record — you do **not** add an A record manually.)
4. Make sure SSL/TLS mode for the domain is **Full** (Cloudflare provides the public HTTPS cert).

## 5. Clone the code & configure secrets
```bash
git clone git@github.com:<you>/aquamind.git
cd aquamind                        # the repo root (was WQS-Aquamind/)
cp .env.prod.example .env.prod
nano .env.prod                     # fill in everything below
```
Fill in: `DOMAIN`, `CLOUDFLARE_TUNNEL_TOKEN`, `DB_PASSWORD`, `JWT_SECRET`,
`JWT_REFRESH_SECRET`, `INTERNAL_API_SECRET`, and the HiveMQ `MQTT_*` values.
```bash
openssl rand -hex 48   # JWT_SECRET (run again for JWT_REFRESH_SECRET)
openssl rand -hex 32   # INTERNAL_API_SECRET
```

## 6. Build & start
```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build
```
First run builds the images and applies DB migrations automatically. Check:
```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f backend cloudflared
```
In `cloudflared` logs you should see the tunnel register; in `backend` logs,
`✅ MQTT connected to broker`.

## 7. Seed the first admin user (one time)
```bash
docker compose -f docker-compose.prod.yml exec backend npx ts-node prisma/seed.ts
```

Visit **https://wqmscloud.com** — done.

---

## Updating after a code change
```bash
git pull
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build
```
(Migrations run automatically on backend startup.)

## Backups
```bash
docker compose -f docker-compose.prod.yml exec database \
  pg_dump -U aquamind aquamind_db | gzip > backup_$(date +%F).sql.gz
```

## Notes
- **Building needs ~2 GB RAM** (the frontend bundle is large). Add swap on a small box.
- **The office machine must stay powered on with internet** for the site and
  data ingestion to work. If it sleeps/reboots, Docker's `restart: unless-stopped`
  brings the stack back up automatically once it's running again.
- **No HiveMQ?** You can instead run the broker on a small cloud VPS and point
  `MQTT_BROKER_URL` at it — but HiveMQ Cloud's free tier is the least effort here.
- **Build on the server** (same CPU arch) so the Prisma engine binary matches.
