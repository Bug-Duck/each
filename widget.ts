import type { EachSourceNode } from './parse'
import { effect } from '@vue/reactivity'

export type RenderFn = () => Node
export type WidgetFactory<T extends Record<string, string>> =
  (attrs: T, children: (EachSourceNode | string)[], context: Record<string, any>) => RenderFn
export type WidgetRegistryMap = Map<string, WidgetFactory<any>>

export class WidgetRegistry {
  private constructor() {}
  private static _registry: WidgetRegistryMap = new Map()

  static register<T extends Record<string, string> = Record<string, string>>(name: string, factory: WidgetFactory<T>) {
    this._registry.set(name, factory)
  }

  static resolve<T extends Record<string, string> = Record<string, string>>(name: string): WidgetFactory<T> | undefined {
    return this._registry.get(name)
  }
}

export function noop(): void {}

export function resolveNode(input: EachSourceNode | string, context: Record<string, any> = {}): RenderFn {
  if (typeof input == 'string') {
    return () => document.createTextNode(input)
  }

  const factory = WidgetRegistry.resolve(input.tag)
  if (factory == null) {
    throw new TypeError(`invalid tag: ${input.tag}`)
  }

  return factory(input.attrs, input.children, context)
}

export function createContextFn(src: string): (context: Record<string, any>) => any {
  // eslint-disable-next-line no-new-func
  return new Function(`return (function(context){with(context){return (${src});}});`)() as any
}

WidgetRegistry.register<{
  width?: string
  height?: string
}>('eich', ({ width, height }, children, context) => {
  return () => {
    const div = document.createElement('div')
    width != null && div.setAttribute('width', width)
    height != null && div.setAttribute('height', height)
    children.forEach(f => div.append(resolveNode(f, context)()))
    return div
  }
})

WidgetRegistry.register('row', (_, children, context) => {
  return () => {
    const div = document.createElement('div')
    children.forEach(f => div.append(resolveNode(f, context)()))
    return div
  }
})

WidgetRegistry.register('col', (_, children, context) => {
  return () => {
    const div = document.createElement('div')
    children.forEach(f => div.append(resolveNode(f, context)()))
    return div
  }
})

WidgetRegistry.register('if', ({ $condition }, children, context) => {
  const cond = createContextFn($condition)
  return () => {
    const div = document.createElement('span')

    effect(() => {
      div.replaceChildren()
      if (cond(context)) {
        children.forEach(f => div.append(resolveNode(f, context)()))
      }
    })

    return div
  }
})

WidgetRegistry.register('for', ({ $in, key }, children, context) => {
  const iter = createContextFn($in)
  return () => {
    const div = document.createElement('span')

    effect(() => {
      div.replaceChildren()
      for (const item of iter(context)) {
        children.forEach(f => div.append(resolveNode(f, Object.assign({ [key]: item }, context))()))
      }
    })

    return div
  }
})

WidgetRegistry.register('value', ({ $data }, _, context) => {
  const data = createContextFn($data)
  return () => {
    const text = document.createTextNode('')
    effect(() => text.textContent = data(context))
    return text
  }
})

WidgetRegistry.register('var', ({ key, $value }, _, context) => {
  const initial = createContextFn($value)(context)
  context[key] = initial

  return () => document.createComment(`each/variable ${key} defined`)
})
