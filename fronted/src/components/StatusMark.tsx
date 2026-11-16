import { Icon } from './Icon'
import type { StatusKind } from '../ixchel'

export function StatusMark({ kind, size = 'md' }: { kind: StatusKind; size?: 'sm' | 'md' | 'lg' }) {
  const labels: Record<StatusKind, string> = {
    normal: 'Normal',
    attention: 'Attention',
    critical: 'Critical',
    empty: 'No data yet',
    model: 'Early model notice',
    protocol: 'Active support',
  }
  return (
    <span className={`status-mark ${kind} ${size}`} aria-label={labels[kind]}>
      {kind === 'normal' && <Icon name="check" />}
      {kind === 'attention' && <Icon name="alert" />}
      {kind === 'critical' && <strong>!</strong>}
      {kind === 'empty' && <span />}
      {kind === 'model' && <Icon name="spark" />}
      {kind === 'protocol' && <Icon name="heart" />}
    </span>
  )
}

export const levelKind = (nivel?: string | null): StatusKind => (nivel === 'ROJO' ? 'critical' : nivel === 'AMARILLO' ? 'attention' : 'normal')
