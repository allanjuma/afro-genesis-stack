
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cron = require('node-cron');
const { Octokit } = require('@octokit/rest');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Initialize GitHub client
const octokit = process.env.GITHUB_TOKEN ? new Octokit({
  auth: process.env.GITHUB_TOKEN,
}) : null;

// Data storage
const dataDir = '/app/data';
const conversationsFile = path.join(dataDir, 'conversations.json');
const issuesFile = path.join(dataDir, 'issues.json');

// CEO Agent context
const getCEOContext = () => {
  return `You are the CEO of Afro Network, a revolutionary blockchain network that integrates mobile money systems with blockchain technology. Your role is to:

1. STRATEGIC PLANNING: Provide strategic guidance for the Afro Network development
2. CUSTOMER SUPPORT: Answer questions about the network, mobile money integration, and technical aspects
3. ISSUE MANAGEMENT: Identify problems and create actionable GitHub issues
4. TEAM COORDINATION: Communicate with developers and manage project coordination
5. NETWORK OVERSIGHT: Monitor network health and performance

KEY KNOWLEDGE AREAS:
- Afro Network uses Chain ID 7878 (mainnet) and 7879 (testnet)
- Mobile money integration with format: afro:[MSISDN]:[extra_characters]
- Supports Kenya mobile money (254 country code, 700000000 operator code)
- Address generation uses brute-force algorithm with SMS validation
- Network includes validator nodes, block explorers, and web frontend
- Built on Ethereum-compatible blockchain with custom address format

CURRENT NETWORK STATUS:
- Mainnet RPC: ${process.env.MAINNET_RPC_URL}
- Testnet RPC: ${process.env.TESTNET_RPC_URL}
- Mainnet Explorer: ${process.env.MAINNET_EXPLORER_URL}
- Testnet Explorer: ${process.env.TESTNET_EXPLORER_URL}

Always respond as a knowledgeable CEO who understands both the technical and business aspects of the network.`;
};

// Ollama integration
const queryOllama = async (prompt, context = '') => {
  try {
    const fullPrompt = `${getCEOContext()}\n\nCONTEXT: ${context}\n\nQUESTION: ${prompt}`;
    
    const response = await axios.post(`${process.env.OLLAMA_BASE_URL}/api/generate`, {
      model: process.env.OLLAMA_MODEL,
      prompt: fullPrompt,
      stream: false
    });

    return response.data.response;
  } catch (error) {
    console.error('Ollama query error:', error.message);
    throw new Error('Failed to get response from CEO agent');
  }
};

// GitHub integration
const createGitHubIssue = async (title, body, labels = []) => {
  if (!octokit || !process.env.GITHUB_REPO) {
    console.log('GitHub not configured, skipping issue creation');
    return null;
  }

  try {
    const [owner, repo] = process.env.GITHUB_REPO.split('/');
    
    const issue = await octokit.rest.issues.create({
      owner,
      repo,
      title,
      body,
      labels: ['ceo-agent', ...labels]
    });

    return issue.data;
  } catch (error) {
    console.error('GitHub issue creation error:', error.message);
    return null;
  }
};

// Data persistence
const saveConversation = async (conversation) => {
  try {
    let conversations = [];
    try {
      const data = await fs.readFile(conversationsFile, 'utf8');
      conversations = JSON.parse(data);
    } catch (error) {
      // File doesn't exist yet
    }

    conversations.push({
      ...conversation,
      timestamp: new Date().toISOString()
    });

    await fs.writeFile(conversationsFile, JSON.stringify(conversations, null, 2));
  } catch (error) {
    console.error('Error saving conversation:', error.message);
  }
};

