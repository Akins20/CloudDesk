import { AuthLayout } from '@/components/layout';
import { LoginForm } from '@/components/auth';

export default function LoginPage() {
  return (
    <AuthLayout>
      <LoginForm />
    </AuthLayout>
  );
}
