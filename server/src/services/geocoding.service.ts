import { logger } from './logger';

interface LatLng {
  latitude: number;
  longitude: number;
}

interface PostcodeResult {
  postcode: string;
  latitude: number;
  longitude: number;
  admin_district: string;
  region: string;
}

export class GeocodingService {
  private static readonly BASE_URL = 'https://api.postcodes.io';

  // Look up a UK postcode and return lat/lng
  static async lookupPostcode(postcode: string): Promise<LatLng | null> {
    try {
      const cleaned = postcode.replace(/\s/g, '').toUpperCase();
      const res = await fetch(`${this.BASE_URL}/postcodes/${encodeURIComponent(cleaned)}`);
      if (!res.ok) return null;

      const data: any = await res.json();
      if (data.status !== 200 || !data.result) return null;

      return {
        latitude: data.result.latitude,
        longitude: data.result.longitude,
      };
    } catch (err) {
      logger.error('[Geocoding] Postcode lookup failed', { postcode, error: err });
      return null;
    }
  }

  // Validate a UK postcode
  static async validatePostcode(postcode: string): Promise<boolean> {
    try {
      const cleaned = postcode.replace(/\s/g, '').toUpperCase();
      const res = await fetch(`${this.BASE_URL}/postcodes/${encodeURIComponent(cleaned)}/validate`);
      const data: any = await res.json();
      return data.result === true;
    } catch {
      return false;
    }
  }

  // Bulk lookup postcodes (max 100)
  static async bulkLookup(postcodes: string[]): Promise<Map<string, LatLng>> {
    const results = new Map<string, LatLng>();
    try {
      const cleaned = postcodes.map(p => p.replace(/\s/g, '').toUpperCase());
      const res = await fetch(`${this.BASE_URL}/postcodes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postcodes: cleaned }),
      });
      const data: any = await res.json();
      if (data.status === 200 && data.result) {
        for (const item of data.result) {
          if (item.result) {
            results.set(item.query, {
              latitude: item.result.latitude,
              longitude: item.result.longitude,
            });
          }
        }
      }
    } catch (err) {
      logger.error('[Geocoding] Bulk lookup failed', { error: err });
    }
    return results;
  }

  // Calculate distance between two points in miles (Haversine formula)
  static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 3959; // Earth's radius in miles
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10; // 1 decimal place
  }

  private static toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}