// Network status monitoring
const getNetworkStatus = async () => {
  const status = {
    mainnet: { rpc: false, explorer: false },
    testnet: { rpc: false, explorer: false },
    timestamp: new Date().toISOString()
  };

  try {
    // Check mainnet RPC
    await axios.post(process.env.MAINNET_RPC_URL, {
      jsonrpc: '2.0',
      method: 'eth_chainId',
      params: [],
      id: 1
    }, { timeout: 5000 });
    status.mainnet.rpc = true;
  } catch (error) {
    console.log('Mainnet RPC check failed:', error.message);
  }

  try {
    // Check testnet RPC
    await axios.post(process.env.TESTNET_RPC_URL, {
      jsonrpc: '2.0',
      method: 'eth_chainId',
      params: [],
      id: 1
    }, { timeout: 5000 });
    status.testnet.rpc = true;
  } catch (error) {
    console.log('Testnet RPC check failed:', error.message);
  }

  try {
    // Check mainnet explorer
    await axios.get(`${process.env.MAINNET_EXPLORER_URL}/api/v1/status`, { timeout: 5000 });
    status.mainnet.explorer = true;
  } catch (error) {
    console.log('Mainnet explorer check failed:', error.message);
  }

  try {
    // Check testnet explorer
    await axios.get(`${process.env.TESTNET_EXPLORER_URL}/api/v1/status`, { timeout: 5000 });
    status.testnet.explorer = true;
  } catch (error) {
    console.log('Testnet explorer check failed:', error.message);
  }

  return status;
};

// API Routes
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'afro-ceo-agent',
    timestamp: new Date().toISOString()
  });
});

app.post('/api/chat', async (req, res) => {
  try {
    const { message, context } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get network status for context
    const networkStatus = await getNetworkStatus();
    const fullContext = `${context || ''}\n\nCURRENT NETWORK STATUS: ${JSON.stringify(networkStatus)}`;

    // Query Ollama
    const response = await queryOllama(message, fullContext);

    // Save conversation
    await saveConversation({
      message,
      response,
      context: fullContext,
      networkStatus
    });

    // Check if response indicates an issue that needs GitHub tracking
    if (response.toLowerCase().includes('issue') || response.toLowerCase().includes('problem') || response.toLowerCase().includes('bug')) {
      const issue = await createGitHubIssue(
        `CEO Agent Issue: ${message.substring(0, 50)}...`,
        `**Original Question:** ${message}\n\n**CEO Response:** ${response}\n\n**Network Status:** ${JSON.stringify(networkStatus, null, 2)}\n\n*This issue was automatically created by the CEO Agent.*`,
        ['auto-generated', 'ceo-identified']
      );

      if (issue) {
        console.log(`Created GitHub issue #${issue.number}: ${issue.title}`);
      }
    }

    res.json({ 
      response,
      networkStatus,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Chat error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/status', async (req, res) => {
  try {
    const networkStatus = await getNetworkStatus();
    res.json(networkStatus);
  } catch (error) {
    console.error('Status error:', error.message);
    res.status(500).json({ error: 'Failed to get network status' });
  }
});

app.get('/api/conversations', async (req, res) => {
  try {
    let conversations = [];
    try {
      const data = await fs.readFile(conversationsFile, 'utf8');
      conversations = JSON.parse(data);
    } catch (error) {
      // File doesn't exist yet
    }

    res.json(conversations.slice(-50)); // Return last 50 conversations
  } catch (error) {
    console.error('Conversations error:', error.message);
    res.status(500).json({ error: 'Failed to get conversations' });
  }
});

// Scheduled network monitoring
cron.schedule('*/5 * * * *', async () => {
  try {
    const networkStatus = await getNetworkStatus();
    console.log('Network status check:', networkStatus);

    // Create issues for network problems
    if (!networkStatus.mainnet.rpc || !networkStatus.mainnet.explorer) {
      await createGitHubIssue(
        'Network Issue: Mainnet Services Down',
        `**Issue:** Mainnet services are experiencing problems.\n\n**Status:** ${JSON.stringify(networkStatus.mainnet, null, 2)}\n\n**Time:** ${networkStatus.timestamp}\n\n*This issue was automatically created by the CEO Agent monitoring system.*`,
        ['critical', 'mainnet', 'auto-generated']
      );
    }

    if (!networkStatus.testnet.rpc || !networkStatus.testnet.explorer) {
      await createGitHubIssue(
        'Network Issue: Testnet Services Down',
        `**Issue:** Testnet services are experiencing problems.\n\n**Status:** ${JSON.stringify(networkStatus.testnet, null, 2)}\n\n**Time:** ${networkStatus.timestamp}\n\n*This issue was automatically created by the CEO Agent monitoring system.*`,
        ['testnet', 'auto-generated']
      );
    }
  } catch (error) {
    console.error('Scheduled monitoring error:', error.message);
  }
});

// Error handling
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`CEO Agent running on port ${port}`);
  console.log(`Ollama URL: ${process.env.OLLAMA_BASE_URL}`);
  console.log(`GitHub integration: ${octokit ? 'enabled' : 'disabled'}`);
});
