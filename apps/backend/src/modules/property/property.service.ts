import PropertyConfig, { IPropertyConfig } from './property.model';

export const propertyService = {
  async getProperty(ownerUserId: string): Promise<IPropertyConfig | null> {
    const owned = await PropertyConfig.findOne({ ownerUserId });
    if (owned) return owned;

    // Backward-compatible migration path: claim one legacy active property
    const legacy = await PropertyConfig.findOneAndUpdate(
      {
        isActive: true,
        $or: [{ ownerUserId: '' }, { ownerUserId: { $exists: false } }],
      },
      { $set: { ownerUserId } },
      { new: true, sort: { updatedAt: -1 } }
    );
    return legacy;
  },

  async getPropertyById(id: string): Promise<IPropertyConfig | null> {
    return PropertyConfig.findById(id);
  },

  async updateProperty(ownerUserId: string, data: Partial<IPropertyConfig>): Promise<IPropertyConfig | null> {
    const existing = await this.getProperty(ownerUserId);
    if (!existing) return null;

    return PropertyConfig.findByIdAndUpdate(
      existing._id,
      { $set: { ...data, isActive: true, ownerUserId } },
      { new: true }
    );
  },

  async createProperty(ownerUserId: string, data: Partial<IPropertyConfig>): Promise<IPropertyConfig> {
    return PropertyConfig.create({ ...data, ownerUserId });
  },

  async addPhoto(
    ownerUserId: string,
    key: string,
    label: string,
    url: string,
    order: number
  ): Promise<IPropertyConfig | null> {
    return PropertyConfig.findOneAndUpdate(
      { ownerUserId },
      { $push: { images: { key, label, url, order } } },
      { new: true }
    );
  },

  async removePhoto(ownerUserId: string, key: string): Promise<IPropertyConfig | null> {
    return PropertyConfig.findOneAndUpdate(
      { ownerUserId },
      { $pull: { images: { key } } },
      { new: true }
    );
  },
};
