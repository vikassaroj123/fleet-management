import { useNavigate } from 'react-router-dom';
import { useFleet } from '@/context/FleetContext';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { DataTable } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { NotificationsPanel } from '@/components/shared/NotificationsPanel';
import { ActivityFeed } from '@/components/shared/ActivityFeed';
import { QuickActions } from '@/components/shared/QuickActions';
import { 
  Truck, 
  AlertTriangle, 
  Package, 
  FileText, 
  ClipboardList,
  Calendar,
  DollarSign,
  Wrench,
  Printer,
  Download,
  Bell,
  Activity,
  TrendingUp,
  BarChart3,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Target,
  Award,
  Clock,
  Users,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { exportToExcel, printPage } from '@/lib/exportUtils';
import { toast } from 'sonner';
import { useState, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const COLORS = ['hsl(221, 83%, 53%)', 'hsl(142, 76%, 36%)', 'hsl(38, 92%, 50%)', 'hsl(199, 89%, 48%)', 'hsl(0, 84%, 60%)'];

export default function Dashboard() {
  const navigate = useNavigate();
  const { 
    vehicles, 
    inventory, 
    pendingWork, 
    documents, 
    jobCards, 
    scheduledServices 
  } = useFleet();
  const [showNotifications, setShowNotifications] = useState(false);

  // Calculate stats
  const vehiclesDueForService = scheduledServices.filter(s => s.status === 'Due').length;
  const lowStockItems = inventory.filter(i => i.stockAvailable < 10).length;
  const pendingWorkCount = pendingWork.filter(p => p.status === 'Pending').length;
  const expiringDocs = documents.filter(d => d.status === 'Expiring Soon' || d.status === 'Expired').length;
  const todayJobCards = jobCards.filter(jc => jc.jobDate === format(new Date(), 'yyyy-MM-dd')).length;
  const monthlyServiceCost = jobCards
    .filter(jc => {
      const jobDate = new Date(jc.jobDate);
      const now = new Date();
      return jobDate.getMonth() === now.getMonth() && jobDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, jc) => sum + jc.totalCost, 0);

  // Advanced Analytics
  const serviceCostTrend = useMemo(() => {
    const last6Months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = format(date, 'yyyy-MM');
      const monthJobs = jobCards.filter(jc => jc.jobDate.startsWith(monthKey));
      last6Months.push({
        month: format(date, 'MMM yyyy'),
        cost: monthJobs.reduce((sum, jc) => sum + jc.totalCost, 0),
        count: monthJobs.length,
      });
    }
    return last6Months;
  }, [jobCards]);

  const vehicleStatusDistribution = useMemo(() => {
    const statusCounts = vehicles.reduce((acc, v) => {
      acc[v.status] = (acc[v.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status,
      value: count,
    }));
  }, [vehicles]);

  const topConsumingParts = useMemo(() => {
    const partUsage: Record<string, { name: string; total: number; count: number }> = {};
    jobCards.forEach(jc => {
      jc.partsUsed.forEach(part => {
        if (!partUsage[part.itemId]) {
          partUsage[part.itemId] = {
            name: part.itemName,
            total: 0,
            count: 0,
          };
        }
        partUsage[part.itemId].total += part.quantity;
        partUsage[part.itemId].count += 1;
      });
    });
    return Object.values(partUsage)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [jobCards]);

  // Notification count
  const notificationCount = useMemo(() => {
    return (
      scheduledServices.filter(s => s.status === 'Due').length +
      documents.filter(d => d.status === 'Expiring Soon' || d.status === 'Expired').length +
      inventory.filter(i => i.stockAvailable < 10 && i.stockAvailable > 0).length +
      pendingWork.filter(p => p.priority === 'High' && p.status === 'Pending').length
    );
  }, [scheduledServices, documents, inventory, pendingWork]);

  // Advanced Metrics
  const advancedMetrics = useMemo(() => {
    const totalVehicles = vehicles.length;
    const activeVehicles = vehicles.filter(v => v.status === 'Active').length;
    const totalInventoryValue = inventory.reduce((sum, i) => sum + (i.stockAvailable * i.averagePrice), 0);
    const totalJobCards = jobCards.length;
    const completedJobCards = jobCards.filter(jc => jc.status === 'Completed').length;
    const completionRate = totalJobCards > 0 ? Math.round((completedJobCards / totalJobCards) * 100) : 0;
    const avgJobCardCost = totalJobCards > 0 ? Math.round(jobCards.reduce((sum, jc) => sum + jc.totalCost, 0) / totalJobCards) : 0;
    const vehiclesWithDrivers = vehicles.filter(v => v.driverId).length;
    const driverAssignmentRate = totalVehicles > 0 ? Math.round((vehiclesWithDrivers / totalVehicles) * 100) : 0;
    
    // Calculate trends (comparing this month to last month)
    const now = new Date();
    const thisMonth = format(now, 'yyyy-MM');
    const lastMonth = format(new Date(now.getFullYear(), now.getMonth() - 1, 1), 'yyyy-MM');
    
    const thisMonthCost = jobCards
      .filter(jc => jc.jobDate.startsWith(thisMonth))
      .reduce((sum, jc) => sum + jc.totalCost, 0);
    const lastMonthCost = jobCards
      .filter(jc => jc.jobDate.startsWith(lastMonth))
      .reduce((sum, jc) => sum + jc.totalCost, 0);
    const costTrend = lastMonthCost > 0 ? Math.round(((thisMonthCost - lastMonthCost) / lastMonthCost) * 100) : 0;
    
    const thisMonthJobs = jobCards.filter(jc => jc.jobDate.startsWith(thisMonth)).length;
    const lastMonthJobs = jobCards.filter(jc => jc.jobDate.startsWith(lastMonth)).length;
    const jobsTrend = lastMonthJobs > 0 ? Math.round(((thisMonthJobs - lastMonthJobs) / lastMonthJobs) * 100) : 0;

    return {
      totalVehicles,
      activeVehicles,
      totalInventoryValue,
      completionRate,
      avgJobCardCost,
      driverAssignmentRate,
      costTrend,
      jobsTrend,
    };
  }, [vehicles, inventory, jobCards]);

  // Job Cards by Status
  const jobCardsByStatus = useMemo(() => {
    const statusCounts = jobCards.reduce((acc, jc) => {
      acc[jc.status] = (acc[jc.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
    }));
  }, [jobCards]);

  // Branch Performance
  const branchPerformance = useMemo(() => {
    const branchStats: Record<string, { vehicles: number; jobCards: number; cost: number }> = {};
    vehicles.forEach(v => {
      if (!branchStats[v.branch]) {
        branchStats[v.branch] = { vehicles: 0, jobCards: 0, cost: 0 };
      }
      branchStats[v.branch].vehicles++;
    });
    jobCards.forEach(jc => {
      const vehicle = vehicles.find(v => v.vehicleNumber === jc.vehicleNumber);
      if (vehicle && branchStats[vehicle.branch]) {
        branchStats[vehicle.branch].jobCards++;
        branchStats[vehicle.branch].cost += jc.totalCost;
      }
    });
    return Object.entries(branchStats)
      .map(([branch, stats]) => ({ branch, ...stats }))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 5);
  }, [vehicles, jobCards]);

  // Recent job cards
  const recentJobCards = [...jobCards]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // Due services
  const dueServicesList = scheduledServices
    .filter(s => s.status === 'Due')
    .slice(0, 5)
    .map(s => {
      const vehicle = vehicles.find(v => v.id === s.vehicleId);
      return { ...s, vehicleNumber: vehicle?.vehicleNumber || 'Unknown', id: s.id };
    });

  // Expiring documents
  const expiringDocsList = documents
    .filter(d => d.status === 'Expiring Soon' || d.status === 'Expired')
    .slice(0, 5)
    .map(d => {
      const vehicle = vehicles.find(v => v.id === d.vehicleId);
      return { ...d, vehicleNumber: vehicle?.vehicleNumber || 'N/A', id: d.id };
    });

  const handlePrint = () => {
    printPage();
  };

  const handleExport = () => {
    const exportData = [
      { Metric: 'Vehicles Due for Service', Value: vehiclesDueForService },
      { Metric: 'Low Stock Items', Value: lowStockItems },
      { Metric: 'Pending Work', Value: pendingWorkCount },
      { Metric: 'Expiring Documents', Value: expiringDocs },
      { Metric: "Today's Job Cards", Value: todayJobCards },
      { Metric: 'Active Vehicles', Value: vehicles.filter(v => v.status === 'Active').length },
      { Metric: 'Monthly Service Cost (SAR)', Value: monthlyServiceCost },
      { Metric: 'In Service', Value: vehicles.filter(v => v.status === 'In Service').length },
    ];
    exportToExcel(exportData, `dashboard_${format(new Date(), 'yyyy-MM-dd')}`);
    toast.success('Dashboard data exported successfully');
  };

  return (
    <div className="animate-fade-in">
      <PageHeader 
        title="Dashboard" 
        description="Fleet management overview and quick actions"
        action={
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowNotifications(true)}
              className="relative"
            >
              <Bell className="w-4 h-4 mr-2" />
              Notifications
              {notificationCount > 0 && (
                <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </Badge>
              )}
            </Button>
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        }
      />

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="stat-card bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 hover:shadow-lg transition-all">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground mb-1">Total Vehicles</p>
              <p className="text-3xl font-bold text-foreground mb-1">{advancedMetrics.totalVehicles}</p>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center gap-1 text-success">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-xs font-medium">{advancedMetrics.activeVehicles} Active</span>
                </div>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-primary/10">
              <Truck className="w-7 h-7 text-primary" />
            </div>
          </div>
        </div>

        <div className="stat-card bg-gradient-to-br from-success/5 to-success/10 border-success/20 hover:shadow-lg transition-all">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground mb-1">Monthly Service Cost</p>
              <p className="text-3xl font-bold text-foreground mb-1">SAR {monthlyServiceCost.toLocaleString()}</p>
              <div className="flex items-center gap-2 mt-2">
                {advancedMetrics.costTrend !== 0 && (
                  <div className={`flex items-center gap-1 ${advancedMetrics.costTrend > 0 ? 'text-destructive' : 'text-success'}`}>
                    {advancedMetrics.costTrend > 0 ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4" />
                    )}
                    <span className="text-xs font-medium">{Math.abs(advancedMetrics.costTrend)}% vs last month</span>
                  </div>
                )}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-success/10">
              <DollarSign className="w-7 h-7 text-success" />
            </div>
          </div>
        </div>

        <div className="stat-card bg-gradient-to-br from-warning/5 to-warning/10 border-warning/20 hover:shadow-lg transition-all">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground mb-1">Job Card Completion</p>
              <p className="text-3xl font-bold text-foreground mb-1">{advancedMetrics.completionRate}%</p>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <ClipboardList className="w-4 h-4" />
                  <span className="text-xs">{jobCards.filter(jc => jc.status === 'Completed').length} of {jobCards.length} completed</span>
                </div>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-warning/10">
              <Target className="w-7 h-7 text-warning" />
            </div>
          </div>
        </div>

        <div className="stat-card bg-gradient-to-br from-info/5 to-info/10 border-info/20 hover:shadow-lg transition-all">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground mb-1">Inventory Value</p>
              <p className="text-3xl font-bold text-foreground mb-1">SAR {Math.round(advancedMetrics.totalInventoryValue / 1000)}K</p>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Package className="w-4 h-4" />
                  <span className="text-xs">{inventory.length} items</span>
                </div>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-info/10">
              <Package className="w-7 h-7 text-info" />
            </div>
          </div>
        </div>
      </div>

      {/* Alert Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Vehicles Due for Service"
          value={vehiclesDueForService}
          icon={Truck}
          variant="warning"
          onClick={() => navigate('/scheduled-services')}
          trend={vehiclesDueForService > 0 ? { value: 0, isPositive: false } : undefined}
        />
        <StatCard
          title="Low Stock Items"
          value={lowStockItems}
          icon={Package}
          variant="danger"
          onClick={() => navigate('/inventory')}
        />
        <StatCard
          title="Pending Work"
          value={pendingWorkCount}
          icon={AlertTriangle}
          variant="warning"
          onClick={() => navigate('/pending-work')}
        />
        <StatCard
          title="Expiring Documents"
          value={expiringDocs}
          icon={FileText}
          variant="danger"
          onClick={() => navigate('/documents')}
        />
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="stat-card bg-gradient-to-br from-purple-500/5 to-purple-500/10 border-purple-500/20">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground mb-1">Today's Job Cards</p>
              <p className="text-3xl font-bold text-foreground">{todayJobCards}</p>
              <div className="flex items-center gap-2 mt-2">
                {advancedMetrics.jobsTrend !== 0 && (
                  <div className={`flex items-center gap-1 text-xs ${advancedMetrics.jobsTrend > 0 ? 'text-success' : 'text-muted-foreground'}`}>
                    {advancedMetrics.jobsTrend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    <span>{Math.abs(advancedMetrics.jobsTrend)}% vs last month</span>
                  </div>
                )}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-purple-500/10">
              <ClipboardList className="w-7 h-7 text-purple-500" />
            </div>
          </div>
        </div>

        <div className="stat-card bg-gradient-to-br from-blue-500/5 to-blue-500/10 border-blue-500/20">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground mb-1">Driver Assignment</p>
              <p className="text-3xl font-bold text-foreground">{advancedMetrics.driverAssignmentRate}%</p>
              <p className="text-xs text-muted-foreground mt-2">
                {vehicles.filter(v => v.driverId).length} of {vehicles.length} vehicles
              </p>
            </div>
            <div className="p-3 rounded-xl bg-blue-500/10">
              <Users className="w-7 h-7 text-blue-500" />
            </div>
          </div>
        </div>

        <div className="stat-card bg-gradient-to-br from-orange-500/5 to-orange-500/10 border-orange-500/20">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground mb-1">Avg Job Card Cost</p>
              <p className="text-3xl font-bold text-foreground">SAR {advancedMetrics.avgJobCardCost.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-2">
                Based on {jobCards.length} job cards
              </p>
            </div>
            <div className="p-3 rounded-xl bg-orange-500/10">
              <Award className="w-7 h-7 text-orange-500" />
            </div>
          </div>
        </div>

        <div className="stat-card bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground mb-1">Active Vehicles</p>
              <p className="text-3xl font-bold text-foreground">{advancedMetrics.activeVehicles}</p>
              <p className="text-xs text-muted-foreground mt-2">
                {Math.round((advancedMetrics.activeVehicles / advancedMetrics.totalVehicles) * 100)}% of total fleet
              </p>
            </div>
            <div className="p-3 rounded-xl bg-green-500/10">
              <Zap className="w-7 h-7 text-green-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Service Cost Trend */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-lg flex items-center gap-2 mb-1">
                <TrendingUp className="w-5 h-5 text-primary" />
                Service Cost Trend
              </h3>
              <p className="text-sm text-muted-foreground">Last 6 months performance</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/reports')}>
              View Details
            </Button>
          </div>
          {serviceCostTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={serviceCostTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis 
                  dataKey="month" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(value) => `SAR ${(value / 1000).toFixed(0)}K`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value: number) => [`SAR ${value.toLocaleString()}`, 'Cost']}
                />
                <Line 
                  type="monotone" 
                  dataKey="cost" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  dot={{ fill: 'hsl(var(--primary))', r: 5, strokeWidth: 2, stroke: 'hsl(var(--card))' }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-muted-foreground">
              No data available
            </div>
          )}
        </div>

        {/* Vehicle Status Distribution */}
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-lg flex items-center gap-2 mb-1">
                <BarChart3 className="w-5 h-5 text-primary" />
                Vehicle Status
              </h3>
              <p className="text-sm text-muted-foreground">Fleet distribution</p>
            </div>
          </div>
          {vehicleStatusDistribution.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={vehicleStatusDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                    outerRadius={70}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {vehicleStatusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {vehicleStatusDistribution.map((entry, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-muted-foreground">{entry.name}</span>
                    </div>
                    <span className="font-medium">{entry.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-muted-foreground">
              No data available
            </div>
          )}
        </div>
      </div>

      {/* Job Cards Status & Branch Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Job Cards by Status */}
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-lg flex items-center gap-2 mb-1">
                <ClipboardList className="w-5 h-5 text-primary" />
                Job Cards Status
              </h3>
              <p className="text-sm text-muted-foreground">Current distribution</p>
            </div>
          </div>
          {jobCardsByStatus.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={jobCardsByStatus}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis 
                  dataKey="status" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={11}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar 
                  dataKey="count" 
                  fill="hsl(var(--primary))" 
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground">
              No data available
            </div>
          )}
        </div>

        {/* Branch Performance */}
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-lg flex items-center gap-2 mb-1">
                <MapPin className="w-5 h-5 text-primary" />
                Top Performing Branches
              </h3>
              <p className="text-sm text-muted-foreground">By service cost</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/reports')}>
              View All
            </Button>
          </div>
          {branchPerformance.length > 0 ? (
            <div className="space-y-4">
              {branchPerformance.map((branch, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{branch.branch}</p>
                        <p className="text-xs text-muted-foreground">
                          {branch.vehicles} vehicles • {branch.jobCards} job cards
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">SAR {branch.cost.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Total cost</p>
                    </div>
                  </div>
                  {index < branchPerformance.length - 1 && (
                    <div className="h-px bg-border" />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground">
              No data available
            </div>
          )}
        </div>
      </div>

      {/* Top Consuming Parts */}
      <div className="bg-card rounded-xl border border-border p-6 mb-6 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-lg flex items-center gap-2 mb-1">
              <Package className="w-5 h-5 text-primary" />
              Top Consuming Parts
            </h3>
            <p className="text-sm text-muted-foreground">Most frequently used spare parts</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/inventory')}>
            View Inventory
          </Button>
        </div>
        {topConsumingParts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {topConsumingParts.map((part, index) => (
              <div 
                key={index} 
                className="p-4 rounded-lg border border-border bg-gradient-to-br from-muted/30 to-muted/10 hover:shadow-md transition-all cursor-pointer"
                onClick={() => navigate('/inventory')}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg mb-3">
                    {index + 1}
                  </div>
                  <p className="font-medium text-sm mb-1 line-clamp-2">{part.name}</p>
                  <p className="text-xs text-muted-foreground mb-2">
                    Used {part.count} time(s)
                  </p>
                  <div className="mt-auto pt-2 border-t border-border w-full">
                    <p className="font-bold text-primary">{part.total}</p>
                    <p className="text-xs text-muted-foreground">units consumed</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No parts consumption data available
          </div>
        )}
      </div>

      {/* Quick Actions & Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <div className="bg-card rounded-xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-lg flex items-center gap-2 mb-1">
                  <Activity className="w-5 h-5 text-primary" />
                  Recent Activity
                </h3>
                <p className="text-sm text-muted-foreground">Latest system updates and changes</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/reports')}>
                View All
              </Button>
            </div>
            <ActivityFeed limit={5} />
          </div>
        </div>
        <div>
          <QuickActions />
        </div>
      </div>

      {/* Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Job Cards */}
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-1">Recent Job Cards</h2>
              <p className="text-sm text-muted-foreground">Latest service records</p>
            </div>
            <button 
              onClick={() => navigate('/job-card')}
              className="text-sm text-primary hover:underline font-medium"
            >
              View All →
            </button>
          </div>
          <DataTable
            data={recentJobCards}
            columns={[
              { key: 'id', header: 'ID' },
              { key: 'vehicleNumber', header: 'Vehicle' },
              { key: 'jobDate', header: 'Date' },
              { 
                key: 'totalCost', 
                header: 'Cost',
                render: (item) => `SAR ${item.totalCost.toLocaleString()}`
              },
              { 
                key: 'status', 
                header: 'Status',
                render: (item) => <StatusBadge status={item.status} />
              },
            ]}
            onRowClick={(item) => navigate(`/job-card?id=${item.id}`)}
          />
        </div>

        {/* Due Services */}
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-1">Services Due</h2>
              <p className="text-sm text-muted-foreground">Requires immediate attention</p>
            </div>
            <button 
              onClick={() => navigate('/scheduled-services')}
              className="text-sm text-primary hover:underline font-medium"
            >
              View All →
            </button>
          </div>
          <DataTable
            data={dueServicesList}
            columns={[
              { key: 'vehicleNumber', header: 'Vehicle' },
              { key: 'serviceType', header: 'Service' },
              { key: 'triggerType', header: 'Trigger' },
              { 
                key: 'status', 
                header: 'Status',
                render: (item) => <StatusBadge status={item.status} />
              },
            ]}
            onRowClick={() => navigate('/scheduled-services')}
            emptyMessage="No services due"
          />
        </div>

        {/* Pending Work */}
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-1">Pending Work</h2>
              <p className="text-sm text-muted-foreground">Awaiting completion</p>
            </div>
            <button 
              onClick={() => navigate('/pending-work')}
              className="text-sm text-primary hover:underline font-medium"
            >
              View All →
            </button>
          </div>
          <DataTable
            data={pendingWork.filter(p => p.status === 'Pending').slice(0, 5)}
            columns={[
              { key: 'vehicleNumber', header: 'Vehicle' },
              { key: 'description', header: 'Description', className: 'max-w-[200px] truncate' },
              { 
                key: 'priority', 
                header: 'Priority',
                render: (item) => <StatusBadge status={item.priority} />
              },
            ]}
            onRowClick={() => navigate('/pending-work')}
            emptyMessage="No pending work"
          />
        </div>

        {/* Expiring Documents */}
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-1">Document Alerts</h2>
              <p className="text-sm text-muted-foreground">Expiring or expired documents</p>
            </div>
            <button 
              onClick={() => navigate('/documents')}
              className="text-sm text-primary hover:underline font-medium"
            >
              View All →
            </button>
          </div>
          <DataTable
            data={expiringDocsList}
            columns={[
              { key: 'vehicleNumber', header: 'Vehicle' },
              { key: 'documentType', header: 'Document' },
              { key: 'expiryDate', header: 'Expiry' },
              { 
                key: 'status', 
                header: 'Status',
                render: (item) => <StatusBadge status={item.status} />
              },
            ]}
            onRowClick={() => navigate('/documents')}
            emptyMessage="No document alerts"
          />
        </div>
      </div>

      {/* Notifications Panel */}
      <NotificationsPanel open={showNotifications} onOpenChange={setShowNotifications} />
    </div>
  );
}
