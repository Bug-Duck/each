import { effect, effectScope, type EffectScope, type Reactive, reactive, toRefs } from '@vue/reactivity'
import { Idiomorph } from './idiomorph'
import { type EachBasicNode, type EachIfNode, type EachSourceNode, isEachIfNode, isEachTextNode, parse } from './parser'

export type Attributes = Record<string, any>
export type Context = Reactive<Record<string, any>>
export type Component<T extends Attributes = Attributes> =
  (props: T, children: () => Node[], node: EachSourceNode) => Node | Node[] | void

export const intrinsics = new Map<string, Component<any>>()
let activeContext: Context | null = null

export function patch(target: Node, source: Node): void {
  Idiomorph.morph(target, source)
}

export function getCurrentContext(): Context {
  if (activeContext == null) {
    throw new Error('no active context')
  }

  return activeContext
}

export function mergeContext(target: Context, from: Context): Context {
  return Object.assign(toRefs(target), toRefs(from))
}

export function runInContext<T extends Context, R>(
  initial: Reactive<T>,
  fn: () => R,
  parent: Context | null = getCurrentContext(),
): R {
  const newContext = reactive(
    parent ? mergeContext(initial, parent) : initial,
  )

  const oldContext = activeContext
  activeContext = newContext
  try {
    return fn()
  }
  finally {
    activeContext = oldContext
  }
}

export function createAdhoc<T = unknown>(src: string): (context: Context) => T {
  // eslint-disable-next-line no-new-func
  return new Function(`return (function(context){with(context){return (${src});}});`)() as any
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

  if (isEachIfNode(node)) {
    return renderIfNode(node)
  }

  if (intrinsics.has(node.tag)) {
    return renderComp(intrinsics.get(node.tag)!, node)
  }

  return renderComp(noopComp, node)
}

export function renderIfNode(node: EachIfNode): Node {
  const container = document.createElement('span')
  const context = getCurrentContext()

  if (!node.attrs.$condition) {
    throw new Error('missing $condition attribute')
  }
  const cond = createAdhoc(node.attrs.$condition)
  let scope: EffectScope

  const elifCond = node.elif && node.elif.map(({ attrs }) => {
    if (!attrs.$condition) {
      throw new Error('missing $condition attribute')
    }

    return createAdhoc(attrs.$condition)
  })

  effect(() => {
    scope?.stop()
    scope = effectScope()
    runInContext(context, () => {
      const root = document.createElement('span')
      if (cond(context)) {
        scope.run(() => root.append(...node.children.flatMap(renderNode)))
        patch(container, root)
        return
      }

      if (node.elif && node.elif.length != 0) {
        for (let i = 0; i < node.elif.length; i += 1) {
          if (elifCond![i](context)) {
            scope.run(() => root.append(...node.elif![i].children.flatMap(renderNode)))
            patch(container, root)
            return
          }
        }
      }

      if (node.else) {
        scope.run(() => root.append(...node.else!.children.flatMap(renderNode)))
        patch(container, root)
      }
    }, null)
  })

  return container
}

export function renderRoots(roots: EachSourceNode[], target: Node, initialContext: Reactive<Context> = {}): [Node[], Reactive<Context>] {
  const context = reactive(initialContext)
  const children = runInContext(context, () => roots.flatMap(renderNode), null)
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
