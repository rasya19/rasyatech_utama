import { prisma } from '../lib/prisma';

export class RegistrationService {
  static async getAll() {
    return prisma.registration.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  static async getById(id: string) {
    return prisma.registration.findUnique({
      where: { id }
    });
  }

  static async create(data: any) {
    return prisma.registration.create({
      data: {
        ...data,
        status: data.status || 'pending'
      }
    });
  }

  static async update(id: string, data: any) {
    return prisma.registration.update({
      where: { id },
      data
    });
  }

  static async delete(id: string) {
    await prisma.registration.delete({
      where: { id }
    });
    return { success: true };
  }

  static async updateStatus(id: string, status: string) {
    return this.update(id, { status });
  }
}
