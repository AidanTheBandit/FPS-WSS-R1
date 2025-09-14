# FPS-WSS-R1 Monorepo

A multiplayer FPS game built with React frontend and Node.js backend, optimized for cloud deployment with Cloudflare Tunnel.

## 🏗️ Monorepo Structure

```
FPS-WSS-R1/
├── react/          # React frontend (Vite)
├── server/         # Node.js backend (Express + Socket.IO)
├── package.json    # Root package.json with monorepo scripts
└── README.md       # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- npm 7+
- Cloudflare account (for tunneling)

### Installation
```bash
# Install all dependencies (frontend + backend)
npm run install:all

# Or install separately
npm install                    # Root dependencies
npm run install:server         # Backend dependencies
```

### Development
```bash
# Start both frontend and backend in development mode
npm start
# Frontend: http://localhost:5642
# Backend: http://localhost:5642

# Start with Cloudflare tunnels
npm run tunnel
# Frontend tunnel URL will be provided
# Backend tunnel URL will be provided
```

### Production
```bash
# Build and start in production mode
npm run start:prod

# Build and start with tunnels
npm run tunnel:prod
```

## 📜 Available Scripts

### Root Scripts (Monorepo)
- `npm run install:all` - Install all dependencies
- `npm run build` - Build frontend only
- `npm run build:all` - Build both frontend and backend
- `npm start` - Start development servers
- `npm run start:prod` - Start production servers
- `npm run tunnel` - Start development with Cloudflare tunnels
- `npm run tunnel:prod` - Start production with Cloudflare tunnels
- `npm run clean` - Clean all build artifacts

### Frontend Scripts (React/Vite)
- `npm run start:frontend` - Start frontend dev server
- `npm run start:frontend:prod` - Start frontend production server
- `npm run build:frontend` - Build frontend for production
- `npm run tunnel:frontend` - Tunnel frontend only
- `npm run clean:frontend` - Clean frontend build

### Backend Scripts (Node.js)
- `npm run start:backend` - Start backend dev server
- `npm run start:backend:prod` - Start backend production server
- `npm run build:backend` - Build backend (no-op for Node.js)
- `npm run tunnel:backend` - Tunnel backend only
- `npm run clean:backend` - Clean backend build

## 🌐 Cloudflare Tunnel Setup

### 1. Install Cloudflared
```bash
# macOS
brew install cloudflared

# Or download from: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/tunnel-guide/
```

### 2. Authenticate
```bash
cloudflared tunnel login
```

### 3. Create Tunnels (Optional)
```bash
# Create named tunnels
cloudflared tunnel create fps-frontend
cloudflared tunnel create fps-backend
```

### 4. Use the Scripts
```bash
# Development with tunnels
npm run tunnel

# Production with tunnels
npm run tunnel:prod
```

## 🔧 Manual Commands

If you prefer to run things manually:

### Frontend Only
```bash
cd react
npm install
npm run dev          # Development
npm run build        # Build for production
npm run serve        # Serve built files
```

### Backend Only
```bash
cd server
npm install
npm run dev          # Development with auto-reload
npm start            # Production
```

### Full Stack
```bash
# Terminal 1 - Frontend
npm run start:frontend

# Terminal 2 - Backend
npm run start:backend

# Terminal 3 - Frontend Tunnel (optional)
npm run tunnel:frontend

# Terminal 4 - Backend Tunnel (optional)
npm run tunnel:backend
```

## 📦 Build Process

### Frontend Build
- Uses Vite for fast builds
- Outputs to `react/dist/`
- Includes minification and optimization
- Supports ES modules

### Backend Build
- Node.js server (no compilation needed)
- Can be extended for TypeScript if needed
- Ready for deployment as-is

## 🚀 Deployment

### Using Cloudflare Tunnel
```bash
# Build everything
npm run build:all

# Start with tunnels
npm run tunnel:prod
```

### Manual Deployment
1. Build the frontend: `npm run build:frontend`
2. Deploy `react/dist/` to your web server
3. Deploy `server/` to your Node.js server
4. Configure your servers to handle the appropriate ports

## 🐛 Troubleshooting

### Port Conflicts
- Frontend & Backend: http://localhost:5642 (same port, Socket.IO on /server path)

### Cloudflare Issues
- Make sure you're logged in: `cloudflared tunnel login`
- Check tunnel status: `cloudflared tunnel list`

### Build Issues
- Clear caches: `npm run clean`
- Reinstall: `rm -rf node_modules && npm run install:all`

## 📚 Project Structure Details

- **react/**: React frontend with Vite
  - Raycasting engine
  - Game UI and controls
  - Socket.IO client

- **server/**: Node.js backend
  - Express server
  - Socket.IO for real-time communication
  - Game state management

## 🤝 Contributing

1. Make changes in the appropriate directory
2. Test with `npm start`
3. Build with `npm run build:all`
4. Create pull request

## 📄 License

MIT License - see LICENSE file for details</content>
<parameter name="filePath">/Users/aidanpds/Documents/Boondit/FPS-WSS-R1/MONOREPO_README.md
