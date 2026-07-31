import { Navigate, useLocation, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'sonner';

import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

function LoginPage() {
  const { t } = useTranslation('auth');
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Kept in the component (not a shared schema file) since login is the
  // only place this exact shape is used — split out only if a second form
  // needs it.
  const loginSchema = z.object({
    email: z
      .string()
      .min(1, t('errors.emailRequired'))
      .email(t('errors.emailInvalid')),
    password: z.string().min(1, t('errors.passwordRequired')),
  });

  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  // Already signed in — don't show the login form again.
  if (user) {
    const redirectTo = location.state?.from?.pathname || '/dashboard';
    return <Navigate to={redirectTo} replace />;
  }

  const onSubmit = async (values) => {
    try {
      await login(values.email, values.password);
      const redirectTo = location.state?.from?.pathname || '/dashboard';
      navigate(redirectTo, { replace: true });
    } catch (error) {
      const status = error?.response?.status;
      const message = status === 401 ? t('errors.invalidCredentials') : t('errors.generic');
      toast.error(message);
    }
  };

  const submitting = form.formState.isSubmitting;

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-space-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-1 text-center">
          <p className="text-sm font-medium text-muted-foreground">{t('common:appName', { ns: 'common' })}</p>
          <CardTitle className="text-2xl">{t('loginTitle')}</CardTitle>
          <CardDescription>{t('loginSubtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-space-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('emailLabel')}</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder={t('emailPlaceholder')}
                        autoComplete="username"
                        autoFocus
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('passwordLabel')}</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder={t('passwordPlaceholder')}
                        autoComplete="current-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? t('submitting') : t('submit')}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </main>
  );
}

export default LoginPage;
