import PropertyConfig, { IPropertyConfig } from './property.model';

export const propertyService = {
  async getProperty(): Promise<IPropertyConfig | null> {
    return PropertyConfig.findOne({ isActive: true });
  },

  async getPropertyById(id: string): Promise<IPropertyConfig | null> {
    return PropertyConfig.findById(id);
  },

  async updateProperty(data: Partial<IPropertyConfig>): Promise<IPropertyConfig | null> {
    return PropertyConfig.findOneAndUpdate(
      { isActive: true },
      { $set: data },
      { new: true, upsert: false }
    );
  },

  async createProperty(data: Partial<IPropertyConfig>): Promise<IPropertyConfig> {
    return PropertyConfig.create(data);
  },

  async addPhoto(key: string, label: string, url: string, order: number): Promise<IPropertyConfig | null> {
    return PropertyConfig.findOneAndUpdate(
      { isActive: true },
      { $push: { images: { key, label, url, order } } },
      { new: true }
    );
  },

  async removePhoto(key: string): Promise<IPropertyConfig | null> {
    return PropertyConfig.findOneAndUpdate(
      { isActive: true },
      { $pull: { images: { key } } },
      { new: true }
    );
  },
};
