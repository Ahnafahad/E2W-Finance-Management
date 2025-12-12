import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ token }) => !!token,
  },
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/transactions/:path*",
    "/invoices/:path*",
    "/recurring/:path*",
    "/reports/:path*",
    "/settings/:path*",
    "/api/dashboard/:path*",
    "/api/transactions/:path*",
    "/api/invoices/:path*",
    "/api/recurring/:path*",
  ],
};
