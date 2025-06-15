
# Afro Network - Complete Blockchain Stack

A complete, production-ready Docker stack for the Afro blockchain network featuring:

- **Validator Node**: Ethereum-compatible blockchain using Geth
- **Block Explorer**: Blockscout-based explorer with custom Afro branding
- **Landing Page**: Static website with documentation and MetaMask integration
- **Unique Address Format**: Frontend-level `afro:` address formatting
- **AppImage Distribution**: Portable Linux application package

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose installed (auto-installed if missing)
- At least 4GB RAM available
- Ports 80, 4000, 8545, 8546, 30303 available

### Setup Options

#### Full Stack Setup (Default)
```bash
chmod +x setup.sh && ./setup.sh
```

#### Validator Nodes Only
```bash
./setup.sh --validator-only
```

#### AppImage Build Only
```bash
./setup.sh --appimage-only
```

#### Production Setup
```bash
./setup.sh --production
```

### Setup Script Flags

The `setup.sh` script supports the following flags:

| Flag | Description | Example |
|------|-------------|---------|
| `--appimage-only` | Build only the AppImage package | `./setup.sh --appimage-only` |
| `--validator-only` | Run only validator nodes (mainnet and testnet) | `./setup.sh --validator-only` |
| `--manual` | Skip automatic setup, use manual mode | `./setup.sh --manual` |
| `--force-reinstall` | Force reinstall Docker Compose even if present | `./setup.sh --force-reinstall` |
| `--skip-docker-check` | Skip Docker installation checks | `./setup.sh --skip-docker-check` |
| `--production` | Setup for production environment | `./setup.sh --production` |
| `--help` | Show help message with all options | `./setup.sh --help` |

#### Flag Combinations
```bash
# Production validator-only setup
./setup.sh --validator-only --production

# Force reinstall Docker Compose and run full setup
./setup.sh --force-reinstall

# Manual production setup
./setup.sh --manual --production

# Skip Docker checks for validator-only setup
./setup.sh --validator-only --skip-docker-check
```

### Manual Setup
```bash
# Clone/download the project
git clone <repository-url>
cd afro-chain

# Start the stack
docker-compose up -d

# Check status
docker-compose ps
```

## 🏗️ Deployment Modes

### Full Stack Mode (Default)
Deploys all services:
- Mainnet & Testnet validators
- Block explorers for both networks
- Web frontend with documentation
- CEO agent backend
- Database services

### Validator-Only Mode
Deploys only the blockchain nodes:
- Mainnet validator (port 8545/8546)
- Testnet validator (port 8547/8548)
- No web interface or explorers
- Ideal for headless servers or API-only setups

### Production Mode
Optimized for production deployment:
- Enhanced security settings
- Debug logging disabled
- Performance optimizations
- Production environment variables

## 📦 AppImage Build

### Docker-based Build (Recommended)
The AppImage is now built inside a Docker container for consistent, reproducible builds across all environments.

```bash
# Build AppImage using Docker (recommended)
./setup.sh --appimage-only

# Or build manually with Docker
docker build -t afro-appimage-builder -f appimage/Dockerfile .
docker run --rm -v "$(pwd):/output" afro-appimage-builder
```

### Native Build (Legacy)
If Docker is not available, the system will fall back to native building:

```bash
# Prerequisites for native build
- Linux system (Ubuntu/Debian/Fedora/Arch/openSUSE)
- Node.js v18+ (automatically installed via nvm if needed)
- FUSE library (automatically installed if missing)
- Build essentials and dependencies
```

### AppImage Features
- **Dockerized Build**: Consistent builds across all environments
- **Portable**: Runs on any Linux distribution
- **Self-contained**: No installation required
- **Cross-architecture**: Automatically detects system architecture
- **Integrated dashboard**: Complete Afro Network interface
- **No dependencies**: All required components bundled

### Using the AppImage
```bash
# Make executable
chmod +x AfroNetwork.AppImage

# Run the application
./AfroNetwork.AppImage

# Access dashboard at http://localhost:8080
```

### AppImage Build Process
1. **Docker Container**: Builds in Ubuntu 22.04 container with Node.js 18
2. **React Build**: Compiles the dashboard using Vite
3. **AppImage Creation**: Packages everything using AppImageTool
4. **Output**: Places `AfroNetwork.AppImage` in current directory

### Build Troubleshooting
```bash
# Check Docker installation
docker --version

# Manual Docker build
docker build -t afro-appimage-builder -f appimage/Dockerfile .

# Clean Docker build
docker build --no-cache -t afro-appimage-builder -f appimage/Dockerfile .

# Check build logs
docker run --rm afro-appimage-builder

# Native build fallback
./setup.sh --appimage-only  # Will use native build if Docker fails
```

## 🌐 Service URLs

### Full Stack Mode
| Service | URL | Description |
|---------|-----|-------------|
| **Web Frontend** | http://localhost | Landing page & documentation |
| **Mainnet Explorer** | http://localhost:4000 | Mainnet blockchain explorer |
| **Testnet Explorer** | http://localhost:4001 | Testnet blockchain explorer |
| **CEO Agent** | http://localhost:3000 | AI assistant backend |
| **Mainnet RPC** | http://localhost:8545 | Mainnet JSON-RPC API |
| **Testnet RPC** | http://localhost:8547 | Testnet JSON-RPC API |
| **Mainnet WebSocket** | ws://localhost:8546 | Mainnet WebSocket API |
| **Testnet WebSocket** | ws://localhost:8548 | Testnet WebSocket API |
| **RPC Proxy** | http://localhost/rpc | CORS-enabled RPC proxy |

### Validator-Only Mode
| Service | URL | Description |
|---------|-----|-------------|
| **Mainnet RPC** | http://localhost:8545 | Mainnet JSON-RPC API |
| **Testnet RPC** | http://localhost:8547 | Testnet JSON-RPC API |
| **Mainnet WebSocket** | ws://localhost:8546 | Mainnet WebSocket API |
| **Testnet WebSocket** | ws://localhost:8548 | Testnet WebSocket API |

## 🔧 MetaMask Configuration

### Automatic Setup
1. Visit http://localhost (full stack mode only)
2. Click "Add to MetaMask" button

### Manual Setup
- **Network Name**: Afro Network
- **RPC URL**: http://localhost:8545
- **Chain ID**: 7878
- **Currency Symbol**: AFRO
- **Block Explorer**: http://localhost:4000

## 🏗️ Architecture

```
afro-chain/
├── validator/          # Geth-based validator node
│   ├── Dockerfile
│   ├── genesis.json    # Custom genesis configuration
│   └── entrypoint.sh   # Node startup script
├── validator-testnet/  # Testnet validator node
│   ├── Dockerfile
│   ├── genesis-testnet.json
│   └── entrypoint-testnet.sh
├── explorer/           # Blockscout blockchain explorer
│   ├── Dockerfile
│   ├── config.exs      # Blockscout configuration
│   └── entrypoint.sh   # Explorer startup script
├── explorer-testnet/   # Testnet explorer
│   ├── Dockerfile
│   ├── config-testnet.exs
│   └── entrypoint-testnet.sh
├── web/               # NGINX static site
│   ├── Dockerfile
│   ├── nginx.conf     # NGINX configuration
│   └── site/          # Static HTML/CSS/JS files
├── ceo/              # CEO agent backend
│   ├── Dockerfile
│   ├── package.json
│   └── server.js
├── appimage/          # AppImage build system
│   ├── Dockerfile     # AppImage builder container
│   └── build-appimage.sh  # Build script
├── scripts/           # Build and deployment scripts
│   ├── appimage-builder.sh    # AppImage build script
│   ├── env-generator.sh       # Environment configuration
│   ├── docker-manager.sh      # Docker operations
│   ├── docker-compose-installer.sh  # Docker Compose installer
│   ├── auto-setup.sh          # Automatic setup
│   └── health-checker.sh      # Service monitoring
├── docker-compose.yml # Main orchestration file
├── setup.sh          # Automated setup script
└── README.md         # This file
```

## 🎯 Features

### Validator Node
- **Ethereum-compatible**: Full EVM compatibility
- **Custom Genesis**: Pre-configured for Afro Network
- **PoA Consensus**: Clique consensus for development
- **JSON-RPC APIs**: Full eth, net, web3 API support
- **CORS Enabled**: Ready for web3 applications

### Block Explorer
- **Custom Branding**: Afro Network branding and styling
- **Address Formatting**: Displays `afro:` prefixed addresses
- **Full Features**: Blocks, transactions, addresses, tokens
- **Real-time**: Live updates via WebSocket
- **PostgreSQL**: Persistent data storage

### Web Frontend
- **Responsive Design**: Modern, mobile-friendly interface
- **MetaMask Integration**: One-click network addition
- **Documentation**: Complete setup and usage guides
- **RPC Proxy**: CORS-enabled JSON-RPC proxy
- **Health Checks**: Service monitoring endpoints

### Address Format
- **Display Format**: `afro:1234567890abcdef...`
- **Protocol Format**: `0x1234567890abcdef...` (standard Ethereum)
- **Automatic Conversion**: Frontend handles format conversion
- **Wallet Compatible**: Works with MetaMask and other wallets

### AppImage Distribution
- **Dockerized Build**: Consistent builds using Docker containers
- **Portable Package**: Single file that runs on any Linux distribution
- **Self-contained**: Includes Node.js runtime and all dependencies
- **Desktop Integration**: Proper .desktop file and icon integration
- **Architecture Detection**: Automatically builds for target architecture

## 🔧 Management

### Service Control Commands

#### Full Stack
```bash
# View all services status
docker-compose ps

# View logs for all services
docker-compose logs -f

# View specific service logs
docker-compose logs -f afro-validator
docker-compose logs -f afro-explorer
docker-compose logs -f afro-web

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Restart services
docker-compose restart

# Rebuild and restart
docker-compose up -d --build
```

#### Validator-Only Mode
```bash
# View validator status
docker-compose ps afro-validator afro-testnet-validator

# View validator logs
docker-compose logs -f afro-validator afro-testnet-validator

# Stop validators
docker-compose stop afro-validator afro-testnet-validator

# Restart validators
docker-compose restart afro-validator afro-testnet-validator

# Start validators only
docker-compose up -d afro-validator afro-testnet-validator
```

### Configuration
Environment variables can be configured in `.env` file:

```env
# Network Configuration
NETWORK_ID=7878
CHAIN_ID=7878
COIN=AFRO

# Ports
VALIDATOR_HTTP_PORT=8545
VALIDATOR_TESTNET_HTTP_PORT=8547
EXPLORER_PORT=4000
EXPLORER_TESTNET_PORT=4001
WEB_PORT=80

# Mode Configuration
VALIDATOR_ONLY=false
PRODUCTION_MODE=false
```

## 🧪 Development

### Testing the Network
```bash
# Check mainnet validator status
curl -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  http://localhost:8545

# Check testnet validator status
curl -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  http://localhost:8547

# Check explorer API (full stack mode)
curl http://localhost:4000/api/v1/blocks

# Check web frontend (full stack mode)
curl http://localhost/health
```

### Smart Contract Deployment
1. Configure MetaMask with Afro Network
2. Use Remix IDE or Hardhat with RPC: http://localhost:8545
3. Deploy contracts as normal (they'll use 0x addresses)
4. View in explorer with afro: formatting

## 🔒 Security Notes

- **Development Only**: This setup is for development/testing
- **Default Accounts**: Uses hardcoded test accounts
- **No SSL**: Uses HTTP (add reverse proxy for production)
- **Open CORS**: Allows all origins (restrict for production)

## 🆙 Upgrading

```bash
# Pull latest images
docker-compose pull

# Restart with new images
docker-compose up -d

# Clean up old images
docker image prune
```

## 🐛 Troubleshooting

### Services Not Starting
```bash
# Check container status
docker-compose ps

# View detailed logs
docker-compose logs

# Check system resources
docker system df
```

### Explorer Not Loading
- Wait 2-3 minutes for database initialization
- Check that validator is running first
- Verify database connection in logs

### MetaMask Connection Issues
- Ensure RPC URL is http://localhost:8545
- Check that validator is responding
- Try using the proxy endpoint: http://localhost/rpc

### Validator-Only Mode Issues
```bash
# Check validator status
docker-compose ps afro-validator afro-testnet-validator

# Check validator logs
docker-compose logs afro-validator
docker-compose logs afro-testnet-validator

# Test RPC connectivity
curl -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  http://localhost:8545
```

### AppImage Build Issues
```bash
# Check Docker installation
docker --version

# Rebuild AppImage builder
docker build --no-cache -t afro-appimage-builder -f appimage/Dockerfile .

# Check build logs
docker run --rm afro-appimage-builder

# Native build fallback
./setup.sh --appimage-only  # Will use native build if Docker fails
```

### Port Conflicts
Edit `docker-compose.yml` to change port mappings:
```yaml
ports:
  - "8080:80"    # Change web port to 8080
  - "4001:4000"  # Change explorer port to 4001
```

## 📝 License

This project is open source. Individual components may have their own licenses:
- Geth: LGPL-3.0
- Blockscout: GPL-3.0
- NGINX: BSD-2-Clause

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Test your changes thoroughly
4. Submit a pull request

---

**Built with ❤️ for the decentralized future**

## 📑 Validator Node Backend Documentation

The validator node exposes its backend functionality through Bash scripts using `geth attach` for all blockchain interactions. For a complete, interactive guide to these backend scripts (address generation, rewards distribution, SMS, etc.), visit:

- **Live interactive docs:**  
  [`/docs`](http://localhost/docs) (served from the web container as `web/site/docs.html`)

This page provides interactive documentation of all available Bash scripts for the validator backend and how they directly utilize `geth attach` for full on-chain operations.

**Want Markdown/extended docs for GitHub use?**  
See the [Validator Node Backend Scripts](../../wiki/Validator-Node-Backend-Scripts) page in your project's GitHub Wiki for an up-to-date, copy-pasteable API and Bash documentation.
