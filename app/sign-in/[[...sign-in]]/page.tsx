import { SignIn } from "@clerk/nextjs";
import { AuthLayout } from "@/components/auth-layout";
import { clerkAppearance } from "@/lib/clerk-appearance";

export default function SignInPage() {
  return (
    <AuthLayout>
      <SignIn appearance={clerkAppearance} />
    </AuthLayout>
  );
}
