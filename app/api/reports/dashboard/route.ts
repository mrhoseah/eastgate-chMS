import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth, subMonths, format, eachMonthOfInterval } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const end = new Date();
    const start = subMonths(end, 5); // Last 6 months including current

    // Generate array of months
    const months = eachMonthOfInterval({ start, end });

    // Fetch data
    const [donations, expenses, attendances, newMembers] = await Promise.all([
      prisma.donation.findMany({
        where: {
          status: "completed",
          createdAt: { gte: start, lte: end },
        },
        select: { amount: true, createdAt: true },
      }),
      prisma.expense.findMany({
        where: {
          status: "PAID",
          expenseDate: { gte: start, lte: end },
        },
        select: { amount: true, expenseDate: true },
      }),
      prisma.attendance.findMany({
        where: {
          date: { gte: start, lte: end },
          status: "PRESENT",
        },
        select: { date: true },
      }),
      prisma.user.findMany({
        where: {
          createdAt: { gte: start, lte: end },
          role: "MEMBER",
        },
        select: { createdAt: true },
      }),
    ]);

    // Aggregate data by month
    const data = months.map((month) => {
      const monthKey = format(month, "MMM yyyy");
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);

      const monthlyDonations = donations
        .filter((d) => d.createdAt >= monthStart && d.createdAt <= monthEnd)
        .reduce((sum, d) => sum + Number(d.amount), 0);

      const monthlyExpenses = expenses
        .filter((e) => e.expenseDate >= monthStart && e.expenseDate <= monthEnd)
        .reduce((sum, e) => sum + Number(e.amount), 0);

      const monthlyAttendance = attendances.filter(
        (a) => a.date >= monthStart && a.date <= monthEnd
      ).length;

      const monthlyNewMembers = newMembers.filter(
        (m) => m.createdAt >= monthStart && m.createdAt <= monthEnd
      ).length;

      return {
        name: format(month, "MMM"), // Jan, Feb, etc.
        fullName: monthKey,
        income: monthlyDonations,
        expenses: monthlyExpenses,
        attendance: monthlyAttendance,
        newMembers: monthlyNewMembers,
        // For the sample charts compatibility
        value: monthlyDonations, 
        amount: monthlyExpenses,
      };
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching dashboard report:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
