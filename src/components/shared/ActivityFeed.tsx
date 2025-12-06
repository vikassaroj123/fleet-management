import { useFleet } from '@/context/FleetContext';
import { format } from 'date-fns';
import { 
  ClipboardList, 
  Wrench, 
  FileText, 
  Package, 
  UserCheck, 
  Truck,
  Plus,
  Edit,
} from 'lucide-react';
import { useMemo } from 'react';

interface Activity {
  id: string;
  type: 'job_card' | 'service' | 'document' | 'inventory' | 'driver_change' | 'vehicle' | 'purchase';
  action: string;
  description: string;
  timestamp: string;
  user?: string;
  icon: React.ReactNode;
}

export function ActivityFeed({ limit = 10 }: { limit?: number }) {
  const { jobCards, serviceHistory, documents, inventory, vehicles } = useFleet();

  const activities = useMemo(() => {
    const allActivities: Activity[] = [];

    // Job card activities
    jobCards.slice(0, 5).forEach(jc => {
      allActivities.push({
        id: `activity-jc-${jc.id}`,
        type: 'job_card',
        action: 'Job Card Created',
        description: `Job card ${jc.id} created for ${jc.vehicleNumber}`,
        timestamp: jc.createdAt,
        user: 'System',
        icon: <ClipboardList className="w-4 h-4" />,
      });
    });

    // Service history activities
    serviceHistory.slice(0, 5).forEach(sh => {
      const vehicle = vehicles.find(v => v.id === sh.vehicleId);
      allActivities.push({
        id: `activity-sh-${sh.id}`,
        type: 'service',
        action: 'Service Completed',
        description: `${sh.serviceType} completed for ${vehicle?.vehicleNumber || 'Vehicle'}`,
        timestamp: sh.serviceDate,
        user: 'Mechanic',
        icon: <Wrench className="w-4 h-4" />,
      });
    });

    // Document activities
    documents.slice(0, 3).forEach(doc => {
      const vehicle = vehicles.find(v => v.id === doc.vehicleId);
      allActivities.push({
        id: `activity-doc-${doc.id}`,
        type: 'document',
        action: 'Document Added',
        description: `${doc.documentType} added for ${vehicle?.vehicleNumber || 'Vehicle'}`,
        timestamp: doc.issueDate,
        user: 'Admin',
        icon: <FileText className="w-4 h-4" />,
      });
    });

    // Inventory activities
    inventory
      .filter(i => i.purchaseHistory.length > 0)
      .slice(0, 3)
      .forEach(item => {
        const latestPurchase = item.purchaseHistory[item.purchaseHistory.length - 1];
        allActivities.push({
          id: `activity-inv-${item.id}-${latestPurchase.id}`,
          type: 'inventory',
          action: 'Purchase Entry',
          description: `${item.name} - ${latestPurchase.quantity} units purchased`,
          timestamp: latestPurchase.purchaseDate,
          user: 'Purchasing',
          icon: <Package className="w-4 h-4" />,
        });
      });

    // Sort by timestamp (newest first)
    return allActivities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }, [jobCards, serviceHistory, documents, inventory, vehicles, limit]);

  const getActivityColor = (type: Activity['type']) => {
    switch (type) {
      case 'job_card':
        return 'bg-primary/10 text-primary';
      case 'service':
        return 'bg-success/10 text-success';
      case 'document':
        return 'bg-info/10 text-info';
      case 'inventory':
        return 'bg-warning/10 text-warning';
      case 'driver_change':
        return 'bg-purple-500/10 text-purple-500';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-3">
      {activities.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No recent activity</p>
        </div>
      ) : (
        activities.map(activity => (
          <div
            key={activity.id}
            className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
          >
            <div className={`p-2 rounded-lg ${getActivityColor(activity.type)}`}>
              {activity.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="font-medium text-sm">{activity.action}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {activity.description}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(activity.timestamp), 'MMM dd, yyyy HH:mm')}
                    </span>
                    {activity.user && (
                      <>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">{activity.user}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

