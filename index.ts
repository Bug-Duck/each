/* eslint-disable no-console */
import { render } from './each/renderer'
import './each/intrinisics/var'
import './each/intrinisics/value'
import './each/intrinisics/for'
import './each/intrinisics/if'
import './each/intrinisics/memo'
import { _parseTmpl, _transformTmpl, html } from './each/template'
import { effect, ref } from '@vue/reactivity'
import { each } from './each/utils'

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

<eich width="100%" height="100%">
  <var key="c" $value="'TEST STRING FUCK FUCKVFUCK'"/>
  <row>
    <for $in="Array(c.length).keys()" key="x">
      <if $condition="x % 2 === 0">
        <value $data="'Index Filtered: ' + x"/>
      </if>
    </for>
  </row>
</eich>

`

const app = document.querySelector<HTMLDivElement>('#app')!
const [nodes, context] = render(source, app)

console.log(nodes, context)

const rootEl = ref<HTMLButtonElement | null>()
effect(() => console.log(rootEl.value))

const count = ref(0)

const root = each`
<value $data="${3}"/> 
`

document.body.append(...root)
