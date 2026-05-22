import { Model } from 'mongoose';

// ═══════════════════════════════════════════════════════════
//  REPOSITORY INTERFACE — database-agnostic contract
// ═══════════════════════════════════════════════════════════

export interface FindOptions {
  projection?: Record<string, 0 | 1> | string;
  sort?: Record<string, 1 | -1>;
  skip?: number;
  limit?: number;
  session?: any;
}

export interface IRepository<T = Record<string, any>> {
  findById(id: string, options?: FindOptions): Promise<T | null>;
  findOne(filter: Record<string, unknown>, options?: FindOptions): Promise<T | null>;
  findMany(filter: Record<string, unknown>, options?: FindOptions): Promise<T[]>;
  create(data: any, options?: FindOptions): Promise<T>;
  createMany(data: any[], options?: FindOptions): Promise<T[]>;
  updateById(id: string, data: any, options?: FindOptions): Promise<T | null>;
  incrementById(id: string, field: string, amount: number, options?: FindOptions): Promise<T | null>;
  upsert(filter: Record<string, unknown>, data: any, options?: FindOptions): Promise<T>;
  deleteById(id: string, options?: FindOptions): Promise<boolean>;
  deleteMany(filter: Record<string, unknown>, options?: FindOptions): Promise<number>;
  count(filter?: Record<string, unknown>, options?: FindOptions): Promise<number>;
  aggregate<R = any>(pipeline: Record<string, unknown>[], options?: FindOptions): Promise<R[]>;
}

// ═══════════════════════════════════════════════════════════
//  MONGOOSE IMPLEMENTATION
// ═══════════════════════════════════════════════════════════

export class MongooseRepository<T> implements IRepository<T> {
  constructor(private model: Model<any>) {}

  async findById(id: string, options?: FindOptions): Promise<T | null> {
    let query = this.model.findById(id);
    if (options?.projection) query = query.select(options.projection as any);
    if (options?.session) query = query.session(options.session);
    const doc = await query;
    return doc ? (doc.toJSON() as T) : null;
  }

  async findOne(filter: Record<string, unknown>, options?: FindOptions): Promise<T | null> {
    let query = this.model.findOne(filter);
    if (options?.projection) query = query.select(options.projection as any);
    if (options?.session) query = query.session(options.session);
    const doc = await query;
    return doc ? (doc.toJSON() as T) : null;
  }

  async findMany(filter: Record<string, unknown>, options?: FindOptions): Promise<T[]> {
    let query = this.model.find(filter);
    if (options?.projection) query = query.select(options.projection as any);
    if (options?.sort) query = query.sort(options.sort as any);
    if (options?.skip) query = query.skip(options.skip);
    if (options?.limit) query = query.limit(options.limit);
    if (options?.session) query = query.session(options.session);
    const docs = await query;
    return docs.map((d) => d.toJSON() as T);
  }

  async create(data: any, options?: FindOptions): Promise<T> {
    const doc = await this.model.create([data], { session: options?.session });
    return (doc[0] as any).toJSON() as T;
  }

  async createMany(data: any[], options?: FindOptions): Promise<T[]> {
    const docs = await this.model.insertMany(data, { session: options?.session });
    return docs.map((d) => (d as any).toJSON() as T);
  }

  async updateById(id: string, data: any, options?: FindOptions): Promise<T | null> {
    const doc = await this.model.findByIdAndUpdate(id, data, { returnDocument: 'after', session: options?.session });
    return doc ? (doc.toJSON() as T) : null;
  }

  async incrementById(id: string, field: string, amount: number, options?: FindOptions): Promise<T | null> {
    const doc = await this.model.findByIdAndUpdate(
      id,
      { $inc: { [field]: amount } } as any,
      { returnDocument: 'after', session: options?.session },
    );
    return doc ? (doc.toJSON() as T) : null;
  }

  async upsert(filter: Record<string, unknown>, data: any, options?: FindOptions): Promise<T> {
    const doc = await this.model.findOneAndUpdate(
      filter,
      { $set: data },
      { upsert: true, returnDocument: 'after', session: options?.session },
    );
    return doc!.toJSON() as T;
  }

  async deleteById(id: string, options?: FindOptions): Promise<boolean> {
    const result = await this.model.findByIdAndDelete(id, { session: options?.session });
    return !!result;
  }

  async deleteMany(filter: Record<string, unknown>, options?: FindOptions): Promise<number> {
    const result = await this.model.deleteMany(filter, { session: options?.session });
    return result.deletedCount ?? 0;
  }

  async count(filter: Record<string, unknown> = {}, options?: FindOptions): Promise<number> {
    return this.model.countDocuments(filter, { session: options?.session });
  }

  async aggregate<R = any>(pipeline: Record<string, unknown>[], options?: FindOptions): Promise<R[]> {
    return this.model.aggregate(pipeline as any).session(options?.session);
  }
}
