import { SignUp } from "@clerk/nextjs";
import { AuthLayout } from "@/components/auth-layout";
import { clerkAppearance } from "@/lib/clerk-appearance";

export default function SignUpPage() {
  return (
    <AuthLayout>
      <SignUp appearance={clerkAppearance} />
    </AuthLayout>
  );
}
