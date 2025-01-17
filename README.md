# Eich Refresh
🧩 Even better [Eich](https://github.com/Bug-Duck/eich)

## Usage
See `index.ts`.

## Example
```ts
import { eich, ref } from './eich'

const root = document.querySelector<HTMLDivElement>('#app')!

// Each
const app = eich`
  <var key="count" $value="0"></var>
  <button @click="count += 1">
    Count <value $data="count" />
  </button>
`
root.append(...app)

// Hybrid
function Count() {
  const count = ref(0)
  const handleClick = () => count.value += 1

  return eich`
  <button @click="${handleClick}()">
    Click Me! Count: <value $data="${count}" />
  </button>
  `
}

root.append(...Count())
```
