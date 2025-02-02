# ts-extensions-resolver

A TypeScript transformer that resolves relative extensions, absolute baseUrl extensions, and path aliases. Supports .ts and .tsx extensions.

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
import {...} from 'src/bar';

import('@/bar');

export * from '@/bar';
```

### Run build Command

```sh
npm run build
```

### Compiled JavaScript (`index.js`)

```js
import {...} from './foo/index.js';
import {...} from './bar.js';

import('./bar.js');

export * from './bar.js';
```
