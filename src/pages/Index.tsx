import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AuthScreen from '@/components/AuthScreen';
import AdminPanel from '@/components/AdminPanel';
import {
  AUTH_URL,
  CARS_URL,
  BROADCAST_URL,
  MAX_PHOTOS,
  Tab,
  Lang,
  CURRENCIES,
  Settings,
  defaultSettings,
  T,
  SettingsContext,
  useSettings,
  Car,
  PLACEHOLDER,
  buildTabs,
  emptyForm,
} from './index/shared';
import { PublishForm } from './index/PublishForm';
import { CarList, SellDialog, SendCarDialog, Broadcast, SettingsPanel } from './index/CarComponents';

export { useSettings };

const Index = () => {
  const [authChecked, setAuthChecked] = useState(false);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('autosell_token'));
  const [userLogin, setUserLogin] = useState<string>(() => localStorage.getItem('autosell_login') || '');
  const [isAdmin, setIsAdmin] = useState<boolean>(() => localStorage.getItem('autosell_admin') === '1');

  useEffect(() => {
    const saved = localStorage.getItem('autosell_token');
    if (!saved) {
      setAuthChecked(true);
      return;
    }
    fetch(AUTH_URL, { headers: { 'X-Auth-Token': saved } })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        setToken(saved);
        setUserLogin(d.login);
        setIsAdmin(!!d.isAdmin);
        localStorage.setItem('autosell_admin', d.isAdmin ? '1' : '0');
      })
      .catch(() => {
        localStorage.removeItem('autosell_token');
        localStorage.removeItem('autosell_login');
        localStorage.removeItem('autosell_admin');
        setToken(null);
      })
      .finally(() => setAuthChecked(true));
  }, []);

  const handleAuth = (tk: string, lg: string, admin: boolean) => {
    localStorage.setItem('autosell_token', tk);
    localStorage.setItem('autosell_login', lg);
    localStorage.setItem('autosell_admin', admin ? '1' : '0');
    setToken(tk);
    setUserLogin(lg);
    setIsAdmin(admin);
  };

  const handleLogout = () => {
    const tk = localStorage.getItem('autosell_token');
    if (tk) {
      fetch(AUTH_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Auth-Token': tk }, body: JSON.stringify({ action: 'logout' }) }).catch(() => {});
    }
    localStorage.removeItem('autosell_token');
    localStorage.removeItem('autosell_login');
    localStorage.removeItem('autosell_admin');
    setToken(null);
    setUserLogin('');
    setIsAdmin(false);
  };

  const [tab, setTab] = useState<Tab>('publish');
  const [cars, setCars] = useState<Car[]>([]);
  const [carsLoading, setCarsLoading] = useState(false);
  const [soldSearch, setSoldSearch] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [photos, setPhotos] = useState<string[]>([]);

  const carsAuth = () => ({ 'Content-Type': 'application/json', 'X-Auth-Token': localStorage.getItem('autosell_token') || '' });

  const loadCars = () => {
    setCarsLoading(true);
    fetch(CARS_URL, { headers: carsAuth() })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setCars(d.cars || []))
      .catch(() => {})
      .finally(() => setCarsLoading(false));
  };

  useEffect(() => {
    if (token) loadCars();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);
  const [settings, setSettingsState] = useState<Settings>(() => {
    try {
      const saved = localStorage.getItem('autosell_settings');
      if (saved) return { ...defaultSettings, ...JSON.parse(saved) };
      const deviceLang: Lang = (navigator.language || '').toLowerCase().startsWith('ru') ? 'ru' : 'en';
      return { ...defaultSettings, lang: deviceLang };
    } catch {
      return defaultSettings;
    }
  });

  const setSettings = (s: Settings) => {
    setSettingsState(s);
    try {
      localStorage.setItem('autosell_settings', JSON.stringify(s));
    } catch {
      /* ignore */
    }
  };

  const t = T[settings.lang];
  const cur = CURRENCIES.find((c) => c.code === settings.currency) || CURRENCIES[0];
  const tabs = buildTabs(t, isAdmin);

  const selling = cars.filter((c) => c.status === 'selling');
  const sold = cars.filter((c) => c.status === 'sold');
  const knownBuyers = Array.from(
    new Set(cars.map((c) => (c.buyer || '').trim()).filter(Boolean)),
  ).sort((a, b) => a.localeCompare(b));
  const soldQuery = soldSearch.trim().toLowerCase();
  const soldFiltered = soldQuery
    ? sold.filter((c) =>
        [c.buyer, c.make, c.model, c.vin, c.sold_at].some((f) => (f || '').toLowerCase().includes(soldQuery)),
      )
    : sold;

  const handlePhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = MAX_PHOTOS - photos.length;
    const toAdd = files.slice(0, remaining).map((f) => URL.createObjectURL(f));
    setPhotos((prev) => [...prev, ...toAdd]);
    e.target.value = '';
  };

  const removePhoto = (idx: number) =>
    setPhotos((prev) => prev.filter((_, i) => i !== idx));

  const handlePublish = async () => {
    if (!form.make) return;
    const payload = { ...form, photos: photos.length ? photos : [PLACEHOLDER], status: 'selling' };
    await fetch(CARS_URL, { method: 'POST', headers: carsAuth(), body: JSON.stringify(payload) }).catch(() => {});
    setForm(emptyForm);
    setPhotos([]);
    setTab('selling');
    loadCars();
  };

  const changeStatus = async (id: number, status: 'selling' | 'sold', buyer?: string) => {
    const today = new Date().toISOString().slice(0, 10);
    setCars((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, status, buyer: status === 'sold' ? (buyer || '') : '', sold_at: status === 'sold' ? (c.sold_at || today) : null }
          : c,
      ),
    );
    const payload: Record<string, unknown> = { id, status, buyer: status === 'sold' ? (buyer || '') : '' };
    await fetch(CARS_URL, { method: 'PUT', headers: carsAuth(), body: JSON.stringify(payload) }).catch(() => {});
    fetch(BROADCAST_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Auth-Token': localStorage.getItem('autosell_token') || '' },
      body: JSON.stringify({ action: status === 'sold' ? 'mark_sold' : 'restore', carId: id }),
    }).catch(() => {});
  };

  const markSold = (id: number, buyer: string) => changeStatus(id, 'sold', buyer);

  const restore = (id: number) => changeStatus(id, 'selling');

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Icon name="Loader2" size={36} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!token) {
    return <AuthScreen onAuth={handleAuth} />;
  }

  return (
    <SettingsContext.Provider value={{ settings, setSettings, t, cur }}>
    <div className="min-h-screen bg-background flex justify-center">
      <div className="w-full max-w-md bg-background min-h-screen relative pb-24 shadow-2xl">
        <header className="gradient-brand px-5 pt-12 pb-8 rounded-b-[2.5rem] text-white relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/10 rounded-full" />
          <div className="absolute right-16 top-20 w-20 h-20 bg-white/10 rounded-full" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-1">
              <img
                src="https://cdn.poehali.dev/projects/6ab20892-3900-4803-af4f-d41104923ec6/files/7452054d-be5a-4e6f-a857-f94069c0936d.jpg"
                alt="ALLISALE"
                className="w-7 h-7 rounded-lg object-cover shadow-sm"
              />
              <span className="text-sm font-medium uppercase tracking-widest opacity-90">ALLISALE</span>
              <button
                onClick={handleLogout}
                className="ml-auto flex items-center gap-1.5 bg-white/15 hover:bg-white/25 transition-colors rounded-xl px-3 py-1.5 text-xs font-medium"
              >
                <Icon name="LogOut" size={14} />
                {userLogin}
              </button>
            </div>
            <h1 className="font-display text-4xl font-bold uppercase leading-none">{t.appTitle}</h1>
            <p className="text-sm opacity-90 mt-2">{t.appSubtitle}</p>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setTab('selling')}
                className="bg-white/15 hover:bg-white/25 active:scale-95 transition-all backdrop-blur rounded-2xl px-4 py-2 flex-1 text-left"
              >
                <div className="font-display text-2xl font-bold">{selling.length}</div>
                <div className="text-xs opacity-90">{t.statSelling}</div>
              </button>
              <button
                onClick={() => setTab('sold')}
                className="bg-white/15 hover:bg-white/25 active:scale-95 transition-all backdrop-blur rounded-2xl px-4 py-2 flex-1 text-left"
              >
                <div className="font-display text-2xl font-bold">{sold.length}</div>
                <div className="text-xs opacity-90">{t.statSold}</div>
              </button>
            </div>
          </div>
        </header>

        <main className="px-5 pt-6 animate-fade-in" key={tab}>
          {tab === 'publish' && (
            <PublishForm
              form={form}
              setForm={setForm}
              photos={photos}
              handlePhotos={handlePhotos}
              removePhoto={removePhoto}
              onPublish={handlePublish}
            />
          )}
          {(tab === 'selling' || tab === 'sold') && carsLoading && (
            <div className="flex justify-center py-16">
              <Icon name="Loader2" size={32} className="animate-spin text-primary" />
            </div>
          )}
          {tab === 'selling' && !carsLoading && (
            <CarList
              cars={selling}
              groupByMake
              empty={t.emptySelling}
              action={(c) => (
                <div className="space-y-2">
                  <SendCarDialog car={c} />
                  <SellDialog car={c} onSold={markSold} buyers={knownBuyers} />
                </div>
              )}
            />
          )}
          {tab === 'sold' && !carsLoading && (
            <div className="space-y-4">
              {sold.length > 0 && (
                <div className="relative">
                  <Icon
                    name="Search"
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    value={soldSearch}
                    onChange={(e) => setSoldSearch(e.target.value)}
                    placeholder={t.searchSold}
                    className="rounded-xl h-11 pl-10"
                  />
                  {soldSearch && (
                    <button
                      onClick={() => setSoldSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <Icon name="X" size={18} />
                    </button>
                  )}
                </div>
              )}
              <CarList
                cars={soldFiltered}
                sold
                empty={soldQuery ? t.nothingFound : t.emptySold}
                action={(c) => (
                  <Button variant="outline" onClick={() => restore(c.id)} className="w-full rounded-xl">
                    <Icon name="Undo2" size={18} className="mr-2" />
                    {t.restore}
                  </Button>
                )}
              />
            </div>
          )}
          {tab === 'broadcast' && <Broadcast count={selling.length} cars={selling} />}
          {tab === 'settings' && <SettingsPanel />}
          {tab === 'admin' && isAdmin && <AdminPanel />}
        </main>

        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-card/95 backdrop-blur border-t border-border px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] flex justify-around z-10">
          {tabs.map((item) => {
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl transition-all ${active ? 'text-primary' : 'text-muted-foreground'}`}
              >
                <div className={`p-1.5 rounded-xl transition-all ${active ? 'bg-primary/10' : ''}`}>
                  <Icon name={item.icon} size={22} />
                </div>
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
    </SettingsContext.Provider>
  );
};

export default Index;
