# Each
🧩 Yet Another Simple [Eich](https://github.com/Bug-Duck/eich)

## Usage
See `index.ts`.

## Example
```ts
import { render } from './each'

const source = `
<eich width="100%" height="100%">
  <var key="c" $value="'TEST STRING'"/>
  <row>  
    <if $condition="c.startsWith('TEST')">
      <value $data="'Output: ' + c + ' '"/>
    </if>
  </row>
</eich>
`

const app = document.querySelector<HTMLDivElement>('#app')!
const [nodes, context] = render(source, app)

```
