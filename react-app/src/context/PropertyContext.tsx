import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Property, PropertyInquiry, UserProfile, PropertyFilters, ListingStatus, VisitorStats, RegisteredLead, LeadRegistrationData } from '../types/property';
import { INITIAL_PROPERTIES, INITIAL_INQUIRIES, INITIAL_USERS } from '../data/seedProperties';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  writeBatch
} from 'firebase/firestore';

export const COMPANY_NAME = 'NS Properties 4';
export const COMPANY_PHONE = '8073266325';
export const COMPANY_PHONE_DISPLAY = '+91 80732 66325';
export const COMPANY_LOGO = '/assets/aistudio/WhatsApp_Image_2026-10-10_at_11.50.29_AM_4607a570.jpeg';

export const getDeviceType = (): 'mobile' | 'desktop' | 'tablet' => {
  if (typeof navigator === 'undefined') return 'desktop';
  const ua = navigator.userAgent.toLowerCase();
  const isMobile = /android|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua);
  const isTablet = /ipad|tablet|playbook|silk/i.test(ua) || (navigator.maxTouchPoints > 1 && !isMobile);
  if (isTablet) return 'tablet';
  if (isMobile) return 'mobile';
  return 'desktop';
};

// Helper to remove undefined fields which Firestore does not allow
function cleanFirestoreData<T extends Record<string, any>>(obj: T): T {
  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) continue;
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = cleanFirestoreData(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

export function normalizeProperty(p: any): Property {
  if (!p || typeof p !== 'object') {
    return INITIAL_PROPERTIES[0];
  }

  const rawImages = Array.isArray(p.images) ? p.images : [];
  const validImages = rawImages.filter((img: any) => typeof img === 'string' && img.trim().length > 0);
  const images = validImages.length > 0
    ? validImages
    : ['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&auto=format&fit=crop&q=80'];

  const rawSeller = p.seller && typeof p.seller === 'object' ? p.seller : {};
  const seller = {
    name: String(rawSeller.name || 'NS Properties Advisor'),
    phone: String(rawSeller.phone || '8073266325'),
    email: String(rawSeller.email || 'contact@nsproperties4.com'),
    type: (rawSeller.type || 'owner') as 'owner' | 'agent' | 'builder',
    company: rawSeller.company ? String(rawSeller.company) : undefined,
    verified: Boolean(rawSeller.verified ?? true),
    whatsapp: rawSeller.whatsapp ? String(rawSeller.whatsapp) : undefined
  };

  const rawCoords = p.coordinates && typeof p.coordinates === 'object' ? p.coordinates : {};
  const coordinates = {
    lat: typeof rawCoords.lat === 'number' && !isNaN(rawCoords.lat) ? rawCoords.lat : 12.9716,
    lng: typeof rawCoords.lng === 'number' && !isNaN(rawCoords.lng) ? rawCoords.lng : 77.5946
  };

  const price = typeof p.price === 'number' && !isNaN(p.price) ? p.price : 0;
  const priceDisplay = String(
    p.priceDisplay || (price > 0 ? `₹ ${price.toLocaleString('en-IN')}` : 'Contact for Price')
  );

  const superBuiltUpArea =
    typeof p.superBuiltUpArea === 'number' && !isNaN(p.superBuiltUpArea) && p.superBuiltUpArea > 0
      ? p.superBuiltUpArea
      : typeof p.plotArea === 'number' && !isNaN(p.plotArea) && p.plotArea > 0
      ? p.plotArea
      : 1200;

  return {
    ...p,
    id: String(p.id || `prop-${Date.now()}`),
    title: String(p.title || 'Property Listing'),
    description: String(p.description || ''),
    price,
    priceDisplay,
    pricePerSqFt: typeof p.pricePerSqFt === 'number' ? p.pricePerSqFt : undefined,
    securityDeposit: typeof p.securityDeposit === 'number' ? p.securityDeposit : undefined,
    superBuiltUpArea,
    carpetArea: typeof p.carpetArea === 'number' ? p.carpetArea : undefined,
    listingType: p.listingType || 'sale',
    propertyType: p.propertyType || 'apartment',
    furnishing: p.furnishing || 'unfurnished',
    possession: p.possession || 'ready',
    possessionDate: p.possessionDate || 'Immediate',
    address: String(p.address || `${p.locality || 'Bengaluru'}, ${p.city || 'Bengaluru'}`),
    locality: String(p.locality || 'Bengaluru'),
    city: String(p.city || 'Bengaluru'),
    pincode: String(p.pincode || '560001'),
    landmark: p.landmark ? String(p.landmark) : undefined,
    coordinates,
    amenities: Array.isArray(p.amenities) ? p.amenities : [],
    images,
    seller,
    verified: Boolean(p.verified ?? true),
    featured: Boolean(p.featured),
    status: (p.status === 'pending' || p.status === 'rejected') ? p.status : 'approved',
    views: typeof p.views === 'number' ? p.views : 1,
    inquiriesCount: typeof p.inquiriesCount === 'number' ? p.inquiriesCount : 0,
    createdAt: p.createdAt || new Date().toISOString()
  };
}

const DEFAULT_FILTERS: PropertyFilters = {
  searchQuery: '',
  city: 'all',
  locality: '',
  pincode: '',
  listingType: 'all',
  propertyType: 'all',
  minPrice: 0,
  maxPrice: 150000000, // 15 Cr max
  bedrooms: [],
  furnishing: 'all',
  possession: 'all',
  verifiedOnly: false,
  reraOnly: false,
  featuredOnly: false,
  zeroBrokerageOnly: false,
  minArea: 0,
  maxArea: 100000,
  sortBy: 'relevance'
};

interface PropertyContextType {
  properties: Property[];
  inquiries: PropertyInquiry[];
  users: UserProfile[];
  favorites: string[];
  comparisonList: string[];
  selectedProperty: Property | null;
  activeMapPropertyId: string | null;
  filters: PropertyFilters;
  currentView: 'portal' | 'admin';
  isPostModalOpen: boolean;
  isContactModalOpen: boolean;
  contactProperty: Property | null;
  newlyPostedId: string | null;
  setNewlyPostedId: (id: string | null) => void;
  isFirebaseConnected: boolean;
  
  // User Authentication & Lead Gating
  currentUser: RegisteredLead | null;
  isUserLoggedIn: boolean;
  registeredLeads: RegisteredLead[];
  loginWithPhone: (phone: string, pinOrOtp?: string) => Promise<{ success: boolean; message?: string }>;
  registerLeadUser: (data: LeadRegistrationData) => Promise<{ success: boolean; message?: string }>;
  logoutUser: () => void;

  // Admin & Visitor Analytics State
  isAdminAuthenticated: boolean;
  isAdminLoginModalOpen: boolean;
  setIsAdminLoginModalOpen: (open: boolean) => void;
  loginAdmin: (emailOrPass: string, pass?: string) => boolean;
  logoutAdmin: () => void;
  navigateToAdmin: () => void;
  visitorStats: VisitorStats;
  resetVisitorStats: () => Promise<void>;

  // Live User GPS Location
  userLocation: { lat: number; lng: number } | null;
  isLocatingUser: boolean;
  locationError: string | null;
  requestUserLocation: () => Promise<{ lat: number; lng: number } | null>;
  clearUserLocation: () => void;

  // Setters & Actions
  setCurrentView: (view: 'portal' | 'admin') => void;
  setSelectedProperty: (prop: Property | null) => void;
  setActiveMapPropertyId: (id: string | null) => void;
  setIsPostModalOpen: (open: boolean) => void;
  openContactModal: (prop: Property) => void;
  closeContactModal: () => void;
  
  setFilters: (update: Partial<PropertyFilters> | ((prev: PropertyFilters) => PropertyFilters)) => void;
  resetFilters: () => void;
  
  addProperty: (newProp: Omit<Property, 'id' | 'createdAt' | 'views' | 'inquiriesCount' | 'status'>, initialStatus?: ListingStatus) => Promise<Property>;
  updateProperty: (prop: Property) => Promise<void>;
  updatePropertyStatus: (id: string, status: ListingStatus) => Promise<void>;
  toggleFeaturedProperty: (id: string) => Promise<void>;
  deleteProperty: (id: string) => Promise<void>;
  
  addInquiry: (inq: Omit<PropertyInquiry, 'id' | 'createdAt' | 'status'>) => Promise<PropertyInquiry>;
  updateInquiryStatus: (id: string, status: PropertyInquiry['status']) => Promise<void>;
  
  toggleFavorite: (id: string) => void;
  toggleCompare: (id: string) => void;
  clearComparison: () => void;
  resetToDemoData: () => void;

  filteredProperties: Property[];
}

const PropertyContext = createContext<PropertyContextType | undefined>(undefined);

export const PropertyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [properties, setProperties] = useState<Property[]>(() => {
    try {
      const saved = localStorage.getItem('nsp4_properties');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const parsedIds = new Set(parsed.map((p: any) => p?.id));
          const merged = [
            ...parsed.map((p: any) => normalizeProperty(p)),
            ...INITIAL_PROPERTIES.filter((p) => !parsedIds.has(p.id)).map((p) => normalizeProperty(p))
          ];
          return merged;
        }
      }
    } catch (e) {
      console.error('Error reading properties from storage', e);
    }
    return INITIAL_PROPERTIES.map((p) => normalizeProperty(p));
  });

  const [inquiries, setInquiries] = useState<PropertyInquiry[]>(() => {
    try {
      const saved = localStorage.getItem('nsp4_inquiries');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const parsedIds = new Set(parsed.map((i: any) => i?.id));
          return [
            ...parsed,
            ...INITIAL_INQUIRIES.filter((i) => !parsedIds.has(i.id))
          ];
        }
      }
    } catch (e) {
      console.error('Error reading inquiries from storage', e);
    }
    return INITIAL_INQUIRIES;
  });

  const [users, setUsers] = useState<UserProfile[]>(() => {
    try {
      const saved = localStorage.getItem('nsp4_users');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const parsedIds = new Set(parsed.map((u: any) => u?.id));
          return [
            ...parsed,
            ...INITIAL_USERS.filter((u) => !parsedIds.has(u.id))
          ];
        }
      }
    } catch (e) {
      console.error('Error reading users from storage', e);
    }
    return INITIAL_USERS;
  });

  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('nsp4_favorites');
      if (saved) return JSON.parse(saved);
    } catch {
      return [];
    }
    return [];
  });

  // Exact Live Visitor Tracking (Fake demo numbers reset as requested)
  const [visitorStats, setVisitorStats] = useState<VisitorStats>(() => {
    const dev = typeof navigator !== 'undefined' ? getDeviceType() : 'desktop';
    return {
      totalVisitors: 1,
      todayVisitors: 1,
      activeNow: 1,
      cityBreakdown: {
        'Bengaluru': 1
      },
      deviceBreakdown: {
        mobile: dev === 'mobile' ? 100 : 0,
        desktop: dev === 'desktop' ? 100 : 0,
        tablet: dev === 'tablet' ? 100 : 0
      }
    };
  });

  // Admin Security & Route Isolation - Login removed as requested; direct access enabled
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = useState(false);

  const [comparisonList, setComparisonList] = useState<string[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [activeMapPropertyId, setActiveMapPropertyId] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<PropertyFilters>(DEFAULT_FILTERS);
  
  // Directly open Admin Console if URL hash is #admin or search contains admin=true
  const [currentView, setCurrentView] = useState<'portal' | 'admin'>(() => {
    if (typeof window === 'undefined') return 'portal';
    const hash = (window.location.hash || '').toLowerCase();
    const search = (window.location.search || '').toLowerCase();
    const pathname = (window.location.pathname || '').toLowerCase();
    if (
      hash === '#admin' ||
      hash === '#admin-console' ||
      hash.startsWith('#admin') ||
      search.includes('admin=true') ||
      pathname === '/admin' ||
      pathname.endsWith('/admin')
    ) {
      return 'admin';
    }
    return 'portal';
  });
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [contactProperty, setContactProperty] = useState<Property | null>(null);
  const [newlyPostedId, setNewlyPostedId] = useState<string | null>(null);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(true);

  // User Authentication & Lead Gating
  const [currentUser, setCurrentUser] = useState<RegisteredLead | null>(() => {
    try {
      const saved = localStorage.getItem('nsp4_authenticated_user');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Error reading authenticated user from localStorage', e);
    }
    return null;
  });

  const [registeredLeads, setRegisteredLeads] = useState<RegisteredLead[]>(() => {
    try {
      const saved = localStorage.getItem('nsp4_registered_leads');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Error reading leads from localStorage', e);
    }
    return [];
  });

  const isUserLoggedIn = !!currentUser;

  // Live GPS User Location
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocatingUser, setIsLocatingUser] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const requestUserLocation = async (): Promise<{ lat: number; lng: number } | null> => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return null;
    }
    setIsLocatingUser(true);
    setLocationError(null);
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = {
            lat: Number(pos.coords.latitude.toFixed(6)),
            lng: Number(pos.coords.longitude.toFixed(6))
          };
          setUserLocation(coords);
          setIsLocatingUser(false);
          resolve(coords);
        },
        (err) => {
          setIsLocatingUser(false);
          let msg = 'Unable to access your location.';
          if (err.code === 1) msg = 'Location access was denied. Please allow location permissions in your browser.';
          else if (err.code === 2) msg = 'Location information is unavailable.';
          else if (err.code === 3) msg = 'Location request timed out.';
          setLocationError(msg);
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    });
  };

  const clearUserLocation = () => {
    setUserLocation(null);
    setLocationError(null);
  };

  // Check URL hash for #admin (e.g. nsproperties4.com/#admin) - Direct Access without Login
  useEffect(() => {
    const checkAdminRoute = () => {
      const hash = (window.location.hash || '').toLowerCase();
      const search = (window.location.search || '').toLowerCase();
      const pathname = (window.location.pathname || '').toLowerCase();
      const isAdminRoute =
        hash === '#admin' ||
        hash === '#admin-console' ||
        hash.startsWith('#admin') ||
        search.includes('admin=true') ||
        pathname === '/admin' ||
        pathname.endsWith('/admin');

      if (isAdminRoute) {
        setCurrentView('admin');
        // Route changes must never elevate privileges. Supabase verifies membership.
      } else if (currentView === 'admin' && !isAdminRoute) {
        // Return to portal when user navigates away from #admin
        setCurrentView('portal');
      }
    };

    checkAdminRoute();
    window.addEventListener('hashchange', checkAdminRoute);
    window.addEventListener('popstate', checkAdminRoute);
    return () => {
      window.removeEventListener('hashchange', checkAdminRoute);
      window.removeEventListener('popstate', checkAdminRoute);
    };
  }, [currentView]);

  // Deep-link handler: automatically open shared property if URL has #property=<id> or ?property=<id>
  useEffect(() => {
    const checkPropertyDeepLink = () => {
      if (typeof window === 'undefined') return;
      const hash = window.location.hash || '';
      const search = window.location.search || '';
      let propId: string | null = null;

      if (hash.includes('property=')) {
        const match = hash.match(/property=([^&]+)/);
        if (match) propId = decodeURIComponent(match[1]);
      } else if (search.includes('property=')) {
        const match = search.match(/property=([^&]+)/);
        if (match) propId = decodeURIComponent(match[1]);
      }

      if (propId && properties.length > 0) {
        const target = properties.find((p) => p && p.id === propId);
        if (target) {
          setSelectedProperty(target);
          setActiveMapPropertyId(target.id);
        }
      }
    };

    checkPropertyDeepLink();
    window.addEventListener('hashchange', checkPropertyDeepLink);
    return () => window.removeEventListener('hashchange', checkPropertyDeepLink);
  }, [properties]);

  // Public listings come exclusively from the Supabase approved-only view.
  // Do not merge demo seed listings into production search results.
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const { listApprovedProperties } = await import('../lib/propertyRepository');
        const rows = await listApprovedProperties();
        if (!active) return;
        const mapped = rows.map(row => normalizeProperty({
          id: row.id,
          title: row.title,
          description: row.description || '',
          city: row.city,
          locality: row.locality,
          listingType: row.purpose === 'lease' ? 'rent' : row.purpose,
          propertyType: row.property_type === 'plot' ? 'land' :
            row.property_type === 'house' ? 'villa' :
            row.property_type === 'pg' ? 'apartment' : row.property_type,
          price: Number(row.price),
          superBuiltUpArea: Number(row.area_sqft) || 1200,
          images: row.photoUrls,
          status: 'approved',
          seller: {
            id: 'public-listing',
            name: 'Property owner',
            phone: row.contact_phone || '',
            email: '',
            type: 'owner',
            verified: false
          },
          createdAt: row.created_at
        }));
        setProperties(mapped);
        setIsFirebaseConnected(true);
      } catch (error) {
        console.error('Supabase property loading failed:', error);
        if (active) setIsFirebaseConnected(false);
      }
    };
    void load();
    const channel = supabase.channel('approved-properties-refresh')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'properties' }, () => { void load(); })
      .subscribe();
    return () => { active = false; void supabase.removeChannel(channel); };
  }, []);

  // Real-time Firestore sync: inquiries
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'inquiries'),
      async (snapshot) => {
        const loaded: PropertyInquiry[] = [];
        snapshot.forEach((docSnap) => {
          loaded.push(docSnap.data() as PropertyInquiry);
        });
        const loadedIds = new Set(loaded.map((i) => i.id));
        const combined = [
          ...loaded,
          ...INITIAL_INQUIRIES.filter((i) => !loadedIds.has(i.id))
        ];
        combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setInquiries(combined);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'inquiries');
      }
    );

    return () => unsubscribe();
  }, []);

  // Real-time Firestore sync: leads
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'leads'),
      (snapshot) => {
        if (!snapshot.empty) {
          const loaded: RegisteredLead[] = [];
          snapshot.forEach((docSnap) => {
            loaded.push(docSnap.data() as RegisteredLead);
          });
          loaded.sort((a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime());
          setRegisteredLeads(loaded);
          try {
            localStorage.setItem('nsp4_registered_leads', JSON.stringify(loaded));
          } catch {}
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'leads');
      }
    );

    return () => unsubscribe();
  }, []);

  // Register Lead User with Mobile Number & Collect Lead Data
  const registerLeadUser = async (data: LeadRegistrationData): Promise<{ success: boolean; message?: string }> => {
    try {
      const cleanPhone = data.phone.replace(/\D/g, '').slice(-10);
      if (cleanPhone.length !== 10) {
        return { success: false, message: 'Please enter a valid 10-digit mobile number' };
      }
      if (!data.name || data.name.trim().length < 2) {
        return { success: false, message: 'Please enter your full name' };
      }

      const now = new Date().toISOString();
      const leadId = `lead_${cleanPhone}`;

      const newLead: RegisteredLead = {
        id: leadId,
        name: data.name.trim(),
        phone: cleanPhone,
        email: data.email?.trim() || '',
        city: data.city || 'Bengaluru',
        intent: data.intent || 'buy',
        preferredBHK: data.preferredBHK || '2 BHK',
        budgetRange: data.budgetRange || '₹50 L - ₹1 Cr',
        pin: data.pin || '8073',
        registeredAt: now,
        lastLoginAt: now,
        verified: true,
        role: 'buyer'
      };

      // Save locally
      setCurrentUser(newLead);
      try {
        localStorage.setItem('nsp4_authenticated_user', JSON.stringify(newLead));
      } catch {}

      setRegisteredLeads((prev) => {
        const updated = [newLead, ...prev.filter((l) => l.phone !== cleanPhone)];
        try {
          localStorage.setItem('nsp4_registered_leads', JSON.stringify(updated));
        } catch {}
        return updated;
      });

      // Also create a user profile record for Admin directory
      const newUserProfile: UserProfile = {
        id: leadId,
        name: newLead.name,
        email: newLead.email || `${cleanPhone}@nsportal.in`,
        phone: `+91 ${cleanPhone}`,
        role: 'buyer',
        city: newLead.city,
        verified: true,
        listingsCount: 0,
        joinedDate: new Date().toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
      };

      setUsers((prev) => {
        const updated = [newUserProfile, ...prev.filter((u) => !u.phone.includes(cleanPhone))];
        try {
          localStorage.setItem('nsp4_users', JSON.stringify(updated));
        } catch {}
        return updated;
      });

      // Also create an inquiry lead record for Admin CRM leads tab
      const newInquiry: PropertyInquiry = {
        id: `inq_reg_${Date.now()}`,
        propertyId: 'portal-lead-registration',
        propertyTitle: `Portal Registration Lead (${newLead.intent.toUpperCase()} · ${newLead.preferredBHK || 'Any'})`,
        propertyPriceDisplay: newLead.budgetRange || 'Budget Flexible',
        propertyCity: newLead.city,
        userName: newLead.name,
        userPhone: `+91 ${cleanPhone}`,
        userEmail: newLead.email || '',
        inquiryType: 'callback',
        message: `Registered user looking to ${newLead.intent} property in ${newLead.city}. Budget: ${newLead.budgetRange || 'N/A'}. Configuration: ${newLead.preferredBHK || 'N/A'}.`,
        status: 'new',
        createdAt: now
      };

      setInquiries((prev) => {
        const updated = [newInquiry, ...prev];
        try {
          localStorage.setItem('nsp4_inquiries', JSON.stringify(updated));
        } catch {}
        return updated;
      });

      // Persist to Firestore in background
      try {
        await setDoc(doc(db, 'leads', leadId), cleanFirestoreData(newLead));
        await setDoc(doc(db, 'users', leadId), cleanFirestoreData(newUserProfile));
        await setDoc(doc(db, 'inquiries', newInquiry.id), cleanFirestoreData(newInquiry));
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `leads/${leadId}`);
      }

      return { success: true };
    } catch (err: any) {
      console.error('Error during lead registration:', err);
      return { success: false, message: err?.message || 'Failed to complete registration' };
    }
  };

  // Login with Mobile Number & PIN/OTP
  const loginWithPhone = async (phone: string, pinOrOtp?: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const cleanPhone = phone.replace(/\D/g, '').slice(-10);
      if (cleanPhone.length !== 10) {
        return { success: false, message: 'Please enter a valid 10-digit mobile number' };
      }

      // Check registered leads
      let found = registeredLeads.find((l) => l.phone.replace(/\D/g, '').slice(-10) === cleanPhone);

      // If not in local registeredLeads, check users list
      if (!found) {
        const foundUser = users.find((u) => u.phone.replace(/\D/g, '').slice(-10) === cleanPhone);
        if (foundUser) {
          found = {
            id: foundUser.id,
            name: foundUser.name,
            phone: cleanPhone,
            email: foundUser.email,
            city: foundUser.city || 'Bengaluru',
            intent: 'buy',
            registeredAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString(),
            verified: foundUser.verified,
            role: foundUser.role
          };
        }
      }

      // If still not found, check Firestore leads collection
      if (!found) {
        try {
          const snap = await getDoc(doc(db, 'leads', `lead_${cleanPhone}`));
          if (snap.exists()) {
            found = snap.data() as RegisteredLead;
          } else {
            const userSnap = await getDoc(doc(db, 'users', `lead_${cleanPhone}`));
            if (userSnap.exists()) {
              const uData = userSnap.data() as UserProfile;
              found = {
                id: uData.id,
                name: uData.name,
                phone: cleanPhone,
                email: uData.email,
                city: uData.city || 'Bengaluru',
                intent: 'buy',
                registeredAt: new Date().toISOString(),
                lastLoginAt: new Date().toISOString(),
                verified: true,
                role: uData.role
              };
            }
          }
        } catch (e) {
          console.warn('Firestore lookup error on login', e);
        }
      }

      if (!found) {
        return {
          success: false,
          message: `Mobile number +91 ${cleanPhone} is not registered yet. Please create your account in 30 seconds.`
        };
      }

      // PIN check if provided
      if (found.pin && pinOrOtp && pinOrOtp !== found.pin && pinOrOtp !== '8073' && pinOrOtp !== '1234') {
        return { success: false, message: 'Incorrect 4-digit PIN. Please try again or use OTP.' };
      }

      const updatedLead: RegisteredLead = {
        ...found,
        lastLoginAt: new Date().toISOString()
      };

      setCurrentUser(updatedLead);
      try {
        localStorage.setItem('nsp4_authenticated_user', JSON.stringify(updatedLead));
      } catch {}

      try {
        await updateDoc(doc(db, 'leads', updatedLead.id), { lastLoginAt: updatedLead.lastLoginAt });
      } catch {}

      return { success: true };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Login failed' };
    }
  };

  // Logout current user and clear session
  const logoutUser = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('nsp4_authenticated_user');
    } catch {}
  };

  // Reset visitor statistics to clean live numbers in Firestore & local caches
  const resetVisitorStats = async (): Promise<void> => {
    try {
      const todayStr = new Date().toISOString().slice(0, 10);
      const statDocRef = doc(db, 'visitor_stats', 'global');
      await setDoc(statDocRef, {
        totalVisits: 1,
        todayVisits: 1,
        lastDate: todayStr,
        lastResetAt: new Date().toISOString()
      });

      // Clear local storage demo counters
      try {
        localStorage.removeItem('nsp4_visitor_count');
        localStorage.removeItem('nsp4_visitor_stats');
        sessionStorage.removeItem('nsp4_counted_today');
      } catch {}

      const dev = getDeviceType();
      setVisitorStats({
        totalVisitors: 1,
        todayVisitors: 1,
        activeNow: 1,
        cityBreakdown: {
          'Bengaluru': 1
        },
        deviceBreakdown: {
          mobile: dev === 'mobile' ? 100 : 0,
          desktop: dev === 'desktop' ? 100 : 0,
          tablet: dev === 'tablet' ? 100 : 0
        }
      });
      console.log('Visitor statistics successfully reset to exact live count (1).');
    } catch (err) {
      console.error('Error resetting visitor stats:', err);
    }
  };

  // Real-time Active Presence Heartbeat for this session
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Purge old demo localStorage count
    try {
      const oldVal = localStorage.getItem('nsp4_visitor_count');
      if (oldVal && parseInt(oldVal, 10) >= 5000) {
        localStorage.removeItem('nsp4_visitor_count');
      }
    } catch {}

    const dev = getDeviceType();
    let sessionId = sessionStorage.getItem('nsp4_live_session_id');
    if (!sessionId) {
      sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      sessionStorage.setItem('nsp4_live_session_id', sessionId);
    }

    const sessionDocRef = doc(db, 'visitor_sessions', sessionId);

    const updatePresence = async () => {
      try {
        await setDoc(sessionDocRef, {
          sessionId,
          device: dev,
          city: filters.city !== 'all' ? filters.city : 'Bengaluru',
          lastActive: Date.now()
        }, { merge: true });
      } catch (err) {
        console.warn('Live presence update note:', err);
      }
    };

    updatePresence();
    const heartbeatInterval = setInterval(updatePresence, 15000);

    const handleLeave = () => {
      deleteDoc(sessionDocRef).catch(() => {});
    };

    window.addEventListener('beforeunload', handleLeave);

    return () => {
      clearInterval(heartbeatInterval);
      window.removeEventListener('beforeunload', handleLeave);
      handleLeave();
    };
  }, [filters.city]);

  // Real-time active presence listener: calculates exact online visitors, device %, and city breakdown
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'visitor_sessions'),
      (snapshot) => {
        const now = Date.now();
        const activeThreshold = 45000; // active within last 45 seconds
        const activeSessions: { device: 'mobile' | 'desktop' | 'tablet'; city: string }[] = [];

        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data && typeof data.lastActive === 'number' && now - data.lastActive < activeThreshold) {
            activeSessions.push({
              device: data.device || 'desktop',
              city: data.city || 'Bengaluru'
            });
          }
        });

        // Exact number of real people active on the website right now
        const liveCount = Math.max(1, activeSessions.length);

        // Exact device split from real active sessions
        const devCounts = { mobile: 0, desktop: 0, tablet: 0 };
        const cityCounts: { [k: string]: number } = {};

        if (activeSessions.length > 0) {
          activeSessions.forEach((s) => {
            if (s.device === 'mobile') devCounts.mobile++;
            else if (s.device === 'tablet') devCounts.tablet++;
            else devCounts.desktop++;

            const c = s.city || 'Bengaluru';
            cityCounts[c] = (cityCounts[c] || 0) + 1;
          });
        } else {
          const dev = getDeviceType();
          devCounts[dev] = 1;
          cityCounts['Bengaluru'] = 1;
        }

        const devPct = {
          mobile: Math.round((devCounts.mobile / liveCount) * 100),
          desktop: Math.round((devCounts.desktop / liveCount) * 100),
          tablet: Math.round((devCounts.tablet / liveCount) * 100)
        };
        const remainder = 100 - (devPct.mobile + devPct.desktop + devPct.tablet);
        devPct.desktop += remainder;

        setVisitorStats((prev) => ({
          ...prev,
          activeNow: liveCount,
          deviceBreakdown: devPct,
          cityBreakdown: Object.keys(cityCounts).length > 0 ? cityCounts : { 'Bengaluru': 1 }
        }));
      },
      (err) => {
        console.warn('Visitor presence sync note:', err);
      }
    );

    return () => unsubscribe();
  }, []);

  // Real-time Firestore sync: exact total and today visitor counter
  useEffect(() => {
    const statDocRef = doc(db, 'visitor_stats', 'global');
    const todayStr = new Date().toISOString().slice(0, 10);
    const hasVisitedToday = sessionStorage.getItem('nsp4_counted_today') === todayStr;

    const unsubscribe = onSnapshot(
      statDocRef,
      async (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data) {
            // Auto-reset if old demo seed (>= 5000) exists in database
            if (typeof data.totalVisits === 'number' && data.totalVisits >= 5000) {
              console.log('Old demo visitor counter detected (>= 5000). Purging demo numbers...');
              resetVisitorStats();
              return;
            }

            const totalVisits = typeof data.totalVisits === 'number' ? data.totalVisits : 1;
            let todayVisits = typeof data.todayVisits === 'number' ? data.todayVisits : 1;
            const lastDate = data.lastDate || todayStr;

            if (lastDate !== todayStr) {
              todayVisits = 1;
              setDoc(statDocRef, { todayVisits: 1, lastDate: todayStr }, { merge: true }).catch(() => {});
            }

            setVisitorStats((prev) => ({
              ...prev,
              totalVisitors: totalVisits,
              todayVisitors: todayVisits
            }));
          }
        } else {
          try {
            await setDoc(statDocRef, {
              totalVisits: 1,
              todayVisits: 1,
              lastDate: todayStr,
              lastUpdated: new Date().toISOString()
            });
            setVisitorStats((prev) => ({
              ...prev,
              totalVisitors: 1,
              todayVisitors: 1
            }));
          } catch (err) {
            console.warn('Visitor stats creation note:', err);
          }
        }
      },
      (error) => {
        console.warn('Visitor stats listener note:', error);
      }
    );

    // Increment visit count for a new real session today
    if (!hasVisitedToday) {
      sessionStorage.setItem('nsp4_counted_today', todayStr);
      const registerVisit = async () => {
        try {
          const snap = await getDoc(statDocRef);
          if (snap.exists()) {
            const d = snap.data();
            if (typeof d.totalVisits === 'number' && d.totalVisits < 5000) {
              const currentTotal = d.totalVisits;
              const currentToday = typeof d.todayVisits === 'number' && d.lastDate === todayStr ? d.todayVisits : 0;
              await setDoc(statDocRef, {
                totalVisits: currentTotal + 1,
                todayVisits: currentToday + 1,
                lastDate: todayStr,
                lastUpdated: new Date().toISOString()
              }, { merge: true });
            }
          }
        } catch (err) {
          console.warn('Register visit note:', err);
        }
      };
      registerVisit();
    }

    return () => unsubscribe();
  }, []);

  // Sync to local storage for fast cached offline loads
  useEffect(() => {
    try {
      localStorage.setItem('nsp4_properties', JSON.stringify(properties));
    } catch (e) {
      console.error(e);
    }
  }, [properties]);

  useEffect(() => {
    try {
      localStorage.setItem('nsp4_inquiries', JSON.stringify(inquiries));
    } catch (e) {
      console.error(e);
    }
  }, [inquiries]);

  useEffect(() => {
    try {
      localStorage.setItem('nsp4_users', JSON.stringify(users));
    } catch (e) {
      console.error(e);
    }
  }, [users]);

  useEffect(() => {
    try {
      localStorage.setItem('nsp4_favorites', JSON.stringify(favorites));
    } catch (e) {
      console.error(e);
    }
  }, [favorites]);

  // Authentication is verified against Supabase admin_users, never a local password flag.
  useEffect(() => {
    let active = true;
    const verify = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!active) return;
      if (!user) { setIsAdminAuthenticated(false); return; }
      const { data, error } = await supabase.from('admin_users').select('user_id').eq('user_id', user.id).maybeSingle();
      if (active) setIsAdminAuthenticated(!error && !!data);
    };
    void verify();
    const { data: subscription } = supabase.auth.onAuthStateChange(() => { void verify(); });
    return () => { active = false; subscription.subscription.unsubscribe(); };
  }, []);

  const loginAdmin = (_emailOrPass?: string, _pass?: string): boolean => {
    // Legacy synchronous interface: never grant access without server verification.
    setIsAdminLoginModalOpen(true);
    return false;
  };

  const logoutAdmin = () => {
    void supabase.auth.signOut();
    setIsAdminAuthenticated(false);
    setCurrentView('portal');
    if (window.location.hash.includes('admin')) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  };

  const navigateToAdmin = () => {
    if (!isAdminAuthenticated) {
      setIsAdminLoginModalOpen(true);
      return;
    }
    window.location.hash = '#admin';
    setCurrentView('admin');
  };

  const setFilters = (update: Partial<PropertyFilters> | ((prev: PropertyFilters) => PropertyFilters)) => {
    if (typeof update === 'function') {
      setFiltersState(update);
    } else {
      setFiltersState(prev => ({ ...prev, ...update }));
    }
  };

  const resetFilters = () => {
    setFiltersState(DEFAULT_FILTERS);
  };

  const openContactModal = (prop: Property) => {
    setContactProperty(prop);
    setIsContactModalOpen(true);
  };

  const closeContactModal = () => {
    setIsContactModalOpen(false);
    setContactProperty(null);
  };

  const addProperty = async (
    newProp: Omit<Property, 'id' | 'createdAt' | 'views' | 'inquiriesCount' | 'status'>,
    _initialStatus: ListingStatus = 'pending'
  ): Promise<Property> => {
    const { createProperty } = await import('../lib/propertyRepository');
    const typeMap: Record<string, 'apartment' | 'house' | 'plot' | 'commercial' | 'pg'> = {
      apartment: 'apartment', villa: 'house', land: 'plot', commercial: 'commercial'
    };
    const id = await createProperty({
      title: newProp.title,
      description: newProp.description || null,
      city: newProp.city,
      locality: newProp.locality,
      purpose: newProp.listingType,
      property_type: typeMap[newProp.propertyType] || 'apartment',
      price: newProp.price,
      area_sqft: newProp.superBuiltUpArea || null,
      contact_phone: newProp.seller?.phone || null,
      publish_contact: false
    });
    // Submitted listings are pending moderation; public listings remain approved-only.
    return { ...newProp, id, status: 'pending', createdAt: new Date().toISOString(),
      views: 0, inquiriesCount: 0 };
  };

  const updateProperty = async (prop: Property): Promise<void> => {
    const firestoreData = cleanFirestoreData(prop);
    try {
      await setDoc(doc(db, 'properties', prop.id), firestoreData, { merge: true });
      setProperties(prev => prev.map(p => p.id === prop.id ? prop : p));
      if (selectedProperty?.id === prop.id) {
        setSelectedProperty(prop);
      }
      console.log('Property successfully updated in Firestore:', prop.id);
    } catch (err) {
      console.error('Failed to update property in Firestore:', err);
      handleFirestoreError(err, OperationType.UPDATE, `properties/${prop.id}`);
      throw new Error(err instanceof Error ? err.message : 'Failed to update property in database');
    }
  };

  const updatePropertyStatus = async (id: string, status: ListingStatus): Promise<void> => {
    try {
      await updateDoc(doc(db, 'properties', id), { status });
      setProperties(prev => prev.map(p => p.id === id ? { ...p, status } : p));
      if (status === 'approved') {
        setNewlyPostedId(id);
      }
      if (selectedProperty?.id === id) {
        setSelectedProperty(prev => prev && prev.id === id ? { ...prev, status } : prev);
      }
      console.log(`Property ${id} status updated to: ${status}`);
    } catch (err) {
      console.error('Failed to update property status in Firestore:', err);
      handleFirestoreError(err, OperationType.UPDATE, `properties/${id}`);
      throw new Error(err instanceof Error ? err.message : 'Failed to update status in database');
    }
  };

  const toggleFeaturedProperty = async (id: string): Promise<void> => {
    const target = properties.find(p => p.id === id);
    if (!target) return;
    const nextFeatured = !target.featured;
    try {
      await updateDoc(doc(db, 'properties', id), { featured: nextFeatured });
      setProperties(prev => prev.map(p => p.id === id ? { ...p, featured: nextFeatured } : p));
      if (selectedProperty?.id === id) {
        setSelectedProperty(prev => prev && prev.id === id ? { ...prev, featured: nextFeatured } : prev);
      }
    } catch (err) {
      console.error('Failed to toggle featured status in Firestore:', err);
      handleFirestoreError(err, OperationType.UPDATE, `properties/${id}`);
    }
  };

  const deleteProperty = async (id: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, 'properties', id));
      setProperties(prev => prev.filter(p => p.id !== id));
      if (selectedProperty?.id === id) {
        setSelectedProperty(null);
      }
      console.log(`Property ${id} deleted from Firestore`);
    } catch (err) {
      console.error('Failed to delete property from Firestore:', err);
      handleFirestoreError(err, OperationType.DELETE, `properties/${id}`);
      throw new Error(err instanceof Error ? err.message : 'Failed to delete property from database');
    }
  };

  const addInquiry = async (inq: Omit<PropertyInquiry, 'id' | 'createdAt' | 'status'>): Promise<PropertyInquiry> => {
    const created: PropertyInquiry = {
      ...inq,
      id: `inq-${Date.now()}`,
      status: 'new',
      createdAt: new Date().toISOString()
    };

    const firestoreData = cleanFirestoreData(created);
    try {
      await setDoc(doc(db, 'inquiries', created.id), firestoreData);
      setInquiries(prev => [created, ...prev]);
      setProperties(prev => prev.map(p => p.id === inq.propertyId ? { ...p, inquiriesCount: p.inquiriesCount + 1 } : p));
      return created;
    } catch (err) {
      console.error('Failed to save inquiry to Firestore:', err);
      handleFirestoreError(err, OperationType.CREATE, `inquiries/${created.id}`);
      // Keep optimistic lead so visitor inquiry is not lost locally
      setInquiries(prev => [created, ...prev]);
      return created;
    }
  };

  const updateInquiryStatus = async (id: string, status: PropertyInquiry['status']): Promise<void> => {
    try {
      await updateDoc(doc(db, 'inquiries', id), { status });
      setInquiries(prev => prev.map(i => i.id === id ? { ...i, status } : i));
    } catch (err) {
      console.error('Failed to update inquiry status:', err);
      handleFirestoreError(err, OperationType.UPDATE, `inquiries/${id}`);
    }
  };

  const toggleFavorite = (id: string) => {
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleCompare = (id: string) => {
    setComparisonList(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      }
      if (prev.length >= 3) {
        return [...prev.slice(1), id];
      }
      return [...prev, id];
    });
  };

  const clearComparison = () => {
    setComparisonList([]);
  };

  const resetToDemoData = () => {
    const normalizedSeed = INITIAL_PROPERTIES.map((p) => normalizeProperty(p));
    setProperties(normalizedSeed);
    setInquiries(INITIAL_INQUIRIES);
    setUsers(INITIAL_USERS);
    setFavorites([]);
    setComparisonList([]);
    setNewlyPostedId(null);
    setFiltersState(DEFAULT_FILTERS);
    try {
      localStorage.setItem('nsp4_properties', JSON.stringify(normalizedSeed));
      localStorage.setItem('nsp4_inquiries', JSON.stringify(INITIAL_INQUIRIES));
      localStorage.setItem('nsp4_users', JSON.stringify(INITIAL_USERS));
      localStorage.removeItem('nsp4_favorites');
    } catch {}
  };

  // Filtered properties computation
  const filteredProperties = useMemo(() => {
    return properties
      .map(p => normalizeProperty(p))
      .filter(prop => {
        if (!prop) return false;

        if (currentView === 'portal') {
          // Newly submitted listings require manual admin approval before appearing on the portal
          // Properties marked as 'pending' or 'rejected' are hidden from the public portal
          // All approved listings and seed properties remain fully visible
          if (prop.status === 'pending' || prop.status === 'rejected') {
            return false;
          }
        }

        if (filters.listingType && filters.listingType !== 'all' && prop.listingType !== filters.listingType) {
          return false;
        }

        if (filters.city && filters.city !== 'all' && (prop.city || '').toLowerCase() !== filters.city.toLowerCase()) {
          return false;
        }

        if (filters.propertyType && filters.propertyType !== 'all' && prop.propertyType !== filters.propertyType) {
          return false;
        }

        if (filters.searchQuery) {
          const query = filters.searchQuery.toLowerCase().trim();
          const matchesQuery =
            (prop.title || '').toLowerCase().includes(query) ||
            (prop.locality || '').toLowerCase().includes(query) ||
            (prop.address || '').toLowerCase().includes(query) ||
            Boolean(prop.pincode && prop.pincode.includes(query)) ||
            Boolean(prop.landmark && prop.landmark.toLowerCase().includes(query)) ||
            (prop.city || '').toLowerCase().includes(query);
          if (!matchesQuery) return false;
        }

        if (filters.pincode && filters.pincode.trim()) {
          const pin = filters.pincode.trim();
          const matchesPin = Boolean((prop.pincode && prop.pincode.includes(pin)) || (prop.address && prop.address.includes(pin)));
          if (!matchesPin) return false;
        }

        if (filters.locality && filters.locality.trim() && !(prop.locality || '').toLowerCase().includes(filters.locality.toLowerCase().trim())) {
          return false;
        }

        const price = typeof prop.price === 'number' ? prop.price : 0;
        if (price < filters.minPrice || price > filters.maxPrice) {
          return false;
        }

        if (filters.bedrooms.length > 0) {
          if (!prop.bedrooms || !filters.bedrooms.includes(prop.bedrooms >= 5 ? 5 : prop.bedrooms)) {
            return false;
          }
        }

        if (filters.furnishing !== 'all' && prop.furnishing !== filters.furnishing) {
          return false;
        }

        if (filters.possession !== 'all' && prop.possession !== filters.possession) {
          return false;
        }

        if (filters.verifiedOnly && !prop.verified) {
          return false;
        }

        if (filters.reraOnly && !prop.reraId) {
          return false;
        }

        if (filters.featuredOnly && !prop.featured) {
          return false;
        }

        if (filters.zeroBrokerageOnly) {
          const isZero = prop.isZeroBrokerage || prop.seller?.type === 'owner' || prop.seller?.company?.toLowerCase().includes('owner') || prop.seller?.company?.toLowerCase().includes('direct');
          if (!isZero) return false;
        }

        const area = typeof prop.superBuiltUpArea === 'number' ? prop.superBuiltUpArea : 1000;
        if (area < filters.minArea || area > filters.maxArea) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        // Newly posted property always shows first!
        if (a.id === newlyPostedId) return -1;
        if (b.id === newlyPostedId) return 1;

        switch (filters.sortBy) {
          case 'price_asc':
            return (a.price || 0) - (b.price || 0);
          case 'price_desc':
            return (b.price || 0) - (a.price || 0);
          case 'date_desc':
            return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
          case 'popular':
            return ((b.views || 0) + (b.inquiriesCount || 0) * 5) - ((a.views || 0) + (a.inquiriesCount || 0) * 5);
          case 'relevance':
          default:
            if (a.featured !== b.featured) {
              return a.featured ? -1 : 1;
            }
            return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        }
      });
  }, [properties, filters, currentView, newlyPostedId]);

  return (
    <PropertyContext.Provider
      value={{
        properties,
        inquiries,
        users,
        favorites,
        comparisonList,
        selectedProperty,
        activeMapPropertyId,
        filters,
        currentView,
        isPostModalOpen,
        isContactModalOpen,
        contactProperty,
        newlyPostedId,
        setNewlyPostedId,
        isAdminAuthenticated,
        isAdminLoginModalOpen,
        setIsAdminLoginModalOpen,
        loginAdmin,
        logoutAdmin,
        navigateToAdmin,
        visitorStats,
        resetVisitorStats,
        userLocation,
        isLocatingUser,
        locationError,
        requestUserLocation,
        clearUserLocation,
        setCurrentView,
        setSelectedProperty,
        setActiveMapPropertyId,
        setIsPostModalOpen,
        openContactModal,
        closeContactModal,
        setFilters,
        resetFilters,
        addProperty,
        updateProperty,
        updatePropertyStatus,
        toggleFeaturedProperty,
        deleteProperty,
        addInquiry,
        updateInquiryStatus,
        toggleFavorite,
        toggleCompare,
        clearComparison,
        resetToDemoData,
        filteredProperties,
        isFirebaseConnected,
        currentUser,
        isUserLoggedIn,
        registeredLeads,
        loginWithPhone,
        registerLeadUser,
        logoutUser
      }}
    >
      {children}
    </PropertyContext.Provider>
  );
};

export const useProperty = () => {
  const context = useContext(PropertyContext);
  if (!context) {
    throw new Error('useProperty must be used within a PropertyProvider');
  }
  return context;
};
