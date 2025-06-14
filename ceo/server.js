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
const executeDockerCommand = async (command, workingDir = '/app') => {
  try {
    console.log(`Executing Docker command: ${command} in ${workingDir}`);
    const { stdout, stderr } = await execAsync(command, { cwd: workingDir });
    
    if (stderr && !stderr.includes('WARNING') && !stderr.includes('WARN')) {
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
const executeGitCommand = async (command, workingDir = '/tmp') => {
  try {
    console.log(`Executing Git command: ${command} in ${workingDir}`);
    const { stdout, stderr } = await execAsync(command, { cwd: workingDir });
    
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
    // First check if docker-compose file exists and get container status
    const result = await executeDockerCommand('docker ps --format "table {{.Names}}\t{{.Status}}" --filter "name=afro"');
    
    if (!result.success) {
      console.log('Docker ps command failed, assuming containers are stopped');
      return {
        mainnet: false,
        testnet: false,
        explorer: false,
        website: false,
        ceo: false
      };
    }

    const containerLines = result.output.split('\n').filter(line => line.trim() && !line.includes('NAMES'));
    
    return {
      mainnet: containerLines.some(line => line.includes('afro-validator') && line.includes('Up')),
      testnet: containerLines.some(line => line.includes('afro-testnet-validator') && line.includes('Up')),
      explorer: containerLines.some(line => (line.includes('afro-explorer') || line.includes('afro-testnet-explorer')) && line.includes('Up')),
      website: containerLines.some(line => line.includes('afro-web') && line.includes('Up')),
      ceo: containerLines.some(line => line.includes('afro-ceo') && line.includes('Up'))
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
    const dockerComposeFile = process.env.DOCKER_COMPOSE_FILE || '/app/docker-compose.yml';
    
    switch (operation) {
      case 'start':
        if (services && services.length > 0) {
          command = `docker-compose -f ${dockerComposeFile} up -d ${services.join(' ')}`;
        } else {
          command = `docker-compose -f ${dockerComposeFile} up -d`;
        }
        break;
      case 'stop':
        if (services && services.length > 0) {
          command = `docker-compose -f ${dockerComposeFile} stop ${services.join(' ')}`;
        } else {
          command = `docker-compose -f ${dockerComposeFile} down`;
        }
        break;
      case 'restart':
        if (services && services.length > 0) {
          command = `docker-compose -f ${dockerComposeFile} restart ${services.join(' ')}`;
        } else {
          command = `docker-compose -f ${dockerComposeFile} restart`;
        }
        break;
    }

    const result = await executeDockerCommand(command, '/app');
    
    res.json({
      success: result.success,
      message: result.success ? `Stack ${operation} completed` : result.error,
      output: result.output,
      services: services,
      logs: result.output ? result.output.split('\n').filter(line => line.trim()) : []
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
    const repoDir = '/tmp/afro-blockchain';
    
    switch (operation) {
      case 'clone':
        // Remove existing directory first
        await executeGitCommand(`rm -rf ${repoDir}`);
        command = `git clone https://github.com/afro-network/afro-blockchain.git ${repoDir}`;
        break;
      case 'pull':
        command = `cd ${repoDir} && git pull origin main`;
        break;
      case 'build':
        const dockerComposeFile = process.env.DOCKER_COMPOSE_FILE || '/app/docker-compose.yml';
        command = `docker-compose -f ${dockerComposeFile} build --no-cache`;
        break;
    }

    const workingDir = operation === 'build' ? '/app' : '/tmp';
    const result = await executeGitCommand(command, workingDir);
    
    res.json({
      success: result.success,
      message: result.success ? `Git ${operation} completed` : result.error,
      output: result.output,
      logs: result.output ? result.output.split('\n').filter(line => line.trim()) : []
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

// Health check endpoint for IPC
app.get('/api/ceo/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'CEO API is running',
    timestamp: new Date().toISOString()
  });
});

// Docker command execution endpoint
app.post('/api/ceo/docker-execute', async (req, res) => {
  const { command } = req.body;
  
  if (!command) {
    return res.status(400).json({ 
      success: false, 
      message: 'Command is required' 
    });
  }

  try {
    console.log(`Executing Docker command: ${command}`);
    
    const result = await new Promise((resolve, reject) => {
      exec(command, { cwd: '/usr/src/app' }, (error, stdout, stderr) => {
        if (error) {
          console.error(`Command failed: ${error.message}`);
          resolve({
            success: false,
            message: error.message,
            output: stderr || stdout,
            exitCode: error.code
          });
        } else {
          console.log(`Command succeeded: ${stdout}`);
          resolve({
            success: true,
            message: 'Command executed successfully',
            output: stdout,
            exitCode: 0
          });
        }
      });
    });

    res.json(result);
  } catch (error) {
    console.error('Docker command execution error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
      error: error.message
    });
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
