import path from 'path';
import mm from 'micromatch';
import isGlob from 'is-glob';
import resolveImportPath from './resolveImportPath';
import type {TSESLint} from '@typescript-eslint/utils';

type ModuleOption = {
  module: string;
  allowReferenceFrom: string[];
  allowSameModule?: boolean;
  allowTypeImport?: boolean;
};
type ExtraOptions = {
  resolveRelativeImport?: boolean;
  allowTypeImport?: boolean;
};

/**
 * pathのmatcher。
 * eslintrcで設定できる値は以下のケースを扱う
 * - globパターン指定
 * - globパターン以外の場合 => 前方部分一致
 */
const isMatch = (str: string, pattern: string): boolean =>
  isGlob(pattern) ? mm.isMatch(str, pattern) : str.startsWith(pattern);

export default {
  meta: {
    type: 'suggestion',
    messages: {
      importNotAllowed: 'import {{importPath}} is not allowed from {{relativeFilePath}}.',
    },
    schema: [
      {
        type: 'array',
        items: [
          {
            type: 'object',
            properties: {
              module: {
                type: 'string',
              },
              allowReferenceFrom: {
                type: 'array',
                items: [
                  {
                    type: 'string',
                  },
                ],
              },
              allowSameModule: {
                type: 'boolean',
              },
              allowTypeImport: {
                type: 'boolean',
              },
            },
          },
        ],
      },
      {
        type: 'object',
        properties: {
          resolveRelativeImport: {
            type: 'boolean',
          },
        },
      },
    ],
  },
  create: (context) => {
    const dependencies = context.options[0];
    // eslint-disable-next-line no-magic-numbers
    const options = (context.options.length > 1 ? context.options[1] : {}) as ExtraOptions;
    const resolveRelativeImport = options.resolveRelativeImport;
    const allowTypeImport = options.allowTypeImport;

    function checkImport(node) {
      if (allowTypeImport && node.importKind === 'type') {
        return;
      }

      const fileFullPath = context.getFilename();
      const relativeFilePath = path.relative(process.cwd(), fileFullPath);
      const importPath = resolveImportPath(node.source.value, resolveRelativeImport ? relativeFilePath : undefined);

      dependencies
        .filter((dependency) => isMatch(importPath, dependency.module))
        .forEach((dependency) => {
          const isAllowed =
            // 参照元が許可されている
            dependency.allowReferenceFrom.some((allowPath) =>
              isMatch(relativeFilePath, allowPath),
            ) || // または同一モジュール間の参照が許可されている場合
            (dependency.allowSameModule && isMatch(relativeFilePath, dependency.module)) ||
            (dependency.allowTypeImport && node.importKind === 'type');

          if (!isAllowed) {
            context.report({
              node,
              messageId: 'importNotAllowed',
              data: {importPath, relativeFilePath},
            });
          }
        });
    }

    return {
      ImportDeclaration: checkImport,
    };
  },
} as TSESLint.RuleModule<'importNotAllowed', [ModuleOption[]] | [ModuleOption[], ExtraOptions]>;
