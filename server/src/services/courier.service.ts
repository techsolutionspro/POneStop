// Courier integration stubs for Royal Mail, DPD, Evri, and cold-chain partners

interface ShipmentRequest {
  orderId: string;
  recipientName: string;
  address: string;
  city: string;
  postcode: string;
  phone: string;
  weight: number; // grams
  isColdChain: boolean;
  isSignedFor: boolean;
  courier: 'ROYAL_MAIL' | 'DPD' | 'EVRI' | 'COLD_CHAIN';
}

interface ShipmentResponse {
  trackingNumber: string;
  trackingUrl: string;
  labelUrl: string;
  estimatedDelivery: string;
}

export class CourierService {
  static async createShipment(request: ShipmentRequest): Promise<ShipmentResponse> {
    console.log(`[Courier] Creating ${request.courier} shipment for order ${request.orderId}`);

    // Stub responses per courier
    const trackingNumber = `${request.courier.slice(0, 2)}-${Date.now().toString(36).toUpperCase()}`;

    switch (request.courier) {
      case 'ROYAL_MAIL':
        return {
          trackingNumber: `RM${trackingNumber}`,
          trackingUrl: `https://www.royalmail.com/track-your-item#/tracking-results/RM${trackingNumber}`,
          labelUrl: `/labels/${request.orderId}-rm.pdf`,
          estimatedDelivery: this.getEstimatedDelivery(1),
        };
      case 'DPD':
        return {
          trackingNumber: `DPD${trackingNumber}`,
          trackingUrl: `https://track.dpd.co.uk/parcels/DPD${trackingNumber}`,
          labelUrl: `/labels/${request.orderId}-dpd.pdf`,
          estimatedDelivery: this.getEstimatedDelivery(1),
        };
      case 'EVRI':
        return {
          trackingNumber: `EV${trackingNumber}`,
          trackingUrl: `https://www.evri.com/track/parcel/EV${trackingNumber}`,
          labelUrl: `/labels/${request.orderId}-evri.pdf`,
          estimatedDelivery: this.getEstimatedDelivery(2),
        };
      case 'COLD_CHAIN':
        return {
          trackingNumber: `CC${trackingNumber}`,
          trackingUrl: `https://coldchain.tracking.example/CC${trackingNumber}`,
          labelUrl: `/labels/${request.orderId}-cc.pdf`,
          estimatedDelivery: this.getEstimatedDelivery(1),
        };
    }
  }

  // Check if a cold-chain dispatch is still within cut-off
  static isColdChainCutoffValid(dispatchDate: Date): boolean {
    const now = new Date();
    const cutoff = new Date(dispatchDate);
    cutoff.setHours(14, 0, 0, 0); // 2pm cut-off

    // No weekend dispatch for cold-chain
    const dayOfWeek = dispatchDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) return false;

    // Check if we're past Friday 2pm (would deliver over weekend)
    if (dayOfWeek === 5 && now.getHours() >= 14) return false;

    return now < cutoff;
  }

  // Get cold-chain dispatch cut-off time for today
  static getColdChainCutoff(): Date | null {
    const now = new Date();
    const day = now.getDay();

    // No cold-chain on weekends or Friday after 2pm
    if (day === 0 || day === 6) return null;
    if (day === 5) {
      const cutoff = new Date(now);
      cutoff.setHours(14, 0, 0, 0);
      return now < cutoff ? cutoff : null;
    }

    const cutoff = new Date(now);
    cutoff.setHours(14, 0, 0, 0);
    return now < cutoff ? cutoff : null;
  }

  // Generate manifest for bulk dispatch
  static async generateManifest(shipments: { trackingNumber: string; courier: string; recipientName: string; postcode: string }[]): Promise<string> {
    console.log(`[Courier] Generating manifest for ${shipments.length} shipments`);
    // Would generate a PDF manifest for the courier pickup driver
    return `/manifests/manifest-${Date.now()}.pdf`;
  }

  // Select optimal courier based on order requirements
  static selectCourier(isColdChain: boolean, isSignedFor: boolean, weight: number): 'ROYAL_MAIL' | 'DPD' | 'EVRI' | 'COLD_CHAIN' {
    if (isColdChain) return 'COLD_CHAIN';
    if (weight > 2000) return 'DPD'; // Over 2kg
    if (isSignedFor) return 'ROYAL_MAIL'; // Royal Mail Special Delivery
    return 'EVRI'; // Budget option
  }

  // Get temperature log for cold-chain shipments
  static async getTemperatureLog(trackingNumber: string): Promise<{
    readings: { timestamp: string; tempC: number; humidity: number; location: string }[];
    inRange: boolean;
  }> {
    // Stub: would integrate with cold-chain partner API
    console.log(`[Courier] Getting temp log for ${trackingNumber}`);
    return {
      readings: [
        { timestamp: new Date().toISOString(), tempC: 4.2, humidity: 45, location: 'Dispatch' },
        { timestamp: new Date(Date.now() + 3600000).toISOString(), tempC: 3.8, humidity: 42, location: 'In Transit' },
      ],
      inRange: true, // 2-8°C range
    };
  }

  // Check delivery slot availability
  static async getDeliverySlots(postcode: string, isColdChain: boolean): Promise<{
    date: string;
    slots: { time: string; courier: string; price: number }[];
  }[]> {
    const slots = [];
    const now = new Date();

    for (let i = 1; i <= 5; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() + i);
      if (date.getDay() === 0 || date.getDay() === 6) continue; // Skip weekends

      const daySlots: { time: string; courier: string; price: number }[] = [
        { time: '9:00-13:00', courier: 'ROYAL_MAIL', price: 0 },
        { time: '13:00-17:00', courier: 'DPD', price: 0 },
      ];

      if (!isColdChain) {
        daySlots.push({ time: '9:00-21:00', courier: 'EVRI', price: 0 });
      } else {
        daySlots.push({ time: '9:00-12:00', courier: 'COLD_CHAIN', price: 4.99 });
      }

      slots.push({ date: date.toISOString().split('T')[0], slots: daySlots });
    }

    return slots;
  }

  // Validate dispatch address
  static validateDispatchAddress(postcode: string): boolean {
    // UK postcode regex
    const ukPostcodeRegex = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;
    return ukPostcodeRegex.test(postcode.trim());
  }

  private static getEstimatedDelivery(daysFromNow: number): string {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    // Skip weekends
    while (date.getDay() === 0 || date.getDay() === 6) {
      date.setDate(date.getDate() + 1);
    }
    return date.toISOString().split('T')[0];
  }
}
