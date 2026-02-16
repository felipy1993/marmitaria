
export enum OrderStatus {
  RECEIVED = 'recebido',
  PREPARING = 'em preparo',
  DELIVERING = 'saiu para entrega',
  FINISHED = 'finalizado'
}

export enum PaymentMethod {
  PIX = 'Pix',
  CASH = 'Dinheiro na entrega',
  CARD = 'Cartão na entrega'
}

export interface OptionItem {
  name: string;
  price?: number;
}

export interface OptionGroup {
  id: string;
  name: string;
  min: number;
  max: number;
  extraPricePerItem?: number;
  items: OptionItem[];
}

export interface Product {
  id?: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  active: boolean;
  category: string;
  tags?: string[];
  optionsGroups?: OptionGroup[];
  createdAt: number;
  restaurantId: string;
}

export interface SelectedOption {
  groupName: string;
  items: string[];
}

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  selectedOptions?: SelectedOption[];
  observation?: string;
}

export interface Order {
  id?: string;
  customerName: string;
  phone: string;
  address: string;
  paymentMethod: PaymentMethod;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  couponCode?: string;
  distanceKm?: number;
  total: number;
  status: OrderStatus;
  createdAt: number;
  restaurantId: string;
}

export interface RestaurantConfig {
  deliveryRadiusKm: number;
  deliveryFee: number;
  isDeliveryFree: boolean;
  freeDeliveryOver: number;
  addressBase: string;
  latitude?: number;
  longitude?: number;
  cep?: string;
}

export interface Coupon {
  id?: string;
  code: string;
  discountPercentage: number;
  active: boolean;
  createdAt: number;
}
