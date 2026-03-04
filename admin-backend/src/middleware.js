import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

export function middleware(request) {
  // Admin routes are protected client-side in the dashboard component
  // Middleware disabled to prevent conflicts with localStorage-based auth
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
