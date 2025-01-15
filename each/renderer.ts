import { isReactive, type Reactive, reactive, readonly, toRefs } from '@vue/reactivity'
import patch from 'morphdom'
import { type EachBasicNode, type EachSourceNode, isEachTextNode, parse } from './parser'

export type Attributes = Record<string, any>
export type Context = Reactive<Record<string, any>>
export type Component<T extends Attributes = Attributes> =
  (props: T, children: () => Node[], node: EachSourceNode) => Node | Node[] | void

export const intrinsics = new Map<string, Component<any>>()
let activeContext: Context | null = null

export { patch }

export function getCurrentContext(): Context {
  if (activeContext == null) {
    throw new Error('no active context')
  }

  return activeContext
}

export function setCurrentContext(context: Context): void {
  activeContext = context
}

export function mergeContext(target: Context, from: Context): Context {
  return reactive(Object.assign(toRefs(target), toRefs(from)))
}

export function runInContext<T extends Context, R>(
  context: T,
  fn: () => R,
): R {
  const oldContext = activeContext
  activeContext = context
  try {
    return fn()
  }
  finally {
    activeContext = oldContext
  }
}

export function createAdhoc<T = unknown>(src: string): (context: Context) => T {
  // eslint-disable-next-line no-new-func
  return new Function(`return (function($__each_ctx){with($__each_ctx){return (${src});}});`)() as any
}

const noopComp = defineComponent(
  (_, children, node) => {
    if (import.meta.env.DEV) {
      console.warn(`ignoring <${node.tag}>, instead of using <noop> (internal)`)
    }
    return children()
  },
)

export function renderComp(comp: Component<any>, node: EachBasicNode): Node | Node[] {
  return comp(node.attrs, () => node.children.flatMap(renderNode), node) ?? []
}

export function renderNode(node: EachSourceNode): Node | Node[] {
  if (isEachTextNode(node)) {
    return document.createTextNode(node.value)
  }

  if (intrinsics.has(node.tag)) {
    return renderComp(intrinsics.get(node.tag)!, node)
  }

  return renderComp(noopComp, node)
}

export function renderRoots(roots: EachSourceNode[], target: Node, initialContext: Reactive<Context> = {}): [Node[], Reactive<Context>] {
  const context = reactive(initialContext)
  const children = runInContext(context, () => roots.flatMap(renderNode))
  target && children.forEach(child => target.appendChild(child))
  return [children, context]
}

export function render(source: string, target: Node, initialContext: Reactive<Context> = {}): [Node[], Reactive<Context>] {
  const ast = parse(source)
  return renderRoots(ast, target, initialContext)
}

export function defineComponent<T extends Attributes = Attributes>(comp: Component<T>): Component<T> {
  return comp
}
