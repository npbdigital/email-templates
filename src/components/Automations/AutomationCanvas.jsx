import { useCallback, useMemo, useRef, useState, useEffect } from 'react'
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  Background,
  Controls,
  useReactFlow
} from 'reactflow'
import 'reactflow/dist/style.css'
import { makeCustomNode } from './CustomNode'
import NodePalette from './NodePalette'
import NodeForm from './NodeForm'
import { defaultDataFor } from './nodeTypes'

function newId() {
  return 'n_' + Math.random().toString(36).slice(2, 10)
}

function CanvasInner({ flowData, templates, automation, onChange }) {
  const wrapperRef = useRef(null)
  const { screenToFlowPosition } = useReactFlow()

  const [nodes, setNodes] = useState(flowData?.nodes || [])
  const [edges, setEdges] = useState(flowData?.edges || [])
  const [selectedId, setSelectedId] = useState(null)

  useEffect(() => {
    setNodes(flowData?.nodes || [])
    setEdges(flowData?.edges || [])
  }, [flowData])

  useEffect(() => {
    onChange?.({ nodes, edges })
  }, [nodes, edges, onChange])

  const customNode = useMemo(() => makeCustomNode(templates), [templates])
  const nodeTypes = useMemo(() => ({
    trigger: customNode,
    send_email: customNode,
    end: customNode
  }), [customNode])

  const onNodesChange = useCallback((changes) => {
    setNodes(nds => {
      const protectedIds = new Set(nds.filter(n => n.type === 'trigger').map(n => n.id))
      const filtered = changes.filter(c => !(c.type === 'remove' && protectedIds.has(c.id)))
      return applyNodeChanges(filtered, nds)
    })
  }, [])

  const onEdgesChange = useCallback((changes) => {
    setEdges(eds => applyEdgeChanges(changes, eds))
  }, [])

  const onConnect = useCallback((connection) => {
    setEdges(eds => addEdge({ ...connection, id: 'e_' + Math.random().toString(36).slice(2, 10) }, eds))
  }, [])

  const onDragOver = useCallback((event) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback((event) => {
    event.preventDefault()
    const type = event.dataTransfer.getData('application/automation-node-type')
    if (!type) return
    const position = screenToFlowPosition({ x: event.clientX, y: event.clientY })
    const id = newId()
    setNodes(nds => nds.concat({
      id,
      type,
      position,
      data: defaultDataFor(type, { trigger_event: automation?.trigger_event })
    }))
  }, [screenToFlowPosition, automation])

  const updateNodeData = useCallback((id, data) => {
    setNodes(nds => nds.map(n => n.id === id ? { ...n, data } : n))
  }, [])

  const deleteNode = useCallback((id) => {
    setNodes(nds => {
      const node = nds.find(n => n.id === id)
      if (node?.type === 'trigger') return nds
      return nds.filter(n => n.id !== id)
    })
    setEdges(eds => eds.filter(e => e.source !== id && e.target !== id))
    setSelectedId(prev => prev === id ? null : prev)
  }, [])

  const selectedNode = nodes.find(n => n.id === selectedId) || null
  const existingTypes = nodes.map(n => n.type)

  return (
    <div style={{ display: 'flex', height: 540, gap: 12 }}>
      <div
        ref={wrapperRef}
        onDragOver={onDragOver}
        onDrop={onDrop}
        style={{
          flex: 1,
          minWidth: 0,
          background: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: 12,
          overflow: 'hidden'
        }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          onNodeClick={(_, n) => setSelectedId(n.id)}
          onPaneClick={() => setSelectedId(null)}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          deleteKeyCode={['Backspace', 'Delete']}
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={16} size={1} color="#e2e8f0" />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>

      <div style={{
        width: 280,
        flexShrink: 0,
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: 12,
        padding: 16,
        overflowY: 'auto'
      }}>
        {selectedNode ? (
          <NodeForm
            node={selectedNode}
            templates={templates}
            onChange={updateNodeData}
            onDelete={deleteNode}
          />
        ) : (
          <NodePalette existingNodeTypes={existingTypes} />
        )}
      </div>
    </div>
  )
}

export default function AutomationCanvas(props) {
  return (
    <ReactFlowProvider>
      <CanvasInner {...props} />
    </ReactFlowProvider>
  )
}
