import React, { createContext, useContext, useState, ReactNode } from 'react';
import {
  Vehicle,
  Driver,
  Worker,
  InventoryItem,
  JobCard,
  ServiceHistory,
  Document,
  PendingWork,
  ScheduledService,
  PurchaseRecord,
  JobCardPart,
  initialVehicles,
  initialDrivers,
  initialWorkers,
  initialInventory,
  initialJobCards,
  initialServiceHistory,
  initialDocuments,
  initialPendingWork,
  initialScheduledServices,
} from '@/data/mockData';

// Driver assignment history with timestamps
export interface DriverAssignmentHistory {
  id: string;
  driverId: string;
  vehicleId: string;
  vehicleNumber: string;
  assignedAt: string;
  unassignedAt?: string;
  assignedBy?: string;
  reason?: string;
}

interface FleetContextType {
  vehicles: Vehicle[];
  drivers: Driver[];
  workers: Worker[];
  inventory: InventoryItem[];
  jobCards: JobCard[];
  serviceHistory: ServiceHistory[];
  documents: Document[];
  pendingWork: PendingWork[];
  scheduledServices: ScheduledService[];
  driverAssignmentHistory: DriverAssignmentHistory[];
  
  // Vehicle operations
  getVehicle: (id: string) => Vehicle | undefined;
  getVehicleByNumber: (number: string) => Vehicle | undefined;
  updateVehicle: (vehicle: Vehicle) => void;
  
  // Driver operations
  getDriver: (id: string) => Driver | undefined;
  getDriverHistory: (driverId: string) => {
    vehicles: DriverAssignmentHistory[];
    jobCards: JobCard[];
    siteVisits: any[];
    serviceHistory: ServiceHistory[];
  };
  
  // Inventory operations
  getInventoryItem: (id: string) => InventoryItem | undefined;
  updateInventoryStock: (itemId: string, quantityChange: number) => void;
  addPurchaseEntry: (itemId: string, purchase: PurchaseRecord) => void;
  addInventoryItem: (item: InventoryItem) => void;
  
  // Job Card operations
  createJobCard: (jobCard: Omit<JobCard, 'id' | 'createdAt'>) => JobCard;
  updateJobCard: (jobCard: JobCard) => void;
  getLastJobCard: (vehicleId: string) => JobCard | undefined;
  
  // Service History operations
  addServiceHistory: (history: Omit<ServiceHistory, 'id'>) => void;
  getVehicleServiceHistory: (vehicleId: string) => ServiceHistory[];
  
  // Document operations
  addDocument: (doc: Omit<Document, 'id'>) => void;
  updateDocument: (doc: Document) => void;
  getVehicleDocuments: (vehicleId: string) => Document[];
  getDriverDocuments: (driverId: string) => Document[];
  
  // Pending Work operations
  addPendingWork: (work: Omit<PendingWork, 'id'>) => void;
  updatePendingWork: (work: PendingWork) => void;
  getVehiclePendingWork: (vehicleId: string) => PendingWork[];
  
  // Scheduled Services operations
  getVehicleScheduledServices: (vehicleId: string) => ScheduledService[];
  getDueServices: (vehicleId: string, currentKM: number, totalHours: number) => ScheduledService[];
  updateScheduledService: (service: ScheduledService) => void;
}

const FleetContext = createContext<FleetContextType | undefined>(undefined);

