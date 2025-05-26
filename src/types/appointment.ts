// src/types/appointment.ts
export type AdjustableService = {
  id: string;
  name: string;
  baseDuration: number;
  adjustedDuration: number;
  basePrice: number;
  adjustedPrice: number;
  isAdjusted: boolean;
  adjustmentReason?: string;
};

export type Customer = {
  id: string;
  name: string;
  kana: string;
  phone: string;
};

export type Service = {
  id: string;
  name: string;
  duration: number;
  price: number;
};

export type Appointment = {
  id: string;
  title: string;
  start: string;
  end: string;
  clientId: string;
  clientName: string;
  phone: string;
  services: Service[];
  totalPrice: number;
  totalDuration: number;
  note: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
};

export type HistoricalAdjustment = {
  serviceId: string;
  serviceName: string;
  averageDuration: number;
  averagePrice: number;
  lastDuration: number;
  lastPrice: number;
  frequency: number;
  baseDuration: number;
  basePrice: number;
};

// コンポーネントのProps型定義
export type BulkAdjustmentProps = {
  selectedServices: AdjustableService[];
  onBulkAdjustment: (services: AdjustableService[]) => void;
  onClose: () => void;
};

export type CustomerSuggestionsProps = {
  customerId: string;
  selectedServices: AdjustableService[];
  onApplySuggestions: (suggestions: AdjustableService[]) => void;
  onClose: () => void;
};

export type ServiceAdjustmentModalProps = {
  serviceId: string;
  service: AdjustableService;
  onSave: (serviceId: string, duration: number, price: number, reason?: string) => void;
  onClose: () => void;
  onReset: (serviceId: string) => void;
};