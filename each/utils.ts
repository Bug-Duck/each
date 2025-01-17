import type { Context } from './renderer'
import { effect, type MaybeRefOrGetter, reactive, stop, toValue } from '@vue/reactivity'
import { toDisplayString } from '@vue/shared'
import { parse } from './parser'
import { getCurrentContext, hasContext, mergeContext, renderRoots } from './renderer'

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

export function each(literal: TemplateStringsArray, ...values: MaybeRefOrGetter<unknown>[]): Node[] {
  const uid = Math.round(performance.now() * 100)
  const src = literal.reduce((acc, v, i) => {
    return `${acc}${v}${i == literal.length - 1 ? '' : `($$_EachEnv_${uid}_${i}_)`}`
  }, '').trim()
  const ast = parse(src)
  if (ast.length != 1) {
    throw new TypeError(`Invalid template \n---\n${src}\n---\n`)
  }

  const o = reactive(values.reduce<Context>((acc, v, i) => {
    acc[`$$_EachEnv_${uid}_${i}_`] = v
    return acc
  }, {}))

  console.log(src)

  return renderRoots(ast, undefined, hasContext() ? mergeContext(o, getCurrentContext()) : o)[0]
}
