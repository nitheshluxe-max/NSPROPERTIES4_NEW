import React, { useState, useEffect, useRef } from 'react';
import { useProperty } from '../context/PropertyContext';
import { PropertyCategory, ListingPurpose, FurnishingStatus, PossessionStatus, SellerType } from '../types/property';
import { X, Check, Upload, Image, MapPin, IndianRupee, Building, Home, CheckCircle2, ChevronRight, ChevronLeft, Eye, Trash2, Plus, Sparkles, Navigation, Loader2, AlertCircle, ShieldCheck, Clock } from 'lucide-react';
import { resolveCoordinates, LOCALITY_COORDINATES, CITY_CENTROIDS } from '../utils/geoData';
import { compressImage } from '../utils/imageCompressor';
import { GoogleLocationPicker } from './GoogleLocationPicker';

interface PostPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PostPropertyModal: React.FC<PostPropertyModalProps> = ({ isOpen, onClose }) => {
  const {
    addProperty,
    setSelectedProperty,
    setFilters
  } = useProperty();

  const [currentStep, setCurrentStep] = useState(1);
  const [successProperty, setSuccessProperty] = useState<any | null>(null);

  // Validation & Submission States
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Form State
  const [sellerType, setSellerType] = useState<SellerType>('owner');
  const [sellerName, setSellerName] = useState('');
  const [sellerPhone, setSellerPhone] = useState('');
  const [sellerEmail, setSellerEmail] = useState('');
  const [company, setCompany] = useState('');

  const [listingType, setListingType] = useState<ListingPurpose>('sale');
  const [propertyType, setPropertyType] = useState<PropertyCategory>('apartment');
  const [title, setTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');

  // Location with precise coordinates
  const [city, setCity] = useState<'Mumbai' | 'Delhi-NCR' | 'Bengaluru' | 'Pune' | 'Hyderabad'>('Mumbai');
  const [locality, setLocality] = useState('');
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number }>(() => resolveCoordinates('Mumbai', ''));

  // Specifications
  const [bedrooms, setBedrooms] = useState(3);
  const [bathrooms, setBathrooms] = useState(3);
  const [balconies, setBalconies] = useState(2);
  const [superBuiltUpArea, setSuperBuiltUpArea] = useState(1500);
  const [carpetArea, setCarpetArea] = useState(1200);
  const [floorNumber, setFloorNumber] = useState(5);
  const [totalFloors, setTotalFloors] = useState(15);
  const [facing, setFacing] = useState<'North' | 'East' | 'North-East' | 'West' | 'South'>('East');
  const [furnishing, setFurnishing] = useState<FurnishingStatus>('semi-furnished');
  const [possession, setPossession] = useState<PossessionStatus>('ready');
  const [possessionDate, setPossessionDate] = useState('Immediate');

  // Land / Commercial specifics
  const [plotArea, setPlotArea] = useState(2400);
  const [plotUnit, setPlotUnit] = useState<'sq.ft' | 'sq.yards' | 'acres'>('sq.ft');
  const [zoning, setZoning] = useState<'Residential NA' | 'Commercial' | 'Industrial' | 'Agricultural'>('Residential NA');
  const [openSides, setOpenSides] = useState(1);
  const [boundaryWall, setBoundaryWall] = useState(true);
  const [commercialSubType, setCommercialSubType] = useState<'Office Space' | 'Retail Showroom' | 'Warehouse'>('Office Space');

  // Pricing
  const [price, setPrice] = useState(15000000); // 1.5 Cr
  const [securityDeposit, setSecurityDeposit] = useState(50000);
  const [maintenanceMonthly, setMaintenanceMonthly] = useState(5000);
  const [priceNegotiable, setPriceNegotiable] = useState(true);
  const [reraId, setReraId] = useState('');

  // Media
  const [selectedPresetImages, setSelectedPresetImages] = useState<string[]>([
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80'
  ]);
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Amenities
  const availableAmenities = [
    'Swimming Pool', 'Gymnasium', 'Clubhouse', '24/7 Security', 'Covered Parking',
    'Power Backup', 'Private Garden', 'High Speed Elevators', 'Piped Gas', 'Children Play Area',
    'EV Charging', 'Tennis Court', 'Water Supply'
  ];
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([
    '24/7 Security', 'Covered Parking', 'Power Backup', 'Gymnasium'
  ]);

  if (!isOpen) return null;

  const toggleAmenity = (item: string) => {
    setSelectedAmenities(prev =>
      prev.includes(item) ? prev.filter(a => a !== item) : [...prev, item]
    );
  };

