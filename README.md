# ts-extensions-resolver

A TypeScript transformer that resolves relative extensions, absolute baseUrl extensions, and path aliases. Supports .ts and .tsx extensions.

## Syntax support

| Description                | example input               | example output for file      | example output for module          |
| -------------------------- | --------------------------- | ---------------------------- | ---------------------------------- |
| relative import            | `import "./utils"`          | `import "./utils.js"`        | `import "./utils/index.js"`        |
| relative export            | `export * from "./utils"`   | `export * from "./utils.js"` | `export * from "./utils/index.js"` |
| relative dynamic import    | `import("./utils")`         | `import("./utils.js")`       | `import("./utils/index.js")`       |
| baseUrl import             | `import "src/utils"`        | `import "./utils.js"`        | `import "./utils/index.js"`        |
| baseUrl export             | `export * from "src/utils"` | `export * from "./utils.js"` | `export * from "./utils/index.js"` |
| baseUrl dynamic import     | `import("src/utils")`       | `import("./utils.js")`       | `import("./utils/index.js")`       |
| paths alias import         | `import "@/utils"`          | `import "./utils.js"`        | `import "./utils/index.js"`        |
| paths alias export         | `export * from "@/utils"`   | `export * from "./utils.js"` | `export * from "./utils/index.js"` |
| paths alias dynamic import | `import("@/utils")`         | `import("./utils.js")`       | `import("./utils/index.js")`       |


## Usage

### Install Dev Dependencies

```sh
npm install -D ts-extensions-resolver ts-node ts-patch typescript@5
```

### Add Plugin to `tsconfig.json`

Add the following configuration to your `tsconfig.json`:

```json
{
  "compilerOptions": {
    // ...existing code...
    "plugins": [
      {
        "transform": "ts-extensions-resolver",
        "type": "raw"
      }
    ]
  }
}
```

### Patch `tsc`

```sh
npx ts-patch install
```

## How Does It Work?

### Example Project Structure

```
src
├── index.ts
├── foo
│   └── index.ts
└── bar.ts
```

### Example of `package.json` Build Script

```json
{
  // ...existing code...
  "scripts": {
    "build": "tsc"
  }
}
```

### Example of `tsconfig.json` with Paths Aliases and baseUrl

```json
{
  "compilerOptions": {
    // ...existing code...
    "baseUrl": "./",
    "paths": {
      "@/*": ["./src/*"]
    },
    "plugins": [
      {
        "transform": "ts-extensions-resolver",
        "type": "raw"
      }
    ]
  }
}
```

### TypeScript Source (`index.ts`)

```ts
import {...} from './foo';
import {...} from './bar';

import('src/bar');
import('src/foo');

export * from '@/bar';
export * from '@/foo';
```

### Run build Command

```sh
npm run build
```

### Compiled JavaScript (`index.js`)

```js
import {...} from './foo/index.js';
import {...} from './bar.js';

import('./foo/index.js');
import('./bar.js');

export * from './foo/index.js';
export * from './bar.js';
```
