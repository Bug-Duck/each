import { effect, reactive, type Reactive } from '@vue/reactivity'

import {
  type DocumentNode,
  NodeTypes,
  parse as parseHTML,
  type TagNode,
  type TextNode,
} from 'es-html-parser'

export interface EachSourceNode {
  tag: string
  attrs: Record<string, any>
  children: EachSourceNode[]
}

export type EachContext = Record<string, any>

function toNode(root: TagNode | TextNode): EachSourceNode | string {
  if (root.type == NodeTypes.Text) {
    return root.value.trim()
  }

  const node: EachSourceNode = {
    tag: root.name,
    attrs: root.attributes.reduce((prev, v) => {
      prev[v.key.value] = v.value?.value ?? true
      return prev
    }, {} as Record<string, any>),
    children: [],
  }

  for (const child of root.children) {
    if (child.type == NodeTypes.Text || child.type == NodeTypes.Tag) {
      const ast = toNode(child)
      if (typeof ast == 'string' && ast.length == 0) {
        continue
      }
      node.children.push(ast)
    }
  }

  return node
}

function toRoots(doc: DocumentNode): EachSourceNode[] {
  const children: EachSourceNode[] = []
  for (const child of doc.children) {
    if (child.type == NodeTypes.Text || child.type == NodeTypes.Tag) {
      const ast = toNode(child)
      if (typeof ast != 'string') {
        children.push(ast)
      }
    }
  }

  return children
}

export function parse(input: string): EachSourceNode[] {
  return toRoots(parseHTML(input).ast)
}

export type RenderFn = () => Node
export type WidgetFactory<T extends Record<string, string>> =
  (attrs: T, children: (EachSourceNode | string)[], context: EachContext) => RenderFn
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

export function renderRoots(roots: EachSourceNode[], container?: Node, initialContext: EachContext = {}): [Node[], Reactive<EachContext>] {
  const ctx = reactive(initialContext)
  const nodes = roots.map(root => resolveNode(root, ctx)())
  container && nodes.forEach(child => container.appendChild(child))
  return [nodes, ctx]
}

export function render(source: string, container?: Node, initialContext: EachContext = {}): [Node[], Reactive<EachContext>] {
  return renderRoots(parse(source), container, initialContext)
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
