import { each, ref } from './each'
import './each/intrinisics/var'
import './each/intrinisics/value'
import './each/intrinisics/button'

const count = ref(0)
const handleClick = () => count.value += 1

const root = each`
<button @click="${handleClick}()">
  Click Me! Count: <value $data="${count}" />
</button>
`

document.body.append(...root)
