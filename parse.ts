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
  children: (EachSourceNode | string)[]
}

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
