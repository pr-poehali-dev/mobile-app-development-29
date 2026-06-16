import { useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import func2url from '../../backend/func2url.json';

const ADMIN_URL = func2url.admin;

interface AdminUser {
  id: number;
  login: string;
  is_admin: boolean;
  is_blocked: boolean;
  created_at: string;
  cars_count: number;
  selling_count: number;
  sold_count: number;
}

interface AdminCar {
  id: number;
  user_id: number;
  make: string;
  model: string;
  price: string;
  year: string;
  status: string;
  photos: string[];
}

type Confirm =
  | { kind: 'delete_car'; carId: number; title: string }
  | { kind: 'block_user'; userId: number; login: string }
  | { kind: 'unblock_user'; userId: number; login: string };

const AdminPanel = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [cars, setCars] = useState<AdminCar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openUser, setOpenUser] = useState<number | null>(null);
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const [busy, setBusy] = useState(false);

  const authHeaders = () => ({
    'Content-Type': 'application/json',
    'X-Auth-Token': localStorage.getItem('autosell_token') || '',
  });

  const load = () => {
    fetch(ADMIN_URL, { headers: authHeaders() })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        setUsers(d.users || []);
        setCars(d.cars || []);
      })
      .catch(() => setError('Не удалось загрузить данные'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runConfirm = async () => {
    if (!confirm) return;
    setBusy(true);
    const body =
      confirm.kind === 'delete_car'
        ? { action: 'delete_car', carId: confirm.carId }
        : { action: confirm.kind, userId: (confirm as { userId: number }).userId };
    await fetch(ADMIN_URL, { method: 'POST', headers: authHeaders(), body: JSON.stringify(body) }).catch(() => {});
    setBusy(false);
    setConfirm(null);
    load();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Icon name="Loader2" size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-destructive/10 text-destructive text-sm rounded-xl px-4 py-3 flex items-center gap-2">
        <Icon name="TriangleAlert" size={16} />
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h2 className="font-display text-2xl font-bold uppercase">Админ-панель</h2>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <Icon name="Users" size={14} /> Пользователей
          </div>
          <div className="font-display text-3xl font-bold">{users.length}</div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <Icon name="Car" size={14} /> Всего объявлений
          </div>
          <div className="font-display text-3xl font-bold">{cars.length}</div>
        </div>
      </div>

      <div className="space-y-3">
        {users.map((u) => {
          const userCars = cars.filter((c) => c.user_id === u.id);
          const isOpen = openUser === u.id;
          return (
            <div key={u.id} className="bg-card border border-border rounded-2xl overflow-hidden">
              <button
                onClick={() => setOpenUser(isOpen ? null : u.id)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold uppercase ${u.is_blocked ? 'bg-muted-foreground' : 'gradient-brand'}`}
                >
                  {u.login.slice(0, 1)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold flex items-center gap-1.5 flex-wrap">
                    {u.login}
                    {u.is_admin && (
                      <span className="text-[10px] bg-primary/15 text-primary rounded-full px-2 py-0.5 font-medium">
                        админ
                      </span>
                    )}
                    {u.is_blocked && (
                      <span className="text-[10px] bg-destructive/15 text-destructive rounded-full px-2 py-0.5 font-medium">
                        заблокирован
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {Number(u.cars_count)} объявл. · {Number(u.selling_count)} в продаже · {Number(u.sold_count)} продано
                  </div>
                </div>
                <Icon name={isOpen ? 'ChevronUp' : 'ChevronDown'} size={18} className="text-muted-foreground" />
              </button>

              {isOpen && (
                <div className="border-t border-border px-4 py-3 space-y-3 bg-muted/30">
                  {!u.is_admin && (
                    <Button
                      variant={u.is_blocked ? 'outline' : 'destructive'}
                      size="sm"
                      className="w-full rounded-xl"
                      onClick={() =>
                        setConfirm(
                          u.is_blocked
                            ? { kind: 'unblock_user', userId: u.id, login: u.login }
                            : { kind: 'block_user', userId: u.id, login: u.login },
                        )
                      }
                    >
                      <Icon name={u.is_blocked ? 'LockOpen' : 'Ban'} size={16} className="mr-2" />
                      {u.is_blocked ? 'Разблокировать' : 'Заблокировать'}
                    </Button>
                  )}

                  {userCars.length === 0 ? (
                    <div className="text-sm text-muted-foreground py-1">Нет объявлений</div>
                  ) : (
                    userCars.map((c) => (
                      <div key={c.id} className="flex items-center gap-3 bg-card rounded-xl p-2">
                        <img
                          src={c.photos?.[0] || ''}
                          alt=""
                          className="w-12 h-12 rounded-lg object-cover bg-muted"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">
                            {c.make} {c.model}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {c.year} · {c.price}
                          </div>
                        </div>
                        <span
                          className={`text-[10px] rounded-full px-2 py-0.5 font-medium ${c.status === 'sold' ? 'bg-accent/15 text-accent' : 'bg-primary/15 text-primary'}`}
                        >
                          {c.status === 'sold' ? 'продано' : 'в продаже'}
                        </span>
                        <button
                          onClick={() => setConfirm({ kind: 'delete_car', carId: c.id, title: `${c.make} ${c.model}` })}
                          className="text-destructive hover:bg-destructive/10 rounded-lg p-2 transition-colors"
                          aria-label="Удалить"
                        >
                          <Icon name="Trash2" size={16} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent className="rounded-2xl max-w-[340px]">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm?.kind === 'delete_car' && 'Удалить объявление?'}
              {confirm?.kind === 'block_user' && 'Заблокировать пользователя?'}
              {confirm?.kind === 'unblock_user' && 'Разблокировать пользователя?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm?.kind === 'delete_car' && `«${confirm.title}» будет удалено без возможности восстановления.`}
              {confirm?.kind === 'block_user' && `«${confirm.login}» потеряет доступ ко входу в приложение.`}
              {confirm?.kind === 'unblock_user' && `«${confirm.login}» снова сможет входить в приложение.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={runConfirm}
              disabled={busy}
              className={confirm?.kind === 'unblock_user' ? 'rounded-xl' : 'rounded-xl bg-destructive hover:bg-destructive/90'}
            >
              {busy ? <Icon name="Loader2" size={16} className="animate-spin" /> : 'Подтвердить'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminPanel;
