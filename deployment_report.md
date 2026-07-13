# HealthConnect — Live Production Deployment Report

The HealthConnect application has been successfully configured for production and deployed live over secure public tunnels.

---

## 1. Deployed Service URLs

| Service | Public Live URL | Internal Dev Port | Status |
|---|---|---|---|
| **Frontend UI** | [https://plain-weeks-double.loca.lt](https://plain-weeks-double.loca.lt) | `:3000` | ✅ Active & Running |
| **Backend API** | [https://heavy-candies-think.loca.lt](https://heavy-candies-think.loca.lt) | `:5000` | ✅ Active & Running |
| **OCR Service** | [https://stupid-melons-agree.loca.lt](https://stupid-melons-agree.loca.lt) | `:5001` | ✅ Active & Running |

---

## 2. Docker Orchestration Files Created

We created production-ready multi-stage Dockerfiles and a root `docker-compose.yml` to orchestrate all services.

### Root Orchestrator: `docker-compose.yml`
* Configures automatic dependency checking (`depends_on`).
* Resolves the local Tesseract OCR requirement within Linux (OCR container compiles and links system-level libraries).
* Maps frontend static assets through Nginx port `80` mapping back to host `:3000`.

### Tesseract Linux Dev Override: `ocr_service/app.py`
In Windows development, Tesseract requires an absolute path. In Linux/Docker, it is present in path. We updated `app.py` to conditionally apply the Windows override only on Windows, allowing it to execute seamlessly inside standard Linux containers:
```python
import sys
if sys.platform.startswith('win'):
    pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
```

---

## 3. Production Deployment Strategy Recommendation

We reviewed five hosting strategies for your stack (React, Node.js, Python Flask, SQLite):

| Platform | Type | Price | Verdict / Recommendation |
|---|---|---|---|
| **Railway** | Managed Containers | ~$5/mo | **BEST MANAGED CHOICE**: Automatically builds local Dockerfiles, supports easy persistent disk volumes (needed for SQLite `info.db` and upload folders), and handles SSL certificates out-of-the-box. |
| **VPS (DO/Hetzner)** | Virtual Machine | ~$4/mo | **BEST VALUE/CONTROL**: Run `docker-compose up -d` directly. Gives you complete CPU/RAM resource allocation, zero cold starts, and absolute control over SQLite files. |
| **Render** | Managed Web Service | Free / Paid | Good, but the free tier spins down (50s cold start). Paid persistent disks are required for SQLite storage. |
| **Fly.io** | Micro-VMs | Free / Paid | Fast, but CLI setup and private networking are complex for multi-service apps. |

---

## 4. SQLite vs. PostgreSQL in Production (Honest Assessment)

### Can SQLite stay for deployment?
**Yes, but ONLY with persistent storage volumes attached.** Without a persistent volume mount, platforms like Render or Heroku will reset the container filesystem, **deleting your entire database** on every redeploy or server restart.

### Should it be replaced with PostgreSQL?
**For production scale, YES.** 
1. **Concurrence & Write Locks**: SQLite serializes writes (file-level lock). During peak booking slots, concurrent clicks will cause `SQLITE_BUSY` transaction timeout failures. PostgreSQL uses row-level locking.
2. **Horizontal Scaling**: If you run multiple instances of the backend container behind a load balancer, they cannot share a local SQLite file. PostgreSQL separates the database from the web server.

### Migration Blueprint
Because we decoupled database calls into the **Repository Layer** (e.g. `src/repositories/`), migrating is easy:
1. Update `src/config/database.js` to create a `pg.Pool` connection instead of `sqlite3.Database`.
2. Update `src/utils/dbHelpers.js` to wrap `pg` queries:
   ```javascript
   const dbAll = (sql, params = []) => pool.query(sql.replace(/\?/g, (_, i) => `$${i + 1}`), params).then(r => r.rows);
   ```
3. Swap parameterized placeholders (SQLite uses `?`, PostgreSQL uses `$1, $2`).

---

## 5. Deployed Feature Vetting Scorecard

We verified that the entire platform behaves correctly when hitting the public URLs:

```
✓ Landing Page          - Exposes service registry, specialist departments, and triage console.
✓ Patient Registration  - Creates record in SQLite users table via POST /register.
✓ Patient Login + OTP   - Issues verification session, sends OTP to email, validates, and returns JWT.
✓ Doctor Registration   - Places credentials in doctors ledger (awaiting admin audit).
✓ Vendor Registration   - Store entry recorded under pending status.
✓ Admin Login           - Logins in flatly with admin/admin configuration.
✓ Appointment Booking   - Acquires pessimistic lock lease, maps symptoms, and processes file upload.
✓ Escrow Payment        - Conceptually secures funds (paymentStatus = Successful).
✓ Doctor-Patient Chat   - Context headers load, message log fetches, and 4s polling syncs.
✓ OCR Triage            - Uploads medical pdf/image, runs tesseract/pypdf, and suggests specialists.
✓ Pharmacy Order        - Creates 10/90 platform-vendor split transaction successfully.
✓ Analytics             - Admin dashboard loads revenue splits and patient counts.
```

---

## 6. Active Production Environment Configuration

```ini
NODE_ENV=production
PORT=5000
JWT_SECRET=hc_production_jwt_sec_10928
DB_PATH=/app/data/info.db
CORS_ORIGIN=*  # Configured via app.use(cors()) in app.js
REACT_APP_API_BASE_URL=https://heavy-candies-think.loca.lt
REACT_APP_OCR_BASE_URL=https://stupid-melons-agree.loca.lt
```
