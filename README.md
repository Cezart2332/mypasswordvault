# MyPasswordVault — Frontend

React + TypeScript single-page application for the MyPasswordVault zero-knowledge password manager.

## Tech Stack

| Tool | Version | Purpose |
|---|---|---|
| React | 19 | UI framework |
| TypeScript | 5.9 | Type safety |
| Vite | 6 | Build tool & dev server |
| React Router | 7 | Client-side routing |
| Axios | 1.x | HTTP client |
| react-icons | 5 | Icon library (Feather set) |
| qrcode.react | 4 | QR code rendering for 2FA setup |

## Project Structure

```
client/
├── src/
│   ├── pages/               # Full-page route components
│   │   ├── LandingPage.tsx       # Marketing / home page
│   │   ├── LoginPage.tsx         # Email + password login
│   │   ├── RegisterPage.tsx      # Account creation
│   │   ├── DashboardPage.tsx     # Post-login redirect
│   │   ├── VaultPage.tsx         # Main vault with sidebar & grid
│   │   ├── SettingsPage.tsx      # Password, email, 2FA, delete account
│   │   ├── ForgotPasswordPage.tsx
│   │   ├── ResetPasswordPage.tsx
│   │   ├── EmailVerificationPage.tsx
│   │   ├── TwoFactorLoginPage.tsx
│   │   └── VerifyEmailChangePage.tsx
│   ├── components/
│   │   ├── common/
│   │   │   ├── Navbar.tsx
│   │   │   ├── ProtectedRoute.tsx   # Redirects unauthenticated users
│   │   │   ├── Toast.tsx            # Notification toasts
│   │   │   └── ConfirmDialog.tsx    # Delete confirmation modal
│   │   └── vault/
│   │       ├── VaultList.tsx        # Grid of password cards
│   │       ├── VaultEntryCard.tsx   # Single password card
│   │       ├── AddPasswordModal.tsx # Create / edit modal with password generator
│   │       └── UnlockVaultModal.tsx # Re-derive vault key after session restore
│   ├── context/
│   │   └── AuthContext.tsx     # JWT token storage + refresh logic
│   ├── hooks/
│   │   ├── useToast.ts
│   │   └── useVault.ts
│   ├── services/              # Axios API wrappers
│   │   ├── authService.ts
│   │   ├── vaultService.ts
│   │   └── userService.ts
│   ├── types/                 # Shared TypeScript interfaces
│   ├── index.css              # Global design tokens & shared components
│   └── App.tsx                # Router configuration
├── nginx/
│   └── default.conf           # Nginx config for Docker (SPA fallback routing)
├── Dockerfile
├── docker-compose.yml
└── .github/workflows/
    └── pipeline.yaml          # CI/CD: build → Docker Hub → Coolify
```

## Zero-Knowledge Encryption

All encryption happens **entirely in the browser**. The server never receives your master password or any plaintext.

1. **Key derivation** — PBKDF2 (SHA-256, 600 000 iterations) derives a 256-bit AES key from your master password + a random per-account salt stored on the server.
2. **Vault encryption** — Each entry is encrypted with AES-256-GCM using a unique random IV before being sent to the API.
3. **Decryption** — Only the browser, with the derived key in memory, can decrypt vault entries.
4. **Password reset / change** — Because the vault key is derived from your password, changing or resetting your password **permanently wipes your vault**. This is intentional and unavoidable in a zero-knowledge design.

## Getting Started (Local Development)

### Prerequisites

- Node.js 22+
- The backend API running (see `../server/README.md`)

### Install & run

```bash
cd client
npm install
npm run dev
```

The dev server starts at **http://localhost:5173**.

### Environment variable

The API base URL is baked in **at build time** via a Vite env var:

```bash
# .env.local (git-ignored, for local dev)
VITE_API_BASE_URL=http://localhost:5000
```

If the variable is not set, all API calls use a relative path (works when the frontend is served from the same origin as the API).

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | TypeScript check + production bundle |
| `npm run preview` | Serve the production build locally |

## Docker

### Build manually

```bash
docker build \
  --build-arg VITE_API_BASE_URL=https://api.yourdomain.com \
  -t mypwvault-frontend .
```

### docker-compose (production)

```yaml
# client/docker-compose.yml — pulled by Coolify
services:
  frontend:
    image: cezarique/passfrontend:latest
    pull_policy: always
    ports:
      - "80:80"
    restart: unless-stopped
```

The Nginx container serves the static bundle and handles SPA routing (`try_files $uri $uri/ /index.html`).

## CI/CD

Pushing to `main` triggers `.github/workflows/pipeline.yaml`:

1. Builds a Docker image with `VITE_API_BASE_URL` injected from GitHub Secrets.
2. Pushes `cezarique/passfrontend:latest` and `cezarique/passfrontend:<sha>` to Docker Hub.
3. Calls the Coolify webhook to redeploy automatically.

### Required GitHub Secrets

| Secret | Description |
|---|---|
| `DOCKER_USERNAME` | Docker Hub username |
| `DOCKERHUB_TOKEN` | Docker Hub access token |
| `VITE_API_BASE_URL` | Full URL of the backend API (e.g. `https://api.mypasswordvault.cloud`) |
| `COOLIFY_DOMAIN` | Coolify instance URL |
| `COOLIFY_UUID` | Coolify application UUID |
| `COOLIFY_TOKEN` | Coolify API token |

## Pages & Routes

| Route | Page | Auth required |
|---|---|---|
| `/` | LandingPage | No |
| `/login` | LoginPage | No |
| `/register` | RegisterPage | No |
| `/verify-email` | EmailVerificationPage | No |
| `/forgot-password` | ForgotPasswordPage | No |
| `/reset-password` | ResetPasswordPage | No |
| `/2fa` | TwoFactorLoginPage | No |
| `/verify-email-change` | VerifyEmailChangePage | No |
| `/vault` | VaultPage | **Yes** |
| `/settings` | SettingsPage | **Yes** |
