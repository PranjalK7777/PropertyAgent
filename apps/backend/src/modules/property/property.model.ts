import mongoose, { Schema, Document } from 'mongoose';

export interface IPropertyImage {
  key: string;
  label: string;
  url: string;
  order: number;
}

export interface IPropertyConfig extends Document {
  name: string;
  address: string;
  type: 'apartment' | 'house' | 'room' | 'studio';
  bedrooms: number;
  bathrooms: number;
  areaSqft: number;
  areaSqm: number;
  furnished: boolean;

  // Pricing (PRIVATE — never sent to tenants)
  askingRent: number;
  minimumRent: number;
  deposit: number;
  depositMonths: number;
  leaseDuration: string;

  // Details
  included: string;
  notIncluded: string;
  parking: string;
  petsPolicy: string;
  smokingPolicy: string;
  keyFeatures: string;
  nearby: string;
  preferredTenants: string;
  maxOccupants: number;
  availableFrom: Date;

  // Images
  images: IPropertyImage[];

  // Agent config
  agentName: string;
  agentPhone: string;
  ownerPhone: string;
  digestTime: string;
  digestTimezone: string;
  language: string;
  escalationSensitivity: 'low' | 'medium' | 'high';

  // Status
  isActive: boolean;
  isRented: boolean;

  // Push notifications
  ownerPushToken: string;

  // Future SaaS
  ownerUserId: string;

  createdAt: Date;
  updatedAt: Date;
}

const propertyImageSchema = new Schema<IPropertyImage>({
  key: { type: String, required: true },
  label: { type: String, required: true },
  url: { type: String, required: true },
  order: { type: Number, required: true, default: 0 },
});

const propertyConfigSchema = new Schema<IPropertyConfig>(
  {
    name: { type: String, required: true },
    address: { type: String, required: true },
    type: { type: String, enum: ['apartment', 'house', 'room', 'studio'], required: true },
    bedrooms: { type: Number, required: true },
    bathrooms: { type: Number, required: true },
    areaSqft: { type: Number },
    areaSqm: { type: Number },
    furnished: { type: Boolean, default: true },

    askingRent: { type: Number, required: true },
    minimumRent: { type: Number, required: true },
    deposit: { type: Number, required: true },
    depositMonths: { type: Number, default: 2 },
    leaseDuration: { type: String, default: '12 months minimum' },

    included: { type: String, default: '' },
    notIncluded: { type: String, default: '' },
    parking: { type: String, default: '' },
    petsPolicy: { type: String, default: 'No pets allowed' },
    smokingPolicy: { type: String, default: 'No smoking' },
    keyFeatures: { type: String, default: '' },
    nearby: { type: String, default: '' },
    preferredTenants: { type: String, default: '' },
    maxOccupants: { type: Number, default: 2 },
    availableFrom: { type: Date },

    images: [propertyImageSchema],

    agentName: { type: String, default: 'Aidan' },
    agentPhone: { type: String, required: true },
    ownerPhone: { type: String, required: true },
    digestTime: { type: String, default: '21:00' },
    digestTimezone: { type: String, default: 'Asia/Kolkata' },
    language: { type: String, default: 'en' },
    escalationSensitivity: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },

    isActive: { type: Boolean, default: true },
    isRented: { type: Boolean, default: false },

    ownerPushToken: { type: String, default: '' },
    ownerUserId: { type: String, default: '' },
  },
  { timestamps: true, collection: 'property_configs' }
);

export default mongoose.model<IPropertyConfig>('PropertyConfig', propertyConfigSchema);
