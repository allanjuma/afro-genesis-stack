
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cron = require('node-cron');
const { Octokit } = require('@octokit/rest');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const app = express();
const port = process.env.PORT || 3000;
const execAsync = promisify(exec);

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

// Docker operations
const executeDockerCommand = async (command) => {
  try {
    console.log(`Executing Docker command: ${command}`);
    const { stdout, stderr } = await execAsync(command);
    
    if (stderr && !stderr.includes('WARNING')) {
      console.error('Docker command stderr:', stderr);
    }
    
    return {
      success: true,
      output: stdout,
      error: stderr
    };
  } catch (error) {
    console.error('Docker command failed:', error.message);
    return {
      success: false,
      output: '',
      error: error.message
    };
  }
};

// Git operations
const executeGitCommand = async (command) => {
  try {
    console.log(`Executing Git command: ${command}`);
    const { stdout, stderr } = await execAsync(command);
    
    return {
      success: true,
      output: stdout,
      error: stderr
    };
  } catch (error) {
    console.error('Git command failed:', error.message);
    return {
      success: false,
      output: '',
      error: error.message
    };
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

// Get Docker stack status
const getStackStatus = async () => {
  try {
    const result = await executeDockerCommand('docker-compose ps --format json');
    
    if (!result.success) {
      return {
        mainnet: false,
        testnet: false,
        explorer: false,
        website: false,
        ceo: false
      };
    }

    // Parse container status
    const containers = result.output.split('\n').filter(line => line.trim()).map(line => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    }).filter(Boolean);

    return {
      mainnet: containers.some(c => c.Service === 'afro-validator' && c.State === 'running'),
      testnet: containers.some(c => c.Service === 'afro-testnet-validator' && c.State === 'running'),
      explorer: containers.some(c => (c.Service === 'afro-explorer' || c.Service === 'afro-testnet-explorer') && c.State === 'running'),
      website: containers.some(c => c.Service === 'afro-web' && c.State === 'running'),
      ceo: containers.some(c => c.Service === 'ceo' && c.State === 'running')
    };
  } catch (error) {
    console.error('Failed to get stack status:', error.message);
    return {
      mainnet: false,
      testnet: false,
      explorer: false,
      website: false,
      ceo: false
    };
  }
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

// Stack operation endpoint
app.post('/api/ceo/stack-operation', async (req, res) => {
  try {
    const { operation, mode, services } = req.body;
    
    if (!operation || !['start', 'stop', 'restart'].includes(operation)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid operation. Must be start, stop, or restart' 
      });
    }

    console.log(`Stack operation: ${operation} with mode: ${mode} and services: ${services?.join(', ')}`);

    let command;
    switch (operation) {
      case 'start':
        if (services && services.length > 0) {
          command = `docker-compose up -d ${services.join(' ')}`;
        } else {
          command = 'docker-compose up -d';
        }
        break;
      case 'stop':
        if (services && services.length > 0) {
          command = `docker-compose stop ${services.join(' ')}`;
        } else {
          command = 'docker-compose down';
        }
        break;
      case 'restart':
        if (services && services.length > 0) {
          command = `docker-compose restart ${services.join(' ')}`;
        } else {
          command = 'docker-compose restart';
        }
        break;
    }

    const result = await executeDockerCommand(command);
    
    res.json({
      success: result.success,
      message: result.success ? `Stack ${operation} completed` : result.error,
      output: result.output,
      services: services
    });

  } catch (error) {
    console.error('Stack operation error:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Git operation endpoint
app.post('/api/ceo/git-operation', async (req, res) => {
  try {
    const { operation } = req.body;
    
    if (!operation || !['clone', 'pull', 'build'].includes(operation)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid operation. Must be clone, pull, or build' 
      });
    }

    console.log(`Git operation: ${operation}`);

    let command;
    switch (operation) {
      case 'clone':
        command = 'git clone https://github.com/afro-network/afro-blockchain.git /tmp/afro-blockchain || true';
        break;
      case 'pull':
        command = 'cd /tmp/afro-blockchain && git pull origin main';
        break;
      case 'build':
        command = 'docker-compose build --no-cache';
        break;
    }

    const result = await executeGitCommand(command);
    
    res.json({
      success: result.success,
      message: result.success ? `Git ${operation} completed` : result.error,
      output: result.output
    });

  } catch (error) {
    console.error('Git operation error:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Stack status endpoint
app.get('/api/ceo/stack-status', async (req, res) => {
  try {
    const status = await getStackStatus();
    res.json(status);
  } catch (error) {
    console.error('Stack status error:', error.message);
    res.status(500).json({ error: 'Failed to get stack status' });
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
