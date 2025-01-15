import { effect, type MaybeRefOrGetter, stop, toValue } from '@vue/reactivity'
import { toDisplayString } from '@vue/shared'

export function interpolate(
  literal: TemplateStringsArray,
  ...values: MaybeRefOrGetter<unknown>[]
): Node {
  const tmpl = document.createElement('div')
  tmpl.innerHTML = literal.reduce((acc, v, i) => `${acc}${v}<!$interpolate$${i}>`, '')
  return _interpolate(tmpl.firstChild!, values)
}

export function template<const T extends string | number>(
  literal: TemplateStringsArray,
  ...values: T[]
): (data: Record<T, MaybeRefOrGetter<unknown>>) => Node {
  const tmpl = document.createElement('div')
  tmpl.innerHTML = literal.reduce((acc, v, i) => `${acc}${v}<!$interpolate$${values[i]}>`, '')
  return data => _interpolate(tmpl.firstChild!.cloneNode(), data)
}

function _interpolate(node: Node, values: Record<PropertyKey, MaybeRefOrGetter<unknown>> | MaybeRefOrGetter<unknown>[]): Node {
  node.childNodes.forEach((child) => {
    if (child.nodeType == 8 && child.nodeValue!.startsWith('$interpolate$')) {
      const index = Array.isArray(values) ? Number.parseInt(child.nodeValue!.slice(13)) : child.nodeValue!.slice(13)
      const text = document.createTextNode('')
      effect(() => {
        text.textContent = toDisplayString(toValue((values as any)[index]))
      })
      child.replaceWith(text)
      return
    }

    child.nodeType != 3 && _interpolate(child, values)
  })
  return node
}

export function style(source: TemplateStringsArray, ...values: MaybeRefOrGetter<unknown>[]): () => void {
  const style = document.createElement('style')
  const e = effect(() => {
    style.textContent = source.reduce((acc, v, i) => `${acc}${v}${toDisplayString(toValue(values[i]))}`, '')
  })

  document.head.appendChild(style)

  return () => {
    stop(e)
    style.remove()
  }
}
