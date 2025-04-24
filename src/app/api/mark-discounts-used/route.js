import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const { userId, appliedDiscounts } = await request.json();

    if (!userId || !appliedDiscounts) {
      return NextResponse.json(
        { error: "User ID and applied discounts are required" },
        { status: 400 }
      );
    }

    const discountTypes = appliedDiscounts.map(discount => discount.type);

    if (discountTypes.includes('SIGNUP')) {
      const existingDiscount = await prisma.signupDiscount.findUnique({
        where: { userId: parseInt(userId) }
      });

      if (existingDiscount && !existingDiscount.isUsed) {
        await prisma.signupDiscount.update({
          where: { userId: parseInt(userId) },
          data: { isUsed: true }
        });
      }
    }

    if (discountTypes.includes('LOYALTY')) {
      await prisma.loyaltyDiscount.update({
        where: { userId: parseInt(userId) },
        data: { isUsed: true }
      });
    }

    return NextResponse.json(
      { message: "Discounts marked as used successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error marking discounts as used:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}