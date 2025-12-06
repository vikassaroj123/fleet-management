import { useState, useMemo } from 'react';
import { useFleet } from '@/context/FleetContext';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { Download, FileSpreadsheet, TrendingUp, Package, Users, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { branches, serviceTypes } from '@/data/mockData';

const COLORS = ['hsl(221, 83%, 53%)', 'hsl(142, 76%, 36%)', 'hsl(38, 92%, 50%)', 'hsl(199, 89%, 48%)', 'hsl(0, 84%, 60%)'];

export default function Reports() {
  const { jobCards, inventory, vehicles, workers, serviceHistory } = useFleet();

  // Safety checks
  if (!jobCards || !Array.isArray(jobCards) || !inventory || !Array.isArray(inventory) || 
      !vehicles || !Array.isArray(vehicles) || !workers || !Array.isArray(workers) || 
      !serviceHistory || !Array.isArray(serviceHistory)) {
    return (
      <div className="animate-fade-in min-h-full">
        <PageHeader 
          title="Reports" 
          description="Generate and analyze fleet management reports"
        />
        <div className="bg-card rounded-xl border border-border p-8 text-center">
          <p className="text-muted-foreground">Loading reports data...</p>
        </div>
      </div>
    );
  }

  const [reportType, setReportType] = useState('job-card-summary');
  const [dateRange, setDateRange] = useState('monthly');
  const [filterBranch, setFilterBranch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Job Card Summary Data
  const jobCardSummary = useMemo(() => {
    const summary = jobCards.reduce((acc, jc) => {
      const month = jc.jobDate.substring(0, 7);
      if (!acc[month]) {
        acc[month] = { month, count: 0, cost: 0 };
      }
      acc[month].count++;
      acc[month].cost += jc.totalCost;
      return acc;
    }, {} as Record<string, { month: string; count: number; cost: number }>);
    
    return Object.values(summary).sort((a, b) => a.month.localeCompare(b.month));
  }, [jobCards]);

  // Spare Parts Consumption
  const partsConsumption = useMemo(() => {
    const consumption: Record<string, { name: string; quantity: number; cost: number }> = {};
    
    jobCards.forEach(jc => {
      jc.partsUsed.forEach(part => {
        if (!consumption[part.itemId]) {
          consumption[part.itemId] = { name: part.itemName, quantity: 0, cost: 0 };
        }
        consumption[part.itemId].quantity += part.quantity;
        consumption[part.itemId].cost += part.lineTotal;
      });
    });
    
    return Object.values(consumption)
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 10);
  }, [jobCards]);

  // Stock Valuation
  const stockValuation = useMemo(() => {
    return inventory.map(item => ({
      name: item.name.substring(0, 20),
      value: item.stockAvailable * item.averagePrice,
      stock: item.stockAvailable,
    })).sort((a, b) => b.value - a.value).slice(0, 10);
  }, [inventory]);

  // Service Cost Analysis
  const serviceCostAnalysis = useMemo(() => {
    const analysis: Record<string, { type: string; count: number; totalCost: number }> = {};
    
    serviceHistory.forEach(sh => {
      if (!analysis[sh.serviceType]) {
        analysis[sh.serviceType] = { type: sh.serviceType, count: 0, totalCost: 0 };
      }
      analysis[sh.serviceType].count++;
      analysis[sh.serviceType].totalCost += sh.cost;
    });
    
    return Object.values(analysis).sort((a, b) => b.totalCost - a.totalCost);
  }, [serviceHistory]);

  // Worker Productivity
  const workerProductivity = useMemo(() => {
    const productivity: Record<string, { name: string; jobCards: number }> = {};
    
    jobCards.forEach(jc => {
      jc.workers.forEach(workerId => {
        const worker = workers.find(w => w.id === workerId);
        if (worker) {
          if (!productivity[workerId]) {
            productivity[workerId] = { name: worker.name, jobCards: 0 };
          }
          productivity[workerId].jobCards++;
        }
      });
    });
    
    return Object.values(productivity).sort((a, b) => b.jobCards - a.jobCards);
  }, [jobCards, workers]);

  // Purchase Summary (from inventory purchase history)
  const purchaseSummary = useMemo(() => {
    const summary: Record<string, { month: string; total: number; count: number }> = {};
    
    inventory.forEach(item => {
      item.purchaseHistory.forEach(purchase => {
        const month = purchase.purchaseDate.substring(0, 7);
        if (!summary[month]) {
          summary[month] = { month, total: 0, count: 0 };
        }
        summary[month].total += purchase.quantity * purchase.unitPrice;
        summary[month].count++;
      });
    });
    
    return Object.values(summary).sort((a, b) => a.month.localeCompare(b.month));
  }, [inventory]);

  const handleExport = () => {
    toast.success('Report exported as Excel file');
  };

  const totalStats = {
    totalJobCards: jobCards.length,
    totalServiceCost: jobCards.reduce((sum, jc) => sum + jc.totalCost, 0),
    totalInventoryValue: inventory.reduce((sum, i) => sum + (i.stockAvailable * i.averagePrice), 0),
    activeVehicles: vehicles.filter(v => v.status === 'Active').length,
  };

  return (
    <div className="animate-fade-in min-h-full w-full" style={{ minHeight: '100vh' }}>
      <PageHeader 
        title="Reports" 
        description="Generate and analyze fleet management reports"
        action={
          <Button onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export Excel
          </Button>
        }
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileSpreadsheet className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Job Cards</p>
              <p className="text-2xl font-bold">{totalStats.totalJobCards}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-success/10 rounded-lg">
              <DollarSign className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Service Cost</p>
              <p className="text-2xl font-bold">SAR {totalStats.totalServiceCost.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-warning/10 rounded-lg">
              <Package className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Inventory Value</p>
              <p className="text-2xl font-bold">SAR {totalStats.totalInventoryValue.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-info/10 rounded-lg">
              <TrendingUp className="w-5 h-5 text-info" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Vehicles</p>
              <p className="text-2xl font-bold">{totalStats.activeVehicles}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl border border-border p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <Label>Report Type</Label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="job-card-summary">Job Card Summary</SelectItem>
                <SelectItem value="parts-consumption">Parts Consumption</SelectItem>
                <SelectItem value="stock-valuation">Stock Valuation</SelectItem>
                <SelectItem value="service-cost">Service Cost Analysis</SelectItem>
                <SelectItem value="worker-productivity">Worker Productivity</SelectItem>
                <SelectItem value="purchase-summary">Purchase Summary</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Period</Label>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Branch</Label>
            <Select value={filterBranch || "all"} onValueChange={(v) => setFilterBranch(v === "all" ? "" : v)}>
              <SelectTrigger>
                <SelectValue placeholder="All Branches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                {branches.map(b => (
                  <SelectItem key={b} value={b}>{b}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Start Date</Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <Label>End Date</Label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Job Card Summary */}
        {reportType === 'job-card-summary' && (
          <>
            <div className="bg-card rounded-xl border border-border p-5">
              <h3 className="font-semibold mb-4">Job Cards by Month</h3>
              {jobCardSummary.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={jobCardSummary}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No data available
                </div>
              )}
            </div>
            <div className="bg-card rounded-xl border border-border p-5">
              <h3 className="font-semibold mb-4">Service Cost Trend</h3>
              {jobCardSummary.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={jobCardSummary}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [`SAR ${value.toLocaleString()}`, 'Cost']}
                  />
                  <Line type="monotone" dataKey="cost" stroke="hsl(var(--success))" strokeWidth={2} dot={{ fill: 'hsl(var(--success))' }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No data available
                </div>
              )}
            </div>
          </>
        )}

        {/* Parts Consumption */}
        {reportType === 'parts-consumption' && (
          <>
            <div className="bg-card rounded-xl border border-border p-5">
              <h3 className="font-semibold mb-4">Top Parts by Cost</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={partsConsumption} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis dataKey="name" type="category" width={150} stroke="hsl(var(--muted-foreground))" fontSize={10} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [`SAR ${value.toLocaleString()}`, 'Cost']}
                  />
                  <Bar dataKey="cost" fill="hsl(var(--warning))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-card rounded-xl border border-border p-5">
              <h3 className="font-semibold mb-4">Parts by Quantity</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={partsConsumption.slice(0, 5)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name.substring(0, 15)} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="quantity"
                  >
                    {partsConsumption.slice(0, 5).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {/* Stock Valuation */}
        {reportType === 'stock-valuation' && (
          <>
            <div className="bg-card rounded-xl border border-border p-5 lg:col-span-2">
              <h3 className="font-semibold mb-4">Stock Valuation by Item</h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={stockValuation}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} angle={-45} textAnchor="end" height={80} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [`SAR ${value.toLocaleString()}`, 'Value']}
                  />
                  <Bar dataKey="value" fill="hsl(var(--info))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {/* Service Cost Analysis */}
        {reportType === 'service-cost' && (
          <>
            <div className="bg-card rounded-xl border border-border p-5">
              <h3 className="font-semibold mb-4">Cost by Service Type</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={serviceCostAnalysis}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ type, percent }) => `${type.substring(0, 10)} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="totalCost"
                  >
                    {serviceCostAnalysis.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`SAR ${value.toLocaleString()}`, 'Cost']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-card rounded-xl border border-border p-5">
              <h3 className="font-semibold mb-4">Service Count</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={serviceCostAnalysis}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="type" stroke="hsl(var(--muted-foreground))" fontSize={10} angle={-45} textAnchor="end" height={80} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {/* Worker Productivity */}
        {reportType === 'worker-productivity' && (
          <div className="bg-card rounded-xl border border-border p-5 lg:col-span-2">
            <h3 className="font-semibold mb-4">Worker Productivity (Job Cards Assigned)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={workerProductivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip />
                <Bar dataKey="jobCards" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Purchase Summary */}
        {reportType === 'purchase-summary' && (
          <div className="bg-card rounded-xl border border-border p-5 lg:col-span-2">
            <h3 className="font-semibold mb-4">Purchase Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={purchaseSummary}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => [`SAR ${value.toLocaleString()}`, 'Total']}
                />
                <Line type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
