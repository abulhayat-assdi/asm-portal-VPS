// Override parent saas-admin/layout.tsx for the login route.
// Login page must NOT inherit the auth-checking layout — it would cause an infinite redirect loop.
export default function AdminLoginLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
