import { each, html, ref } from './each'
import './each/intrinisics/var'
import './each/intrinisics/value'
import './each/intrinisics/button'

function AppHybrid() {
  const count = ref(0)
  const handleClick = () => count.value += 1

  return each`
  <button @click="${handleClick}()">
    Click Me! Count: <value $data="${count}" />
  </button>
  `
}

function App() {
  return each`
  <var key="count" $value="0"></var>
    <button @click="count += 1">
  Click Me! Count: <value $data="count" />
  `
}

const root = html`
<div>
<p>Each App: ${App()}</p>
<p>Each + JS App: ${AppHybrid()}</p>
</div>
`

document.body.append(root)
