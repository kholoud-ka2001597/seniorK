import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import nodemailer from "nodemailer";

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const body = await request.json();
    const { reservationItemID, requestUser, status, filter } = body;

    if (!reservationItemID || !requestUser || !status) {
      return NextResponse.json(
        { message: "reservationItemID, requestUser, and status are required" },
        { status: 400 }
      );
    }

    // Create the partner request
    const newPartnerRequest = await prisma.partnerRequest.create({
      data: {
        reservationItem: {
          connect: { id: reservationItemID },
        },
        requester: {
          connect: { id: requestUser },
        },
        status,
        filter: filter || {},
      },
      include: {
        reservationItem: true,
        requester: true,
      },
    });

    // Get user email for notification
    const user = await prisma.user.findUnique({
      where: { id: requestUser },
    });

    if (user && user.email) {
      // Set up email transporter
      const transporter = nodemailer.createTransport({
        service: "Gmail",
        auth: {
          user: process.env.SMTP_EMAIL,
          pass: process.env.SMTP_PASSWORD,
        },
      });

      // Prepare email details
      const partnerRequestDetails = `
Partner Request ID: ${newPartnerRequest.id}
Reservation Item ID: ${newPartnerRequest.reservationItem.id}
Status: ${newPartnerRequest.status}
Created At: ${new Date(newPartnerRequest.createdAt).toLocaleString()}
      `;

      const mailOptions = {
        from: "no-reply@qreserve.com",
        to: user.email,
        cc: "kholoud.alshafai@gmail.com",
        subject: "Partner Request Confirmation",
        text: `Thank you for your partner request! Here are the details:\n\n${partnerRequestDetails}\n\nIf you have any questions, please contact us.`,
      };

      // Send email
      try {
        await transporter.sendMail(mailOptions);
      } catch (emailError) {
        console.error("Error sending email:", emailError);
      }
    }

    return NextResponse.json(
      {
        message: "Partner Request created successfully",
        partnerRequest: newPartnerRequest,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating partner request:", error);
    return NextResponse.json(
      { message: "Error creating partner request", error: error.message },
      { status: 500 }
    );
  }
}