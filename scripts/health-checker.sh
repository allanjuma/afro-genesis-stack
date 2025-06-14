
#!/bin/bash

# Health Checker for Afro Network
# This script checks the health of all services

set -e

check_service_health() {
    echo "🔍 Checking service health..."

    # Check mainnet validator
    if curl -s http://localhost:8545 > /dev/null; then
        echo "✅ Mainnet validator node is running (http://localhost:8545)"
    else
        echo "⚠️  Mainnet validator node is not responding yet"
    fi

    # Check testnet validator
    if curl -s http://localhost:8547 > /dev/null; then
        echo "✅ Testnet validator node is running (http://localhost:8547)"
    else
        echo "⚠️  Testnet validator node is not responding yet"
    fi

    # Check mainnet explorer
    if curl -s http://localhost:4000 > /dev/null; then
        echo "✅ Mainnet explorer is running (http://localhost:4000)"
    else
        echo "⚠️  Mainnet explorer is not responding yet (may take a few minutes to start)"
    fi

    # Check testnet explorer
    if curl -s http://localhost:4001 > /dev/null; then
        echo "✅ Testnet explorer is running (http://localhost:4001)"
    else
        echo "⚠️  Testnet explorer is not responding yet (may take a few minutes to start)"
    fi

    # Check web frontend
    if curl -s http://localhost:80 > /dev/null; then
        echo "✅ Web frontend is running (http://localhost:80)"
    else
        echo "⚠️  Web frontend is not responding yet"
    fi

    # Check CEO agent
    if curl -s http://localhost:3000/health > /dev/null; then
        echo "✅ CEO agent is running (http://localhost:3000)"
    else
        echo "⚠️  CEO agent is not responding yet"
    fi
}

display_completion_info() {
    echo ""
    echo "🎉 Afro Network setup complete!"
    echo ""
    echo "📋 Service URLs:"
    echo "   • Web Frontend: http://localhost"
    echo "   • Mainnet Explorer: http://localhost:4000"
    echo "   • Testnet Explorer: http://localhost:4001"
    echo "   • Mainnet RPC: http://localhost:8545"
    echo "   • Testnet RPC: http://localhost:8547"
    echo "   • Mainnet WebSocket: ws://localhost:8546"
    echo "   • Testnet WebSocket: ws://localhost:8548"
    echo "   • CEO Agent API: http://localhost:3000"
    echo ""
    echo "🤖 CEO Agent Integration:"
    echo "   • Strategic Management: AI-powered network oversight"
    echo "   • Customer Support: Automated question handling"
    echo "   • GitHub Integration: Automatic issue creation and PR management"
    echo "   • Network Monitoring: Continuous health checks with alerting"
    echo "   • Chat API: http://localhost:3000/api/chat"
    echo "   • Status API: http://localhost:3000/api/status"
    echo ""
    echo "⚙️  CEO Agent Configuration:"
    echo "   • Ollama URL: Configure OLLAMA_BASE_URL in .env"
    echo "   • Model: Configure OLLAMA_MODEL in .env (default: llama3.1:8b)"
    echo "   • GitHub: Set GITHUB_TOKEN and GITHUB_REPO in .env for automation"
    echo ""
    echo "📱 Mobile Money Integration:"
    echo "   • Address Format: afro:254700000000:[extra_characters]"
    echo "   • Country Code: 254 (Kenya)"
    echo "   • Mobile Money Code: 700000000"
    echo "   • SMS Validation: Enabled"
    echo "   • OTP Generation: From address extra characters"
    echo ""
    echo "🔧 MetaMask Configuration:"
    echo "   Mainnet:"
    echo "   • Network Name: Afro Network"
    echo "   • RPC URL: http://localhost:8545"
    echo "   • Chain ID: 7878"
    echo "   • Currency: AFRO"
    echo "   • Explorer: http://localhost:4000"
    echo ""
    echo "   Testnet:"
    echo "   • Network Name: Afro Testnet"
    echo "   • RPC URL: http://localhost:8547"
    echo "   • Chain ID: 7879"
    echo "   • Currency: tAFRO"
    echo "   • Explorer: http://localhost:4001"
    echo ""
    echo "📖 Next Steps:"
    echo "   1. Configure CEO Agent: Edit .env file with your Ollama and GitHub settings"
    echo "   2. Visit http://localhost to see the landing page"
    echo "   3. Test CEO Agent: curl -X POST http://localhost:3000/api/chat -H 'Content-Type: application/json' -d '{\"message\":\"What is the current network status?\"}'"
    echo "   4. Click 'Add Mainnet to MetaMask' or 'Add Testnet to MetaMask'"
    echo "   5. Explore the blockchain at http://localhost:4000 (mainnet) or http://localhost:4001 (testnet)"
    echo ""
    echo "🔧 Management Commands:"
    echo "   • View logs: docker-compose logs -f"
    echo "   • View CEO logs: docker-compose logs -f ceo"
    echo "   • Stop services: docker-compose down"
    echo "   • Restart services: docker-compose restart"
    echo "   • Update: docker-compose pull && docker-compose up -d"
    echo "   • Force rebuild: docker-compose build --no-cache && docker-compose up -d"
    echo ""
    echo "Enjoy your Afro Network with AI-powered CEO Agent! 🌍📱🤖"
}
