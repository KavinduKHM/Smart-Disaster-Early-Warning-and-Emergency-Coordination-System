export interface ReliefDashboard {
  totalShelters: number;
  availableShelters: number;
  fullShelters: number;
  totalCapacity: number;
  totalOccupancy: number;
  occupancyPercentage: number;

  totalResources: number;
  lowStockResources: number;

  openReliefNeeds: number;
  pendingAllocations: number;
}