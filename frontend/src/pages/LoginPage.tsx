import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { HardHat, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/stores/auth';
import { apiErrorMessage } from '@/lib/api';
import { he } from '@/locales/he';

const schema = z.object({
  email: z.string().email(he.auth.loginError),
  password: z.string().min(1, he.common.required),
});
type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const navigate = useNavigate();
  const { user, login, initialized } = useAuth();
  const [error, setError] = useState('');
  const { register, handleSubmit, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: 'admin@crm.local', password: 'Admin123!' },
  });

  if (initialized && user) return <Navigate to="/" replace />;

  const onSubmit = async (values: FormValues) => {
    setError('');
    try {
      await login(values.email, values.password);
      navigate('/');
    } catch (e) {
      setError(apiErrorMessage(e, he.auth.loginError));
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-bl from-primary/10 via-background to-accent/5 p-4">
      <Card className="w-full max-w-md p-8">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <HardHat className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold">{he.auth.welcome}</h1>
          <p className="text-sm text-muted-foreground">{he.auth.loginSubtitle}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="email">{he.auth.email}</Label>
            <Input id="email" type="email" dir="ltr" autoComplete="username" {...register('email')} />
            {formState.errors.email && (
              <p className="mt-1 text-xs text-destructive">{formState.errors.email.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="password">{he.auth.password}</Label>
            <Input id="password" type="password" dir="ltr" autoComplete="current-password" {...register('password')} />
            {formState.errors.password && (
              <p className="mt-1 text-xs text-destructive">{formState.errors.password.message}</p>
            )}
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
          )}

          <Button type="submit" className="w-full" disabled={formState.isSubmitting}>
            {formState.isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {he.auth.loginButton}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          admin@crm.local / Admin123!
        </p>
      </Card>
    </div>
  );
}
