import { useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';
import func2url from '../../backend/func2url.json';

const ADMIN_URL = func2url.admin;

interface AdminUser {
  id: number;
  login: string;
  is_admin: boolean;
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

const AdminPanel = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [cars, setCars] = useState<AdminCar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openUser, setOpenUser] = useState<number | null>(null);

  useEffect(() => {
    fetch(ADMIN_URL, { headers: { 'X-Auth-Token': localStorage.getItem('autosell_token') || '' } })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        setUsers(d.users || []);
        setCars(d.cars || []);
      })
      .catch(() => setError('Не удалось загрузить данные'))
      .finally(() => setLoading(false));
  }, []);

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

  const totalCars = cars.length;

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
          <div className="font-display text-3xl font-bold">{totalCars}</div>
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
                <div className="w-10 h-10 rounded-full gradient-brand flex items-center justify-center text-white font-bold uppercase">
                  {u.login.slice(0, 1)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold flex items-center gap-1.5">
                    {u.login}
                    {u.is_admin && (
                      <span className="text-[10px] bg-primary/15 text-primary rounded-full px-2 py-0.5 font-medium">
                        админ
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
                <div className="border-t border-border px-4 py-3 space-y-2 bg-muted/30">
                  {userCars.length === 0 ? (
                    <div className="text-sm text-muted-foreground py-2">Нет объявлений</div>
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
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminPanel;
