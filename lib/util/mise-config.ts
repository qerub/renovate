import upath from 'upath';
import { findUpLocal, readLocalDirectory } from './fs/index.ts';

export const miseConfigSearchPaths = [
  'mise.toml',
  'mise/config.toml',
  '.mise/config.toml',
  '.config/mise.toml',
  '.config/mise/config.toml',
] as const;

/**
 * Finds the mise configuration file by searching up the directory tree.
 * Returns the relative path to the config file, or null if not found.
 */
export async function findMiseConfig(cwd: string): Promise<string | null> {
  return findUpLocal([...miseConfigSearchPaths], cwd);
}

/**
 * Searches for a conf.d directory containing .toml files by walking up from cwd.
 * Returns the relative path to the first .toml file found in a conf.d directory,
 * or null if none found.
 */
async function findMiseConfDConfig(cwd: string): Promise<string | null> {
  let current = cwd;
  for (;;) {
    const confDDir = upath.join(current, '.config/mise/conf.d');
    const entries = await readLocalDirectorySafe(confDDir);
    const firstToml = entries.find((entry) => entry.endsWith('.toml'));
    if (firstToml) {
      return upath.join(confDDir, firstToml);
    }

    if (current === '') {
      return null;
    }
    const parent = upath.dirname(current);
    current = parent === '.' ? '' : parent;
  }
}

/**
 * Finds the mise working directory (the directory where `mise env` should be run).
 * For a standard config file, this is the directory containing the file.
 * For conf.d files, this is the `.config/mise` parent directory.
 * Returns a relative path from localDir, or null if no mise config is found.
 */
export async function findMiseCwd(cwd: string): Promise<string | null> {
  const miseConfig = await findMiseConfig(cwd);
  if (miseConfig) {
    return upath.dirname(miseConfig);
  }

  const confDConfig = await findMiseConfDConfig(cwd);
  if (confDConfig) {
    // conf.d files live in .config/mise/conf.d/*, so go up to .config/mise
    const confDDir = upath.dirname(confDConfig);
    return upath.dirname(confDDir);
  }

  return null;
}

async function readLocalDirectorySafe(path: string): Promise<string[]> {
  try {
    return await readLocalDirectory(path);
  } catch {
    return [];
  }
}
