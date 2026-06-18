import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = { title: "Create Account" };

export default function RegisterPage() {
  return (
    <AuthShell
      title="List your property"
      subtitle="Create a landlord account to post and manage your listings."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-orange hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
