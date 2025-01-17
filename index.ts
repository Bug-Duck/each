import { each } from './each'
import './each/intrinisics/var'
import './each/intrinisics/value'
import './each/intrinisics/button'

const root = each`
<var key="count" $value="0"></var>
<button @click="count += 1">
  Click Me! Count: <value $data="count" />
</button>
`

document.body.append(...root)
