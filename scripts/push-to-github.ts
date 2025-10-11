import { Octokit } from '@octokit/rest';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('GitHub not connected');
  }
  return accessToken;
}

async function getGitHubClient() {
  const accessToken = await getAccessToken();
  return new Octokit({ auth: accessToken });
}

async function createRepository() {
  try {
    const octokit = await getGitHubClient();
    
    // Get authenticated user
    const { data: user } = await octokit.users.getAuthenticated();
    console.log(`Authenticated as: ${user.login}`);
    
    // Create repository
    const { data: repo } = await octokit.repos.createForAuthenticatedUser({
      name: 'eyes-open-dementia-care',
      description: 'Eyes Open - AI-powered dementia care assistant with visual object recognition and reminders',
      private: false,
      auto_init: false
    });
    
    console.log(`✅ Repository created: ${repo.html_url}`);
    console.log(`\nRepository URL: ${repo.clone_url}`);
    console.log(`\nNext steps:`);
    console.log(`1. git init`);
    console.log(`2. git add .`);
    console.log(`3. git commit -m "Initial commit: Eyes Open dementia care assistant"`);
    console.log(`4. git branch -M main`);
    console.log(`5. git remote add origin ${repo.clone_url}`);
    console.log(`6. git push -u origin main`);
    
    return repo;
  } catch (error: any) {
    if (error.status === 422 && error.message.includes('already exists')) {
      console.log('❌ Repository "eyes-open-dementia-care" already exists');
      console.log('Please delete it on GitHub or choose a different name');
    } else {
      console.error('Error creating repository:', error.message);
    }
    throw error;
  }
}

createRepository();
