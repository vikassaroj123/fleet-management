// Types
export interface Vehicle {
  id: string;
  vehicleNumber: string;
  model: string;
  type: 'Truck' | 'Van' | 'Bus' | 'Car' | 'Bike';
  branch: string;
  subBranch: string;
  driverId: string;
  currentKM: number;
  nextServiceKM: number;
  nextServiceDate: string;
  totalHours: number;
  nextServiceHours: number;
  status: 'Active' | 'In Service' | 'Idle';
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  licenseNumber: string;
  branch: string;
  subBranch: string;
}

export interface Worker {
  id: string;
  name: string;
  role: string;
  branch: string;
  subBranch: string;
  phone: string;
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  subCategory: string;
  branch: string;
  subBranch: string;
  stockAvailable: number;
  lastPurchasePrice: number;
  averagePrice: number;
  purchaseHistory: PurchaseRecord[];
}

export interface PurchaseRecord {
  id: string;
  purchaseDate: string;
  quantity: number;
  unitPrice: number;
  supplier: string;
  branch: string;
  subBranch: string;
  invoiceUrl?: string;
}

export interface JobCard {
  id: string;
  vehicleId: string;
  vehicleNumber: string;
  jobDate: string;
  startTime: string;
  endTime: string;
  totalKM: number;
  totalHours: number;
  workers: string[];
  partsUsed: JobCardPart[];
  servicesDone: string[];
  remarks: string;
  photoProofs: string[];
  documents: string[];
  totalCost: number;
  status: 'Open' | 'In Progress' | 'Completed';
  createdAt: string;
}

