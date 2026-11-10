export type PropertyCategory = 'apartment' | 'villa' | 'land' | 'commercial';
export type ListingPurpose = 'sale' | 'rent';
export type FurnishingStatus = 'unfurnished' | 'semi-furnished' | 'fully-furnished';
export type PossessionStatus = 'ready' | 'under-construction' | 'new-launch';
export type SellerType = 'owner' | 'agent' | 'builder';
export type ListingStatus = 'approved' | 'pending' | 'rejected';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface SellerInfo {
  id: string;
  name: string;
  type: SellerType;
  phone: string;
  email: string;
  company?: string;
  verified: boolean;
  rating?: number;
  activeListingsCount?: number;
}

export interface Property {
  id: string;
  title: string;
  tagline: string;
  propertyType: PropertyCategory;
  listingType: ListingPurpose;
  price: number; // in INR
  priceDisplay: string; // e.g. "₹ 2.45 Cr" or "₹ 55,000/mo"
  pricePerSqFt?: number;
  maintenanceMonthly?: number;
  securityDeposit?: number;
  isZeroBrokerage?: boolean;
  
  city: 'Mumbai' | 'Delhi-NCR' | 'Bengaluru' | 'Pune' | 'Hyderabad';
  locality: string;
  address: string;
  pincode?: string;
  landmark?: string;
  coordinates: Coordinates;

  // Residential details
  bedrooms?: number; // 1, 2, 3, 4, 5+
  bathrooms?: number;
  balconies?: number;
  floorNumber?: number;
  totalFloors?: number;
  facing?: 'North' | 'East' | 'North-East' | 'West' | 'South';

  // Area measurements
  superBuiltUpArea: number; // in sq.ft
  carpetArea?: number; // in sq.ft
  plotArea?: number; // for Land: in sq.yards or acres
  plotUnit?: 'sq.ft' | 'sq.yards' | 'acres';

  // Land / Commercial specifics
  zoning?: 'Residential NA' | 'Commercial' | 'Industrial' | 'Agricultural';
  openSides?: number;
  boundaryWall?: boolean;
  commercialSubType?: 'Office Space' | 'Retail Showroom' | 'Warehouse' | 'Coworking Desk';

  // Status & Compliance
  furnishing: FurnishingStatus;
  possession: PossessionStatus;
  possessionDate: string; // e.g. "Immediate", "Dec 2026"
  reraId?: string;
  verified: boolean;
  featured: boolean;
  status: ListingStatus;

  // Media & Amenities
  images: string[];
  floorPlanUrl?: string;
  videoTourUrl?: string;
  amenities: string[];
  description: string;

  // Metadata & Metrics
  seller: SellerInfo;
  createdAt: string;
  views: number;
  inquiriesCount: number;

  // Historical Price Trends (Locality Price Records)
  priceHistory?: PriceHistoryRecord[];
}

export interface PriceHistoryRecord {
  year: number; // e.g. 2021, 2022, 2023, 2024, 2025, 2026
  quarter?: string; // e.g. "Q1", "Q2", "Q4"
  avgPricePerSqFt: number; // in INR
  appreciationRate?: number; // e.g. 7.5 (%)
  recordedDate?: string;
  localityDemandIndex?: number; // 1-100 scale
}

export interface PropertyInquiry {
  id: string;
  propertyId: string;
  propertyTitle: string;
  propertyPriceDisplay: string;
  propertyCity: string;
  userName: string;
  userPhone: string;
  userEmail: string;
  inquiryType: 'callback' | 'site_visit' | 'whatsapp' | 'price_sheet';
  scheduledDate?: string;
  message: string;
  status: 'new' | 'contacted' | 'visit_scheduled' | 'closed';
  createdAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'owner' | 'agent' | 'builder' | 'buyer' | 'admin';
  city: string;
  verified: boolean;
  listingsCount: number;
  joinedDate: string;
}

export interface RegisteredLead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  city: string;
  intent: 'buy' | 'rent' | 'plot' | 'commercial' | 'sell';
  preferredBHK?: string;
  budgetRange?: string;
  pin?: string;
  registeredAt: string;
  lastLoginAt: string;
  verified: boolean;
  role?: 'buyer' | 'owner' | 'agent' | 'builder' | 'admin';
}

export interface LeadRegistrationData {
  name: string;
  phone: string;
  email?: string;
  city: string;
  intent: 'buy' | 'rent' | 'plot' | 'commercial' | 'sell';
  preferredBHK?: string;
  budgetRange?: string;
  pin?: string;
}

export interface PropertyFilters {
  searchQuery: string;
  city: string;
  locality: string;
  pincode?: string;
  listingType: ListingPurpose | 'all';
  propertyType: PropertyCategory | 'all';
  minPrice: number;
  maxPrice: number;
  bedrooms: number[]; // e.g. [2, 3]
  furnishing: FurnishingStatus | 'all';
  possession: PossessionStatus | 'all';
  verifiedOnly: boolean;
  reraOnly: boolean;
  featuredOnly: boolean;
  zeroBrokerageOnly?: boolean;
  minArea: number;
  maxArea: number;
  sortBy: 'relevance' | 'price_asc' | 'price_desc' | 'date_desc' | 'popular';
}

export interface VisitorStats {
  totalVisitors: number;
  todayVisitors: number;
  activeNow: number;
  cityBreakdown: { [city: string]: number };
  deviceBreakdown: { mobile: number; desktop: number; tablet: number };
}
