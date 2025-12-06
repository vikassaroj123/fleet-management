import { cn } from '@/lib/utils';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'default';

interface StatusBadgeProps {
  status: string;
  variant?: BadgeVariant;
}

const variantMap: Record<string, BadgeVariant> = {
  // Job Card statuses
  'Completed': 'success',
  'In Progress': 'info',
  'Open': 'warning',
  
  // Vehicle statuses
  'Active': 'success',
  'In Service': 'info',
  'Idle': 'warning',
  
  // Document statuses
  'Valid': 'success',
  'Expiring Soon': 'warning',
  'Expired': 'danger',
  
  // Pending Work statuses
  'Pending': 'warning',
  
  // Scheduled Service statuses
  'Due': 'danger',
  'Upcoming': 'info',
  
  // Priority
  'High': 'danger',
  'Medium': 'warning',
  'Low': 'info',
};

export function StatusBadge({ status, variant }: StatusBadgeProps) {
  const resolvedVariant = variant || variantMap[status] || 'default';

  return (
    <span
      className={cn(
        'status-badge',
        resolvedVariant === 'success' && 'status-badge-success',
        resolvedVariant === 'warning' && 'status-badge-warning',
        resolvedVariant === 'danger' && 'status-badge-danger',
        resolvedVariant === 'info' && 'status-badge-info',
        resolvedVariant === 'default' && 'bg-muted text-muted-foreground'
      )}
    >
      {status}
    </span>
  );
}
