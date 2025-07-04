import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

import { getClientInfoFromRequest } from "@/lib/get-client-info";
import { logUserLogout } from "@/lib/audit-login-logout";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (session?.user?.id) {
      const { ipAddress, userAgent } = getClientInfoFromRequest(request);
      
      // Log the logout
      await logUserLogout(
        session.user.id,
        ipAddress,
        userAgent
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Logout API error:", error);
    return NextResponse.json(
      { error: "Failed to log logout" },
      { status: 500 }
    );
  }
}