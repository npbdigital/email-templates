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
import { Plus, X } from 'lucide-react'
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
  const [showPalette, setShowPalette] = useState(false)

  useEffect(() => {
    setNodes(flowData?.nodes || [])
    setEdges(flowData?.edges || [])
  }, [flowData])

  useEffect(() => {
    onChange?.({ nodes, edges })
  }, [nodes, edges, onChange])

  // customNode só depende de templates — não recriar em cada change de nodes
  const customNode = useMemo(() => makeCustomNode(templates), [templates])
  const nodeTypes = useMemo(() => ({
    trigger: customNode,
    send_email: customNode,
    wait_duration: customNode,
    wait_until_time: customNode,
    condition_opened: customNode,
    condition_clicked: customNode,
    condition_time: customNode,
    webhook_out: customNode,
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
    setShowPalette(false)
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

  const handleNodeClick = useCallback((_event, node) => {
    setSelectedId(node.id)
    setShowPalette(false)
  }, [])

  const handlePaneClick = useCallback(() => {
    setSelectedId(null)
  }, [])

  const selectedNode = nodes.find(n => n.id === selectedId) || null
  const existingTypes = nodes.map(n => n.type)

  return (
    <div style={{ display: 'flex', height: 600, gap: 12 }}>
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
          onNodeClick={handleNodeClick}
          onPaneClick={handlePaneClick}
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
        width: 300,
        flexShrink: 0,
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: 12,
        padding: 16,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <button
          onClick={() => { setShowPalette(s => !s); if (!showPalette) setSelectedId(null) }}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            background: showPalette ? 'white' : '#0f766e',
            color: showPalette ? '#475569' : 'white',
            border: showPalette ? '1px solid #e2e8f0' : 'none',
            borderRadius: 8, padding: '9px 14px', fontSize: 13, fontWeight: 500,
            cursor: 'pointer', marginBottom: 14, width: '100%'
          }}
        >
          {showPalette ? (<><X size={14} /> Fechar lista</>) : (<><Plus size={14} /> Adicionar nó</>)}
        </button>

        <div style={{ flex: 1, minHeight: 0 }}>
          {showPalette ? (
            <NodePalette existingNodeTypes={existingTypes} />
          ) : selectedNode ? (
            <NodeForm
              node={selectedNode}
              templates={templates}
              allNodes={nodes}
              onChange={updateNodeData}
              onDelete={deleteNode}
            />
          ) : (
            <EmptyHint />
          )}
        </div>
      </div>
    </div>
  )
}

function EmptyHint() {
  return (
    <div style={{
      textAlign: 'center', color: '#94a3b8', fontSize: 13, padding: '40px 12px', lineHeight: 1.6
    }}>
      <p style={{ marginBottom: 8 }}>Clique em qualquer <strong>nó do canvas</strong> para configurá-lo.</p>
      <p>Use <strong style={{ color: '#0f766e' }}>+ Adicionar nó</strong> acima para arrastar novos passos.</p>
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
