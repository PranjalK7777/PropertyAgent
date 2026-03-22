export interface PropertyImage {
  key: string;
  label: string;
  url: string;
  order: number;
}

export interface PropertyConfig {
  _id: string;
  name: string;
  address: string;
  type: 'apartment' | 'house' | 'room' | 'studio';
  bedrooms: number;
  bathrooms: number;
  areaSqft?: number;
  areaSqm?: number;
  furnished: boolean;
  askingRent: number;
  deposit: number;
  depositMonths: number;
  leaseDuration: string;
  included: string;
  notIncluded: string;
  parking: string;
  petsPolicy: string;
  smokingPolicy: string;
  keyFeatures: string;
  nearby: string;
  preferredTenants: string;
  genderPreference: 'male' | 'female' | 'any';
  maxOccupants: number;
  availableFrom: string;
  utilityCostMonthly: number;
  depositDeductionPolicy: string;
  images: PropertyImage[];
  agentName: string;
  agentPhone: string;
  ownerPhone: string;
  digestTime: string;
  digestTimezone: string;
  isActive: boolean;
  isRented: boolean;
  createdAt: string;
  updatedAt: string;
}
