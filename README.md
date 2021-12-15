# eslint-plugin-strict-dependencies

ESlint plugin to define custom module dependency rules.

NOTE: `eslint-plugin-strict-dependencies` uses tsconfig, tsconfig.json must be present.

## Table of Contents

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
<details>
<summary>Details</summary>

- [Installation](#installation)
- [Supported Rules](#supported-rules)
  - [Options](#options)
- [Usage](#usage)
- [License](#license)

</details>
<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Installation

```
npm install @technote-space/eslint-plugin-strict-dependencies --save-dev
```

## Supported Rules

- strict-dependencies
  - module: `string` (Glob or Forward matching string)
    - target module path
  - allowReferenceFrom: `string[]` (Glob or Forward matching string)
    - Paths of files where target module imports are allowed.
  - allowSameModule: `boolean`
    - Whether it can be imported by other files in the same directory
  - allowTypeImport: `boolean`
    - Whether to allow type import

### Options

- resolveRelativeImport: `boolean[default = false]`
  - Whether to resolve relative import as in the following example
  - `src/components/aaa.ts`
   ```typescript
   import bbb from './bbb';
   ```
     - `./bbb`: `resolveRelativeImport = false`
     - `src/components/bbb`: `resolveRelativeImport = true`
- allowTypeImport: `boolean`
  - Whether to allow type import

## Usage

.eslintrc:

```js
"plugins": [
  "@technote-space/strict-dependencies",
],
"rules": {
  "@technote-space/strict-dependencies/strict-dependencies": [
    "error",
    [
      /**
       * Example:
       * Limit the dependencies in the following directions
       * pages -> components/page -> components/ui
       */
      {
        "module": "src/components/page",
        "allowReferenceFrom": ["src/pages"],
        // components/page can't import other components/page
        "allowSameModule": false,
        "allowTypeImport": true
      },
      {
        "module": "src/components/ui",
        "allowReferenceFrom": ["src/components/page"],
        // components/ui can import other components/ui
        "allowSameModule": true
      },

      /**
       * example:
       * Disallow to import `next/router` directly. it should always be imported using `libs/router.ts`.
       */
      {
        "module": "next/router",
        "allowReferenceFrom": ["src/libs/router.ts"],
        "allowSameModule": false
      },
    ],
    // options
    // {
    //   "resolveRelativeImport": true,
    //   "allowTypeImport": true
    // }
  ]
}

```


## License

MIT
