import { useState } from 'react';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { loginUserSchema, registerUserSchema } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export default function AuthPage() {
  const { login, register, isAuthenticating } = useAuth();
  const { toast } = useToast();
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await login(loginUserSchema.parse({ email: loginEmail, password: loginPassword }));
    } catch (error) {
      toast({
        title: 'Sign in failed',
        description: error instanceof Error ? error.message : 'Check your email and password.',
        variant: 'destructive',
      });
    }
  }

  async function handleRegister(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await register(
        registerUserSchema.parse({
          displayName,
          email: registerEmail,
          password: registerPassword,
        }),
      );
    } catch (error) {
      toast({
        title: 'Account setup failed',
        description: error instanceof Error ? error.message : 'Check the account fields and try again.',
        variant: 'destructive',
      });
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto flex min-h-screen max-w-5xl items-center px-6 py-10">
        <div className="grid w-full gap-8 lg:grid-cols-[1fr_420px] lg:items-center">
          <section className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-md border bg-card px-3 py-2 text-sm font-medium text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Protected caregiver workspace
            </div>
            <div className="space-y-3">
              <h1 className="max-w-2xl text-4xl font-bold tracking-normal text-foreground md:text-5xl">
                Eyes Open care dashboard
              </h1>
              <p className="max-w-xl text-lg text-muted-foreground">
                Manage reminders, recognition labels, and camera-assisted task completion in a user-scoped workspace.
              </p>
            </div>
            <div className="grid max-w-2xl gap-3 sm:grid-cols-3">
              <div className="rounded-md border bg-card p-4">
                <p className="text-sm font-medium text-muted-foreground">Session</p>
                <p className="mt-2 font-semibold">HTTP-only cookie</p>
              </div>
              <div className="rounded-md border bg-card p-4">
                <p className="text-sm font-medium text-muted-foreground">Storage</p>
                <p className="mt-2 font-semibold">PostgreSQL-ready</p>
              </div>
              <div className="rounded-md border bg-card p-4">
                <p className="text-sm font-medium text-muted-foreground">Inference</p>
                <p className="mt-2 font-semibold">On-device</p>
              </div>
            </div>
          </section>

          <Card>
            <CardHeader>
              <CardTitle>Access dashboard</CardTitle>
              <CardDescription>Use a caregiver account to keep records separated by user.</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="signin" className="space-y-5">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="signin">Sign in</TabsTrigger>
                  <TabsTrigger value="create">Create account</TabsTrigger>
                </TabsList>

                <TabsContent value="signin">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        autoComplete="email"
                        value={loginEmail}
                        onChange={(event) => setLoginEmail(event.target.value)}
                        data-testid="input-login-email"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Password</Label>
                      <Input
                        id="login-password"
                        type="password"
                        autoComplete="current-password"
                        value={loginPassword}
                        onChange={(event) => setLoginPassword(event.target.value)}
                        data-testid="input-login-password"
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full gap-2"
                      disabled={isAuthenticating}
                      data-testid="button-login"
                    >
                      {isAuthenticating && <Loader2 className="h-4 w-4 animate-spin" />}
                      Sign in
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="create">
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-name">Display name</Label>
                      <Input
                        id="register-name"
                        autoComplete="name"
                        value={displayName}
                        onChange={(event) => setDisplayName(event.target.value)}
                        data-testid="input-register-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-email">Email</Label>
                      <Input
                        id="register-email"
                        type="email"
                        autoComplete="email"
                        value={registerEmail}
                        onChange={(event) => setRegisterEmail(event.target.value)}
                        data-testid="input-register-email"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-password">Password</Label>
                      <Input
                        id="register-password"
                        type="password"
                        autoComplete="new-password"
                        value={registerPassword}
                        onChange={(event) => setRegisterPassword(event.target.value)}
                        data-testid="input-register-password"
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full gap-2"
                      disabled={isAuthenticating}
                      data-testid="button-register"
                    >
                      {isAuthenticating && <Loader2 className="h-4 w-4 animate-spin" />}
                      Create account
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
