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
