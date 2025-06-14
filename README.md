# Afro Network - Complete Blockchain Stack

A complete, production-ready Docker stack for the Afro blockchain network featuring:

- **Validator Node**: Ethereum-compatible blockchain using Geth
- **Block Explorer**: Blockscout-based explorer with custom Afro branding
- **Landing Page**: Static website with documentation and MetaMask integration
- **Unique Address Format**: Frontend-level `afro:` address formatting

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose installed
- At least 4GB RAM available
- Ports 80, 4000, 8545, 8546, 30303 available

### One-Line Setup
```bash
chmod +x setup.sh && ./setup.sh
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

## 🌐 Service URLs

| Service | URL | Description |
|---------|-----|-------------|
| **Web Frontend** | http://localhost | Landing page & documentation |
| **Block Explorer** | http://localhost:4000 | Blockchain explorer |
| **RPC Endpoint** | http://localhost:8545 | JSON-RPC API |
| **WebSocket** | ws://localhost:8546 | WebSocket API |
| **RPC Proxy** | http://localhost/rpc | CORS-enabled RPC proxy |

## 🔧 MetaMask Configuration

### Automatic Setup
1. Visit http://localhost
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
├── explorer/           # Blockscout blockchain explorer
│   ├── Dockerfile
│   ├── config.exs      # Blockscout configuration
│   └── entrypoint.sh   # Explorer startup script
├── web/               # NGINX static site
│   ├── Dockerfile
│   ├── nginx.conf     # NGINX configuration
│   └── site/          # Static HTML/CSS/JS files
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

## 🔧 Management

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f afro-validator
docker-compose logs -f afro-explorer
docker-compose logs -f afro-web
```

### Service Control
```bash
# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Restart services
docker-compose restart

# Rebuild and restart
docker-compose up -d --build
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
EXPLORER_PORT=4000
WEB_PORT=80
```

## 🧪 Development

### Testing the Network
```bash
# Check validator status
curl -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  http://localhost:8545

# Check explorer API
curl http://localhost:4000/api/v1/blocks

# Check web frontend
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
