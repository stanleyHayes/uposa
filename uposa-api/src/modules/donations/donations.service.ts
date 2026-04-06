import prisma from '../../config/db';
import { getPaginationParams, buildPaginationMeta } from '../../utils/pagination.utils';
import { CreateDonationInput, ConfirmDonationInput } from './donations.validation';

export async function submitDonation(data: CreateDonationInput, memberId?: string) {
  const donation = await prisma.donation.create({
    data: {
      memberId: memberId || null,
      donorName: data.donorName,
      donorEmail: data.donorEmail,
      amount: data.amount,
      currency: data.currency || 'GHS',
      channel: data.channel || 'CASH',
      purpose: data.purpose,
      transactionRef: data.transactionRef,
      projectId: data.projectId || null,
      notes: data.notes,
      status: 'PENDING',
    },
    include: { project: { select: { id: true, title: true } } },
  });
  return donation;
}

export async function getMyDonations(memberId: string, query: Record<string, string | undefined>) {
  const { page, limit, skip } = getPaginationParams(query);

  const [data, total] = await Promise.all([
    prisma.donation.findMany({
      where: { memberId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { project: { select: { id: true, title: true } } },
    }),
    prisma.donation.count({ where: { memberId } }),
  ]);

  return { data, meta: buildPaginationMeta(page, limit, total) };
}

export async function adminListDonations(query: Record<string, string | undefined>) {
  const { page, limit, skip } = getPaginationParams(query);
  const { status, channel, projectId, search } = query;

  const where: Record<string, unknown> = {};
  if (status) where.status = status.toUpperCase();
  if (channel) where.channel = channel.toUpperCase();
  if (projectId) where.projectId = projectId;
  if (search) {
    where.OR = [
      { donorName: { contains: search, mode: 'insensitive' } },
      { donorEmail: { contains: search, mode: 'insensitive' } },
      { transactionRef: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.donation.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        member: { select: { id: true, fullName: true, email: true } },
        project: { select: { id: true, title: true } },
      },
    }),
    prisma.donation.count({ where }),
  ]);

  return { data, meta: buildPaginationMeta(page, limit, total) };
}

export async function confirmDonation(id: string, data: ConfirmDonationInput) {
  const donation = await prisma.donation.findUnique({ where: { id } });
  if (!donation) throw Object.assign(new Error('Donation not found'), { statusCode: 404 });

  const updated = await prisma.donation.update({
    where: { id },
    data: {
      status: 'CONFIRMED',
      transactionRef: data.transactionRef || donation.transactionRef,
      notes: data.notes || donation.notes,
    },
  });

  // Update project raisedAmount if linked
  if (donation.projectId) {
    await prisma.project.update({
      where: { id: donation.projectId },
      data: { raisedAmount: { increment: donation.amount } },
    });
  }

  return updated;
}

export async function getDonationSummary() {
  const [total, byChannel, byStatus] = await Promise.all([
    prisma.donation.aggregate({
      where: { status: 'CONFIRMED' },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.donation.groupBy({
      by: ['channel'],
      where: { status: 'CONFIRMED' },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.donation.groupBy({
      by: ['status'],
      _count: true,
      _sum: { amount: true },
    }),
  ]);

  return {
    totalConfirmed: total._sum.amount || 0,
    totalConfirmedCount: total._count,
    byChannel,
    byStatus,
  };
}
