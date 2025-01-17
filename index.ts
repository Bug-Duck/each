import { eich, html, ref } from './eich'
import './eich/intrinisics/var'
import './eich/intrinisics/value'
import './eich/intrinisics/button'

function AppHybrid() {
  const count = ref(0)
  const handleClick = () => count.value += 1

  return eich`
  <button @click="${handleClick}()">
    Click Me! Count: <value $data="${count}" />
  </button>
  `
}

function App() {
  return eich`
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
