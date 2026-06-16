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
import { useSettings } from '@/pages/Index';

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
  const { t } = useSettings();
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
      .catch(() => setError(t.loadError))
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
      <h2 className="font-display text-2xl font-bold uppercase">{t.adminTitle}</h2>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <Icon name="Users" size={14} /> {t.usersStat}
          </div>
          <div className="font-display text-3xl font-bold">{users.length}</div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <Icon name="Car" size={14} /> {t.adsStat}
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
                        {t.badgeAdmin}
                      </span>
                    )}
                    {u.is_blocked && (
                      <span className="text-[10px] bg-destructive/15 text-destructive rounded-full px-2 py-0.5 font-medium">
                        {t.badgeBlocked}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t.userCounts(Number(u.cars_count), Number(u.selling_count), Number(u.sold_count))}
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
                      {u.is_blocked ? t.unblock : t.block}
                    </Button>
                  )}

                  {userCars.length === 0 ? (
                    <div className="text-sm text-muted-foreground py-1">{t.noAds}</div>
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
                          {c.status === 'sold' ? t.statusSold : t.statusSelling}
                        </span>
                        <button
                          onClick={() => setConfirm({ kind: 'delete_car', carId: c.id, title: `${c.make} ${c.model}` })}
                          className="text-destructive hover:bg-destructive/10 rounded-lg p-2 transition-colors"
                          aria-label={t.deleteAria}
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
              {confirm?.kind === 'delete_car' && t.confirmDeleteCar}
              {confirm?.kind === 'block_user' && t.confirmBlockUser}
              {confirm?.kind === 'unblock_user' && t.confirmUnblockUser}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm?.kind === 'delete_car' && t.confirmDeleteCarDesc(confirm.title)}
              {confirm?.kind === 'block_user' && t.confirmBlockUserDesc(confirm.login)}
              {confirm?.kind === 'unblock_user' && t.confirmUnblockUserDesc(confirm.login)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">{t.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={runConfirm}
              disabled={busy}
              className={confirm?.kind === 'unblock_user' ? 'rounded-xl' : 'rounded-xl bg-destructive hover:bg-destructive/90'}
            >
              {busy ? <Icon name="Loader2" size={16} className="animate-spin" /> : t.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminPanel;