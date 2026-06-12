import { codeBlock } from 'common-tags';
import upath from 'upath';
import { mockExecAll } from '~test/exec-util.ts';
import { partial } from '~test/util.ts';
import { GlobalConfig } from '../../config/global.ts';
import { findMiseCwd, getMiseEnvs, isMise } from './mise.ts';
import type { RawExecOptions } from './types.ts';
import * as miseConfig from '../mise-config.ts';

const localDir = '/tmp/renovate/repository/project-a';

describe('util/exec/mise', () => {
  describe('isMise', () => {
    it('should return true when binarySource is mise', () => {
      GlobalConfig.set({ binarySource: 'docker' });
      expect(isMise()).toBeFalse();
      GlobalConfig.set({ binarySource: 'mise' });
      expect(isMise()).toBeTruthy();
    });
  });

  describe('findMiseCwd', () => {
    beforeEach(() => {
      GlobalConfig.set({ localDir });
      vi.restoreAllMocks();
    });

    it.each`
      dir                         | miseLocation                    | expected
      ${'nested/other/directory'} | ${'nested/.config/mise'}        | ${'nested/.config/mise'}
      ${'nested'}                 | ${'nested/mise'}                | ${'nested/mise'}
      ${'other/directory'}        | ${'.config/mise'}               | ${'.config/mise'}
      ${''}                       | ${'mise'}                       | ${'mise'}
    `(
      '("$dir") === $expected',
      async ({ dir, miseLocation, expected }) => {
        const cwd = upath.join(localDir, dir);
        vi.spyOn(miseConfig, 'findMiseCwd').mockResolvedValueOnce(miseLocation);
        expect(await findMiseCwd(cwd)).toBe(upath.join(localDir, expected));
      },
    );

    it('should return null when mise cwd is not found', async () => {
      vi.spyOn(miseConfig, 'findMiseCwd').mockResolvedValueOnce(null);
      await expect(findMiseCwd('other/directory')).resolves.toBeNull();
    });
  });

  describe('getMiseEnvs', () => {
    beforeEach(() => {
      GlobalConfig.set({ localDir });
      vi.restoreAllMocks();
    });

    it('should return mise environment variables when mise env returns successfully', async () => {
      vi.spyOn(miseConfig, 'findMiseCwd').mockResolvedValueOnce('nested/.config/mise');
      mockExecAll({
        stdout: codeBlock`
          PATH=/usr/src/app/repository-a/.local/share/mise/shims:/usr/src/app/repository-a/bin
          MISE_PROJECT_ROOT=/usr/src/app/repository-a
        `,
        stderr: '',
      });

      const relativeCwd = 'nested/other/bin';
      const fullCwd = upath.join(localDir, relativeCwd);

      const resp = await getMiseEnvs(
        partial<RawExecOptions>({
          cwd: fullCwd,
        }),
      );

      expect(resp).toStrictEqual({
        PATH: '/usr/src/app/repository-a/.local/share/mise/shims:/usr/src/app/repository-a/bin',
        MISE_PROJECT_ROOT: '/usr/src/app/repository-a',
      });
    });

    it('should return empty env when no mise config is found', async () => {
      vi.spyOn(miseConfig, 'findMiseCwd').mockResolvedValueOnce(null);
      const relativeCwd = 'nested/other/bin';
      const fullCwd = upath.join(localDir, relativeCwd);
      await expect(
        getMiseEnvs(
          partial<RawExecOptions>({
            cwd: fullCwd,
          }),
        ),
      ).resolves.toStrictEqual({});
    });
  });
});
