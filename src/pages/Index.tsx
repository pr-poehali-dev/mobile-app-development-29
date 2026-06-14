import { useState, useRef } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

const MAX_PHOTOS = 15;

type Tab = 'publish' | 'selling' | 'sold' | 'broadcast';

interface Car {
  id: number;
  title: string;
  price: string;
  year: string;
  mileage: string;
  engine: string;
  description: string;
  photos: string[];
  status: 'selling' | 'sold';
}

const PLACEHOLDER = 'https://cdn.poehali.dev/projects/6ab20892-3900-4803-af4f-d41104923ec6/files/7551188f-b758-4ec5-99b4-c23efe804a13.jpg';

const initialCars: Car[] = [
  {
    id: 1,
    title: 'BMW M4 Competition',
    price: '6 950 000',
    year: '2022',
    mileage: '18 400',
    engine: '3.0 / 510 л.с.',
    description: 'Идеальное состояние, один владелец, полный пакет M Performance.',
    photos: [PLACEHOLDER],
    status: 'selling',
  },
  {
    id: 2,
    title: 'Audi RS6 Avant',
    price: '9 200 000',
    year: '2021',
    mileage: '32 100',
    engine: '4.0 / 600 л.с.',
    description: 'Семейный универсал мечты. Керамика, пневмоподвеска, карбон.',
    photos: [PLACEHOLDER],
    status: 'sold',
  },
];

const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: 'publish', label: 'Опубликовать', icon: 'PlusCircle' },
  { id: 'selling', label: 'В продаже', icon: 'Car' },
  { id: 'sold', label: 'Продано', icon: 'CheckCircle2' },
  { id: 'broadcast', label: 'Рассылка', icon: 'Send' },
];

const emptyForm = { title: '', price: '', year: '', mileage: '', engine: '', description: '' };

