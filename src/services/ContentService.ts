import { prisma } from '../lib/prisma';

export class ContentService {
  static async getServices() {
    return prisma.service.findMany({
      orderBy: { title: 'asc' }
    });
  }

  static async getLaptops() {
    return prisma.laptop.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  static async getProducts() {
    return prisma.product.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  static async getAffiliates() {
    return prisma.affiliate.findMany({
      orderBy: { name: 'asc' }
    });
  }

  static async getSettings(key: string) {
    const setting = await prisma.setting.findUnique({
      where: { id: key }
    });
    return setting ? setting.value : null;
  }

  static async updateSettings(key: string, value: any) {
    return prisma.setting.upsert({
      where: { id: key },
      update: { value, updatedAt: new Date() },
      create: { id: key, value }
    });
  }

  static async getAll(collectionName: string, schoolId?: string) {
    const mapping: Record<string, any> = {
      services: prisma.service,
      laptops: prisma.laptop,
      products: prisma.product,
      affiliates: prisma.affiliate,
      users: prisma.user,
      teachers: prisma.teacher,
      students: prisma.student
    };

    const prismaModel = mapping[collectionName];
    if (!prismaModel) throw new Error(`Model ${collectionName} not found`);

    const where: any = {};
    if (schoolId) {
      where.school_id = schoolId;
    }

    return prismaModel.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
  }

  static async upsert(collectionName: string, data: any) {
    const { id, ...rest } = data;
    const mapping: Record<string, any> = {
      services: prisma.service,
      laptops: prisma.laptop,
      products: prisma.product,
      affiliates: prisma.affiliate,
      users: prisma.user,
      teachers: prisma.teacher,
      students: prisma.student
    };

    const prismaModel = mapping[collectionName];
    if (!prismaModel) throw new Error(`Model ${collectionName} not found`);

    if (id) {
      return prismaModel.update({
        where: { id },
        data: rest
      });
    } else {
      return prismaModel.create({
        data: rest
      });
    }
  }

  static async deleteItem(collectionName: string, id: string) {
    const mapping: Record<string, any> = {
      services: prisma.service,
      laptops: prisma.laptop,
      products: prisma.product,
      affiliates: prisma.affiliate,
      users: prisma.user,
      teachers: prisma.teacher,
      students: prisma.student
    };

    const prismaModel = mapping[collectionName];
    if (!prismaModel) throw new Error(`Model ${collectionName} not found`);

    return prismaModel.delete({
      where: { id }
    });
  }
}
