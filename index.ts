import { reactive } from '@vue/reactivity'
import { parse } from './parse'
import { resolveNode } from './widget'

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

const ast = parse(source)
const context = reactive({})
const node = ast.map(root => resolveNode(root, context)())

node.forEach(child => document.body.append(child))

// eslint-disable-next-line no-console
console.log(ast, node, context)
