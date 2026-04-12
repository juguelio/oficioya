# Oficio

Marketplace hiperlocal de oficios para el corredor andino patagónico (San Martín de los Andes, Villa La Angostura, Bariloche).

## Desarrollo local

```bash
npm install
cp .env.example .env.local   # completar con credenciales reales
npm run dev                   # http://localhost:3000
```

Type check:
```bash
npx tsc --noEmit
```

Screenshot headless (390px):
```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --headless=new --screenshot=/tmp/page.png \
  --window-size=390,844 --virtual-time-budget=5000 \
  "http://localhost:3000/"
```

---

## Deploy — Vercel

### Prerequisitos

- Cuenta Vercel conectada al repo
- Proyecto Supabase activo (`dmzdvjfctkfxefhxjmkm`)
- Instancia n8n corriendo (opcional — los webhooks se omiten silenciosamente si no están configurados)

### Pasos

**1. Importar el proyecto en Vercel**

```
vercel.com/new → Import Git Repository → seleccionar este repo
```

Vercel detecta Vite automáticamente. La configuración en `vercel.json` sobreescribe cualquier autodetección:
- Build command: `npm run build`
- Output directory: `dist`
- Framework: `vite`
- SPA rewrites: todas las rutas → `index.html`

**2. Configurar variables de entorno**

En Vercel → Project Settings → Environment Variables, agregar las variables de `.env.production.example`:

| Variable | Dónde obtenerla |
|----------|----------------|
| `VITE_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → anon public key |
| `VITE_N8N_WEBHOOK_WELCOME_EMAIL` | n8n → Webhook node URL del workflow welcome-email |
| `VITE_N8N_WEBHOOK_NEW_PROVIDER` | n8n → Webhook node URL del workflow new-provider |

Marcar todas como **Production** (y Preview si se quiere probar en branch deploys).

> Las variables `VITE_*` se incrustan en el bundle en build time. No son secretas — no poner `SUPABASE_SERVICE_ROLE_KEY` ni ningún secreto de servidor aquí.

**3. Deploy**

```bash
# Primer deploy (o trigger manual)
vercel --prod

# O simplemente hacer push a main — Vercel hace deploy automático
git push origin main
```

**4. Configurar Supabase Auth redirect URLs**

En Supabase → Authentication → URL Configuration:

```
Site URL:              https://oficio.app
Redirect URLs:         https://oficio.app/**
                       https://*.vercel.app/**   ← para preview deploys
```

**5. Verificar**

- `https://oficio.app/` — HomePage carga, pills de ciudad visibles
- `https://oficio.app/san-martin/electricista` — RubroPage carga prestadores desde Supabase
- `https://oficio.app/registro/prestador` — form de signup funciona
- `https://oficio.app/cualquier-ruta-inventada` — debe cargar la app (SPA rewrite activo)

### Variables de entorno para servicios VPS (no van en Vercel)

Los servicios en `~/services/` (Baileys, Whisper) y n8n corren en VPS separado. Sus variables van en `.env` local de cada servicio. Ver `.env.example` en cada directorio de servicio y `oficio/.claude/integrations.md` para el detalle completo.
