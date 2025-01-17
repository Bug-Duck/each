# Each
🧩 Yet Another Simple [Eich](https://github.com/Bug-Duck/eich)

## Usage
See `index.ts`.

## Example
```ts
import { eich } from './each'

const app = eich`
  <var key="count" $value="0"></var>
  <button @click="count += 1">
    Count <value $data="count" />
  </button>
`
const root = document.querySelector<HTMLDivElement>('#app')!
root.append(...app)
```
