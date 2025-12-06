import { useState, useEffect } from 'react';
import { useFleet } from '@/context/FleetContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  X, 
  AlertTriangle, 
  Calendar, 
  FileText, 
  Package, 
  Truck,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface Notification {
  id: string;
  type: 'service_due' | 'document_expiring' | 'low_stock' | 'pending_work' | 'system';
  title: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
  read: boolean;
  timestamp: string;
  actionUrl?: string;
  actionLabel?: string;
}

export function NotificationsPanel({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { vehicles, documents, inventory, pendingWork, scheduledServices } = useFleet();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const newNotifications: Notification[] = [];

    // Service due notifications
    scheduledServices
      .filter(s => s.status === 'Due')
      .forEach(service => {
        const vehicle = vehicles.find(v => v.id === service.vehicleId);
        newNotifications.push({
          id: `notif-service-${service.id}`,
          type: 'service_due',
          title: 'Service Due',
          message: `${vehicle?.vehicleNumber || 'Vehicle'} - ${service.serviceType} is due`,
          priority: 'high',
          read: false,
          timestamp: new Date().toISOString(),
          actionUrl: '/scheduled-services',
          actionLabel: 'View Services',
        });
      });

    // Document expiring notifications
    documents
      .filter(d => d.status === 'Expiring Soon' || d.status === 'Expired')
      .forEach(doc => {
        const vehicle = vehicles.find(v => v.id === doc.vehicleId);
        const expiryDate = new Date(doc.expiryDate);
        const daysUntilExpiry = differenceInDays(expiryDate, new Date());
        newNotifications.push({
          id: `notif-doc-${doc.id}`,
          type: 'document_expiring',
          title: doc.status === 'Expired' ? 'Document Expired' : 'Document Expiring Soon',
          message: `${doc.documentType} for ${vehicle?.vehicleNumber || 'Vehicle'} ${doc.status === 'Expired' ? 'has expired' : `expires in ${daysUntilExpiry} days`}`,
          priority: doc.status === 'Expired' ? 'high' : 'medium',
          read: false,
          timestamp: new Date().toISOString(),
          actionUrl: '/documents',
          actionLabel: 'View Documents',
        });
      });

    // Low stock notifications
    inventory
      .filter(i => i.stockAvailable < 10 && i.stockAvailable > 0)
      .slice(0, 5)
      .forEach(item => {
        newNotifications.push({
          id: `notif-stock-${item.id}`,
          type: 'low_stock',
          title: 'Low Stock Alert',
          message: `${item.name} - Only ${item.stockAvailable} units remaining`,
          priority: item.stockAvailable < 5 ? 'high' : 'medium',
          read: false,
          timestamp: new Date().toISOString(),
          actionUrl: '/inventory',
          actionLabel: 'View Inventory',
        });
      });

    // High priority pending work
    pendingWork
      .filter(p => p.priority === 'High' && p.status === 'Pending')
      .slice(0, 3)
      .forEach(work => {
        newNotifications.push({
          id: `notif-work-${work.id}`,
          type: 'pending_work',
          title: 'High Priority Pending Work',
          message: `${work.vehicleNumber} - ${work.description.substring(0, 50)}...`,
          priority: 'high',
          read: false,
          timestamp: new Date().toISOString(),
          actionUrl: '/pending-work',
          actionLabel: 'View Pending Work',
        });
      });

    // Sort by priority and timestamp
    newNotifications.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    setNotifications(newNotifications);
  }, [vehicles, documents, inventory, pendingWork, scheduledServices]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'service_due':
        return <Calendar className="w-5 h-5" />;
      case 'document_expiring':
        return <FileText className="w-5 h-5" />;
      case 'low_stock':
        return <Package className="w-5 h-5" />;
      case 'pending_work':
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getPriorityColor = (priority: Notification['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-destructive/10 text-destructive';
      case 'medium':
        return 'bg-warning/10 text-warning';
      default:
        return 'bg-info/10 text-info';
    }
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleNotificationClick = (notification: Notification) => {
    handleMarkAsRead(notification.id);
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCount}
                </Badge>
              )}
            </DialogTitle>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead}>
                Mark all as read
              </Button>
            )}
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto space-y-2 mt-4">
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No notifications</p>
            </div>
          ) : (
            notifications.map(notification => (
              <div
                key={notification.id}
                className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                  notification.read 
                    ? 'bg-muted/50 border-border' 
                    : 'bg-card border-primary/20 hover:border-primary/40'
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${getPriorityColor(notification.priority)}`}>
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm">{notification.title}</p>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-primary rounded-full" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(notification.timestamp), 'MMM dd, HH:mm')}
                          </span>
                          {notification.actionUrl && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleNotificationClick(notification);
                              }}
                            >
                              {notification.actionLabel}
                            </Button>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(notification.id);
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

