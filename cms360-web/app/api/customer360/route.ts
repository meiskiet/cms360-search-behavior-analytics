import { NextResponse } from "next/server";
import { getCustomer360Rows } from "@/lib/customer360";

export async function GET() {
  try {
    const rows = await getCustomer360Rows();

    return NextResponse.json({
      success: true,
      count: rows.length,
      data: rows,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}