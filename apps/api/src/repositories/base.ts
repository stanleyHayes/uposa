import { Model } from 'mongoose';

// ═══════════════════════════════════════════════════════════
//  REPOSITORY INTERFACE — database-agnostic contract
// ═══════════════════════════════════════════════════════════

export interface FindOptions {
  projection?: Record<string, 0 | 1> | string;
  sort?: Record<string, 1 | -1>;
  skip?: number;
  limit?: number;
}

export interface IRepository<T = Record<string, any>> {
  findById(id: string, options?: FindOptions): Promise<T | null>;
  findOne(filter: Record<string, unknown>, options?: FindOptions): Promise<T | null>;
  findMany(filter: Record<string, unknown>, options?: FindOptions): Promise<T[]>;
  create(data: any): Promise<T>;
  createMany(data: any[]): Promise<T[]>;
  updateById(id: string, data: any): Promise<T | null>;
  incrementById(id: string, field: string, amount: number): Promise<T | null>;
  upsert(filter: Record<string, unknown>, data: any): Promise<T>;
  deleteById(id: string): Promise<boolean>;
  deleteMany(filter: Record<string, unknown>): Promise<number>;
  count(filter?: Record<string, unknown>): Promise<number>;
  aggregate<R = any>(pipeline: Record<string, unknown>[]): Promise<R[]>;
}

// ═══════════════════════════════════════════════════════════
//  MONGOOSE IMPLEMENTATION
// ═══════════════════════════════════════════════════════════

export class MongooseRepository<T> implements IRepository<T> {
  constructor(private model: Model<any>) {}

  async findById(id: string, options?: FindOptions): Promise<T | null> {
    let query = this.model.findById(id);
    if (options?.projection) query = query.select(options.projection as any);
    const doc = await query;
    return doc ? (doc.toJSON() as T) : null;
  }

  async findOne(filter: Record<string, unknown>, options?: FindOptions): Promise<T | null> {
    let query = this.model.findOne(filter);
    if (options?.projection) query = query.select(options.projection as any);
    const doc = await query;
    return doc ? (doc.toJSON() as T) : null;
  }

  async findMany(filter: Record<string, unknown>, options?: FindOptions): Promise<T[]> {
    let query = this.model.find(filter);
    if (options?.projection) query = query.select(options.projection as any);
    if (options?.sort) query = query.sort(options.sort as any);
    if (options?.skip) query = query.skip(options.skip);
    if (options?.limit) query = query.limit(options.limit);
    const docs = await query;
    return docs.map((d) => d.toJSON() as T);
  }

  async create(data: any): Promise<T> {
    const doc = await this.model.create(data);
    return doc.toJSON() as T;
  }

  async createMany(data: any[]): Promise<T[]> {
    const docs = await this.model.insertMany(data);
    return docs.map((d) => (d as any).toJSON() as T);
  }

  async updateById(id: string, data: any): Promise<T | null> {
    const doc = await this.model.findByIdAndUpdate(id, data, { returnDocument: 'after' });
    return doc ? (doc.toJSON() as T) : null;
  }

  async incrementById(id: string, field: string, amount: number): Promise<T | null> {
    const doc = await this.model.findByIdAndUpdate(
      id,
      { $inc: { [field]: amount } } as any,
      { returnDocument: 'after' },
    );
    return doc ? (doc.toJSON() as T) : null;
  }

  async upsert(filter: Record<string, unknown>, data: any): Promise<T> {
    const doc = await this.model.findOneAndUpdate(
      filter,
      { $set: data },
      { upsert: true, returnDocument: 'after' },
    );
    return doc!.toJSON() as T;
  }

  async deleteById(id: string): Promise<boolean> {
    const result = await this.model.findByIdAndDelete(id);
    return !!result;
  }

  async deleteMany(filter: Record<string, unknown>): Promise<number> {
    const result = await this.model.deleteMany(filter);
    return result.deletedCount ?? 0;
  }

  async count(filter: Record<string, unknown> = {}): Promise<number> {
    return this.model.countDocuments(filter);
  }

  async aggregate<R = any>(pipeline: Record<string, unknown>[]): Promise<R[]> {
    return this.model.aggregate(pipeline as any);
  }
}