export function FleetProvider({ children }: { children: ReactNode }) {
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);
  const [drivers] = useState<Driver[]>(initialDrivers);
  const [workers] = useState<Worker[]>(initialWorkers);
  const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory);
  const [jobCards, setJobCards] = useState<JobCard[]>(initialJobCards);
  const [serviceHistory, setServiceHistory] = useState<ServiceHistory[]>(initialServiceHistory);
  const [documents, setDocuments] = useState<Document[]>(initialDocuments);
  const [pendingWork, setPendingWork] = useState<PendingWork[]>(initialPendingWork);
  const [scheduledServices, setScheduledServices] = useState<ScheduledService[]>(initialScheduledServices);
  const [driverAssignmentHistory, setDriverAssignmentHistory] = useState<DriverAssignmentHistory[]>(() => {
    // Initialize with current assignments
    return initialVehicles
      .filter(v => v.driverId)
      .map(v => ({
        id: `DAH${v.id}`,
        driverId: v.driverId,
        vehicleId: v.id,
        vehicleNumber: v.vehicleNumber,
        assignedAt: new Date().toISOString(),
        assignedBy: 'System',
      }));
  });

  // Vehicle operations
  const getVehicle = (id: string) => vehicles.find(v => v.id === id);
  const getVehicleByNumber = (number: string) => vehicles.find(v => v.vehicleNumber === number);
  const updateVehicle = (vehicle: Vehicle) => {
    setVehicles(prev => {
      const oldVehicle = prev.find(v => v.id === vehicle.id);
      const updated = prev.map(v => v.id === vehicle.id ? vehicle : v);
      
      // Track driver assignment changes
      if (oldVehicle && oldVehicle.driverId !== vehicle.driverId) {
        // Unassign old driver if exists
        if (oldVehicle.driverId) {
          setDriverAssignmentHistory(prevHistory => {
            const existing = prevHistory.find(
              dah => dah.driverId === oldVehicle.driverId && 
                     dah.vehicleId === vehicle.id && 
                     !dah.unassignedAt
            );
            if (existing) {
              return prevHistory.map(dah => 
                dah.id === existing.id 
                  ? { ...dah, unassignedAt: new Date().toISOString() }
                  : dah
              );
            }
            return prevHistory;
          });
        }
        
        // Assign new driver if exists
        if (vehicle.driverId) {
          const newHistory: DriverAssignmentHistory = {
            id: `DAH${Date.now()}`,
            driverId: vehicle.driverId,
            vehicleId: vehicle.id,
            vehicleNumber: vehicle.vehicleNumber,
            assignedAt: new Date().toISOString(),
            assignedBy: 'System Admin',
          };
          setDriverAssignmentHistory(prev => [newHistory, ...prev]);
        }
      }
      
      return updated;
    });
  };

  // Driver operations
  const getDriver = (id: string) => drivers.find(d => d.id === id);

  const getDriverHistory = (driverId: string) => {
    // Get all vehicles assigned to this driver (current and historical)
    const driverVehicles = driverAssignmentHistory
      .filter(dah => dah.driverId === driverId)
      .sort((a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime());
    
    const vehicleIds = driverVehicles.map(dv => dv.vehicleId);
    
    // Get all job cards for vehicles driven by this driver
    const driverJobCards = jobCards.filter(jc => vehicleIds.includes(jc.vehicleId))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    // Get all service history for vehicles driven by this driver
    const driverServiceHistory = serviceHistory.filter(sh => vehicleIds.includes(sh.vehicleId))
      .sort((a, b) => new Date(b.serviceDate).getTime() - new Date(a.serviceDate).getTime());
    
    return {
      vehicles: driverVehicles,
      jobCards: driverJobCards,
      siteVisits: [], // Will be populated from SiteVisit component
      serviceHistory: driverServiceHistory,
    };
  };

  // Inventory operations
  const getInventoryItem = (id: string) => inventory.find(i => i.id === id);
  
  const updateInventoryStock = (itemId: string, quantityChange: number) => {
    setInventory(prev => prev.map(item => {
      if (item.id === itemId) {
        return { ...item, stockAvailable: Math.max(0, item.stockAvailable + quantityChange) };
      }
      return item;
    }));
  };

  const addPurchaseEntry = (itemId: string, purchase: PurchaseRecord) => {
    setInventory(prev => prev.map(item => {
      if (item.id === itemId) {
        const newHistory = [...item.purchaseHistory, purchase];
        const totalQty = newHistory.reduce((sum, p) => sum + p.quantity, 0);
        const totalValue = newHistory.reduce((sum, p) => sum + (p.quantity * p.unitPrice), 0);
        const newAvgPrice = Math.round(totalValue / totalQty);
        
        return {
          ...item,
          stockAvailable: item.stockAvailable + purchase.quantity,
          lastPurchasePrice: purchase.unitPrice,
          averagePrice: newAvgPrice,
          purchaseHistory: newHistory,
        };
      }
      return item;
    }));
  };

  const addInventoryItem = (item: InventoryItem) => {
    setInventory(prev => [...prev, item]);
  };

  // Job Card operations
  const createJobCard = (jobCardData: Omit<JobCard, 'id' | 'createdAt'>): JobCard => {
    const newId = `JC${String(jobCards.length + 1).padStart(3, '0')}`;
    const newJobCard: JobCard = {
      ...jobCardData,
      id: newId,
      createdAt: new Date().toISOString(),
    };
    setJobCards(prev => [...prev, newJobCard]);
    
    // Deduct stock for parts used
    jobCardData.partsUsed.forEach(part => {
      updateInventoryStock(part.itemId, -part.quantity);
    });
    
    // Create service history entries for each service done
    if (jobCardData.servicesDone && jobCardData.servicesDone.length > 0) {
      jobCardData.servicesDone.forEach(serviceType => {
        addServiceHistory({
          vehicleId: jobCardData.vehicleId,
          serviceType,
          serviceDate: jobCardData.jobDate,
          workDone: jobCardData.remarks || `Service completed: ${serviceType}`,
          partsUsed: jobCardData.partsUsed,
          cost: jobCardData.totalCost / jobCardData.servicesDone.length, // Distribute cost evenly
          jobCardId: newId,
        });
      });
    } else if (jobCardData.partsUsed.length > 0 || jobCardData.remarks) {
      // If no specific services but work was done, create a general service history entry
      addServiceHistory({
        vehicleId: jobCardData.vehicleId,
        serviceType: 'General Maintenance',
        serviceDate: jobCardData.jobDate,
        workDone: jobCardData.remarks || 'General maintenance work completed',
        partsUsed: jobCardData.partsUsed,
        cost: jobCardData.totalCost,
        jobCardId: newId,
      });
    }
    
    // Update scheduled services - mark as completed and update next due dates
    const vehicle = getVehicle(jobCardData.vehicleId);
    if (vehicle) {
      // Update scheduled services that match the services done
      setScheduledServices(prev => prev.map(ss => {
        if (ss.vehicleId === jobCardData.vehicleId && 
            jobCardData.servicesDone.includes(ss.serviceType) &&
            ss.status !== 'Completed') {
          // Calculate next due date based on trigger type
          let nextDueKM: number | undefined;
          let nextDueDate: string | undefined;
          
          if (ss.triggerType === 'KM' && typeof ss.triggerValue === 'number') {
            nextDueKM = jobCardData.totalKM + ss.triggerValue;
          } else if (ss.triggerType === 'Hours' && typeof ss.triggerValue === 'number') {
            const nextHours = jobCardData.totalHours + ss.triggerValue;
            // For hours-based, we'll set next due date (approximate)
            const daysFromNow = Math.ceil(ss.triggerValue / 8); // Assuming 8 hours per day
            const nextDate = new Date();
            nextDate.setDate(nextDate.getDate() + daysFromNow);
            nextDueDate = nextDate.toISOString().split('T')[0];
          } else if (ss.triggerType === 'Date' && ss.nextDueDate) {
            // For date-based, calculate next date
            const lastDate = new Date(ss.nextDueDate);
            const nextDate = new Date(lastDate);
            nextDate.setMonth(nextDate.getMonth() + 6); // Default 6 months
            nextDueDate = nextDate.toISOString().split('T')[0];
          }
          
          return {
            ...ss,
            status: 'Completed',
            lastServiceDate: jobCardData.jobDate,
            lastServiceKM: jobCardData.totalKM,
            nextDueKM,
            nextDueDate,
          };
        }
        return ss;
      }));
      
      // Update vehicle's next service dates
      const updatedServices = scheduledServices.map(ss => {
        if (ss.vehicleId === jobCardData.vehicleId && 
            jobCardData.servicesDone.includes(ss.serviceType) &&
            ss.status !== 'Completed') {
          if (ss.triggerType === 'KM' && typeof ss.triggerValue === 'number') {
            return { ...ss, nextDueKM: jobCardData.totalKM + ss.triggerValue };
          }
        }
        return ss;
      });
      
      const nextServiceKM = updatedServices
        .filter(ss => ss.vehicleId === jobCardData.vehicleId && ss.triggerType === 'KM' && ss.nextDueKM)
        .map(ss => ss.nextDueKM!)
        .sort((a, b) => a - b)[0];
      
      const nextServiceHours = updatedServices
        .filter(ss => ss.vehicleId === jobCardData.vehicleId && ss.triggerType === 'Hours')
        .map(ss => {
          if (typeof ss.triggerValue === 'number') {
            return jobCardData.totalHours + ss.triggerValue;
          }
          return undefined;
        })
        .filter((hours): hours is number => hours !== undefined)
        .sort((a, b) => a - b)[0];
      
      updateVehicle({
        ...vehicle,
        currentKM: jobCardData.totalKM,
        totalHours: jobCardData.totalHours,
        nextServiceKM: nextServiceKM || vehicle.nextServiceKM,
        nextServiceHours: nextServiceHours || vehicle.nextServiceHours,
      });
    }
    
    // Complete related pending work items
    setPendingWork(prev => prev.map(pw => {
      if (pw.vehicleId === jobCardData.vehicleId && pw.status !== 'Completed') {
        return {
          ...pw,
          status: 'Completed',
          jobCardId: newId,
        };
      }
      return pw;
    }));
    
    return newJobCard;
  };

  const updateJobCard = (jobCard: JobCard) => {
    setJobCards(prev => prev.map(jc => jc.id === jobCard.id ? jobCard : jc));
  };

  const getLastJobCard = (vehicleId: string) => {
    const vehicleJobCards = jobCards
      .filter(jc => jc.vehicleId === vehicleId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return vehicleJobCards[0];
  };

  // Service History operations
  const addServiceHistory = (history: Omit<ServiceHistory, 'id'>) => {
    const newId = `SH${String(serviceHistory.length + 1).padStart(3, '0')}`;
    setServiceHistory(prev => [...prev, { ...history, id: newId }]);
  };

  const getVehicleServiceHistory = (vehicleId: string) => {
    return serviceHistory
      .filter(sh => sh.vehicleId === vehicleId)
      .sort((a, b) => new Date(b.serviceDate).getTime() - new Date(a.serviceDate).getTime());
  };

  // Document operations
  const addDocument = (doc: Omit<Document, 'id'>) => {
    const newId = `DOC${String(documents.length + 1).padStart(3, '0')}`;
    setDocuments(prev => [...prev, { ...doc, id: newId }]);
  };

  const updateDocument = (doc: Document) => {
    setDocuments(prev => prev.map(d => d.id === doc.id ? doc : d));
  };

  const getVehicleDocuments = (vehicleId: string) => {
    return documents.filter(d => d.vehicleId === vehicleId);
  };

  const getDriverDocuments = (driverId: string) => {
    return documents.filter(d => d.driverId === driverId);
  };

  // Pending Work operations
  const addPendingWork = (work: Omit<PendingWork, 'id'>) => {
    const newId = `PW${String(pendingWork.length + 1).padStart(3, '0')}`;
    setPendingWork(prev => [...prev, { ...work, id: newId }]);
  };

  const updatePendingWork = (work: PendingWork) => {
    setPendingWork(prev => prev.map(pw => pw.id === work.id ? work : pw));
  };

  const getVehiclePendingWork = (vehicleId: string) => {
    return pendingWork.filter(pw => pw.vehicleId === vehicleId && pw.status !== 'Completed');
  };

  // Scheduled Services operations
  const getVehicleScheduledServices = (vehicleId: string) => {
    return scheduledServices.filter(ss => ss.vehicleId === vehicleId);
  };

  const getDueServices = (vehicleId: string, currentKM: number, totalHours: number) => {
    return scheduledServices.filter(ss => {
      if (ss.vehicleId !== vehicleId) return false;
      if (ss.triggerType === 'KM' && ss.nextDueKM && currentKM >= ss.nextDueKM) return true;
      if (ss.triggerType === 'Hours' && typeof ss.triggerValue === 'number') {
        const vehicle = getVehicle(vehicleId);
        if (vehicle && totalHours >= vehicle.nextServiceHours) return true;
      }
      return false;
    });
  };

  const updateScheduledService = (service: ScheduledService) => {
    setScheduledServices(prev => prev.map(ss => ss.id === service.id ? service : ss));
  };

  return (
    <FleetContext.Provider
      value={{
        vehicles,
        drivers,
        workers,
        inventory,
        jobCards,
        serviceHistory,
        documents,
        pendingWork,
        scheduledServices,
        driverAssignmentHistory,
        getVehicle,
        getVehicleByNumber,
        updateVehicle,
        getDriver,
        getDriverHistory,
        getInventoryItem,
        updateInventoryStock,
        addPurchaseEntry,
        addInventoryItem,
        createJobCard,
        updateJobCard,
        getLastJobCard,
        addServiceHistory,
        getVehicleServiceHistory,
        addDocument,
        updateDocument,
        getVehicleDocuments,
        getDriverDocuments,
        addPendingWork,
        updatePendingWork,
        getVehiclePendingWork,
        getVehicleScheduledServices,
        getDueServices,
        updateScheduledService,
      }}
    >
      {children}
    </FleetContext.Provider>
  );
}

export function useFleet() {
  const context = useContext(FleetContext);
  if (context === undefined) {
    throw new Error('useFleet must be used within a FleetProvider');
  }
  return context;
}
