import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import func2url from '../../backend/func2url.json';

const AUTH_URL = func2url.auth;
const LOGO = 'https://cdn.poehali.dev/projects/6ab20892-3900-4803-af4f-d41104923ec6/files/7452054d-be5a-4e6f-a857-f94069c0936d.jpg';

const AuthScreen = ({ onAuth }: { onAuth: (token: string, login: string, isAdmin: boolean) => void }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError('');
    if (login.trim().length < 3) return setError('Логин не короче 3 символов');
    if (password.length < 6) return setError('Пароль не короче 6 символов');

    setLoading(true);
    try {
      const res = await fetch(AUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: mode, login: login.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Ошибка. Попробуйте снова');
        return;
      }
      onAuth(data.token, data.login, !!data.isAdmin);
    } catch {
      setError('Нет соединения с сервером');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex justify-center">
      <div className="w-full max-w-md min-h-screen flex flex-col">
        <div className="gradient-brand px-6 pt-16 pb-12 rounded-b-[2.5rem] text-white relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/10 rounded-full" />
          <div className="absolute right-16 top-20 w-20 h-20 bg-white/10 rounded-full" />
          <div className="relative flex flex-col items-center text-center">
            <img src={LOGO} alt="ALLISALE" className="w-20 h-20 rounded-2xl object-cover shadow-lg mb-4" />
            <h1 className="font-display text-3xl font-bold uppercase tracking-widest">ALLISALE</h1>
            <p className="text-sm opacity-90 mt-1">Вход только для владельца</p>
          </div>
        </div>

        <div className="flex-1 px-6 pt-8 space-y-5">
          <div className="flex bg-muted rounded-2xl p-1">
            {(['login', 'register'] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); }}
                className={`flex-1 h-10 rounded-xl text-sm font-semibold transition-all ${mode === m ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}
              >
                {m === 'login' ? 'Вход' : 'Регистрация'}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <div>
              <Label className="text-sm font-medium mb-1.5 block">Логин</Label>
              <Input
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                placeholder="Ваш логин"
                autoCapitalize="none"
                className="rounded-xl h-11"
                onKeyDown={(e) => e.key === 'Enter' && submit()}
              />
            </div>
            <div>
              <Label className="text-sm font-medium mb-1.5 block">Пароль</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Минимум 6 символов"
                className="rounded-xl h-11"
                onKeyDown={(e) => e.key === 'Enter' && submit()}
              />
            </div>
          </div>

          {error && (
            <div className="bg-destructive/10 text-destructive text-sm rounded-xl px-4 py-3 flex items-center gap-2">
              <Icon name="TriangleAlert" size={16} />
              {error}
            </div>
          )}

          <Button
            onClick={submit}
            disabled={loading}
            className="w-full gradient-brand text-white rounded-xl h-12 text-base font-semibold hover:opacity-90"
          >
            {loading ? (
              <Icon name="Loader2" size={20} className="mr-2 animate-spin" />
            ) : (
              <Icon name={mode === 'login' ? 'LogIn' : 'UserPlus'} size={20} className="mr-2" />
            )}
            {mode === 'login' ? 'Войти' : 'Создать аккаунт'}
          </Button>

          <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1.5">
            <Icon name="ShieldCheck" size={14} className="text-primary" />
            Пароль хранится в зашифрованном виде
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;