import { fs } from '~test/util.ts';
import { GlobalConfig } from '../config/global.ts';
import { findMiseConfig, findMiseCwd } from './mise-config.ts';

vi.mock('../util/fs', async (importOriginal) => {
  const orig = await importOriginal<typeof import('./fs/index.ts')>();
  return {
    ...orig,
    readLocalDirectory: vi.fn(),
  };
});

vi.mock('./fs/index.ts');

const localDir = '/tmp/renovate/repos/project';

describe('util/mise-config', () => {
  beforeEach(() => {
    GlobalConfig.set({ localDir });
    vi.restoreAllMocks();
  });

  describe('findMiseConfig', () => {
    it('should find mise.toml in current directory', async () => {
      fs.findUpLocal.mockResolvedValueOnce('mise.toml');

      const result = await findMiseConfig('');
      expect(result).toBe('mise.toml');
    });

    it('should find .config/mise/config.toml walking up', async () => {
      fs.findUpLocal.mockResolvedValueOnce(
        'nested/.config/mise/config.toml',
      );

      const result = await findMiseConfig('nested/sub');
      expect(result).toBe('nested/.config/mise/config.toml');
    });

    it('should return null when no config found', async () => {
      fs.findUpLocal.mockResolvedValueOnce(null);

      const result = await findMiseConfig('some/dir');
      expect(result).toBeNull();
    });
  });

  describe('findMiseCwd', () => {
    it('should return directory of mise config file', async () => {
      fs.findUpLocal.mockResolvedValueOnce('project/mise.toml');

      const result = await findMiseCwd('project/sub');
      expect(result).toBe('project');
    });

    it('should return .config/mise directory for conf.d config', async () => {
      fs.findUpLocal.mockResolvedValueOnce(null);
      fs.readLocalDirectory.mockResolvedValueOnce(['python.toml']);

      const result = await findMiseCwd('');
      expect(result).toBe('.config/mise');
    });

    it('should return nested .config/mise for conf.d config', async () => {
      fs.findUpLocal.mockResolvedValueOnce(null);
      fs.readLocalDirectory.mockRejectedValueOnce(
        new Error('ENOENT'),
      );
      fs.readLocalDirectory.mockResolvedValueOnce(['node.toml']);

      const result = await findMiseCwd('nested/sub');
      expect(result).toBe('nested/.config/mise');
    });

    it('should return null when no mise config found anywhere', async () => {
      fs.findUpLocal.mockResolvedValueOnce(null);
      fs.readLocalDirectory.mockRejectedValue(new Error('ENOENT'));

      const result = await findMiseCwd('');
      expect(result).toBeNull();
    });

    it('should prefer standard config over conf.d', async () => {
      fs.findUpLocal.mockResolvedValueOnce('.mise/config.toml');

      const result = await findMiseCwd('sub');
      expect(result).toBe('.mise');
    });
  });
});
