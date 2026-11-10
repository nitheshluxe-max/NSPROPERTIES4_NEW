// Comprehensive Metro Locality Coordinates Dictionary for NS Properties 4

export interface CityCentroid {
  lat: number;
  lng: number;
  zoom: number;
}

export const CITY_CENTROIDS: Record<string, CityCentroid> = {
  'Mumbai': { lat: 19.0760, lng: 72.8777, zoom: 12 },
  'Delhi-NCR': { lat: 28.5355, lng: 77.2410, zoom: 11 },
  'Bengaluru': { lat: 12.9716, lng: 77.5946, zoom: 12 },
  'Pune': { lat: 18.5204, lng: 73.8567, zoom: 12 },
  'Hyderabad': { lat: 17.3850, lng: 78.4867, zoom: 12 },
};

export const LOCALITY_COORDINATES: Record<string, Record<string, { lat: number; lng: number }>> = {
  'Mumbai': {
    'worli': { lat: 19.0178, lng: 72.8178 },
    'bandra': { lat: 19.0596, lng: 72.8295 },
    'bandra west': { lat: 19.0596, lng: 72.8295 },
    'bandra east': { lat: 19.0620, lng: 72.8460 },
    'bkc': { lat: 19.0660, lng: 72.8680 },
    'bandra kurla complex': { lat: 19.0660, lng: 72.8680 },
    'juhu': { lat: 19.1075, lng: 72.8263 },
    'andheri': { lat: 19.1136, lng: 72.8697 },
    'andheri west': { lat: 19.1363, lng: 72.8277 },
    'andheri east': { lat: 19.1136, lng: 72.8697 },
    'powai': { lat: 19.1176, lng: 72.9060 },
    'lower parel': { lat: 18.9984, lng: 72.8300 },
    'dadar': { lat: 19.0178, lng: 72.8478 },
    'malad': { lat: 19.1874, lng: 72.8484 },
    'goregaon': { lat: 19.1663, lng: 72.8526 },
    'borivali': { lat: 19.2307, lng: 72.8567 },
    'chembur': { lat: 19.0522, lng: 72.8994 },
    'ghatkopar': { lat: 19.0860, lng: 72.9080 },
    'thane': { lat: 19.2183, lng: 72.9781 },
    'thane west': { lat: 19.2183, lng: 72.9781 },
    'navi mumbai': { lat: 19.0330, lng: 73.0297 },
    'vashi': { lat: 19.0771, lng: 72.9986 },
    'kharghar': { lat: 19.0434, lng: 73.0645 },
    'panvel': { lat: 18.9894, lng: 73.1175 },
    'colaba': { lat: 18.9067, lng: 72.8147 },
    'marine drive': { lat: 18.9432, lng: 72.8230 },
  },
  'Delhi-NCR': {
    'south delhi': { lat: 28.5355, lng: 77.2100 },
    'vasant kunj': { lat: 28.5244, lng: 77.1555 },
    'greater kailash': { lat: 28.5435, lng: 77.2435 },
    'connaught place': { lat: 28.6315, lng: 77.2167 },
    'dwarka': { lat: 28.5921, lng: 77.0460 },
    'gurugram': { lat: 28.4595, lng: 77.0266 },
    'gurgaon': { lat: 28.4595, lng: 77.0266 },
    'golf course road': { lat: 28.4385, lng: 77.0980 },
    'cyber city': { lat: 28.4950, lng: 77.0895 },
    'dlf phase 5': { lat: 28.4520, lng: 77.0940 },
    'sohna road': { lat: 28.3890, lng: 77.0420 },
    'noida': { lat: 28.5355, lng: 77.3910 },
    'noida sector 62': { lat: 28.6280, lng: 77.3649 },
    'noida sector 150': { lat: 28.4410, lng: 77.4760 },
    'greater noida': { lat: 28.4744, lng: 77.5040 },
    'indirapuram': { lat: 28.6390, lng: 77.3680 },
    'ghaziabad': { lat: 28.6692, lng: 77.4538 },
    'faridabad': { lat: 28.4089, lng: 77.3178 },
  },
  'Bengaluru': {
    'whitefield': { lat: 12.9698, lng: 77.7500 },
    'indiranagar': { lat: 12.9784, lng: 77.6408 },
    'koramangala': { lat: 12.9352, lng: 77.6245 },
    'hsr layout': { lat: 12.9121, lng: 77.6446 },
    'sarjapur': { lat: 12.8600, lng: 77.7860 },
    'sarjapur road': { lat: 12.9165, lng: 77.6850 },
    'bellandur': { lat: 12.9304, lng: 77.6784 },
    'electronic city': { lat: 12.8399, lng: 77.6770 },
    'marathahalli': { lat: 12.9591, lng: 77.6974 },
    'hebbal': { lat: 13.0358, lng: 77.5970 },
    'yelahanka': { lat: 13.1007, lng: 77.5963 },
    'jp nagar': { lat: 12.9063, lng: 77.5857 },
    'jayanagar': { lat: 12.9308, lng: 77.5838 },
    'malleshwaram': { lat: 13.0031, lng: 77.5643 },
    'bannerghatta road': { lat: 12.8940, lng: 77.5980 },
    'thanisandra': { lat: 13.0550, lng: 77.6280 },
    'devanahalli': { lat: 13.2483, lng: 77.7126 },
  },
  'Pune': {
    'baner': { lat: 18.5590, lng: 73.7868 },
    'hinjawadi': { lat: 18.5913, lng: 73.7389 },
    'wakad': { lat: 18.5987, lng: 73.7684 },
    'kothrud': { lat: 18.5074, lng: 73.8077 },
    'viman nagar': { lat: 18.5679, lng: 73.9143 },
    'kharadi': { lat: 18.5515, lng: 73.9349 },
    'kalyani nagar': { lat: 18.5463, lng: 73.9034 },
    'koregaon park': { lat: 18.5362, lng: 73.8940 },
    'aundh': { lat: 18.5602, lng: 73.8031 },
    'magarpatta': { lat: 18.5144, lng: 73.9264 },
    'hadapsar': { lat: 18.5089, lng: 73.9259 },
    'bavdhan': { lat: 18.5140, lng: 73.7690 },
    'balewadi': { lat: 18.5760, lng: 73.7710 },
  },
  'Hyderabad': {
    'hitec city': { lat: 17.4435, lng: 78.3772 },
    'gachibowli': { lat: 17.4401, lng: 78.3489 },
    'madhapur': { lat: 17.4483, lng: 78.3915 },
    'jubilee hills': { lat: 17.4319, lng: 78.4073 },
    'banjara hills': { lat: 17.4156, lng: 78.4357 },
    'kondapur': { lat: 17.4699, lng: 78.3578 },
    'financial district': { lat: 17.4180, lng: 78.3420 },
    'kokapet': { lat: 17.4080, lng: 78.3270 },
    'manikonda': { lat: 17.4018, lng: 78.3789 },
    'kukatpally': { lat: 17.4947, lng: 78.3996 },
    'miyapur': { lat: 17.4968, lng: 78.3548 },
    'secunderabad': { lat: 17.4399, lng: 78.4983 },
    'tellapur': { lat: 17.4720, lng: 78.2910 },
  }
};

