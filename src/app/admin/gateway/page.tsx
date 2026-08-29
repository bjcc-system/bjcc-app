'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { loginAdmin } from './actions';

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit(formData: FormData) {
    setIsLoading(true);
    setError('');

    try {
      const result = await loginAdmin(formData);
      if (result.success) {
        router.push('/admin');
      } else {
        setError(result.error || 'Failed to login');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative">
      <Card className="w-full max-w-md bg-card/60 backdrop-blur-xl border-border/50 shadow-2xl relative overflow-hidden">
        {/* Subtle gradient background effect for premium feel */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent opacity-50 pointer-events-none" />
        
        <CardHeader className="space-y-4 items-center text-center relative z-10 pt-8">
          <div className="h-16 w-16 rounded-full bg-blue-500/10 flex items-center justify-center glow-blue">
            <Shield className="w-8 h-8 text-blue-500" />
          </div>
          <div className="space-y-1.5">
            <CardTitle className="text-3xl font-bold tracking-tight text-gradient from-blue-500 to-cyan-400">
              Admin Portal
            </CardTitle>
            <CardDescription className="text-muted-foreground text-sm font-medium">
              Enter password to manage BJCC
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="relative z-10 pb-8">
          <form action={onSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground/80">
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                className="bg-background/50 border-white/10 focus-visible:ring-blue-500"
              />
            </div>

            {error && (
              <div className="p-3 text-sm font-medium text-red-400 bg-red-500/10 border border-red-500/20 rounded-md flex items-center gap-2">
                <div className="w-1 h-full bg-red-500/50 rounded-full" />
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 transition-all duration-300"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                'Login'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