const Index = () => {
  const [tab, setTab] = useState<Tab>('publish');
  const [cars, setCars] = useState<Car[]>(initialCars);
  const [form, setForm] = useState(emptyForm);
  const [photos, setPhotos] = useState<string[]>([]);

  const selling = cars.filter((c) => c.status === 'selling');
  const sold = cars.filter((c) => c.status === 'sold');

  const handlePhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = MAX_PHOTOS - photos.length;
    const toAdd = files.slice(0, remaining).map((f) => URL.createObjectURL(f));
    setPhotos((prev) => [...prev, ...toAdd]);
    e.target.value = '';
  };

  const removePhoto = (idx: number) =>
    setPhotos((prev) => prev.filter((_, i) => i !== idx));

  const handlePublish = () => {
    if (!form.title) return;
    setCars((prev) => [
      { id: Date.now(), ...form, photos: photos.length ? photos : [PLACEHOLDER], status: 'selling' },
      ...prev,
    ]);
    setForm(emptyForm);
    setPhotos([]);
    setTab('selling');
  };

  const markSold = (id: number) =>
    setCars((prev) => prev.map((c) => (c.id === id ? { ...c, status: 'sold' } : c)));

  const restore = (id: number) =>
    setCars((prev) => prev.map((c) => (c.id === id ? { ...c, status: 'selling' } : c)));

  return (
    <div className="min-h-screen bg-background flex justify-center">
      <div className="w-full max-w-md bg-background min-h-screen relative pb-24 shadow-2xl">
        <header className="gradient-brand px-5 pt-12 pb-8 rounded-b-[2.5rem] text-white relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/10 rounded-full" />
          <div className="absolute right-16 top-20 w-20 h-20 bg-white/10 rounded-full" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-1">
              <Icon name="Zap" size={20} />
              <span className="text-sm font-medium uppercase tracking-widest opacity-90">AutoSell</span>
            </div>
            <h1 className="font-display text-4xl font-bold uppercase leading-none">Продажа авто</h1>
            <p className="text-sm opacity-90 mt-2">Загружай, редактируй и отправляй в Telegram</p>
            <div className="flex gap-3 mt-5">
              <div className="bg-white/15 backdrop-blur rounded-2xl px-4 py-2 flex-1">
                <div className="font-display text-2xl font-bold">{selling.length}</div>
                <div className="text-xs opacity-90">в продаже</div>
              </div>
              <div className="bg-white/15 backdrop-blur rounded-2xl px-4 py-2 flex-1">
                <div className="font-display text-2xl font-bold">{sold.length}</div>
                <div className="text-xs opacity-90">продано</div>
              </div>
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
          {tab === 'selling' && (
            <CarList
              cars={selling}
              empty="Пока нет авто в продаже. Опубликуйте первое!"
              action={(c) => (
                <Button
                  onClick={() => markSold(c.id)}
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl"
                >
                  <Icon name="CheckCircle2" size={18} className="mr-2" />
                  Отметить проданным
                </Button>
              )}
            />
          )}
          {tab === 'sold' && (
            <CarList
              cars={sold}
              sold
              empty="Здесь появятся проданные авто."
              action={(c) => (
                <Button variant="outline" onClick={() => restore(c.id)} className="w-full rounded-xl">
                  <Icon name="Undo2" size={18} className="mr-2" />
                  Вернуть в продажу
                </Button>
              )}
            />
          )}
          {tab === 'broadcast' && <Broadcast count={selling.length} />}
        </main>

        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-card/95 backdrop-blur border-t border-border px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] flex justify-around z-10">
          {tabs.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${active ? 'text-primary' : 'text-muted-foreground'}`}
              >
                <div className={`p-1.5 rounded-xl transition-all ${active ? 'bg-primary/10' : ''}`}>
                  <Icon name={t.icon} size={22} />
                </div>
                <span className="text-[10px] font-medium">{t.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

const PublishForm = ({
  form, setForm, photos, handlePhotos, removePhoto, onPublish,
}: {
  form: typeof emptyForm;
  setForm: (f: typeof emptyForm) => void;
  photos: string[];
  handlePhotos: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removePhoto: (idx: number) => void;
  onPublish: () => void;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const canAdd = photos.length < MAX_PHOTOS;

  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl font-bold uppercase">Новое объявление</h2>

      {/* Photo grid */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Фотографии</span>
          <span className="text-xs text-muted-foreground">{photos.length} / {MAX_PHOTOS}</span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {photos.map((src, idx) => (
            <div key={idx} className="relative aspect-square rounded-xl overflow-hidden bg-muted animate-scale-in">
              <img src={src} alt="" className="w-full h-full object-cover" />
              {idx === 0 && (
                <span className="absolute top-1 left-1 bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                  Главное
                </span>
              )}
              <button
                onClick={() => removePhoto(idx)}
                className="absolute top-1 right-1 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center"
              >
                <Icon name="X" size={12} />
              </button>
            </div>
          ))}

          {canAdd && (
            <button
              onClick={() => inputRef.current?.click()}
              className="aspect-square rounded-xl border-2 border-dashed border-border bg-muted/40 flex flex-col items-center justify-center hover:border-primary transition-colors"
            >
              <Icon name="Camera" size={24} className="text-muted-foreground mb-1" />
              <span className="text-[10px] text-muted-foreground">Добавить</span>
            </button>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          className="hidden"
          onChange={handlePhotos}
        />

        {photos.length === 0 && (
          <button
            onClick={() => inputRef.current?.click()}
            className="w-full mt-2 aspect-video rounded-2xl border-2 border-dashed border-border bg-muted/50 flex flex-col items-center justify-center hover:border-primary transition-colors"
          >
            <Icon name="Camera" size={40} className="text-muted-foreground mb-2" />
            <span className="text-sm text-muted-foreground font-medium">Открыть камеру</span>
            <span className="text-xs text-muted-foreground mt-1">до {MAX_PHOTOS} фотографий</span>
          </button>
        )}
      </div>

      <div className="space-y-3">
        <Field label="Марка и модель" placeholder="BMW M4 Competition" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Цена, ₽" placeholder="6 950 000" value={form.price} onChange={(v) => setForm({ ...form, price: v })} />
          <Field label="Год" placeholder="2022" value={form.year} onChange={(v) => setForm({ ...form, year: v })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Пробег, км" placeholder="18 400" value={form.mileage} onChange={(v) => setForm({ ...form, mileage: v })} />
          <Field label="Двигатель" placeholder="3.0 / 510 л.с." value={form.engine} onChange={(v) => setForm({ ...form, engine: v })} />
        </div>
        <div>
          <Label className="text-sm font-medium mb-1.5 block">Описание</Label>
          <Textarea
            placeholder="Состояние, комплектация, история..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="rounded-xl min-h-24"
          />
        </div>
      </div>

      <Button
        onClick={onPublish}
        className="w-full gradient-brand text-white rounded-xl h-12 text-base font-semibold hover:opacity-90"
      >
        <Icon name="Rocket" size={20} className="mr-2" />
        Опубликовать
      </Button>
    </div>
  );
};

const Field = ({ label, placeholder, value, onChange }: {
  label: string; placeholder: string; value: string; onChange: (v: string) => void;
}) => (
  <div>
    <Label className="text-sm font-medium mb-1.5 block">{label}</Label>
    <Input placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} className="rounded-xl" />
  </div>
);

const CarList = ({ cars, action, empty, sold }: {
  cars: Car[];
  action: (c: Car) => React.ReactNode;
  empty: string;
  sold?: boolean;
}) => {
  const [activePhoto, setActivePhoto] = useState<Record<number, number>>({});

  if (cars.length === 0)
    return (
      <div className="text-center py-20 text-muted-foreground">
        <Icon name="Inbox" size={48} className="mx-auto mb-3 opacity-40" />
        <p className="text-sm">{empty}</p>
      </div>
    );

  return (
    <div className="space-y-4">
      {cars.map((c) => {
        const photoIdx = activePhoto[c.id] ?? 0;
        return (
          <div key={c.id} className="bg-card rounded-2xl overflow-hidden border border-border shadow-sm animate-scale-in">
            <div className="relative">
              <img
                src={c.photos[photoIdx]}
                alt={c.title}
                className={`w-full aspect-video object-cover transition-opacity ${sold ? 'grayscale' : ''}`}
              />
              {sold && (
                <div className="absolute top-3 right-3 bg-foreground text-background text-xs font-bold uppercase px-3 py-1 rounded-full rotate-3">
                  Продано
                </div>
              )}
              <div className="absolute bottom-3 left-3 gradient-brand text-white font-display text-lg font-bold px-3 py-1 rounded-xl">
                {c.price} ₽
              </div>
              {c.photos.length > 1 && (
                <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-lg">
                  <Icon name="Images" size={12} className="inline mr-1" />
                  {c.photos.length}
                </div>
              )}
            </div>

            {/* Thumbnail strip */}
            {c.photos.length > 1 && (
              <div className="flex gap-1.5 px-3 pt-3 overflow-x-auto scrollbar-none">
                {c.photos.map((src, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActivePhoto((p) => ({ ...p, [c.id]: idx }))}
                    className={`shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${idx === photoIdx ? 'border-primary' : 'border-transparent opacity-60'}`}
                  >
                    <img src={src} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            <div className="p-4 space-y-3">
              <div>
                <h3 className="font-display text-xl font-bold uppercase leading-tight">{c.title}</h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Tag icon="Calendar" text={c.year} />
                  <Tag icon="Gauge" text={`${c.mileage} км`} />
                  <Tag icon="Cog" text={c.engine} />
                </div>
              </div>
              {c.description && <p className="text-sm text-muted-foreground">{c.description}</p>}
              {action(c)}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const Tag = ({ icon, text }: { icon: string; text: string }) =>
  text ? (
    <span className="inline-flex items-center gap-1 text-xs bg-muted text-foreground px-2.5 py-1 rounded-lg">
      <Icon name={icon} size={13} />
      {text}
    </span>
  ) : null;

const Broadcast = ({ count }: { count: number }) => (
  <div className="space-y-4">
    <h2 className="font-display text-2xl font-bold uppercase">Рассылка в Telegram</h2>
    <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-[#229ED9] flex items-center justify-center text-white">
          <Icon name="Send" size={24} />
        </div>
        <div>
          <div className="font-semibold">Telegram-канал</div>
          <div className="text-sm text-muted-foreground">Не подключён</div>
        </div>
      </div>
      <div className="bg-muted rounded-xl p-4 text-sm">
        <p className="font-medium mb-1">К отправке готово:</p>
        <p className="text-muted-foreground">{count} авто в продаже будут разосланы подписчикам канала.</p>
      </div>
      <Button className="w-full gradient-brand text-white rounded-xl h-12 text-base font-semibold hover:opacity-90">
        <Icon name="Send" size={20} className="mr-2" />
        Отправить рассылку
      </Button>
    </div>
    <div className="bg-secondary rounded-2xl p-4 flex gap-3">
      <Icon name="Info" size={20} className="text-primary shrink-0 mt-0.5" />
      <p className="text-sm text-secondary-foreground">
        Подключите Telegram-бота, чтобы отправлять объявления автоматически.
      </p>
    </div>
  </div>
);

export default Index;
