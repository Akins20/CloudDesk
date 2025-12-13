import { AuthLayout } from '@/components/layout';
import { RegisterForm } from '@/components/auth';

export default function RegisterPage() {
  return (
    <AuthLayout>
      <RegisterForm />
    </AuthLayout>
  );
}
