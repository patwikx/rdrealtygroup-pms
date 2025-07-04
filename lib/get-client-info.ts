import { headers } from "next/headers";

export async function getClientInfo() {
  const headersList = headers();
  
  // Get IP address from various possible headers
  const xForwardedFor = headersList.get("x-forwarded-for");
  const xRealIp = headersList.get("x-real-ip");
  const cfConnectingIp = headersList.get("cf-connecting-ip");
  
  const ipAddress = xForwardedFor?.split(",")[0] || 
                   xRealIp || 
                   cfConnectingIp || 
                   "unknown";
  
  const userAgent = headersList.get("user-agent") || "unknown";
  
  return {
    ipAddress,
    userAgent,
  };
}

// For use in API routes where headers are available on the request
export function getClientInfoFromRequest(request: Request) {
  const xForwardedFor = request.headers.get("x-forwarded-for");
  const xRealIp = request.headers.get("x-real-ip");
  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  
  const ipAddress = xForwardedFor?.split(",")[0] || 
                   xRealIp || 
                   cfConnectingIp || 
                   "unknown";
  
  const userAgent = request.headers.get("user-agent") || "unknown";
  
  return {
    ipAddress,
    userAgent,
  };
}