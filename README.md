# soyo

Publish package in the `dist` directory for clean outputs

### Install

```bash
  pnpm i -D soyo
```

### Usage

We will use `dist` as the root directory for publish.

#### `soyo copy`

Copy `dist` files to `dist/dist` to prepare the publish directory:

```bash
# before

 - dist
   - output.js
 - package.json
 - README.md
```

```bash
# after

 - dist
   # publish root directory
   - dist
     - output.js
   - package.json
   - README.md
 - package.json
 - README.md
```

Then manually run publish script:

```bash
  cd ./dist && npm publish --registry https://registry.npmjs.com/
```

Note:

1. The fields in `package.json` are minimized, use `package.json#soyo.fields` to add extra copies of fields.

2. If `package.json#files` is set, these files will be copied; otherwise, no files from the root directory will be copied.

Example:

```ts
// package.json

  // will copy the following files to `dist/*`:
  "files": [
    "compiled",
    "index.js",
    "react.js"
  ],

  // additional reserved fields:
  "soyo": {
    "fields": ["custom_field"]
  },
  "custom_field": "..."
```

#### `soyo build`

Run build script and copy files to `dist` to prepare the publish directory.

This will:

```bash
  rm -rf ./dist
  pnpm build
  pnpm soyo copy
```

then you can manually publish.

recommended set this to publish scripts:

```ts
// package.json

  "scripts": {
    "push": "soyo build && cd ./dist && npm publish --registry https://registry.npmjs.com/"
  }
```

### License

MIT
