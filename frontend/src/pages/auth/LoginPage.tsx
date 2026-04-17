import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Eye, EyeOff, MessageSquare } from 'lucide-react';
import { authApi } from '../../api/services';
import { useAuthStore } from '../../store/authStore';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

const schema = z.object({
  email:    z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
});
type FormData = z.infer<typeof schema>;

export function LoginPage() {
  const navigate = useNavigate();
  const { setTokens, setUser } = useAuthStore();
  const [showPass, setShowPass] = useState(false);
  const [apiError, setApiError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setApiError('');
    try {
      const { data: tokens } = await authApi.login(data.email, data.password);
      setTokens(tokens.access, tokens.refresh);
      const { data: me } = await authApi.me();
      setUser(me);
      navigate('/conversations');
    } catch {
      setApiError('Invalid email or password');
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'var(--page)' }}
    >
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--brand)' }}
          >
            <MessageSquare size={18} color="#fff" />
          </div>
          <span className="text-xl font-bold text-1">DjezzyChat</span>
        </div>

        <div
          className="rounded-2xl p-8"
          style={{ background: 'var(--sidebar)', border: '1px solid var(--border)' }}
        >
          <h1 className="text-lg font-semibold text-1 mb-1">Welcome back</h1>
          <p className="text-sm mb-6" style={{ color: 'var(--text-2)' }}>Sign in to your account</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="you@company.com"
              error={errors.email?.message}
              {...register('email')}
            />
            <div className="relative">
              <Input
                label="Password"
                type={showPass ? 'text' : 'password'}
                placeholder="••••••••"
                error={errors.password?.message}
                className="pr-10"
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPass(s => !s)}
                className="absolute right-3 top-7 transition-colors"
                style={{ color: 'var(--text-3)' }}
              >
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            {apiError && (
              <p className="text-xs text-red-400 rounded-lg px-3 py-2"
                style={{ background: '#ef444415', border: '1px solid #ef444430' }}>
                {apiError}
              </p>
            )}

            <Button
              type="submit"
              loading={isSubmitting}
              size="lg"
              className="w-full justify-center mt-2"
              style={{ background: 'var(--brand)', color: '#fff' }}
            >
              Sign in
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
