import prisma from '../../config/db';
import { getPaginationParams, buildPaginationMeta } from '../../utils/pagination.utils';
import { CreateDueInput, MarkPaidInput, BulkCreateDuesInput, MemberPayDueInput } from './dues.validation';

export async function getMyDues(memberId: string, query: Record<string, string | undefined>) {
  const { page, limit, skip } = getPaginationParams(query);

  const [data, total] = await Promise.all([
    prisma.due.findMany({
      where: { memberId },
      skip,
      take: limit,
      orderBy: { year: 'desc' },
    }),
    prisma.due.count({ where: { memberId } }),
  ]);

  return { data, meta: buildPaginationMeta(page, limit, total) };
}

export async function adminListDues(query: Record<string, string | undefined>) {
  const { page, limit, skip } = getPaginationParams(query);
  const { status, year, memberId, search } = query;

  const where: Record<string, unknown> = {};
  if (status) where.status = status.toUpperCase();
  if (year) where.year = parseInt(year, 10);
  if (memberId) where.memberId = memberId;
  if (search) {
    where.member = {
      OR: [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ],
    };
  }

  const [data, total] = await Promise.all([
    prisma.due.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { member: { select: { id: true, fullName: true, email: true } } },
    }),
    prisma.due.count({ where }),
  ]);

  return { data, meta: buildPaginationMeta(page, limit, total) };
}

export async function createDue(data: CreateDueInput) {
  const member = await prisma.member.findUnique({ where: { id: data.memberId } });
  if (!member) throw Object.assign(new Error('Member not found'), { statusCode: 404 });

  return prisma.due.create({
    data: {
      memberId: data.memberId,
      amount: data.amount,
      year: data.year,
      status: 'PENDING',
      notes: data.notes,
    },
    include: { member: { select: { id: true, fullName: true, email: true } } },
  });
}

export async function markDuePaid(id: string, data: MarkPaidInput) {
  const due = await prisma.due.findUnique({ where: { id } });
  if (!due) throw Object.assign(new Error('Due not found'), { statusCode: 404 });

  return prisma.due.update({
    where: { id },
    data: {
      status: 'PAID',
      paidAt: new Date(),
      transactionRef: data.transactionRef,
      notes: data.notes || due.notes,
    },
    include: { member: { select: { id: true, fullName: true, email: true } } },
  });
}

export async function memberPayDue(dueId: string, memberId: string, data: MemberPayDueInput) {
  const due = await prisma.due.findUnique({ where: { id: dueId } });
  if (!due) throw Object.assign(new Error('Due not found'), { statusCode: 404 });
  if (due.memberId !== memberId) {
    throw Object.assign(new Error('Not authorized to pay this due'), { statusCode: 403 });
  }
  if (due.status === 'PAID') {
    throw Object.assign(new Error('This due has already been paid'), { statusCode: 400 });
  }

  return prisma.due.update({
    where: { id: dueId },
    data: {
      status: 'PAID',
      paidAt: new Date(),
      transactionRef: data.transactionRef,
      notes: data.notes ? `${due.notes ? due.notes + ' | ' : ''}Payment by member: ${data.notes}` : due.notes,
    },
  });
}

export async function getMemberDueSummary(memberId: string) {
  const [totalDues, paidDues, pendingDues, overdueDues] = await Promise.all([
    prisma.due.count({ where: { memberId } }),
    prisma.due.aggregate({ where: { memberId, status: 'PAID' }, _sum: { amount: true } }),
    prisma.due.aggregate({ where: { memberId, status: 'PENDING' }, _sum: { amount: true } }),
    prisma.due.aggregate({ where: { memberId, status: 'OVERDUE' }, _sum: { amount: true } }),
  ]);

  return {
    totalDues,
    totalPaid: paidDues._sum.amount || 0,
    totalPending: pendingDues._sum.amount || 0,
    totalOverdue: overdueDues._sum.amount || 0,
  };
}

export async function bulkCreateDues(data: BulkCreateDuesInput) {
  const activeMembers = await prisma.member.findMany({
    where: { membershipStatus: 'ACTIVE', isApproved: true },
    select: { id: true },
  });

  if (activeMembers.length === 0) {
    return { created: 0, message: 'No active members found' };
  }

  const duesData = activeMembers.map((m) => ({
    memberId: m.id,
    amount: data.amount,
    year: data.year,
    status: 'PENDING' as const,
    notes: data.notes,
  }));

  const result = await prisma.due.createMany({
    data: duesData,
    skipDuplicates: true,
  });

  return { created: result.count, message: `${result.count} dues created` };
}
