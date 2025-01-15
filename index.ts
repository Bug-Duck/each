import { render } from './each/renderer'
import './each/intrinisics/var'
import './each/intrinisics/value'
import './each/intrinisics/for'
import './each/intrinisics/if'
import './each/intrinisics/memo'

const source = `
<eich width="100%" height="100%">
  <var key="c" $value="'TEST STRING'"/>
  <memo key="cc" $value="c + ' MEMO'"/>
  <row>  
    <if $condition="c.startsWith('TEST')">
      <value $data="'Output starts with TEST: ' + c + ' '"/>
    </if>
    <elif $condition="c.startsWith('OK')">
      <value $data="'Output starts with OK: ' + c + ' '"/>
    </elif>
    <else>
      <value $data="'Output: ' + c + ' '"/>
    </else>
  </row>
</eich>
`

const app = document.querySelector<HTMLDivElement>('#app')!
const [nodes, context] = render(source, app)

// eslint-disable-next-line no-console
console.log(nodes, context)