  const handleCityChange = (newCity: 'Mumbai' | 'Delhi-NCR' | 'Bengaluru' | 'Pune' | 'Hyderabad') => {
    setCity(newCity);
    const resolved = resolveCoordinates(newCity, locality, address);
    setCoordinates(resolved);
  };

  const handleLocalityChange = (newLocality: string) => {
    setLocality(newLocality);
    const resolved = resolveCoordinates(city, newLocality, address);
    setCoordinates(resolved);
  };

  const handleQuickLocality = (locName: string, locCoords: { lat: number; lng: number }) => {
    setLocality(locName);
    setCoordinates(locCoords);
  };

  const handleAddImageUrl = () => {
    if (customImageUrl && customImageUrl.startsWith('http')) {
      setSelectedPresetImages(prev => [...prev, customImageUrl]);
      setCustomImageUrl('');
    }
  };

  // Compress images to ensure safe write within Firestore 1MB document boundary
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    for (const file of Array.from(files)) {
      try {
        const compressed = await compressImage(file, 1000, 750, 0.72);
        if (compressed) {
          setSelectedPresetImages(prev => [...prev, compressed]);
        }
      } catch (err) {
        console.error('Image compression error', err);
      }
    }
    setIsUploading(false);
  };

  const removePhoto = (indexToRemove: number) => {
    setSelectedPresetImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const formatPriceDisplay = (amt: number, purpose: ListingPurpose) => {
    if (!amt || isNaN(amt) || amt <= 0) return '₹ 0';
    if (purpose === 'rent') {
      if (amt >= 100000) return `₹ ${(amt / 100000).toFixed(2)} Lakh/mo`;
      return `₹ ${amt.toLocaleString('en-IN')}/mo`;
    }
    if (amt >= 10000000) {
      return `₹ ${(amt / 10000000).toFixed(2)} Cr`;
    }
    if (amt >= 100000) {
      return `₹ ${(amt / 100000).toFixed(2)} L`;
    }
    return `₹ ${amt.toLocaleString('en-IN')}`;
  };

  // Field-level validator for each wizard step
  const validateStep = (stepNumber: number): boolean => {
    const errs: Record<string, string> = {};

    if (stepNumber === 1) {
      if (!sellerName.trim() || sellerName.trim().length < 2) {
        errs.sellerName = 'Please enter your full name (at least 2 characters)';
      }
      const cleanedPhone = sellerPhone.replace(/\D/g, '');
      if (!cleanedPhone || cleanedPhone.length < 10) {
        errs.sellerPhone = 'Please enter a valid 10-digit mobile number';
      }
    }

    if (stepNumber === 2) {
      if (!city) {
        errs.city = 'Please select a metro city';
      }
      if (!locality.trim() || locality.trim().length < 2) {
        errs.locality = 'Please enter locality or neighborhood';
      }
      if (!address.trim() || address.trim().length < 3) {
        errs.address = 'Please specify society name or street address';
      }
    }

    if (stepNumber === 3) {
      if (propertyType === 'land') {
        if (!plotArea || plotArea <= 0) {
          errs.plotArea = 'Please enter a valid plot area greater than 0';
        }
      } else {
        if (!superBuiltUpArea || superBuiltUpArea <= 0) {
          errs.superBuiltUpArea = 'Please enter super built-up area in sq.ft (> 0)';
        }
      }
    }

    if (stepNumber === 4) {
      if (!title.trim() || title.trim().length < 5) {
        errs.title = 'Please provide a descriptive listing title (min 5 characters)';
      }
      if (!price || price <= 0) {
        errs.price = 'Please enter a valid price in INR (> 0)';
      }
      if (selectedPresetImages.length === 0) {
        errs.images = 'Please select or upload at least 1 property photograph';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setErrors({});
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    // Validate all 4 steps to ensure complete property schema
    for (let s = 1; s <= 4; s++) {
      if (!validateStep(s)) {
        setCurrentStep(s);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const generatedTitle = title.trim();
      const generatedTagline = tagline.trim() || `Prime ${bedrooms} BHK ${propertyType} in ${locality}`;
      const effectiveSuperArea = propertyType === 'land' ? (plotArea || 1200) : (superBuiltUpArea || 1200);

      const newProperty = await addProperty({
        title: generatedTitle,
        tagline: generatedTagline,
        propertyType,
        listingType,
        price: Number(price),
        priceDisplay: formatPriceDisplay(Number(price), listingType),
        pricePerSqFt: Math.round(Number(price) / effectiveSuperArea),
        maintenanceMonthly: Number(maintenanceMonthly) || 0,
        securityDeposit: listingType === 'rent' ? Number(securityDeposit) : undefined,
        isZeroBrokerage: sellerType === 'owner',
        city,
        locality: locality.trim(),
        address: address.trim() || `${locality.trim()}, ${city}`,
        landmark: landmark.trim() || undefined,
        coordinates: {
          lat: coordinates.lat,
          lng: coordinates.lng,
        },
        bedrooms: propertyType === 'land' ? undefined : bedrooms,
        bathrooms: propertyType === 'land' ? undefined : bathrooms,
        balconies: propertyType === 'land' ? undefined : balconies,
        floorNumber: propertyType === 'land' ? undefined : floorNumber,
        totalFloors: propertyType === 'land' ? undefined : totalFloors,
        facing,
        superBuiltUpArea: effectiveSuperArea,
        carpetArea: carpetArea || Math.round(effectiveSuperArea * 0.8),
        plotArea: propertyType === 'land' ? plotArea : undefined,
        plotUnit: propertyType === 'land' ? plotUnit : undefined,
        zoning: propertyType === 'land' ? zoning : undefined,
        openSides: propertyType === 'land' ? openSides : undefined,
        boundaryWall: propertyType === 'land' ? boundaryWall : undefined,
        commercialSubType: propertyType === 'commercial' ? commercialSubType : undefined,
        furnishing,
        possession,
        possessionDate,
        reraId: reraId.trim() || undefined,
        verified: true,
        featured: false,
        images: selectedPresetImages.length > 0 ? selectedPresetImages : [
          'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'
        ],
        amenities: selectedAmenities,
        description: description.trim() || `Prime ${propertyType} property available in ${locality}, ${city}. Excellent location with clear title and prime connectivity.`,
        seller: {
          id: `sel-${Date.now()}`,
          name: sellerName.trim(),
          type: sellerType,
          phone: sellerPhone.trim(),
          email: sellerEmail.trim() || 'seller@nsproperties.in',
          company: company.trim() || (sellerType === 'owner' ? 'Direct Owner' : 'NS Properties 4 Client'),
          verified: true,
          rating: 5.0,
          activeListingsCount: 1
        }
      }, 'pending');

      // Show success modal once property is confirmed saved in the production database
      setSuccessProperty(newProperty);
      setIsSubmitting(false);
    } catch (err) {
      console.error('Failed to post property:', err);
      setSubmitError(err instanceof Error ? err.message : 'Database error: Could not save property. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handlePostAnother = () => {
    setSuccessProperty(null);
    setCurrentStep(1);
    setTitle('');
    setTagline('');
    setPrice(15000000);
    setAddress('');
    setDescription('');
    setSelectedPresetImages([
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80'
    ]);
  };

  const stepNames = ['', 'Basic Details', 'Location & Pin', 'Specifications', 'Pricing & Photos'];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative bg-white w-full max-w-3xl h-[92vh] sm:h-[88vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 z-10">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">Post Property for FREE</h2>
            <p className="text-[11px] sm:text-xs text-slate-500">Instant submission across India on NS Properties 4</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Modal State - Under Review (Manual Admin Approval Only) */}
        {successProperty ? (
          <div className="p-5 sm:p-8 text-center space-y-4 overflow-y-auto">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto shadow-xs border border-amber-200">
              <Clock className="w-8 h-8 sm:w-10 sm:h-10 text-amber-600" />
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100 border border-amber-300 text-amber-900 rounded-full text-xs font-bold tracking-wide">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span>SUBMITTED FOR VERIFICATION</span>
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-slate-900">Property Submitted for Review!</h3>
            <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto">
              Thank you, <strong>{sellerName || 'Partner'}</strong>! Your property listing <strong>"{successProperty.title}"</strong> has been saved and queued for manual verification.
            </p>

            {/* Listing Summary Card */}
            <div className="p-3.5 sm:p-4 bg-slate-50 border border-slate-200 rounded-xl text-left max-w-md mx-auto text-xs space-y-2 font-sans">
              <div className="flex justify-between border-b pb-1">
                <span className="font-semibold text-slate-500">Listing Reference:</span>
                <span className="font-mono font-bold text-slate-900">{successProperty.id}</span>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span className="font-semibold text-slate-500">Status:</span>
                <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[11px] inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Under Review (Admin Approval Required)
                </span>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span className="font-semibold text-slate-500">Price:</span>
                <span className="font-bold text-blue-700 font-mono">{successProperty.priceDisplay}</span>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span className="font-semibold text-slate-500">Location:</span>
                <span className="text-slate-800">{successProperty.locality}, {successProperty.city}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-500">Customer Helpline:</span>
                <span className="text-emerald-700 font-bold font-mono">8073266325</span>
              </div>
            </div>

            {/* Admin Policy Notice */}
            <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl max-w-md mx-auto text-left flex items-start gap-2.5">
              <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-[11px] text-blue-950 leading-relaxed space-y-0.5">
                <span className="font-bold block text-blue-900">Manual Approval Process:</span>
                <p className="text-slate-600">
                  To ensure authentic listings and protect buyers, all submissions must be manually reviewed and verified by an authorized NS Properties administrator.
                </p>
                <p className="text-slate-600 font-medium pt-1">
                  Once approved by the admin desk, your listing will automatically appear live on the public feed and map.
                </p>
              </div>
            </div>

            {/* User Action Controls */}
            <div className="flex flex-col sm:flex-row justify-center gap-2.5 sm:gap-3 pt-2 max-w-md mx-auto">
              <button
                onClick={onClose}
                className="flex-1 px-5 py-2.5 bg-blue-600 text-white font-bold text-xs sm:text-sm rounded-xl hover:bg-blue-700 shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[42px]"
              >
                <span>Done / Back to Website</span>
              </button>
              <button
                onClick={handlePostAnother}
                className="px-4 py-2.5 bg-slate-100 text-slate-700 font-semibold text-xs sm:text-sm rounded-xl hover:bg-slate-200 transition-colors cursor-pointer min-h-[42px]"
              >
                Post Another Property
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Step Progress Indicators */}
            <div className="px-4 sm:px-6 py-2.5 sm:py-3 bg-slate-50 border-b border-slate-200">
              {/* Mobile compact step progress bar */}
              <div className="sm:hidden flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
                    {currentStep}
                  </span>
                  <span className="text-xs font-bold text-slate-800">
                    Step {currentStep} of 4: {stepNames[currentStep]}
                  </span>
                </div>
                <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all duration-300 rounded-full"
                    style={{ width: `${(currentStep / 4) * 100}%` }}
                  />
                </div>
              </div>

              {/* Tablet & Desktop Detailed Multi-Step Header */}
              <div className="hidden sm:flex items-center justify-between text-xs font-semibold text-slate-600">
                <div className={`flex items-center gap-2 ${currentStep >= 1 ? 'text-blue-600 font-bold' : ''}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-slate-200'}`}>1</span>
                  <span>Basic Info</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300" />
                <div className={`flex items-center gap-2 ${currentStep >= 2 ? 'text-blue-600 font-bold' : ''}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-slate-200'}`}>2</span>
                  <span>Location</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300" />
                <div className={`flex items-center gap-2 ${currentStep >= 3 ? 'text-blue-600 font-bold' : ''}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-slate-200'}`}>3</span>
                  <span>Features</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300" />
                <div className={`flex items-center gap-2 ${currentStep >= 4 ? 'text-blue-600 font-bold' : ''}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${currentStep >= 4 ? 'bg-blue-600 text-white' : 'bg-slate-200'}`}>4</span>
                  <span>Pricing & Photos</span>
                </div>
              </div>
            </div>

            {/* Form Scroll Area */}
            <form onSubmit={handleSubmit} noValidate className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-5 sm:space-y-6 text-sm text-slate-800">
              {/* STEP 1: Basic Info & Category */}
              {currentStep === 1 && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  {/* Seller Role */}
                  <div>
                    <label className="block font-bold text-slate-900 mb-2">You are listing as:</label>
                    <div className="grid grid-cols-3 gap-3">
                      {(['owner', 'agent', 'builder'] as SellerType[]).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setSellerType(type)}
                          className={`py-2.5 px-3 rounded-xl border text-center font-bold capitalize transition-all cursor-pointer ${
                            sellerType === type
                              ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-xs'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Purpose: Sell or Rent */}
                  <div>
                    <label className="block font-bold text-slate-900 mb-2">Listing Purpose:</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setListingType('sale');
                          if (price < 100000) setPrice(8500000);
                        }}
                        className={`py-2.5 px-4 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                          listingType === 'sale'
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        Sell Property
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setListingType('rent');
                          if (price > 1000000) setPrice(25000);
                        }}
                        className={`py-2.5 px-4 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                          listingType === 'rent'
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        Rent / Lease Out
                      </button>
                    </div>
                  </div>

                  {/* Property Category: Apartment, Villa, Land, Commercial */}
                  <div>
                    <label className="block font-bold text-slate-900 mb-2">Property Category:</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: 'Apartment / Flat', val: 'apartment' },
                        { label: 'Independent Villa', val: 'villa' },
                        { label: 'Land / Plot', val: 'land' },
                        { label: 'Commercial', val: 'commercial' }
                      ].map((cat) => (
                        <button
                          key={cat.val}
                          type="button"
                          onClick={() => setPropertyType(cat.val as PropertyCategory)}
                          className={`py-3 px-3 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${
                            propertyType === cat.val
                              ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-xs'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Seller Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-200">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Your Full Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Vikram Sharma"
                        value={sellerName}
                        onChange={(e) => {
                          setSellerName(e.target.value);
                          if (errors.sellerName) setErrors(prev => ({ ...prev, sellerName: '' }));
                        }}
                        className={`w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm outline-hidden focus:bg-white ${
                          errors.sellerName ? 'border-rose-500 bg-rose-50/40 focus:border-rose-600' : 'border-slate-200 focus:border-blue-600'
                        }`}
                      />
                      {errors.sellerName && (
                        <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          <span>{errors.sellerName}</span>
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number *</label>
                      <input
                        type="tel"
                        required
                        placeholder="+91 98000 00000"
                        value={sellerPhone}
                        onChange={(e) => {
                          setSellerPhone(e.target.value);
                          if (errors.sellerPhone) setErrors(prev => ({ ...prev, sellerPhone: '' }));
                        }}
                        className={`w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm outline-hidden focus:bg-white ${
                          errors.sellerPhone ? 'border-rose-500 bg-rose-50/40 focus:border-rose-600' : 'border-slate-200 focus:border-blue-600'
                        }`}
                      />
                      {errors.sellerPhone && (
                        <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          <span>{errors.sellerPhone}</span>
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                      <input
                        type="email"
                        placeholder="vikram@example.com"
                        value={sellerEmail}
                        onChange={(e) => setSellerEmail(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-hidden focus:border-blue-600 focus:bg-white"
                      />
                    </div>
                    {sellerType !== 'owner' && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Company / Firm Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Apex Realty Consultants"
                          value={company}
                          onChange={(e) => setCompany(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-hidden focus:border-blue-600 focus:bg-white"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 2: Location & Project */}
              {currentStep === 2 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Metro City *</label>
                      <select
                        value={city}
                        onChange={(e) => handleCityChange(e.target.value as any)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-hidden focus:border-blue-600 focus:bg-white cursor-pointer font-medium"
                      >
                        <option value="Mumbai">Mumbai MMR</option>
                        <option value="Delhi-NCR">Delhi-NCR</option>
                        <option value="Bengaluru">Bengaluru</option>
                        <option value="Pune">Pune</option>
                        <option value="Hyderabad">Hyderabad</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Locality / Area Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Worli, Indiranagar, Whitefield, Hitec City"
                        value={locality}
                        onChange={(e) => {
                          handleLocalityChange(e.target.value);
                          if (errors.locality) setErrors(prev => ({ ...prev, locality: '' }));
                        }}
                        className={`w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm outline-hidden focus:bg-white ${
                          errors.locality ? 'border-rose-500 bg-rose-50/40 focus:border-rose-600' : 'border-slate-200 focus:border-blue-600'
                        }`}
                      />
                      {errors.locality && (
                        <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          <span>{errors.locality}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Popular Localities in this city */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">
                      Popular Localities in {city} (click to set pin):
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(LOCALITY_COORDINATES[city] || {})
                        .slice(0, 8)
                        .map(([locKey, locCoords]) => {
                          const formattedLabel = locKey.replace(/\b\w/g, l => l.toUpperCase());
                          return (
                            <button
                              key={locKey}
                              type="button"
                              onClick={() => {
                                handleQuickLocality(formattedLabel, locCoords);
                                if (errors.locality) setErrors(prev => ({ ...prev, locality: '' }));
                              }}
                              className="text-[11px] px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 rounded-md border border-slate-200 text-slate-700 font-medium transition-colors cursor-pointer"
                            >
                              📍 {formattedLabel}
                            </button>
                          );
                        })}
                    </div>
                  </div>

                  {/* Interactive Google Maps Location Picker with Search & Draggable Pin */}
                  <GoogleLocationPicker
                    city={city}
                    locality={locality}
                    address={address}
                    coords={coordinates}
                    onCoordsChange={setCoordinates}
                  />

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Complete Address / Society Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Tower 2, Oberoi Sky City, Off Western Express Hwy"
                      value={address}
                      onChange={(e) => {
                        setAddress(e.target.value);
                        if (errors.address) setErrors(prev => ({ ...prev, address: '' }));
                      }}
                      className={`w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm outline-hidden focus:bg-white ${
                        errors.address ? 'border-rose-500 bg-rose-50/40 focus:border-rose-600' : 'border-slate-200 focus:border-blue-600'
                      }`}
                    />
                    {errors.address && (
                      <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>{errors.address}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Prominent Landmark</label>
                    <input
                      type="text"
                      placeholder="e.g. Near Metro Station / Behind Phoenix Mall"
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-hidden focus:border-blue-600 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">RERA Registration ID (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. P51900001339"
                      value={reraId}
                      onChange={(e) => setReraId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-hidden focus:border-blue-600 focus:bg-white font-mono"
                    />
                  </div>
                </div>
              )}

              {/* STEP 3: Property Features & Specifications */}
              {currentStep === 3 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  {/* Category-Specific fields */}
                  {propertyType === 'land' ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Plot Area *</label>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={plotArea ? plotArea.toString() : ''}
                            onChange={(e) => {
                              const cleaned = e.target.value.replace(/\D/g, '');
                              const num = cleaned === '' ? 0 : Number(cleaned);
                              setPlotArea(num);
                              setSuperBuiltUpArea(num);
                            }}
                            placeholder="e.g. 1500"
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Plot Unit</label>
                          <select
                            value={plotUnit}
                            onChange={(e) => setPlotUnit(e.target.value as any)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                          >
                            <option value="sq.ft">Square Feet (sq.ft)</option>
                            <option value="sq.yards">Square Yards (Gaj)</option>
                            <option value="acres">Acres</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Zoning Authority</label>
                          <select
                            value={zoning}
                            onChange={(e) => setZoning(e.target.value as any)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                          >
                            <option value="Residential NA">Residential NA</option>
                            <option value="Commercial">Commercial</option>
                            <option value="Industrial">Industrial</option>
                            <option value="Agricultural">Agricultural</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Number of Open Sides</label>
                          <select
                            value={openSides}
                            onChange={(e) => setOpenSides(Number(e.target.value))}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                          >
                            <option value={1}>1 Side Open</option>
                            <option value={2}>2 Sides Open (Corner Plot)</option>
                            <option value={3}>3 Sides Open</option>
                            <option value={4}>4 Sides Open</option>
                          </select>
                        </div>
                      </div>

                      <label className="flex items-center gap-2 cursor-pointer pt-2">
                        <input
                          type="checkbox"
                          checked={boundaryWall}
                          onChange={(e) => setBoundaryWall(e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded-sm"
                        />
                        <span className="text-xs font-semibold text-slate-700">Constructed Boundary / Demarcation Wall Present</span>
                      </label>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Bedrooms */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Bedrooms (BHK)</label>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((num) => (
                            <button
                              key={num}
                              type="button"
                              onClick={() => setBedrooms(num)}
                              className={`py-1.5 px-3 rounded-lg border font-bold text-xs ${
                                bedrooms === num
                                  ? 'bg-blue-600 border-blue-600 text-white'
                                  : 'bg-white border-slate-200 text-slate-700'
                              }`}
                            >
                              {num === 5 ? '5+ BHK' : `${num} BHK`}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Area Measurements */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Super Built-up Area (sq.ft) *</label>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={superBuiltUpArea ? superBuiltUpArea.toString() : ''}
                            onChange={(e) => {
                              const cleaned = e.target.value.replace(/\D/g, '');
                              setSuperBuiltUpArea(cleaned === '' ? 0 : Number(cleaned));
                            }}
                            placeholder="e.g. 1450"
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Carpet Area (sq.ft)</label>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={carpetArea ? carpetArea.toString() : ''}
                            onChange={(e) => {
                              const cleaned = e.target.value.replace(/\D/g, '');
                              setCarpetArea(cleaned === '' ? 0 : Number(cleaned));
                            }}
                            placeholder="e.g. 1150"
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                          />
                        </div>
                      </div>

                      {/* Furnishing & Possession */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Furnishing</label>
                          <select
                            value={furnishing}
                            onChange={(e) => setFurnishing(e.target.value as any)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                          >
                            <option value="fully-furnished">Fully Furnished</option>
                            <option value="semi-furnished">Semi-Furnished</option>
                            <option value="unfurnished">Unfurnished</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Possession Status</label>
                          <select
                            value={possession}
                            onChange={(e) => setPossession(e.target.value as any)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                          >
                            <option value="ready">Ready to Move</option>
                            <option value="under-construction">Under Construction</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Amenities Multi-Check */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2">Amenities & Highlights</label>
                    <div className="flex flex-wrap gap-2">
                      {availableAmenities.map((amenity) => {
                        const isSelected = selectedAmenities.includes(amenity);
                        return (
                          <button
                            key={amenity}
                            type="button"
                            onClick={() => toggleAmenity(amenity)}
                            className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                              isSelected
                                ? 'bg-blue-600 border-blue-600 text-white'
                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {amenity}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: Pricing, Photos & Submit */}
              {currentStep === 4 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  {/* Expected Price */}
                  <div>
                    <div className="flex justify-between items-baseline mb-1">
                      <label className="text-xs font-semibold text-slate-700">
                        {listingType === 'rent' ? 'Expected Monthly Rent (INR) *' : 'Expected Total Price (INR) *'}
                      </label>
                      <span className="text-base font-extrabold text-blue-700 font-mono">
                        {formatPriceDisplay(price, listingType)}
                      </span>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 font-mono font-bold text-sm">
                        ₹
                      </div>
                      <input
                        type="text"
                        inputMode="numeric"
                        autoComplete="off"
                        placeholder={listingType === 'rent' ? 'e.g. 25000' : 'e.g. 8500000'}
                        value={price > 0 ? price.toString() : ''}
                        onChange={(e) => {
                          const cleaned = e.target.value.replace(/\D/g, '');
                          const val = cleaned === '' ? 0 : Number(cleaned);
                          setPrice(val);
                          if (errors.price) setErrors(prev => ({ ...prev, price: '' }));
                        }}
                        className={`w-full pl-8 pr-3 py-2 bg-slate-50 border rounded-lg text-sm font-mono outline-hidden focus:bg-white ${
                          errors.price ? 'border-rose-500 bg-rose-50/40 focus:border-rose-600' : 'border-slate-200 focus:border-blue-600'
                        }`}
                      />
                    </div>
                    {errors.price && (
                      <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>{errors.price}</span>
                      </p>
                    )}

                    {/* Quick Presets for convenient entry without typing large zeroes */}
                    <div className="flex items-center gap-1.5 flex-wrap mt-2">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Presets:</span>
                      {listingType === 'rent'
                        ? [15000, 25000, 35000, 50000, 75000, 100000].map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => {
                                setPrice(preset);
                                if (errors.price) setErrors(prev => ({ ...prev, price: '' }));
                              }}
                              className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold transition-colors cursor-pointer border ${
                                price === preset
                                  ? 'bg-blue-600 text-white border-blue-600'
                                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              ₹ {preset >= 100000 ? `${preset / 100000} L` : `${(preset / 1000).toFixed(0)}k`}/mo
                            </button>
                          ))
                        : [3500000, 6000000, 8500000, 12500000, 20000000, 50000000].map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => {
                                setPrice(preset);
                                if (errors.price) setErrors(prev => ({ ...prev, price: '' }));
                              }}
                              className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold transition-colors cursor-pointer border ${
                                price === preset
                                  ? 'bg-blue-600 text-white border-blue-600'
                                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              ₹ {preset >= 10000000 ? `${(preset / 10000000).toFixed(2)} Cr` : `${preset / 100000} L`}
                            </button>
                          ))}
                    </div>
                  </div>

                  {/* Rent Deposit & Monthly Maintenance */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {listingType === 'rent' && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Security Deposit (INR)
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 font-mono text-xs">
                            ₹
                          </div>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={securityDeposit > 0 ? securityDeposit.toString() : ''}
                            onChange={(e) => {
                              const cleaned = e.target.value.replace(/\D/g, '');
                              setSecurityDeposit(cleaned === '' ? 0 : Number(cleaned));
                            }}
                            placeholder="e.g. 50000"
                            className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono outline-hidden focus:border-blue-600 focus:bg-white"
                          />
                        </div>
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Monthly Maintenance Charges (INR)
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 font-mono text-xs">
                          ₹
                        </div>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={maintenanceMonthly > 0 ? maintenanceMonthly.toString() : ''}
                          onChange={(e) => {
                            const cleaned = e.target.value.replace(/\D/g, '');
                            setMaintenanceMonthly(cleaned === '' ? 0 : Number(cleaned));
                          }}
                          placeholder="e.g. 3500 (0 if inclusive)"
                          className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono outline-hidden focus:border-blue-600 focus:bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Price Negotiable and Zero Brokerage Notice */}
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span className="text-emerald-950 font-medium">
                        {sellerType === 'owner'
                          ? 'Zero Brokerage Certified: 100% Free Owner Listing, 0% Commission'
                          : 'Transparent Direct PropTech Listing on NS Properties 4'}
                      </span>
                    </div>
                    <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-700 select-none">
                      <input
                        type="checkbox"
                        checked={priceNegotiable}
                        onChange={(e) => setPriceNegotiable(e.target.checked)}
                        className="w-3.5 h-3.5 text-blue-600 rounded-sm cursor-pointer"
                      />
                      <span>Negotiable</span>
                    </label>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Listing Headline *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 3 BHK Sea-View Luxury Apartment in Worli"
                      value={title}
                      onChange={(e) => {
                        setTitle(e.target.value);
                        if (errors.title) setErrors(prev => ({ ...prev, title: '' }));
                      }}
                      className={`w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm outline-hidden focus:bg-white ${
                        errors.title ? 'border-rose-500 bg-rose-50/40 focus:border-rose-600' : 'border-slate-200 focus:border-blue-600'
                      }`}
                    />
                    {errors.title && (
                      <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>{errors.title}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Detailed Description</label>
                    <textarea
                      rows={3}
                      placeholder="Highlight special features, nearby schools/IT parks, fittings, and legal status..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>

                  {/* Photos Section */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800">
                        Property Photos ({selectedPresetImages.length} added) *
                      </label>
                      <span className="text-[11px] text-slate-500">Add genuine photos for 5x more inquiries</span>
                    </div>

                    {errors.images && (
                      <p className="text-[11px] text-rose-600 font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>{errors.images}</span>
                      </p>
                    )}

                    {/* Device Upload Area */}
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/50 hover:bg-blue-50/80 rounded-xl p-4 cursor-pointer transition-all group">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                        <Upload className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-slate-800">Choose Photos from Phone / Computer</span>
                      <span className="text-[11px] text-slate-500 mt-0.5">Supports JPG, PNG, WEBP — select multiple files</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                    </label>

                    {/* Quick Curated Property Presets */}
                    <div>
                      <div className="text-[11px] font-semibold text-slate-600 mb-1.5 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>Or add instant HD real-estate photo presets:</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { label: '+ Living Room', url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80' },
                          { label: '+ Master Suite', url: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=80' },
                          { label: '+ Modern Kitchen', url: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&q=80' },
                          { label: '+ Luxury Villa', url: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=80' },
                          { label: '+ Open Land/Plot', url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80' },
                          { label: '+ Commercial Office', url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80' },
                        ].map((preset, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setSelectedPresetImages(prev => [...prev, preset.url])}
                            className="text-[11px] px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-md border border-slate-200 transition-colors cursor-pointer"
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* URL Input */}
                    <div className="flex items-center gap-2">
                      <input
                        type="url"
                        placeholder="Or paste web image link (https://...)"
                        value={customImageUrl}
                        onChange={(e) => setCustomImageUrl(e.target.value)}
                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      />
                      <button
                        type="button"
                        onClick={handleAddImageUrl}
                        className="px-3 py-2 bg-slate-800 text-white text-xs font-semibold rounded-lg hover:bg-slate-700 cursor-pointer"
                      >
                        Add Link
                      </button>
                    </div>

                    {/* Uploaded / Selected Previews Gallery */}
                    {selectedPresetImages.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-[11px] font-semibold text-slate-500">
                          Selected Gallery ({selectedPresetImages.length}):
                        </div>
                        <div className="flex gap-2.5 overflow-x-auto pb-2 pt-1">
                          {selectedPresetImages.map((img, i) => (
                            <div key={i} className="relative w-24 h-20 rounded-xl overflow-hidden border-2 border-slate-200 shrink-0 group shadow-2xs">
                              <img src={img} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                              <button
                                type="button"
                                title="Remove photo"
                                onClick={() => removePhoto(i)}
                                className="absolute top-1 right-1 w-5 h-5 bg-black/75 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors cursor-pointer"
                              >
                                <X className="w-3 h-3" />
                              </button>
                              {i === 0 && (
                                <div className="absolute bottom-0 inset-x-0 bg-blue-600/90 text-white text-[9px] font-bold text-center py-0.5">
                                  Cover Photo
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Submit Error Banner */}
              {submitError && (
                <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-xs text-rose-800 flex items-start gap-2 shadow-xs">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="font-bold block">Database Save Failed:</span>
                    <span>{submitError}</span>
                  </div>
                </div>
              )}

              {/* Sticky Navigation Controls */}
              <div className="sticky bottom-0 -mx-4 sm:-mx-6 -mb-4 sm:-mb-6 pt-3 pb-3 px-4 sm:px-6 bg-white/95 backdrop-blur-md border-t border-slate-200 flex items-center justify-between shadow-[0_-4px_10px_rgba(0,0,0,0.04)] z-20">
                {currentStep > 1 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentStep(prev => prev - 1)}
                    className="flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 active:bg-slate-100 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>
                ) : <div />}

                {currentStep < 4 ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="flex items-center gap-1.5 px-6 py-2.5 min-h-[44px] bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-xs cursor-pointer"
                  >
                    <span>Continue</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 min-h-[44px] bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer disabled:opacity-60 flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Saving to Production Database...</span>
                      </>
                    ) : (
                      <span>Publish Listing for FREE</span>
                    )}
                  </button>
                )}
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
