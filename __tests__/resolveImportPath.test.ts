import { describe, expect, it, vi } from 'vitest';
import resolveImportPath from '../src/strict-dependencies/resolveImportPath';
import {readFileSync} from 'fs';

vi.mock('fs');

describe('resolveImportPath', () => {
  it('should resolve relative path', () => {
    // > src/pages/aaa/bbb.ts
    // import Text from '../../components/ui/Text'

    vi.mocked(readFileSync).mockReturnValue(JSON.stringify({}));
    expect(resolveImportPath('../../components/ui/Text', 'src/pages/aaa/bbb.ts')).toBe('src/components/ui/Text');
  });

  it('should not resolve relative path if relativeFilePath is empty', () => {
    // > src/pages/aaa/bbb.ts
    // import Text from '../../components/ui/Text'

    vi.mocked(readFileSync).mockReturnValue(JSON.stringify({}));
    expect(resolveImportPath('../../components/ui/Text')).toBe('../../components/ui/Text');
  });

  it('should do nothing if tsconfig.json does not exist', () => {
    vi.mocked(readFileSync).mockImplementation(() => {
      throw new Error();
    });
    expect(resolveImportPath('components/aaa/bbb')).toBe('components/aaa/bbb');
  });

  it('should do nothing if no paths setting', () => {
    vi.mocked(readFileSync).mockReturnValue(JSON.stringify({}));
    expect(resolveImportPath('components/aaa/bbb')).toBe('components/aaa/bbb');
  });

  describe('should resolve tsconfig paths', () => {
    [
      ['@/components/', 'components/', 'components/aaa/bbb'],
      ['@/components', 'components', 'components/aaa/bbb'],
      ['@/components/*', 'components/*', 'components/aaa/bbb'],
    ].forEach(([target, resolve, expected]) => {
      it(`${target}: [${resolve}]`, () => {
        vi.mocked(readFileSync).mockReturnValue(JSON.stringify({
          compilerOptions: {
            paths: {
              [target]: [resolve],
            },
          },
        }));

        expect(resolveImportPath('components/aaa/bbb')).toBe('components/aaa/bbb');
        expect(resolveImportPath('@/components/aaa/bbb')).toBe(expected);
      });
    });
  });

  describe('should resolve tsconfig paths with baseUrl', () => {
    [
      ['.', 'components/aaa/bbb'],
      ['./', 'components/aaa/bbb'],
      ['../', '../components/aaa/bbb'],
      ['src', 'src/components/aaa/bbb'],
      ['./src', 'src/components/aaa/bbb'],
      ['src/', 'src/components/aaa/bbb'],
      ['./src/', 'src/components/aaa/bbb'],
    ].forEach(([baseUrl, expected]) => {
      it(baseUrl, () => {
        vi.mocked(readFileSync).mockReturnValue(JSON.stringify({
          compilerOptions: {
            baseUrl,
            paths: {
              '@/components/': ['components/'],
            },
          },
        }));

        expect(resolveImportPath('components/aaa/bbb')).toBe('components/aaa/bbb');
        expect(resolveImportPath('@/components/aaa/bbb')).toBe(expected);
      });
    });
  });
});
