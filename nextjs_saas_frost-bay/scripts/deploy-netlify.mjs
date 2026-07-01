import { spawn } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const DEPLOY_ENV_DENYLIST = new Set([
  'NETLIFY_AUTH_TOKEN',
  'NETLIFY_NETLIFY_AUTH_TOKEN',
  'NETLIFY_SITE_ID',
  'NETLIFY_NETLIFY_SITE_ID',
  'NETLIFY_SITE_NAME',
  'NETLIFY_NETLIFY_SITE_NAME',
  'NETLIFY_SITE_URL',
  'NETLIFY_NETLIFY_SITE_URL',
]);

function getFirstEnvValue(...keys) {
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value) {
      return value;
    }
  }

  return '';
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return false;
    }

    throw error;
  }
}

function parseEnvFile(contents) {
  const values = {};

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    const separatorIndex = line.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (key) {
      values[key] = value;
    }
  }

  return values;
}

async function loadLocalEnv(rootDirectory) {
  const values = {};

  for (const fileName of ['.env', '.env.local']) {
    try {
      const contents = await fs.readFile(path.join(rootDirectory, fileName), 'utf8');
      Object.assign(values, parseEnvFile(contents));
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
        continue;
      }

      throw error;
    }
  }

  for (const [key, value] of Object.entries(values)) {
    if (typeof value === 'string' && !Object.prototype.hasOwnProperty.call(process.env, key)) {
      process.env[key] = value;
    }
  }

  return values;
}

function shouldSyncEnvironmentValue(key, value) {
  if (DEPLOY_ENV_DENYLIST.has(key)) {
    return false;
  }

  if (
    key === 'NEXT_PUBLIC_APP_URL' &&
    /^(https?:\/\/)?(localhost|127\.0\.0\.1)(:\d+)?(\/.*)?$/i.test(value)
  ) {
    return false;
  }

  return true;
}

function collectDeploymentEnvironmentValues(sourceValues) {
  const values = {};

  for (const [key, rawValue] of Object.entries(sourceValues)) {
    if (typeof rawValue !== 'string') {
      continue;
    }

    const trimmed = rawValue.trim();
    if (trimmed === '' || !shouldSyncEnvironmentValue(key, trimmed)) {
      continue;
    }

    values[key] = trimmed;
  }

  return values;
}

async function runCommand(command, args, options = {}) {
  await new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd ?? process.cwd(),
      env: options.env ?? process.env,
      stdio: ['ignore', 'inherit', 'inherit'],
    });

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve(undefined);
        return;
      }

      reject(new Error(`Command failed: ${command} ${args.join(' ')}`));
    });
  });
}

async function runNetlifyCommand(rootDirectory, args, options = {}) {
  const cliPath = path.join(rootDirectory, 'node_modules', 'netlify', 'bin', 'run.js');

  if (await fileExists(cliPath)) {
    await runCommand(process.execPath, [cliPath, ...args], options);
    return;
  }

  await runCommand('npx', ['netlify', ...args], options);
}

async function syncNetlifyEnvironment({ rootDirectory, siteId, values }) {
  const syncedKeys = [];

  for (const [key, value] of Object.entries(values)) {
    await runNetlifyCommand(rootDirectory, ['env:set', key, value, '--site', siteId], {
      cwd: rootDirectory,
    });
    syncedKeys.push(key);
  }

  return syncedKeys;
}