export interface JobCardPart {
  itemId: string;
  itemName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface ServiceHistory {
  id: string;
  vehicleId: string;
  serviceType: string;
  serviceDate: string;
  workDone: string;
  partsUsed: JobCardPart[];
  cost: number;
  jobCardId: string;
}

export interface Document {
  id: string;
  vehicleId?: string;
  driverId?: string;
  documentType: string;
  documentNumber: string;
  issueDate: string;
  expiryDate: string;
  fileUrl: string;
  status: 'Valid' | 'Expiring Soon' | 'Expired';
}

export interface PendingWork {
  id: string;
  vehicleId: string;
  vehicleNumber: string;
  description: string;
  priority: 'High' | 'Medium' | 'Low';
  createdDate: string;
  dueDate?: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  jobCardId?: string;
}

export interface ScheduledService {
  id: string;
  vehicleId: string;
  serviceType: string;
  triggerType: 'KM' | 'Hours' | 'Date';
  triggerValue: number | string;
  lastServiceDate?: string;
  lastServiceKM?: number;
  nextDueKM?: number;
  nextDueDate?: string;
  status: 'Due' | 'Upcoming' | 'Completed';
}

// Mock Data - Saudi Arabia Locations
export const branches = [
  'Head Office - Riyadh', 
  'Eastern Province', 
  'Western Province', 
  'Central Province', 
  'Northern Province', 
  'Southern Province',
  'Qassim Province',
  'Al Jawf Province'
];
export const subBranches: Record<string, string[]> = {
  'Head Office - Riyadh': [
    'Riyadh Main', 
    'Riyadh Warehouse', 
    'Riyadh Service Center',
    'King Fahd District',
    'Olaya District',
    'Malaz District',
    'Al Naseem District'
  ],
  'Eastern Province': [
    'Dammam', 
    'Khobar', 
    'Jubail', 
    'Dhahran',
    'Qatif',
    'Hafr Al-Batin',
    'Ras Tanura',
    'Abqaiq'
  ],
  'Western Province': [
    'Jeddah', 
    'Mecca', 
    'Medina', 
    'Taif',
    'Yanbu',
    'Rabigh',
    'Al Lith',
    'Al Qunfudhah'
  ],
  'Central Province': [
    'Riyadh', 
    'Buraydah', 
    'Unaizah', 
    'Al Kharj',
    'Al Majma\'ah',
    'Shagra',
    'Dawadmi',
    'Zulfi'
  ],
  'Northern Province': [
    'Tabuk', 
    'Hail', 
    'Arar', 
    'Sakaka',
    'Al Qurayyat',
    'Turaif',
    'Rafha',
    'Al Jawf'
  ],
  'Southern Province': [
    'Abha', 
    'Jizan', 
    'Najran', 
    'Khamis Mushait',
    'Al Baha',
    'Al Namas',
    'Sabya',
    'Jazan'
  ],
  'Qassim Province': [
    'Buraydah',
    'Unaizah',
    'Riyadh Al Khabra',
    'Al Mithnab',
    'Al Badayea',
    'Al Bukayriyah'
  ],
  'Al Jawf Province': [
    'Sakaka',
    'Qurayyat',
    'Dumat Al-Jandal',
    'Tabarjal',
    'Al Qurayyat'
  ],
};

export const categories = [
  { name: 'Tyres', subCategories: ['Front Tyres', 'Rear Tyres', 'Spare Tyres', 'Tubes'] },
  { name: 'Batteries', subCategories: ['Lead Acid', 'Lithium', 'AGM'] },
  { name: 'Oil', subCategories: ['Engine Oil', 'Gear Oil', 'Hydraulic Oil', 'Brake Fluid'] },
  { name: 'Electrical & AC', subCategories: ['Lights', 'Wiring', 'AC Components', 'Alternator'] },
  { name: 'Suspension', subCategories: ['Shock Absorbers', 'Springs', 'Bushings', 'Ball Joints'] },
  { name: 'Engine Parts', subCategories: ['Filters', 'Belts', 'Gaskets', 'Spark Plugs'] },
  { name: 'Body/Painting', subCategories: ['Paint', 'Panels', 'Glass', 'Mirrors'] },
  { name: 'Consumables', subCategories: ['Grease', 'Coolant', 'Cleaning', 'Tools'] },
];

export const serviceTypes = [
  'Oil Change',
  'Battery Replacement',
  'Tyre Rotation',
  'Tyre Replacement',
  'Engine Service',
  'AC Service',
  'Electrical Work',
  'Preventive Maintenance (PM)',
  'Brake Service',
  'Suspension Work',
  'Body Repair',
  'General Inspection',
];

export const documentTypes = [
  'Registration Certificate',
  'Insurance',
  'Pollution Certificate',
  'Fitness Certificate',
  'Permit',
  'Driver License',
  'Road Tax',
];

export const initialVehicles: Vehicle[] = [
  { id: 'V001', vehicleNumber: 'KSA-1234-AB', model: 'Mercedes Actros', type: 'Truck', branch: 'Head Office - Riyadh', subBranch: 'Riyadh Main', driverId: 'D001', currentKM: 45000, nextServiceKM: 50000, nextServiceDate: '2024-02-15', totalHours: 2200, nextServiceHours: 2500, status: 'Active' },
  { id: 'V002', vehicleNumber: 'KSA-5678-CD', model: 'Volvo FH16', type: 'Truck', branch: 'Eastern Province', subBranch: 'Dammam', driverId: 'D002', currentKM: 78000, nextServiceKM: 80000, nextServiceDate: '2024-01-20', totalHours: 3800, nextServiceHours: 4000, status: 'Active' },
  { id: 'V003', vehicleNumber: 'KSA-9012-EF', model: 'Toyota Hiace', type: 'Van', branch: 'Western Province', subBranch: 'Jeddah', driverId: 'D003', currentKM: 32000, nextServiceKM: 35000, nextServiceDate: '2024-02-28', totalHours: 1500, nextServiceHours: 1800, status: 'Active' },
  { id: 'V004', vehicleNumber: 'KSA-3456-GH', model: 'Mercedes Sprinter', type: 'Bus', branch: 'Central Province', subBranch: 'Riyadh', driverId: 'D004', currentKM: 120000, nextServiceKM: 125000, nextServiceDate: '2024-01-25', totalHours: 5500, nextServiceHours: 5800, status: 'In Service' },
  { id: 'V005', vehicleNumber: 'KSA-7890-IJ', model: 'Isuzu NPR', type: 'Van', branch: 'Western Province', subBranch: 'Mecca', driverId: 'D005', currentKM: 55000, nextServiceKM: 60000, nextServiceDate: '2024-03-10', totalHours: 2700, nextServiceHours: 3000, status: 'Active' },
  { id: 'V006', vehicleNumber: 'KSA-2345-KL', model: 'Scania R Series', type: 'Truck', branch: 'Eastern Province', subBranch: 'Khobar', driverId: 'D006', currentKM: 95000, nextServiceKM: 100000, nextServiceDate: '2024-02-05', totalHours: 4600, nextServiceHours: 5000, status: 'Active' },
  { id: 'V007', vehicleNumber: 'KSA-6789-MN', model: 'MAN TGX', type: 'Truck', branch: 'Northern Province', subBranch: 'Tabuk', driverId: 'D007', currentKM: 67000, nextServiceKM: 70000, nextServiceDate: '2024-01-30', totalHours: 3200, nextServiceHours: 3500, status: 'Idle' },
  { id: 'V008', vehicleNumber: 'KSA-0123-OP', model: 'Ford Transit', type: 'Van', branch: 'Southern Province', subBranch: 'Abha', driverId: 'D008', currentKM: 41000, nextServiceKM: 45000, nextServiceDate: '2024-02-20', totalHours: 2000, nextServiceHours: 2200, status: 'Active' },
  // Tabuk vehicles from raw data
  { id: 'V009', vehicleNumber: '3042/30888', model: 'DOOSAN EXCAVATOR', type: 'Truck', branch: 'Northern Province', subBranch: 'Tabuk', driverId: 'D007', currentKM: 0, nextServiceKM: 1000, nextServiceDate: '2025-02-01', totalHours: 643, nextServiceHours: 1000, status: 'Active' },
  { id: 'V010', vehicleNumber: '3040/30516', model: 'DOOSAN EXCAVATOR', type: 'Truck', branch: 'Northern Province', subBranch: 'Tabuk', driverId: 'D007', currentKM: 0, nextServiceKM: 1000, nextServiceDate: '2025-02-01', totalHours: 641, nextServiceHours: 1000, status: 'Active' },
  { id: 'V011', vehicleNumber: '7925', model: 'DOOSAN EXCAVATOR', type: 'Truck', branch: 'Northern Province', subBranch: 'Tabuk', driverId: 'D007', currentKM: 0, nextServiceKM: 1000, nextServiceDate: '2025-02-01', totalHours: 5144, nextServiceHours: 5500, status: 'Active' },
  { id: 'V012', vehicleNumber: '3797', model: 'DOOSAN LOADER', type: 'Truck', branch: 'Northern Province', subBranch: 'Tabuk', driverId: 'D007', currentKM: 0, nextServiceKM: 1000, nextServiceDate: '2025-02-01', totalHours: 1593, nextServiceHours: 2000, status: 'Active' },
  { id: 'V013', vehicleNumber: '4948', model: 'DOOSAN EXCAVATOR', type: 'Truck', branch: 'Northern Province', subBranch: 'Tabuk', driverId: 'D007', currentKM: 0, nextServiceKM: 1000, nextServiceDate: '2025-02-01', totalHours: 6668, nextServiceHours: 7000, status: 'Active' },
  { id: 'V014', vehicleNumber: '2664/21552', model: 'DOOSAN LOADER', type: 'Truck', branch: 'Northern Province', subBranch: 'Tabuk', driverId: 'D007', currentKM: 0, nextServiceKM: 1000, nextServiceDate: '2025-02-01', totalHours: 1578, nextServiceHours: 2000, status: 'Active' },
  { id: 'V015', vehicleNumber: '1258', model: 'ROLLAR JCB', type: 'Truck', branch: 'Northern Province', subBranch: 'Tabuk', driverId: 'D007', currentKM: 0, nextServiceKM: 1000, nextServiceDate: '2025-02-01', totalHours: 1567, nextServiceHours: 2000, status: 'Active' },
  { id: 'V016', vehicleNumber: '8523', model: 'DOOSAN LOADER', type: 'Truck', branch: 'Northern Province', subBranch: 'Tabuk', driverId: 'D007', currentKM: 0, nextServiceKM: 1000, nextServiceDate: '2025-02-01', totalHours: 2260, nextServiceHours: 2500, status: 'Active' },
  { id: 'V017', vehicleNumber: '8531', model: 'DOOSAN LOADER', type: 'Truck', branch: 'Northern Province', subBranch: 'Tabuk', driverId: 'D007', currentKM: 0, nextServiceKM: 1000, nextServiceDate: '2025-02-01', totalHours: 1819, nextServiceHours: 2000, status: 'Active' },
  { id: 'V018', vehicleNumber: '8532', model: 'DOOSAN LOADER', type: 'Truck', branch: 'Northern Province', subBranch: 'Tabuk', driverId: 'D007', currentKM: 0, nextServiceKM: 1000, nextServiceDate: '2025-02-01', totalHours: 1852, nextServiceHours: 2000, status: 'Active' },
  { id: 'V019', vehicleNumber: '3791', model: 'DOOSAN LOADER', type: 'Truck', branch: 'Northern Province', subBranch: 'Tabuk', driverId: 'D007', currentKM: 0, nextServiceKM: 1000, nextServiceDate: '2025-02-01', totalHours: 5796, nextServiceHours: 6000, status: 'Active' },
  { id: 'V020', vehicleNumber: 'Opt8144', model: 'UD DUMP TRUCK', type: 'Truck', branch: 'Northern Province', subBranch: 'Tabuk', driverId: 'D007', currentKM: 95022, nextServiceKM: 100000, nextServiceDate: '2025-02-01', totalHours: 12318, nextServiceHours: 13000, status: 'Active' },
  { id: 'V021', vehicleNumber: '8537', model: 'UD TRUCK', type: 'Truck', branch: 'Northern Province', subBranch: 'Tabuk', driverId: 'D007', currentKM: 0, nextServiceKM: 1000, nextServiceDate: '2025-02-01', totalHours: 13540, nextServiceHours: 14000, status: 'Active' },
  { id: 'V022', vehicleNumber: '3043/30890', model: 'DOOSAN EXCAVATOR', type: 'Truck', branch: 'Northern Province', subBranch: 'Tabuk', driverId: 'D007', currentKM: 0, nextServiceKM: 1000, nextServiceDate: '2025-02-01', totalHours: 669, nextServiceHours: 1000, status: 'Active' },
  { id: 'V023', vehicleNumber: '8519', model: 'LOADER', type: 'Truck', branch: 'Northern Province', subBranch: 'Tabuk', driverId: 'D007', currentKM: 0, nextServiceKM: 1000, nextServiceDate: '2025-02-01', totalHours: 1530, nextServiceHours: 2000, status: 'Active' },
  { id: 'V024', vehicleNumber: '7191', model: 'ROLLAR CAT', type: 'Truck', branch: 'Northern Province', subBranch: 'Tabuk', driverId: 'D007', currentKM: 0, nextServiceKM: 1000, nextServiceDate: '2025-02-01', totalHours: 1690, nextServiceHours: 2000, status: 'Active' },
  { id: 'V025', vehicleNumber: '8524', model: 'DOOSAN LOADER', type: 'Truck', branch: 'Northern Province', subBranch: 'Tabuk', driverId: 'D007', currentKM: 0, nextServiceKM: 1000, nextServiceDate: '2025-02-01', totalHours: 1471, nextServiceHours: 2000, status: 'Active' },
  { id: 'V026', vehicleNumber: '8525', model: 'DOOSAN LOADER', type: 'Truck', branch: 'Northern Province', subBranch: 'Tabuk', driverId: 'D007', currentKM: 0, nextServiceKM: 1000, nextServiceDate: '2025-02-01', totalHours: 1827, nextServiceHours: 2000, status: 'Active' },
  { id: 'V027', vehicleNumber: '8530', model: 'DOOSAN LOADER', type: 'Truck', branch: 'Northern Province', subBranch: 'Tabuk', driverId: 'D007', currentKM: 0, nextServiceKM: 1000, nextServiceDate: '2025-02-01', totalHours: 1601, nextServiceHours: 2000, status: 'Active' },
  { id: 'V028', vehicleNumber: '6930', model: 'ROLLAR JCB', type: 'Truck', branch: 'Northern Province', subBranch: 'Tabuk', driverId: 'D007', currentKM: 0, nextServiceKM: 1000, nextServiceDate: '2025-02-01', totalHours: 1642, nextServiceHours: 2000, status: 'Active' },
  { id: 'V029', vehicleNumber: '6948', model: 'ROLLAR JCB', type: 'Truck', branch: 'Northern Province', subBranch: 'Tabuk', driverId: 'D007', currentKM: 0, nextServiceKM: 1000, nextServiceDate: '2025-02-01', totalHours: 1612, nextServiceHours: 2000, status: 'Active' },
  { id: 'V030', vehicleNumber: '3041/30887', model: 'DOOSAN EXCAVATOR', type: 'Truck', branch: 'Northern Province', subBranch: 'Tabuk', driverId: 'D007', currentKM: 0, nextServiceKM: 1000, nextServiceDate: '2025-02-01', totalHours: 684, nextServiceHours: 1000, status: 'Active' },
  { id: 'V031', vehicleNumber: '3044/30889', model: 'DOOSAN EXCAVATOR', type: 'Truck', branch: 'Northern Province', subBranch: 'Tabuk', driverId: 'D007', currentKM: 0, nextServiceKM: 1000, nextServiceDate: '2025-02-01', totalHours: 690, nextServiceHours: 1000, status: 'Active' },
  { id: 'V032', vehicleNumber: '7937', model: 'EXCAVATOR', type: 'Truck', branch: 'Northern Province', subBranch: 'Tabuk', driverId: 'D007', currentKM: 0, nextServiceKM: 1000, nextServiceDate: '2025-02-01', totalHours: 6313, nextServiceHours: 6500, status: 'Active' },
  { id: 'V033', vehicleNumber: '8528', model: 'LOADER', type: 'Truck', branch: 'Northern Province', subBranch: 'Tabuk', driverId: 'D007', currentKM: 0, nextServiceKM: 1000, nextServiceDate: '2025-02-01', totalHours: 1779, nextServiceHours: 2000, status: 'Active' },
  { id: 'V034', vehicleNumber: '3798', model: 'DOOSAN LOADER', type: 'Truck', branch: 'Northern Province', subBranch: 'Tabuk', driverId: 'D007', currentKM: 0, nextServiceKM: 1000, nextServiceDate: '2025-02-01', totalHours: 1550, nextServiceHours: 2000, status: 'Active' },
  { id: 'V035', vehicleNumber: '8534', model: 'UD TRUCK', type: 'Truck', branch: 'Northern Province', subBranch: 'Tabuk', driverId: 'D007', currentKM: 0, nextServiceKM: 1000, nextServiceDate: '2025-02-01', totalHours: 12629, nextServiceHours: 13000, status: 'Active' },
  { id: 'V036', vehicleNumber: '5470 AAA', model: 'DOOSAN LOADER', type: 'Truck', branch: 'Northern Province', subBranch: 'Tabuk', driverId: 'D007', currentKM: 0, nextServiceKM: 1000, nextServiceDate: '2025-02-01', totalHours: 6624, nextServiceHours: 7000, status: 'Active' },
  { id: 'V037', vehicleNumber: '8143', model: 'UD DUMP TRUCK', type: 'Truck', branch: 'Northern Province', subBranch: 'Tabuk', driverId: 'D007', currentKM: 0, nextServiceKM: 1000, nextServiceDate: '2025-02-01', totalHours: 11364, nextServiceHours: 12000, status: 'Active' },
  { id: 'V038', vehicleNumber: '6358', model: 'DOOSAN EXCAVATOR', type: 'Truck', branch: 'Northern Province', subBranch: 'Tabuk', driverId: 'D007', currentKM: 0, nextServiceKM: 1000, nextServiceDate: '2025-02-01', totalHours: 3376, nextServiceHours: 3500, status: 'Active' },
];

export const initialDrivers: Driver[] = [
  { id: 'D001', name: 'Ahmed Al-Rashid', phone: '+966501234567', licenseNumber: 'KSA-2020-001234', branch: 'Head Office - Riyadh', subBranch: 'Riyadh Main' },
  { id: 'D002', name: 'Mohammed Al-Saud', phone: '+966502345678', licenseNumber: 'KSA-2019-002345', branch: 'Eastern Province', subBranch: 'Dammam' },
  { id: 'D003', name: 'Khalid Al-Mansouri', phone: '+966503456789', licenseNumber: 'KSA-2021-003456', branch: 'Western Province', subBranch: 'Jeddah' },
  { id: 'D004', name: 'Fahad Al-Zahrani', phone: '+966504567890', licenseNumber: 'KSA-2018-004567', branch: 'Central Province', subBranch: 'Riyadh' },
  { id: 'D005', name: 'Saud Al-Otaibi', phone: '+966505678901', licenseNumber: 'KSA-2022-005678', branch: 'Western Province', subBranch: 'Mecca' },
  { id: 'D006', name: 'Abdullah Al-Ghamdi', phone: '+966506789012', licenseNumber: 'KSA-2020-006789', branch: 'Eastern Province', subBranch: 'Khobar' },
  { id: 'D007', name: 'Omar Al-Shammari', phone: '+966507890123', licenseNumber: 'KSA-2019-007890', branch: 'Northern Province', subBranch: 'Tabuk' },
  { id: 'D008', name: 'Yousef Al-Qahtani', phone: '+966508901234', licenseNumber: 'KSA-2021-008901', branch: 'Southern Province', subBranch: 'Abha' },
];

export const initialWorkers: Worker[] = [
  { id: 'W001', name: 'Hassan Al-Mutairi', role: 'Senior Mechanic', branch: 'Head Office - Riyadh', subBranch: 'Riyadh Service Center', phone: '+966501111111' },
  { id: 'W002', name: 'Ibrahim Al-Harbi', role: 'Mechanic', branch: 'Head Office - Riyadh', subBranch: 'Riyadh Main', phone: '+966502222222' },
  { id: 'W003', name: 'Salem Al-Dosari', role: 'Electrician', branch: 'Eastern Province', subBranch: 'Dammam', phone: '+966503333333' },
  { id: 'W004', name: 'Nasser Al-Shehri', role: 'AC Technician', branch: 'Western Province', subBranch: 'Jeddah', phone: '+966504444444' },
  { id: 'W005', name: 'Majed Al-Anzi', role: 'Mechanic', branch: 'Central Province', subBranch: 'Riyadh', phone: '+966505555555' },
  { id: 'W006', name: 'Hamad Al-Qahtani', role: 'Body Work Specialist', branch: 'Eastern Province', subBranch: 'Khobar', phone: '+966506666666' },
  { id: 'W007', name: 'Saeed Al-Ghamdi', role: 'Tyre Specialist', branch: 'Western Province', subBranch: 'Mecca', phone: '+966507777777' },
  { id: 'W008', name: 'Bandar Al-Otaibi', role: 'Helper', branch: 'Central Province', subBranch: 'Buraydah', phone: '+966508888888' },
  { id: 'W009', name: 'Turki Al-Shammari', role: 'Senior Mechanic', branch: 'Northern Province', subBranch: 'Tabuk', phone: '+966509999999' },
  { id: 'W010', name: 'Faisal Al-Zahrani', role: 'Electrician', branch: 'Southern Province', subBranch: 'Abha', phone: '+966510000000' },
  { id: 'W011', name: 'Jamsheed', role: 'Mechanic', branch: 'Northern Province', subBranch: 'Tabuk', phone: '+966511111111' },
  { id: 'W012', name: 'Zahid Ali', role: 'Senior Mechanic', branch: 'Northern Province', subBranch: 'Tabuk', phone: '+966512222222' },
  { id: 'W013', name: 'Sunil', role: 'Mechanic', branch: 'Northern Province', subBranch: 'Tabuk', phone: '+966513333333' },
];

export const initialInventory: InventoryItem[] = [
  { id: 'INV001', sku: 'TYR-FRT-001', name: 'Bridgestone 295/80R22.5', category: 'Tyres', subCategory: 'Front Tyres', branch: 'Head Office - Riyadh', subBranch: 'Riyadh Main', stockAvailable: 25, lastPurchasePrice: 850, averagePrice: 820, purchaseHistory: [{ id: 'P001', purchaseDate: '2024-01-05', quantity: 15, unitPrice: 850, supplier: 'Al Futtaim Auto Parts', branch: 'Head Office - Riyadh', subBranch: 'Riyadh Main' }, { id: 'P002', purchaseDate: '2023-12-10', quantity: 20, unitPrice: 790, supplier: 'Petromin Corporation', branch: 'Head Office - Riyadh', subBranch: 'Riyadh Main' }] },
  { id: 'INV002', sku: 'TYR-RER-001', name: 'Michelin 295/80R22.5', category: 'Tyres', subCategory: 'Rear Tyres', branch: 'Head Office - Riyadh', subBranch: 'Riyadh Main', stockAvailable: 18, lastPurchasePrice: 820, averagePrice: 800, purchaseHistory: [{ id: 'P003', purchaseDate: '2024-01-08', quantity: 12, unitPrice: 820, supplier: 'Abdul Latif Jameel', branch: 'Head Office - Riyadh', subBranch: 'Riyadh Main' }] },
  { id: 'INV003', sku: 'BAT-LA-001', name: 'ACDelco 150Ah Battery', category: 'Batteries', subCategory: 'Lead Acid', branch: 'Western Province', subBranch: 'Jeddah', stockAvailable: 20, lastPurchasePrice: 580, averagePrice: 560, purchaseHistory: [{ id: 'P004', purchaseDate: '2024-01-02', quantity: 15, unitPrice: 580, supplier: 'Saudi Parts Center', branch: 'Western Province', subBranch: 'Jeddah' }, { id: 'P005', purchaseDate: '2023-11-20', quantity: 10, unitPrice: 550, supplier: 'Jeddah Auto Supplies', branch: 'Western Province', subBranch: 'Jeddah' }] },
  { id: 'INV004', sku: 'OIL-ENG-001', name: 'Shell Rimula R4 15W-40 20L', category: 'Oil', subCategory: 'Engine Oil', branch: 'Eastern Province', subBranch: 'Dammam', stockAvailable: 35, lastPurchasePrice: 195, averagePrice: 190, purchaseHistory: [{ id: 'P006', purchaseDate: '2024-01-10', quantity: 20, unitPrice: 195, supplier: 'Petromin Corporation', branch: 'Eastern Province', subBranch: 'Dammam' }, { id: 'P007', purchaseDate: '2023-12-15', quantity: 25, unitPrice: 185, supplier: 'Dammam Parts Hub', branch: 'Eastern Province', subBranch: 'Dammam' }] },
  { id: 'INV005', sku: 'OIL-GER-001', name: 'Castrol Gear Oil 85W-140 5L', category: 'Oil', subCategory: 'Gear Oil', branch: 'Central Province', subBranch: 'Riyadh', stockAvailable: 28, lastPurchasePrice: 85, averagePrice: 82, purchaseHistory: [{ id: 'P008', purchaseDate: '2024-01-12', quantity: 15, unitPrice: 85, supplier: 'Riyadh Spare Parts', branch: 'Central Province', subBranch: 'Riyadh' }] },
  { id: 'INV006', sku: 'ELC-LGT-001', name: 'LED Headlight Assembly', category: 'Electrical & AC', subCategory: 'Lights', branch: 'Western Province', subBranch: 'Jeddah', stockAvailable: 12, lastPurchasePrice: 390, averagePrice: 380, purchaseHistory: [{ id: 'P009', purchaseDate: '2024-01-03', quantity: 8, unitPrice: 390, supplier: 'Gulf Auto Parts', branch: 'Western Province', subBranch: 'Jeddah' }] },
  { id: 'INV007', sku: 'SUS-SHK-001', name: 'Monroe Shock Absorber', category: 'Suspension', subCategory: 'Shock Absorbers', branch: 'Eastern Province', subBranch: 'Khobar', stockAvailable: 15, lastPurchasePrice: 160, averagePrice: 155, purchaseHistory: [{ id: 'P010', purchaseDate: '2024-01-07', quantity: 10, unitPrice: 160, supplier: 'Zahid Tractor & Heavy Machinery', branch: 'Eastern Province', subBranch: 'Khobar' }] },
  { id: 'INV008', sku: 'ENG-FLT-001', name: 'Air Filter Heavy Duty', category: 'Engine Parts', subCategory: 'Filters', branch: 'Head Office - Riyadh', subBranch: 'Riyadh Service Center', stockAvailable: 45, lastPurchasePrice: 40, averagePrice: 38, purchaseHistory: [{ id: 'P011', purchaseDate: '2024-01-09', quantity: 30, unitPrice: 40, supplier: 'Al Futtaim Auto Parts', branch: 'Head Office - Riyadh', subBranch: 'Riyadh Service Center' }] },
  { id: 'INV009', sku: 'ENG-BLT-001', name: 'V-Belt Set', category: 'Engine Parts', subCategory: 'Belts', branch: 'Central Province', subBranch: 'Buraydah', stockAvailable: 32, lastPurchasePrice: 55, averagePrice: 52, purchaseHistory: [{ id: 'P012', purchaseDate: '2024-01-11', quantity: 20, unitPrice: 55, supplier: 'Saudi Diesel Equipment', branch: 'Central Province', subBranch: 'Buraydah' }] },
  { id: 'INV010', sku: 'CON-GRS-001', name: 'Multipurpose Grease 3kg', category: 'Consumables', subCategory: 'Grease', branch: 'Western Province', subBranch: 'Mecca', stockAvailable: 50, lastPurchasePrice: 21, averagePrice: 20, purchaseHistory: [{ id: 'P013', purchaseDate: '2024-01-06', quantity: 35, unitPrice: 21, supplier: 'Mecca Fleet Services', branch: 'Western Province', subBranch: 'Mecca' }] },
  { id: 'INV011', sku: 'TYR-SPR-001', name: 'Goodyear Spare Tyre 295/80R22.5', category: 'Tyres', subCategory: 'Spare Tyres', branch: 'Eastern Province', subBranch: 'Jubail', stockAvailable: 15, lastPurchasePrice: 780, averagePrice: 760, purchaseHistory: [{ id: 'P014', purchaseDate: '2024-01-14', quantity: 10, unitPrice: 780, supplier: 'Petromin Corporation', branch: 'Eastern Province', subBranch: 'Jubail' }] },
  { id: 'INV012', sku: 'BAT-LI-001', name: 'Lithium Battery 12V 100Ah', category: 'Batteries', subCategory: 'Lithium', branch: 'Head Office - Riyadh', subBranch: 'Riyadh Main', stockAvailable: 8, lastPurchasePrice: 1200, averagePrice: 1180, purchaseHistory: [{ id: 'P015', purchaseDate: '2024-01-16', quantity: 5, unitPrice: 1200, supplier: 'Al Jomaih Automotive', branch: 'Head Office - Riyadh', subBranch: 'Riyadh Main' }] },
  { id: 'INV013', sku: 'OIL-HYD-001', name: 'Hydraulic Oil ISO 46 20L', category: 'Oil', subCategory: 'Hydraulic Oil', branch: 'Central Province', subBranch: 'Unaizah', stockAvailable: 22, lastPurchasePrice: 175, averagePrice: 170, purchaseHistory: [{ id: 'P016', purchaseDate: '2024-01-18', quantity: 12, unitPrice: 175, supplier: 'Saudi Diesel Equipment', branch: 'Central Province', subBranch: 'Unaizah' }] },
  { id: 'INV014', sku: 'ELC-ALT-001', name: 'Alternator 24V 120A', category: 'Electrical & AC', subCategory: 'Alternator', branch: 'Western Province', subBranch: 'Medina', stockAvailable: 10, lastPurchasePrice: 450, averagePrice: 440, purchaseHistory: [{ id: 'P017', purchaseDate: '2024-01-20', quantity: 6, unitPrice: 450, supplier: 'Medina Auto Center', branch: 'Western Province', subBranch: 'Medina' }] },
  { id: 'INV015', sku: 'SUS-SPR-001', name: 'Coil Spring Set', category: 'Suspension', subCategory: 'Springs', branch: 'Southern Province', subBranch: 'Abha', stockAvailable: 18, lastPurchasePrice: 280, averagePrice: 270, purchaseHistory: [{ id: 'P018', purchaseDate: '2024-01-22', quantity: 12, unitPrice: 280, supplier: 'Abha Auto Supplies', branch: 'Southern Province', subBranch: 'Abha' }] },
];

export const initialJobCards: JobCard[] = [
  { id: 'JC001', vehicleId: 'V001', vehicleNumber: 'KSA-1234-AB', jobDate: '2024-01-10', startTime: '09:00', endTime: '14:00', totalKM: 45000, totalHours: 2200, workers: ['W001', 'W002'], partsUsed: [{ itemId: 'INV004', itemName: 'Shell Rimula R4 15W-40 20L', sku: 'OIL-ENG-001', quantity: 2, unitPrice: 190, lineTotal: 380 }, { itemId: 'INV008', itemName: 'Air Filter Heavy Duty', sku: 'ENG-FLT-001', quantity: 1, unitPrice: 38, lineTotal: 38 }], servicesDone: ['Oil Change', 'General Inspection'], remarks: 'Regular maintenance completed', photoProofs: [], documents: [], totalCost: 418, status: 'Completed', createdAt: '2024-01-10T09:00:00' },
  { id: 'JC002', vehicleId: 'V002', vehicleNumber: 'KSA-5678-CD', jobDate: '2024-01-12', startTime: '10:00', endTime: '16:30', totalKM: 78000, totalHours: 3800, workers: ['W003', 'W004'], partsUsed: [{ itemId: 'INV003', itemName: 'ACDelco 150Ah Battery', sku: 'BAT-LA-001', quantity: 1, unitPrice: 560, lineTotal: 560 }], servicesDone: ['Battery Replacement', 'Electrical Work'], remarks: 'Battery replaced due to failure', photoProofs: [], documents: [], totalCost: 560, status: 'Completed', createdAt: '2024-01-12T10:00:00' },
  { id: 'JC003', vehicleId: 'V004', vehicleNumber: 'KSA-3456-GH', jobDate: '2024-01-15', startTime: '08:30', endTime: '17:00', totalKM: 120000, totalHours: 5500, workers: ['W004', 'W005'], partsUsed: [{ itemId: 'INV006', itemName: 'LED Headlight Assembly', sku: 'ELC-LGT-001', quantity: 2, unitPrice: 380, lineTotal: 760 }, { itemId: 'INV007', itemName: 'Monroe Shock Absorber', sku: 'SUS-SHK-001', quantity: 4, unitPrice: 155, lineTotal: 620 }], servicesDone: ['AC Service', 'Suspension Work', 'Electrical Work'], remarks: 'Major service - AC not cooling, shocks worn out', photoProofs: [], documents: [], totalCost: 1380, status: 'In Progress', createdAt: '2024-01-15T08:30:00' },
  // Tabuk job cards from raw data (sample entries - first 10)
  { id: 'JC004', vehicleId: 'V009', vehicleNumber: '3042/30888', jobDate: '2025-01-11', startTime: '08:00', endTime: '16:00', totalKM: 0, totalHours: 630, workers: ['W011'], partsUsed: [{ itemId: 'INV010', itemName: 'Multipurpose Grease 3kg', sku: 'CON-GRS-001', quantity: 1, unitPrice: 20, lineTotal: 20 }], servicesDone: ['Chisel New Fixing', 'Side Bolt Change', 'Rubber Bush Change', 'Greasing', 'General Check Up'], remarks: 'CHISEL NEW FIXING\nSIDE BOLT CHANGE\nRUBBER BUSH CHANGE\nGREASING\nGENERAL CHEK UP', photoProofs: [], documents: [], totalCost: 20, status: 'Completed', createdAt: '2025-01-11T08:00:00' },
  { id: 'JC005', vehicleId: 'V010', vehicleNumber: '3040/30516', jobDate: '2025-01-11', startTime: '08:00', endTime: '16:00', totalKM: 0, totalHours: 615, workers: ['W011'], partsUsed: [{ itemId: 'INV010', itemName: 'Multipurpose Grease 3kg', sku: 'CON-GRS-001', quantity: 1, unitPrice: 20, lineTotal: 20 }], servicesDone: ['Greasing', 'General Check Up', 'Bolt Fix'], remarks: 'GREASING\nGENERAL CHEK UP\nBOLT FIX', photoProofs: [], documents: [], totalCost: 20, status: 'Completed', createdAt: '2025-01-11T08:00:00' },
  { id: 'JC006', vehicleId: 'V011', vehicleNumber: '7925', jobDate: '2025-01-11', startTime: '08:00', endTime: '16:00', totalKM: 0, totalHours: 5111, workers: ['W011'], partsUsed: [{ itemId: 'INV010', itemName: 'Multipurpose Grease 3kg', sku: 'CON-GRS-001', quantity: 5, unitPrice: 20, lineTotal: 100 }], servicesDone: ['Greasing', 'General Check Up'], remarks: 'GREASING\nGENERAL CHECK UP', photoProofs: [], documents: [], totalCost: 100, status: 'Completed', createdAt: '2025-01-11T08:00:00' },
  { id: 'JC007', vehicleId: 'V012', vehicleNumber: '3797', jobDate: '2025-01-11', startTime: '08:00', endTime: '16:00', totalKM: 0, totalHours: 1593, workers: ['W011'], partsUsed: [{ itemId: 'INV010', itemName: 'Multipurpose Grease 3kg', sku: 'CON-GRS-001', quantity: 2, unitPrice: 20, lineTotal: 40 }], servicesDone: ['AC Problem Checking & Repair', 'Greasing'], remarks: 'AC PROBLEM CHEKING & REPAIR\nGREASING', photoProofs: [], documents: [], totalCost: 40, status: 'Completed', createdAt: '2025-01-11T08:00:00' },
  { id: 'JC008', vehicleId: 'V013', vehicleNumber: '4948', jobDate: '2025-01-11', startTime: '08:00', endTime: '16:00', totalKM: 0, totalHours: 6668, workers: ['W011'], partsUsed: [{ itemId: 'INV010', itemName: 'Multipurpose Grease 3kg', sku: 'CON-GRS-001', quantity: 10, unitPrice: 20, lineTotal: 200 }], servicesDone: ['Greasing', 'General Check Up'], remarks: 'GREASING\nGENERAL CHECK UP', photoProofs: [], documents: [], totalCost: 200, status: 'Completed', createdAt: '2025-01-11T08:00:00' },
  { id: 'JC009', vehicleId: 'V014', vehicleNumber: '2664/21552', jobDate: '2025-01-11', startTime: '08:00', endTime: '16:00', totalKM: 0, totalHours: 1578, workers: ['W012', 'W013'], partsUsed: [{ itemId: 'INV004', itemName: 'Shell Rimula R4 15W-40 20L', sku: 'OIL-ENG-001', quantity: 1, unitPrice: 190, lineTotal: 190 }, { itemId: 'INV008', itemName: 'Air Filter Heavy Duty', sku: 'ENG-FLT-001', quantity: 2, unitPrice: 38, lineTotal: 76 }], servicesDone: ['Main Eng Oil Change Service', 'Oil & Oil Filter Change', 'Air Filter Clean'], remarks: 'MAIN ENG OIL CHANGE SERVICE\nOIL & OIL FILTER CHANGE\nAIR FILTER CLEAN', photoProofs: [], documents: [], totalCost: 266, status: 'Completed', createdAt: '2025-01-11T08:00:00' },
  { id: 'JC010', vehicleId: 'V015', vehicleNumber: '1258', jobDate: '2025-01-11', startTime: '08:00', endTime: '16:00', totalKM: 0, totalHours: 1567, workers: ['W012', 'W013'], partsUsed: [{ itemId: 'INV004', itemName: 'Shell Rimula R4 15W-40 20L', sku: 'OIL-ENG-001', quantity: 1, unitPrice: 190, lineTotal: 190 }, { itemId: 'INV008', itemName: 'Air Filter Heavy Duty', sku: 'ENG-FLT-001', quantity: 1, unitPrice: 38, lineTotal: 38 }], servicesDone: ['Main Eng Oil Change Service', 'Oil & Oil Filter Change', 'Air Filter Clean'], remarks: 'MAIN ENG OIL CHANGE SERVICE\nOIL & OIL FILTER CHANGE\nAIR FILTER CLEAN', photoProofs: [], documents: [], totalCost: 228, status: 'Completed', createdAt: '2025-01-11T08:00:00' },
  { id: 'JC011', vehicleId: 'V016', vehicleNumber: '8523', jobDate: '2025-01-11', startTime: '08:00', endTime: '16:00', totalKM: 0, totalHours: 2260, workers: ['W012', 'W013'], partsUsed: [{ itemId: 'INV004', itemName: 'Shell Rimula R4 15W-40 20L', sku: 'OIL-ENG-001', quantity: 1, unitPrice: 190, lineTotal: 190 }, { itemId: 'INV008', itemName: 'Air Filter Heavy Duty', sku: 'ENG-FLT-001', quantity: 2, unitPrice: 38, lineTotal: 76 }, { itemId: 'INV010', itemName: 'Multipurpose Grease 3kg', sku: 'CON-GRS-001', quantity: 2, unitPrice: 20, lineTotal: 40 }], servicesDone: ['Main Eng Oil Change Service', 'Oil & Oil Filter Change', 'Transmission Oil Change', 'Transmission Oil Filter Change', 'Greasing', 'Air Filter Clean'], remarks: 'MAIN ENG OIL CHANGE SERVICE\nOIL & OIL FILTER CHANGE\nTRANSMISSION OIL CHANGE\nTRANSMISSION OIL FILTER CHANGE\nGREASING\nAIR FILTER CLEAN', photoProofs: [], documents: [], totalCost: 306, status: 'Completed', createdAt: '2025-01-11T08:00:00' },
  { id: 'JC012', vehicleId: 'V020', vehicleNumber: 'Opt8144', jobDate: '2025-01-12', startTime: '08:00', endTime: '16:00', totalKM: 95022, totalHours: 12318, workers: ['W012', 'W013'], partsUsed: [{ itemId: 'INV001', itemName: 'Bridgestone 295/80R22.5', sku: 'TYR-FRT-001', quantity: 2, unitPrice: 820, lineTotal: 1640 }], servicesDone: ['Tyre Blast New Tyre Fixing', 'General Service'], remarks: 'TYRE BLAST NEW TYRE FIXING\nGENERAL SERVICE', photoProofs: [], documents: [], totalCost: 1640, status: 'Completed', createdAt: '2025-01-12T08:00:00' },
];

export const initialServiceHistory: ServiceHistory[] = [
  { id: 'SH001', vehicleId: 'V001', serviceType: 'Oil Change', serviceDate: '2024-01-10', workDone: 'Engine oil changed with filter replacement', partsUsed: [{ itemId: 'INV004', itemName: 'Shell Rimula R4 15W-40 20L', sku: 'OIL-ENG-001', quantity: 2, unitPrice: 190, lineTotal: 380 }], cost: 380, jobCardId: 'JC001' },
  { id: 'SH002', vehicleId: 'V001', serviceType: 'General Inspection', serviceDate: '2024-01-10', workDone: 'Full vehicle inspection completed', partsUsed: [], cost: 0, jobCardId: 'JC001' },
  { id: 'SH003', vehicleId: 'V002', serviceType: 'Battery Replacement', serviceDate: '2024-01-12', workDone: 'Old battery replaced with new ACDelco 150Ah', partsUsed: [{ itemId: 'INV003', itemName: 'ACDelco 150Ah Battery', sku: 'BAT-LA-001', quantity: 1, unitPrice: 560, lineTotal: 560 }], cost: 560, jobCardId: 'JC002' },
  { id: 'SH004', vehicleId: 'V003', serviceType: 'Tyre Rotation', serviceDate: '2023-12-20', workDone: 'All tyres rotated and balanced', partsUsed: [], cost: 25, jobCardId: '' },
  { id: 'SH005', vehicleId: 'V004', serviceType: 'AC Service', serviceDate: '2024-01-15', workDone: 'AC gas refilled and compressor checked', partsUsed: [], cost: 120, jobCardId: 'JC003' },
  // Tabuk service history from raw data
  { id: 'SH006', vehicleId: 'V009', serviceType: 'General Service', serviceDate: '2025-01-11', workDone: 'CHISEL NEW FIXING\nSIDE BOLT CHANGE\nRUBBER BUSH CHANGE\nGREASING\nGENERAL CHEK UP', partsUsed: [{ itemId: 'INV010', itemName: 'Multipurpose Grease 3kg', sku: 'CON-GRS-001', quantity: 1, unitPrice: 20, lineTotal: 20 }], cost: 20, jobCardId: 'JC004' },
  { id: 'SH007', vehicleId: 'V010', serviceType: 'General Service', serviceDate: '2025-01-11', workDone: 'GREASING\nGENERAL CHEK UP\nBOLT FIX', partsUsed: [{ itemId: 'INV010', itemName: 'Multipurpose Grease 3kg', sku: 'CON-GRS-001', quantity: 1, unitPrice: 20, lineTotal: 20 }], cost: 20, jobCardId: 'JC005' },
  { id: 'SH008', vehicleId: 'V011', serviceType: 'General Service', serviceDate: '2025-01-11', workDone: 'GREASING\nGENERAL CHECK UP', partsUsed: [{ itemId: 'INV010', itemName: 'Multipurpose Grease 3kg', sku: 'CON-GRS-001', quantity: 5, unitPrice: 20, lineTotal: 100 }], cost: 100, jobCardId: 'JC006' },
  { id: 'SH009', vehicleId: 'V012', serviceType: 'AC Service', serviceDate: '2025-01-11', workDone: 'AC PROBLEM CHEKING & REPAIR\nGREASING', partsUsed: [{ itemId: 'INV010', itemName: 'Multipurpose Grease 3kg', sku: 'CON-GRS-001', quantity: 2, unitPrice: 20, lineTotal: 40 }], cost: 40, jobCardId: 'JC007' },
  { id: 'SH010', vehicleId: 'V014', serviceType: 'Oil Change', serviceDate: '2025-01-11', workDone: 'MAIN ENG OIL CHANGE SERVICE\nOIL & OIL FILTER CHANGE\nAIR FILTER CLEAN', partsUsed: [{ itemId: 'INV004', itemName: 'Shell Rimula R4 15W-40 20L', sku: 'OIL-ENG-001', quantity: 1, unitPrice: 190, lineTotal: 190 }, { itemId: 'INV008', itemName: 'Air Filter Heavy Duty', sku: 'ENG-FLT-001', quantity: 2, unitPrice: 38, lineTotal: 76 }], cost: 266, jobCardId: 'JC009' },
  { id: 'SH011', vehicleId: 'V020', serviceType: 'Tyre Replacement', serviceDate: '2025-01-12', workDone: 'TYRE BLAST NEW TYRE FIXING\nGENERAL SERVICE', partsUsed: [{ itemId: 'INV001', itemName: 'Bridgestone 295/80R22.5', sku: 'TYR-FRT-001', quantity: 2, unitPrice: 820, lineTotal: 1640 }], cost: 1640, jobCardId: 'JC012' },
];

export const initialDocuments: Document[] = [
  { id: 'DOC001', vehicleId: 'V001', documentType: 'Registration Certificate', documentNumber: 'MH12/2020/123456', issueDate: '2020-05-15', expiryDate: '2035-05-14', fileUrl: '/docs/rc_v001.pdf', status: 'Valid' },
  { id: 'DOC002', vehicleId: 'V001', documentType: 'Insurance', documentNumber: 'INS/2023/789012', issueDate: '2023-06-01', expiryDate: '2024-05-31', fileUrl: '/docs/ins_v001.pdf', status: 'Valid' },
  { id: 'DOC003', vehicleId: 'V001', documentType: 'Pollution Certificate', documentNumber: 'PUC/2023/456789', issueDate: '2023-11-15', expiryDate: '2024-02-14', fileUrl: '/docs/puc_v001.pdf', status: 'Expiring Soon' },
  { id: 'DOC004', vehicleId: 'V002', documentType: 'Insurance', documentNumber: 'INS/2023/345678', issueDate: '2023-03-01', expiryDate: '2024-02-28', fileUrl: '/docs/ins_v002.pdf', status: 'Expiring Soon' },
  { id: 'DOC005', vehicleId: 'V003', documentType: 'Fitness Certificate', documentNumber: 'FIT/2022/901234', issueDate: '2022-08-20', expiryDate: '2024-01-19', fileUrl: '/docs/fit_v003.pdf', status: 'Expired' },
  { id: 'DOC006', driverId: 'D001', documentType: 'Driver License', documentNumber: 'DL1420110012345', issueDate: '2011-04-10', expiryDate: '2031-04-09', fileUrl: '/docs/dl_d001.pdf', status: 'Valid' },
  { id: 'DOC007', vehicleId: 'V004', documentType: 'Permit', documentNumber: 'PER/2023/567890', issueDate: '2023-01-15', expiryDate: '2024-01-14', fileUrl: '/docs/per_v004.pdf', status: 'Expired' },
  { id: 'DOC008', vehicleId: 'V005', documentType: 'Road Tax', documentNumber: 'TAX/2023/234567', issueDate: '2023-04-01', expiryDate: '2024-03-31', fileUrl: '/docs/tax_v005.pdf', status: 'Valid' },
];

export const initialPendingWork: PendingWork[] = [
  { id: 'PW001', vehicleId: 'V001', vehicleNumber: 'MH12AB1234', description: 'Brake pads need replacement - showing wear', priority: 'High', createdDate: '2024-01-10', status: 'Pending' },
  { id: 'PW002', vehicleId: 'V002', vehicleNumber: 'MH14CD5678', description: 'Windshield wiper motor making noise', priority: 'Medium', createdDate: '2024-01-12', status: 'Pending' },
  { id: 'PW003', vehicleId: 'V004', vehicleNumber: 'KA05GH3456', description: 'Rear view mirror cracked', priority: 'Low', createdDate: '2024-01-15', status: 'In Progress' },
  { id: 'PW004', vehicleId: 'V006', vehicleNumber: 'GJ01KL2345', description: 'Engine making unusual sound - needs diagnosis', priority: 'High', createdDate: '2024-01-08', status: 'Pending' },
  { id: 'PW005', vehicleId: 'V007', vehicleNumber: 'WB06MN6789', description: 'Clutch pedal stiff - possible clutch plate issue', priority: 'High', createdDate: '2024-01-05', status: 'Pending' },
];

export const initialScheduledServices: ScheduledService[] = [
  { id: 'SS001', vehicleId: 'V001', serviceType: 'Oil Change', triggerType: 'KM', triggerValue: 5000, lastServiceDate: '2024-01-10', lastServiceKM: 45000, nextDueKM: 50000, status: 'Upcoming' },
  { id: 'SS002', vehicleId: 'V001', serviceType: 'Preventive Maintenance (PM)', triggerType: 'KM', triggerValue: 10000, lastServiceKM: 40000, nextDueKM: 50000, status: 'Upcoming' },
  { id: 'SS003', vehicleId: 'V002', serviceType: 'Oil Change', triggerType: 'KM', triggerValue: 5000, lastServiceKM: 75000, nextDueKM: 80000, status: 'Due' },
  { id: 'SS004', vehicleId: 'V003', serviceType: 'Tyre Rotation', triggerType: 'KM', triggerValue: 10000, lastServiceDate: '2023-12-20', lastServiceKM: 30000, nextDueKM: 40000, status: 'Upcoming' },
  { id: 'SS005', vehicleId: 'V004', serviceType: 'AC Service', triggerType: 'Hours', triggerValue: 500, nextDueKM: 125000, status: 'Due' },
  { id: 'SS006', vehicleId: 'V005', serviceType: 'Brake Service', triggerType: 'KM', triggerValue: 20000, lastServiceKM: 45000, nextDueKM: 65000, status: 'Upcoming' },
  { id: 'SS007', vehicleId: 'V006', serviceType: 'Oil Change', triggerType: 'KM', triggerValue: 5000, lastServiceKM: 95000, nextDueKM: 100000, status: 'Due' },
  { id: 'SS008', vehicleId: 'V007', serviceType: 'General Inspection', triggerType: 'KM', triggerValue: 15000, lastServiceKM: 60000, nextDueKM: 75000, status: 'Upcoming' },
];

// Suppliers - Saudi Arabia
export const suppliers = [
  'Al Futtaim Auto Parts',
  'Abdul Latif Jameel',
  'Petromin Corporation',
  'Zahid Tractor & Heavy Machinery',
  'Saudi Diesel Equipment',
  'Al Jomaih Automotive',
  'Saudi Parts Center',
  'Gulf Auto Parts',
  'Riyadh Spare Parts',
  'Jeddah Auto Supplies',
  'Dammam Parts Hub',
  'Medina Auto Center',
  'Mecca Fleet Services',
  'Tabuk Parts Depot',
  'Abha Auto Supplies',
  'Al Rajhi Auto Parts',
  'Al Yousuf Auto Parts',
  'Saudi Oger Trading',
  'Al Babtain Trading',
  'Al Tuwairqi Group',
  'Saudi Binladin Group',
  'Al Rashid Trading',
  'Al Fozan Trading',
  'Al Gosaibi Trading',
  'Saudi Industrial Services',
  'Riyadh Heavy Equipment',
  'Jeddah Commercial Center',
  'Dammam Industrial Supplies',
  'Khobar Auto Market',
  'Jubail Industrial Parts',
  'Tabuk Construction Supplies',
  'Hail Auto Parts',
  'Abha Commercial Center',
  'Najran Trading Company',
  'Al Kharj Parts Depot',
  'Buraydah Auto Supplies',
  'Taif Commercial Center',
  'Yanbu Industrial Supplies',
  'Qatif Parts Market',
  'Dhahran Service Center',
];
