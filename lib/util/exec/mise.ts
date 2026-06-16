import upath from 'upath';
import { GlobalConfig } from '../../config/global.ts';
import { logger } from '../../logger/index.ts';
import { findMiseCwd as findMiseCwdHelper } from '../mise-config.ts';
import { newlineRegex } from '../regex.ts';
import { coerceString } from '../string.ts';
import { rawExec } from './common.ts';
import type { RawExecOptions } from './types.ts';

export function isMise(): boolean {
  return GlobalConfig.get('binarySource') === 'mise';
}

export async function findMiseCwd(cwd: string): Promise<string | null> {
  const localDir = GlobalConfig.get('localDir');
  const relativeCwd = upath.relative(localDir, cwd);
  const miseCwd = await findMiseCwdHelper(relativeCwd);
  if (miseCwd === null) {
    return null;
  }
  return upath.join(localDir, miseCwd);
}

export async function getMiseEnvs(
  rawOptions: RawExecOptions,
): Promise<Record<string, string>> {
  const cwd = coerceString(rawOptions.cwd);
  const miseCwd = await findMiseCwd(cwd);
  if (miseCwd === null) {
    logger.debug(
      { cwd },
      'No mise config found for cwd, skipping mise environment injection',
    );
    return {};
  }
  logger.debug({ cwd, miseCwd }, 'fetching mise environment variables');
  const miseEnvResp = await rawExec('mise env', {
    ...rawOptions,
    cwd: miseCwd,
  });

  const out: Record<string, string> = {};
  const lines = miseEnvResp.stdout
    .split(newlineRegex)
    .map((line) => line.trim())
    .filter((line) => line.includes('='));
  for (const line of lines) {
    const equalIndex = line.indexOf('=');
    const name = line.substring(0, equalIndex).replace(/^export\s+/, '');
    let value = line.substring(equalIndex + 1);
    // Strip surrounding quotes from shell-style output
    value = value.replace(/^['"]|['"]$/g, '');
    out[name] = value;
  }

  return out;
}