/**
 * Resolves precise coordinates for a given city and locality string
 */
export function resolveCoordinates(
  city: string,
  locality: string,
  address?: string
): { lat: number; lng: number } {
  const normCity = city || 'Mumbai';
  const cityLocalities = LOCALITY_COORDINATES[normCity] || LOCALITY_COORDINATES['Mumbai'];
  const centroid = CITY_CENTROIDS[normCity] || CITY_CENTROIDS['Mumbai'];

  const combined = `${locality || ''} ${address || ''}`.toLowerCase();

  // Try exact or partial locality match
  for (const [key, coords] of Object.entries(cityLocalities)) {
    if (combined.includes(key)) {
      // Deterministic slight offset based on address length to prevent identical stacking
      const hash = combined.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
      const offsetLat = ((hash % 100) - 50) * 0.00015;
      const offsetLng = (((hash >> 2) % 100) - 50) * 0.00015;
      return {
        lat: Number((coords.lat + offsetLat).toFixed(6)),
        lng: Number((coords.lng + offsetLng).toFixed(6)),
      };
    }
  }

  // Fallback to city center
  return {
    lat: centroid.lat,
    lng: centroid.lng,
  };
}

/**
 * Calculates straight-line distance in kilometers between two GPS coordinates using Haversine formula
 */
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}
