import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Plus,
  FileText,
  ClipboardList,
  Package,
  ShoppingCart,
  MapPin,
  Building2,
  Truck,
  Users,
  Calendar,
} from 'lucide-react';

export function QuickActions() {
  const navigate = useNavigate();

  const actions = [
    { icon: ClipboardList, label: 'New Job Card', path: '/job-card', color: 'bg-primary/10 text-primary' },
    { icon: Package, label: 'Add Inventory', path: '/inventory', color: 'bg-success/10 text-success' },
    { icon: ShoppingCart, label: 'Purchase Entry', path: '/purchase', color: 'bg-warning/10 text-warning' },
    { icon: FileText, label: 'Add Document', path: '/documents', color: 'bg-info/10 text-info' },
    { icon: MapPin, label: 'Schedule Visit', path: '/site-visit', color: 'bg-purple-500/10 text-purple-500' },
    { icon: Building2, label: 'Add Branch', path: '/branch-management', color: 'bg-orange-500/10 text-orange-500' },
    { icon: Truck, label: 'View Vehicles', path: '/vehicle', color: 'bg-blue-500/10 text-blue-500' },
    { icon: Users, label: 'View Drivers', path: '/driver', color: 'bg-green-500/10 text-green-500' },
  ];

  return (
    <div className="bg-card rounded-xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="mb-4">
        <h3 className="font-semibold text-lg mb-1">Quick Actions</h3>
        <p className="text-sm text-muted-foreground">Fast access to common tasks</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <Button
              key={index}
              variant="outline"
              className="h-auto flex-col gap-2 py-4 hover:bg-muted/50 hover:border-primary/50 transition-all group"
              onClick={() => navigate(action.path)}
            >
              <div className={`p-2.5 rounded-lg ${action.color} group-hover:scale-110 transition-transform`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium">{action.label}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}

