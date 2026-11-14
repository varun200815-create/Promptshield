import fs from 'node:fs';
import path from 'node:path';
import { exec } from 'node:child_process';

const ROOT = process.cwd();
const TARGET_OWNER = 'varun200815-create';
const TARGET_REPO = 'Promptshield';
const TARGET_URL = `https://github.com/${TARGET_OWNER}/${TARGET_REPO}`;

// GitHub CLI official public OAuth Client ID for Device Flow
const GITHUB_CLIENT_ID = '178c6fc778ccc68e1d6a';

const IGNORE_DIRS = new Set(['node_modules', 'dist', '.git', '_zip_stage', '.zip_stage']);
const IGNORE_FILES = new Set([
  '.env',
  '.env.local',
  '.DS_Store',
  'PROMPTSHIELD-AI-v2-READY.zip',
]);

function verifyGitignore() {
  const gitignorePath = path.join(ROOT, '.gitignore');
  let content = fs.existsSync(gitignorePath) ? fs.readFileSync(gitignorePath, 'utf8') : '';
  const required = ['.env', '.env.local', 'node_modules/'];
  let updated = false;
  for (const item of required) {
    if (!content.split(/\r?\n/).includes(item)) {
      content = `${content.trimEnd()}\n${item}\n`;
      updated = true;
    }
  }
  if (updated) {
    fs.writeFileSync(gitignorePath, content, 'utf8');
  }
  console.log('✔ Verified .env and .env.local are listed in .gitignore');
}

function initLocalGitMetadata(commitSha = '0000000000000000000000000000000000000000') {
  const gitDir = path.join(ROOT, '.git');
  fs.mkdirSync(path.join(gitDir, 'refs', 'heads'), { recursive: true });
  fs.mkdirSync(path.join(gitDir, 'refs', 'remotes', 'origin'), { recursive: true });
  fs.mkdirSync(path.join(gitDir, 'objects', 'info'), { recursive: true });
  fs.mkdirSync(path.join(gitDir, 'objects', 'pack'), { recursive: true });

  fs.writeFileSync(path.join(gitDir, 'HEAD'), 'ref: refs/heads/main\n', 'utf8');
  fs.writeFileSync(
    path.join(gitDir, 'config'),
    `[core]
\trepositoryformatversion = 0
\tfilemode = false
\tbare = false
\tlogallrefupdates = true
\tsymlinks = false
\tignorecase = true
[remote "origin"]
\turl = ${TARGET_URL}.git
\tfetch = +refs/heads/*:refs/remotes/origin/*
[branch "main"]
\tremote = origin
\tmerge = refs/heads/main
`,
    'utf8',
  );

  if (commitSha && commitSha !== '0000000000000000000000000000000000000000') {
    fs.writeFileSync(path.join(gitDir, 'refs', 'heads', 'main'), `${commitSha}\n`, 'utf8');
    fs.writeFileSync(path.join(gitDir, 'refs', 'remotes', 'origin', 'main'), `${commitSha}\n`, 'utf8');
  }
  console.log(`✔ Initialized local .git repository linked to ${TARGET_URL}.git`);
}

function collectFiles(dir, base = '') {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const results = [];
  for (const entry of entries) {
    if (
      entry.name.endsWith('.log') ||
      entry.name.endsWith('.zip') ||
      entry.name === '.env' ||
      entry.name.startsWith('.env.') && entry.name !== '.env.example'
    ) {
      continue;
    }
    if (entry.isDirectory()) {
      if (IGNORE_DIRS.has(entry.name)) continue;
      results.push(...collectFiles(path.join(dir, entry.name), `${base}${entry.name}/`));
    } else if (entry.isFile()) {
      if (IGNORE_FILES.has(entry.name)) continue;
      results.push({
        relPath: `${base}${entry.name}`,
        fullPath: path.join(dir, entry.name),
      });
    }
  }
  return results;
}

