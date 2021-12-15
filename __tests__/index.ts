/* eslint-disable @typescript-eslint/no-explicit-any,no-magic-numbers,@typescript-eslint/no-non-null-assertion */
import strictDependencies from '../src/strict-dependencies';
import path from 'path';
import resolveImportPath from '../src/strict-dependencies/resolveImportPath';

jest.mock('../src/strict-dependencies/resolveImportPath');

const createContext = (options: any, props?: any): Parameters<typeof strictDependencies.create>[0] => ({
  id: 'id',
  options,
  parserPath: 'parserPath',
  parserOptions: {},
  settings: {},
  getAncestors: jest.fn(),
  getDeclaredVariables: jest.fn(),
  getFilename: jest.fn(),
  getScope: jest.fn(),
  getSourceCode: jest.fn(),
  markVariableAsUsed: jest.fn(),
  report: jest.fn(),
  ...props,
});

describe('create', () => {
  it('should return object', () => {
    const created = strictDependencies.create(createContext([[]]));
    expect(typeof created).toBe('object');
    expect(created).toHaveProperty('ImportDeclaration');
  });
});

describe('create.ImportDeclaration', () => {
  it('should do nothing if no dependencies', () => {
    (resolveImportPath as jest.Mock).mockReturnValue('src/components/ui/Text');
    const getFilename = jest.fn(() => path.join(process.cwd(), 'src/components/aaa/bbb.ts'));
    const report = jest.fn();
    const {ImportDeclaration: checkImport} = strictDependencies.create(createContext([[]], {getFilename, report}));

    checkImport!({source: {value: '@/components/ui/Text'}} as never);

    expect(getFilename).toBeCalledTimes(1);
    expect(report).not.toBeCalled();
  });

  it('should do nothing if not matched with importPath', () => {
    // importPath: src/components/ui/Text
    // dependency.module: src/libs

    (resolveImportPath as jest.Mock).mockReturnValue('src/components/ui/Text');
    const getFilename = jest.fn(() => path.join(process.cwd(), 'src/components/aaa/bbb.ts'));
    const report = jest.fn();
    const {ImportDeclaration: checkImport} = strictDependencies.create(createContext([
      [{module: 'src/libs'}],
    ], {getFilename, report}));

    checkImport!({source: {value: '@/components/ui/Tex'}} as never);

    expect(getFilename).toBeCalledTimes(1);
    expect(report).not.toBeCalled();
  });

  it('should not report if allowed', () => {
    // relativePath: src/components/pages/aaa.ts
    // importPath: src/components/ui/Text
    // dependency.module: src/components/ui, dependency.allowReferenceFrom: ['src/components/pages'], allowSameModule: true

    (resolveImportPath as jest.Mock).mockReturnValue('src/components/ui/Text');
    const getFilename = jest.fn(() => path.join(process.cwd(), 'src/components/pages/aaa.ts'));
    const report = jest.fn();
    const {ImportDeclaration: checkImport} = strictDependencies.create(createContext([
      [{module: 'src/components/ui', allowReferenceFrom: ['src/components/pages'], allowSameModule: true}],
    ], {getFilename, report}));

    checkImport!({source: {value: '@/components/ui/Text'}} as never);

    expect(getFilename).toBeCalledTimes(1);
    expect(report).not.toBeCalled();
  });

  it('should not report if allowed with glob pattern', () => {
    // relativePath: src/components/pages/aaa.ts
    // importPath: src/components/ui/Text
    // dependency.module: src/components/ui, dependency.allowReferenceFrom: ['src/components/**/*.ts'], allowSameModule: true

    (resolveImportPath as jest.Mock).mockReturnValue('src/components/ui/Text');
    const getFilename = jest.fn(() => path.join(process.cwd(), 'src/components/pages/aaa.ts'));
    const report = jest.fn();
    const {ImportDeclaration: checkImport} = strictDependencies.create(createContext([
      [{module: 'src/components/ui', allowReferenceFrom: ['src/components/**/*.ts'], allowSameModule: true}],
    ], {getFilename, report}));

    checkImport!({source: {value: '@/components/ui/Text'}} as never);

    expect(getFilename).toBeCalledTimes(1);
    expect(report).not.toBeCalled();
  });

  it('should report if not allowed', () => {
    // relativePath: src/components/test/aaa.ts
    // importPath: src/components/ui/Text
    // dependency.module: src/components/ui, dependency.allowReferenceFrom: ['src/components/pages'], allowSameModule: true

    (resolveImportPath as jest.Mock).mockReturnValue('src/components/ui/Text');
    const getFilename = jest.fn(() => path.join(process.cwd(), 'src/components/test/aaa.ts'));
    const report = jest.fn();
    const {ImportDeclaration: checkImport} = strictDependencies.create(createContext([
      [{module: 'src/components/ui', allowReferenceFrom: ['src/components/pages'], allowSameModule: true}],
    ], {getFilename, report}));

    checkImport!({source: {value: '@/components/ui/Text'}} as never);

    expect(getFilename).toBeCalledTimes(1);
    expect(report.mock.calls).toHaveLength(1);
    expect(report.mock.calls[0][0]).toEqual({
      node: {
        source: {
          value: '@/components/ui/Text',
        },
      },
      messageId: 'importNotAllowed',
      data: {
        importPath: 'src/components/ui/Text',
        relativeFilePath: 'src/components/test/aaa.ts',
      },
    });
  });

  it('should report if not allowed with glob pattern', () => {
    // relativePath: src/components/test/aaa.tsx
    // importPath: src/components/ui/Text
    // dependency.module: src/components/ui, dependency.allowReferenceFrom: ['src/components/**/*.ts'], allowSameModule: true

    (resolveImportPath as jest.Mock).mockReturnValue('src/components/ui/Text');
    const getFilename = jest.fn(() => path.join(process.cwd(), 'src/components/test/aaa.tsx'));
    const report = jest.fn();
    const {ImportDeclaration: checkImport} = strictDependencies.create(createContext([
      [{module: 'src/components/ui', allowReferenceFrom: ['src/components/**/*.ts'], allowSameModule: true}],
    ], {getFilename, report}));

    checkImport!({source: {value: '@/components/ui/Text'}} as never);

    expect(getFilename).toBeCalledTimes(1);
    expect(report.mock.calls).toHaveLength(1);
    expect(report.mock.calls[0][0]).toEqual({
      node: {
        source: {
          value: '@/components/ui/Text',
        },
      },
      messageId: 'importNotAllowed',
      data: {
        importPath: 'src/components/ui/Text',
        relativeFilePath: 'src/components/test/aaa.tsx',
      },
    });
  });

  it('should not report if allowed from same module', () => {
    // relativePath: src/components/pages/aaa.ts
    // importPath: src/components/ui/Text
    // dependency.module: src/components/ui, dependency.allowReferenceFrom: ['src/components/pages'], allowSameModule: true

    (resolveImportPath as jest.Mock).mockReturnValue('src/components/ui/Text');
    const getFilename = jest.fn(() => path.join(process.cwd(), 'src/components/ui/aaa.ts'));
    const report = jest.fn();
    const {ImportDeclaration: checkImport} = strictDependencies.create(createContext([
      [{module: 'src/components/ui', allowReferenceFrom: ['src/aaa'], allowSameModule: true}],
    ], {getFilename, report}));

    checkImport!({source: {value: '@/components/ui/Text'}} as never);

    expect(getFilename).toBeCalledTimes(1);
    expect(report).not.toBeCalled();
  });

  it('should report if not allowed from same module', () => {
    // relativePath: src/components/pages/aaa.ts
    // importPath: src/components/ui/Text
    // dependency.module: src/components/ui, dependency.allowReferenceFrom: ['src/components/pages'], allowSameModule: true

    (resolveImportPath as jest.Mock).mockReturnValue('src/components/ui/Text');
    const getFilename = jest.fn(() => path.join(process.cwd(), 'src/components/ui/aaa.ts'));
    const report = jest.fn();
    const {ImportDeclaration: checkImport} = strictDependencies.create(createContext([
      [{module: 'src/components/ui', allowReferenceFrom: ['src/aaa'], allowSameModule: false}],
    ], {getFilename, report}));

    checkImport!({source: {value: '@/components/ui/Text'}} as never);

    expect(getFilename).toBeCalledTimes(1);
    expect(report.mock.calls).toHaveLength(1);
    expect(report.mock.calls[0][0]).toEqual({
      node: {
        source: {
          value: '@/components/ui/Text',
        },
      },
      messageId: 'importNotAllowed',
      data: {
        importPath: 'src/components/ui/Text',
        relativeFilePath: 'src/components/ui/aaa.ts',
      },
    });
  });

  it('should not report if allowed from type import', () => {
    // relativePath: src/components/pages/aaa.ts
    // importPath: src/components/ui/Text
    // dependency.module: src/components/ui, dependency.allowReferenceFrom: ['src/components/pages']

    (resolveImportPath as jest.Mock).mockReturnValue('src/components/ui/Text');
    const getFilename = jest.fn(() => path.join(process.cwd(), 'src/components/ui/aaa.ts'));
    const report = jest.fn();
    const {ImportDeclaration: checkImport} = strictDependencies.create(createContext([
      [{module: 'src/components/ui', allowReferenceFrom: ['src/aaa']}],
      {allowTypeImport: true},
    ], {getFilename, report}));

    checkImport!({source: {value: '@/components/ui/Text'}, importKind: 'type'} as never);

    expect(getFilename).not.toBeCalled();
    expect(report).not.toBeCalled();
  });

  it('should not report if allowed from each type import', () => {
    // relativePath: src/components/pages/aaa.ts
    // importPath: src/components/ui/Text
    // dependency.module: src/components/ui, dependency.allowReferenceFrom: ['src/components/pages'], allowTypeImport: true

    (resolveImportPath as jest.Mock).mockReturnValue('src/components/ui/Text');
    const getFilename = jest.fn(() => path.join(process.cwd(), 'src/components/ui/aaa.ts'));
    const report = jest.fn();
    const {ImportDeclaration: checkImport} = strictDependencies.create(createContext([
      [{module: 'src/components/ui', allowReferenceFrom: ['src/aaa'], allowTypeImport: true}],
    ], {getFilename, report}));

    checkImport!({source: {value: '@/components/ui/Text'}, importKind: 'type'} as never);

    expect(getFilename).toBeCalledTimes(1);
    expect(report).not.toBeCalled();
  });

  it('should pass relativeFilePath value to resolveImportPath if resolveRelativeImport is true', () => {
    (resolveImportPath as jest.Mock).mockReturnValue('src/components/ui/Text');
    const getFilename = jest.fn(() => path.join(process.cwd(), 'src/components/ui/aaa.ts'));
    const report = jest.fn();
    const {ImportDeclaration: checkImport} = strictDependencies.create(createContext([
      [{module: 'src/components/ui', allowReferenceFrom: ['src/aaa'], allowSameModule: true}],
      {resolveRelativeImport: true},
    ], {getFilename, report}));

    checkImport!({source: {value: '@/components/ui/Text'}} as never);

    expect(resolveImportPath).toBeCalledWith('@/components/ui/Text', 'src/components/ui/aaa.ts');
    expect(getFilename).toBeCalledTimes(1);
    expect(report).not.toBeCalled();
  });

  it('should pass empty relativeFilePath value to resolveImportPath if resolveRelativeImport is falsy', () => {
    (resolveImportPath as jest.Mock).mockReturnValue('../components/ui/Text');
    const getFilename = jest.fn(() => path.join(process.cwd(), 'src/components/ui/aaa.ts'));
    const report = jest.fn();
    const {ImportDeclaration: checkImport} = strictDependencies.create(createContext([
      [{module: 'src/components/ui', allowReferenceFrom: ['src/aaa'], allowSameModule: true}],
    ], {getFilename, report}));

    checkImport!({source: {value: '@/components/ui/Text'}} as never);

    expect(resolveImportPath).toBeCalledWith('@/components/ui/Text', undefined);
    expect(getFilename).toBeCalledTimes(1);
    expect(report).not.toBeCalled();
  });
});