async function ensureNetlifyState(rootDirectory, siteId) {
  const netlifyDirectory = path.join(rootDirectory, '.netlify');
  const statePath = path.join(netlifyDirectory, 'state.json');
  let state = {};

  await fs.mkdir(netlifyDirectory, { recursive: true });

  try {
    state = JSON.parse(await fs.readFile(statePath, 'utf8'));
  } catch (error) {
    if (!(error instanceof SyntaxError) &&
      !(error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT')) {
      throw error;
    }
  }

  state.siteId = siteId;
  await fs.writeFile(statePath, `${JSON.stringify(state, null, '\t')}\n`, 'utf8');
}

async function findNearestAncestorGitPath(rootDirectory) {
  let currentDirectory = path.dirname(rootDirectory);

  while (currentDirectory !== path.dirname(currentDirectory)) {
    const gitPath = path.join(currentDirectory, '.git');

    if (await fileExists(gitPath)) {
      return gitPath;
    }

    currentDirectory = path.dirname(currentDirectory);
  }

  const rootGitPath = path.join(currentDirectory, '.git');
  if (await fileExists(rootGitPath)) {
    return rootGitPath;
  }

  return null;
}

async function ensureNetlifyRepositoryRoot(rootDirectory) {
  const localGitPath = path.join(rootDirectory, '.git');

  if (await fileExists(localGitPath)) {
    return async () => {};
  }

  const ancestorGitPath = await findNearestAncestorGitPath(rootDirectory);
  if (!ancestorGitPath) {
    return async () => {};
  }

  const relativeTarget = path.relative(rootDirectory, ancestorGitPath) || '.git';
  await fs.symlink(relativeTarget, localGitPath);
  console.log(`Created temporary .git link for Netlify deploy: ${relativeTarget}`);

  return async () => {
    try {
      await fs.unlink(localGitPath);
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
        return;
      }

      throw error;
    }
  };
}

async function main() {
  const rootDirectory = process.cwd();
  const localEnvValues = await loadLocalEnv(rootDirectory);

  const authToken = getFirstEnvValue('NETLIFY_AUTH_TOKEN', 'NETLIFY_NETLIFY_AUTH_TOKEN');
  const siteId = getFirstEnvValue('NETLIFY_SITE_ID', 'NETLIFY_NETLIFY_SITE_ID');
  const siteName = getFirstEnvValue('NETLIFY_SITE_NAME', 'NETLIFY_NETLIFY_SITE_NAME');
  const siteUrl = getFirstEnvValue('NETLIFY_SITE_URL', 'NETLIFY_NETLIFY_SITE_URL');

  if (!authToken || !siteId) {
    throw new Error(
      'Netlify is not configured yet. Pull your Stripe project env again so the Netlify auth token and site id are available.',
    );
  }

  // Netlify CLI env commands read the active project from NETLIFY_SITE_ID.
  process.env.NETLIFY_AUTH_TOKEN = authToken;
  process.env.NETLIFY_SITE_ID = siteId;
  if (siteName && !process.env.NETLIFY_SITE_NAME) {
    process.env.NETLIFY_SITE_NAME = siteName;
  }
  if (siteUrl && !process.env.NETLIFY_SITE_URL) {
    process.env.NETLIFY_SITE_URL = siteUrl;
  }

  await ensureNetlifyState(rootDirectory, siteId);

  const deploymentEnvironment = collectDeploymentEnvironmentValues(localEnvValues);
  const cleanupRepositoryRoot = await ensureNetlifyRepositoryRoot(rootDirectory);
  let syncedEnvironmentKeys = [];

  try {
    syncedEnvironmentKeys = await syncNetlifyEnvironment({
      rootDirectory,
      siteId,
      values: deploymentEnvironment,
    });

    console.log('Netlify deploy script: running production deploy');
    await runNetlifyCommand(rootDirectory, ['deploy', '--prod'], {
      cwd: rootDirectory,
    });
  } finally {
    await cleanupRepositoryRoot();
  }

  const deploymentUrl =
    siteUrl ||
    (siteName
      ? `https://${siteName}.netlify.app`
      : null);

  console.log('Deployment completed successfully.');
  if (syncedEnvironmentKeys.length > 0) {
    console.log(`Synced env vars: ${syncedEnvironmentKeys.sort().join(', ')}`);
  }
  if (deploymentUrl) {
    console.log(`URL: ${deploymentUrl}`);
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : 'Unable to deploy to Netlify.';
  console.error(message);
  process.exitCode = 1;
});
