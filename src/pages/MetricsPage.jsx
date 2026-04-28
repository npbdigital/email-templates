import MetricsTab from '../components/Metrics/MetricsTab'
import { useTemplates } from '../hooks/useTemplates'

export default function MetricsPage() {
  const { templates } = useTemplates(null)

  return (
    <>
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1e293b' }}>Métricas</h1>
        <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Aberturas, cliques e bounces dos seus templates</p>
      </div>
      <MetricsTab templates={templates} />
    </>
  )
}
