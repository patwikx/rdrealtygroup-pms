"use server";

import { auth, signOut } from "@/auth";
import { logUserLogout } from "@/lib/audit-login-logout";
import { getClientInfo } from "@/lib/get-client-info";

export const logout = async () => {
  await signOut();
};

export async function logoutWithAudit() {
  try {
    const session = await auth();
    
    if (session?.user?.id) {
      const { ipAddress, userAgent } = await getClientInfo();
      
      // Log the logout before signing out
      await logUserLogout(
        session.user.id,
        ipAddress,
        userAgent
      );
    }
    
    // Perform the actual logout
    await signOut({ redirectTo: "/auth/login" });
  } catch (error) {
    console.error("Logout error:", error);
    // Still attempt to sign out even if audit logging fails
    await signOut({ redirectTo: "/auth/login" });
  }
}