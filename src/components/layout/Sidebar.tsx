import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  ClipboardList,
  Package,
  ShoppingCart,
  History,
  FileText,
  BarChart3,
  Calendar,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Users,
  Car,
  Building2,
  MapPin,
  X,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { AlFalahLogo } from '@/components/shared/AlFalahLogo';
import { useIsMobile } from '@/hooks/use-mobile';

const menuItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Job Card', path: '/job-card', icon: ClipboardList },
  { name: 'Vehicle', path: '/vehicle', icon: Car },
  { name: 'Driver', path: '/driver', icon: Users },
  { name: 'Inventory', path: '/inventory', icon: Package },
  { name: 'Purchase Entry', path: '/purchase', icon: ShoppingCart },
  { name: 'Service History', path: '/service-history', icon: History },
  { name: 'Documents', path: '/documents', icon: FileText },
  { name: 'Site Visit', path: '/site-visit', icon: MapPin },
  { name: 'Branch Management', path: '/branch-management', icon: Building2 },
  { name: 'Reports', path: '/reports', icon: BarChart3 },
  { name: 'Scheduled Services', path: '/scheduled-services', icon: Calendar },
  { name: 'Pending Work', path: '/pending-work', icon: AlertTriangle },
];

interface SidebarProps {
  onMobileClose?: () => void;
}

export function Sidebar({ onMobileClose }: SidebarProps = {}) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const isMobile = useIsMobile();
  
  // Don't allow collapse on mobile - always show full sidebar
  const shouldCollapse = !isMobile && collapsed;
  
  // Reset collapsed state when switching to mobile
  useEffect(() => {
    if (isMobile && collapsed) {
      setCollapsed(false);
    }
  }, [isMobile, collapsed]);

  return (
    <aside
      className={cn(
        'h-screen bg-sidebar flex flex-col transition-all duration-300',
        // Mobile: full height in drawer
        // Desktop: sticky positioning
        'md:sticky md:top-0 md:z-50',
        // Desktop: responsive width, mobile always full
        shouldCollapse ? 'w-16' : 'w-full md:w-64'
      )}
    >
      {/* Logo Section */}
      <div className={cn(
        "flex items-center border-b border-sidebar-border transition-all duration-300",
        shouldCollapse ? "h-16 px-2 justify-center" : "h-20 px-3 md:px-4 justify-start"
      )}>
        <AlFalahLogo collapsed={shouldCollapse} />
        {/* Close button for mobile */}
        {isMobile && onMobileClose && (
          <button
            onClick={onMobileClose}
            className="ml-auto mr-2 p-2 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground transition-colors md:hidden"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'sidebar-link',
                isActive && 'sidebar-link-active'
              )}
              title={shouldCollapse ? item.name : undefined}
              onClick={() => {
                // Close mobile menu when navigating
                if (onMobileClose) {
                  onMobileClose();
                }
              }}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!shouldCollapse && <span className="truncate">{item.name}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Collapse Toggle - Hidden on mobile */}
      <div className="hidden md:block p-3 border-t border-sidebar-border">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent rounded-lg transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
