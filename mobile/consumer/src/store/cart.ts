import { create } from 'zustand';

interface CartItem {
  serviceId: string;
  serviceName: string;
  pharmacyId: string;
  pharmacyName: string;
  pharmacySlug: string;
  price: number;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (serviceId: string) => void;
  updateQuantity: (serviceId: string, quantity: number) => void;
  clear: () => void;
  total: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],

  addItem: (item) => {
    const existing = get().items.find(i => i.serviceId === item.serviceId);
    if (existing) {
      set({ items: get().items.map(i =>
        i.serviceId === item.serviceId ? { ...i, quantity: i.quantity + 1 } : i
      )});
    } else {
      set({ items: [...get().items, item] });
    }
  },

  removeItem: (serviceId) => {
    set({ items: get().items.filter(i => i.serviceId !== serviceId) });
  },

  updateQuantity: (serviceId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(serviceId);
    } else {
      set({ items: get().items.map(i =>
        i.serviceId === serviceId ? { ...i, quantity } : i
      )});
    }
  },

  clear: () => set({ items: [] }),

  total: () => get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),
}));