async function ghFetch(url, token, options = {}) {
  const res = await fetch(`https://api.github.com${url}`, {
    ...options,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'PromptShield-GitHub-Pusher',
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || `GitHub API error (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

async function authenticateViaDeviceFlow() {
  const res = await fetch('https://github.com/login/device/code', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: GITHUB_CLIENT_ID,
      scope: 'repo',
    }),
  });
  const data = await res.json();
  if (!data.device_code) {
    throw new Error('Could not start GitHub Device Flow authentication.');
  }

  console.log('\n========================================================');
  console.log('  GITHUB AUTHORIZATION REQUIRED');
  console.log('========================================================');
  console.log(`  1. Open:  ${data.verification_uri}`);
  console.log(`  2. Enter code:  ${data.user_code}`);
  console.log('========================================================\n');

  // Attempt to open browser automatically on Windows
  exec(`start "" "${data.verification_uri}"`);

  const intervalMs = (data.interval || 5) * 1000;
  const expiresAt = Date.now() + (data.expires_in || 900) * 1000;

  while (Date.now() < expiresAt) {
    await new Promise((r) => setTimeout(r, intervalMs));
    const pollRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        device_code: data.device_code,
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
      }),
    });
    const pollData = await pollRes.json();
    if (pollData.access_token) {
      return pollData.access_token;
    }
    if (pollData.error === 'authorization_pending') {
      continue;
    }
    if (pollData.error === 'slow_down') {
      await new Promise((r) => setTimeout(r, 5000));
      continue;
    }
    throw new Error(`GitHub authorization failed: ${pollData.error_description || pollData.error}`);
  }
  throw new Error('GitHub device authorization timed out.');
}

async function main() {
  verifyGitignore();
  initLocalGitMetadata();

  let token = process.env.GITHUB_TOKEN || process.argv[2] || '';
  if (!token) {
    token = await authenticateViaDeviceFlow();
  }

  console.log('\n1. Authenticating with GitHub...');
  const user = await ghFetch('/user', token);
  const owner = TARGET_OWNER;
  const repoName = TARGET_REPO;
  console.log(`   Signed in as: ${user.login} -> Pushing to: ${owner}/${repoName}`);

  let repo;
  try {
    repo = await ghFetch(`/repos/${owner}/${repoName}`, token);
    console.log(`2. Found repository: ${repo.html_url}`);
  } catch (err) {
    if (err.status === 404) {
      console.log(`2. Creating public repository "${owner}/${repoName}"...`);
      repo = await ghFetch('/user/repos', token, {
        method: 'POST',
        body: JSON.stringify({
          name: repoName,
          description: 'PromptShield AI v2 — AI Security, Privacy & Trust (Local PII/Secret Redaction, 8-Language Voice & Vision Auto-Blur)',
          private: false,
          auto_init: true,
        }),
      });
      await new Promise((r) => setTimeout(r, 1500));
    } else {
      throw err;
    }
  }

  const branch = repo.default_branch || 'main';
  let baseCommitSha = null;
  try {
    const ref = await ghFetch(`/repos/${owner}/${repoName}/git/ref/heads/${branch}`, token);
    baseCommitSha = ref.object.sha;
  } catch {
    await ghFetch(`/repos/${owner}/${repoName}/contents/README.md`, token, {
      method: 'PUT',
      body: JSON.stringify({
        message: 'Initial commit',
        content: Buffer.from('# PromptShield AI v2\n').toString('base64'),
      }),
    });
    const ref = await ghFetch(`/repos/${owner}/${repoName}/git/ref/heads/${branch}`, token);
    baseCommitSha = ref.object.sha;
  }

  const files = collectFiles(ROOT);
  console.log(`3. Committing & uploading ${files.length} files (excluding .env / .env.local / node_modules)...`);

  const tree = [];
  for (const f of files) {
    const content = fs.readFileSync(f.fullPath);
    const blob = await ghFetch(`/repos/${owner}/${repoName}/git/blobs`, token, {
      method: 'POST',
      body: JSON.stringify({
        content: content.toString('base64'),
        encoding: 'base64',
      }),
    });
    tree.push({
      path: f.relPath,
      mode: '100644',
      type: 'blob',
      sha: blob.sha,
    });
  }

  console.log('4. Creating Git tree & commit on main...');
  const newTree = await ghFetch(`/repos/${owner}/${repoName}/git/trees`, token, {
    method: 'POST',
    body: JSON.stringify({ tree }),
  });

  const commit = await ghFetch(`/repos/${owner}/${repoName}/git/commits`, token, {
    method: 'POST',
    body: JSON.stringify({
      message: 'feat: PromptShield AI v2 full-stack release (35 detectors, 8-language voice, Supabase Auth & Vision Auto-Blur)',
      tree: newTree.sha,
      parents: baseCommitSha ? [baseCommitSha] : [],
    }),
  });

  await ghFetch(`/repos/${owner}/${repoName}/git/refs/heads/${branch}`, token, {
    method: 'PATCH',
    body: JSON.stringify({
      sha: commit.sha,
      force: true,
    }),
  });

  initLocalGitMetadata(commit.sha);

  console.log('\n========================================================');
  console.log('  SUCCESS! All files committed and pushed to GitHub:');
  console.log(`  https://github.com/${owner}/${repoName}`);
  console.log(`  Commit SHA: ${commit.sha}`);
  console.log('========================================================\n');
}

main().catch((err) => {
  console.error('\nFailed to push to GitHub:', err.message);
  process.exit(1);
});
