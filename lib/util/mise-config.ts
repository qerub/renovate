import { findUpLocal } from './fs/index.ts';
import upath from 'upath';

export const miseConfigSearchPaths = [
  'mise.toml',
  'mise/config.toml',
  '.mise/config.toml',
  '.config/mise.toml',
  '.config/mise/config.toml',
] as const;

export async function findMiseConfig(
  cwd: string,
): Promise<string | null> {
  return findUpLocal([...miseConfigSearchPaths], cwd);
}

export async function findMiseConfDConfig(
  cwd: string,
): Promise<string | null> {
  let current = cwd;
  while (true) {
    const confDDir = upath.join(current, '.config/mise/conf.d');
    const confDEntries = await readLocalDirectorySafe(confDDir);
    const firstToml = confDEntries.find((entry) => entry.endsWith('.toml'));
    if (firstToml) {
      return upath.join(confDDir, firstToml);
    }

    if (current === '') {
      return null;
    }
    current = upath.dirname(current);
    if (current === '.') {
      current = '';
    }
  }
}

export async function findMiseCwd(cwd: string): Promise<string | null> {
  const miseConfig = await findMiseConfig(cwd);
  if (miseConfig) {
    return upath.dirname(miseConfig);
  }

  const confDConfig = await findMiseConfDConfig(cwd);
  if (confDConfig) {
    return upath.dirname(upath.dirname(confDConfig));
  }

  return null;
}

async function readLocalDirectorySafe(path: string): Promise<string[]> {
  try {
    const { readLocalDirectory } = await import('./fs/index.ts');
    return await readLocalDirectory(path);
  } catch {
    return [];
  }
}
