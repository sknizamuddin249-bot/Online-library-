export interface DetectedAddress {
  village: string;
  po: string;
  district: string;
  pincode: string;
  state: string;
  fullAddress: string;
  latitude: number;
  longitude: number;
}

/**
 * Gets user's current GPS coordinates and reverse-geocodes using OpenStreetMap Nominatim API
 */
export async function detectCurrentLocationAddress(): Promise<DetectedAddress> {
  if (!navigator.geolocation) {
    throw new Error('Geolocation is not supported by your browser.');
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          // OpenStreetMap Reverse Geocoding
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            {
              headers: {
                'Accept-Language': 'en,bn',
              },
            }
          );

          if (!response.ok) {
            throw new Error('Failed to retrieve address details from GPS.');
          }

          const data = await response.json();
          const addr = data.address || {};

          // Extract granular fields
          const village =
            addr.village ||
            addr.suburb ||
            addr.neighbourhood ||
            addr.residential ||
            addr.road ||
            addr.hamlet ||
            addr.town ||
            addr.city_district ||
            addr.city ||
            '';

          const po =
            addr.postcode_locality ||
            addr.suburb ||
            addr.village ||
            addr.town ||
            addr.county ||
            '';

          const district =
            addr.state_district ||
            addr.district ||
            addr.county ||
            addr.city ||
            '';

          const pincode = String(addr.postcode || '').replace(/[^0-9]/g, '').slice(0, 6);
          const state = addr.state || 'West Bengal';

          const fullAddress =
            data.display_name ||
            [village, po, district, state, pincode].filter(Boolean).join(', ');

          resolve({
            village,
            po,
            district,
            pincode,
            state,
            fullAddress,
            latitude,
            longitude,
          });
        } catch (err: any) {
          // Fallback with just coordinates if network or rate-limit
          resolve({
            village: '',
            po: '',
            district: '',
            pincode: '',
            state: 'India',
            fullAddress: `Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`,
            latitude,
            longitude,
          });
        }
      },
      (error) => {
        let msg = 'Could not access location.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Location permission was denied. Please allow location access in your browser settings to auto-fill address.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = 'Location position is currently unavailable.';
        } else if (error.code === error.TIMEOUT) {
          msg = 'Location request timed out. Please try again.';
        }
        reject(new Error(msg));
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 30000,
      }
    );
  });
}
