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

// eslint-disable-next-line no-console
console.log(nodes, context)
