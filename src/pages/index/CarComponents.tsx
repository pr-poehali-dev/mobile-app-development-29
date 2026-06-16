import { useState, useRef } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Car, Settings, CURRENCIES, useSettings, sendCarsToGroups } from './shared';

export const CarList = ({ cars, action, empty, sold, groupByMake }: {
  cars: Car[];
  action: (c: Car) => React.ReactNode;
  empty: string;
  sold?: boolean;
  groupByMake?: boolean;
}) => {
  const [activePhoto, setActivePhoto] = useState<Record<number, number>>({});
  const { cur, t } = useSettings();
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const scrollToMake = (make: string) => {
    sectionRefs.current[make]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (cars.length === 0)
    return (
      <div className="text-center py-20 text-muted-foreground">
        <Icon name="Inbox" size={48} className="mx-auto mb-3 opacity-40" />
        <p className="text-sm">{empty}</p>
      </div>
    );

  const renderCard = (c: Car) => {
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
            <div className="absolute top-3 right-3 bg-white text-black text-xs font-bold uppercase px-3 py-1 rounded-full rotate-3 shadow">
              {t.soldBadge}
            </div>
          )}
          <div className="absolute bottom-3 left-3 gradient-brand text-white font-display text-lg font-bold px-3 py-1 rounded-xl">
            {c.price} {cur.symbol}
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
            <h3 className="font-display text-xl font-bold uppercase leading-tight">{c.make} {c.model}</h3>
            <div className="flex flex-wrap gap-2 mt-2">
              <Tag icon="Calendar" text={c.year} />
              <Tag icon="Gauge" text={c.mileage ? t.mileageValue(c.mileage) : ''} />
              <Tag icon="Cog" text={c.engine} />
              <Tag icon="Fingerprint" text={c.vin ? `VIN ${c.vin}` : ''} />
            </div>
          </div>
          {sold && (c.buyer || c.sold_at) && (
            <div className="bg-accent/10 text-foreground rounded-xl px-3 py-2 text-sm font-medium space-y-1">
              {c.buyer && (
                <div className="flex items-center gap-2">
                  <Icon name="UserCheck" size={16} className="text-accent shrink-0" />
                  {t.buyerTag(c.buyer)}
                </div>
              )}
              {c.sold_at && (
                <div className="flex items-center gap-2">
                  <Icon name="CalendarCheck" size={16} className="text-accent shrink-0" />
                  {t.soldDate(c.sold_at)}
                </div>
              )}
            </div>
          )}
          {c.description && <p className="text-sm text-muted-foreground">{c.description}</p>}
          {action(c)}
        </div>
      </div>
    );
  };

  if (!groupByMake) {
    return <div className="space-y-4">{cars.map(renderCard)}</div>;
  }

  const makes = Array.from(new Set(cars.map((c) => c.make))).sort((a, b) => a.localeCompare(b));

  return (
    <div className="space-y-6">
      {makes.length > 1 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-5 px-5 pb-1 sticky top-0 z-10 bg-background/90 backdrop-blur py-2">
          {makes.map((make) => (
            <button
              key={make}
              onClick={() => scrollToMake(make)}
              className="shrink-0 flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-sm font-medium hover:border-primary hover:text-primary transition-colors"
            >
              {make}
              <span className="text-xs text-muted-foreground">{cars.filter((c) => c.make === make).length}</span>
            </button>
          ))}
        </div>
      )}

      {makes.map((make) => {
        const group = cars.filter((c) => c.make === make);
        return (
          <div
            key={make}
            ref={(el) => (sectionRefs.current[make] = el)}
            className="space-y-3 scroll-mt-16"
          >
            <div className="flex items-center gap-2">
              <h3 className="font-display text-lg font-bold uppercase tracking-wide">{make}</h3>
              <span className="text-xs font-medium bg-primary/10 text-primary rounded-full px-2.5 py-0.5">
                {t.makeCount(group.length)}
              </span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div className="space-y-4">{group.map(renderCard)}</div>
          </div>
        );
      })}
    </div>
  );
};

export const Tag = ({ icon, text }: { icon: string; text: string }) =>
  text ? (
    <span className="inline-flex items-center gap-1 text-xs bg-muted text-foreground px-2.5 py-1 rounded-lg">
      <Icon name={icon} size={13} />
      {text}
    </span>
  ) : null;

export const SellDialog = ({ car, onSold, buyers }: { car: Car; onSold: (id: number, buyer: string) => void; buyers: string[] }) => {
  const { t, cur } = useSettings();
  const [open, setOpen] = useState(false);
  const [buyer, setBuyer] = useState('');
  const [focused, setFocused] = useState(false);

  const confirm = (withBuyer: boolean, value?: string) => {
    onSold(car.id, withBuyer ? (value ?? buyer).trim() : '');
    setOpen(false);
    setBuyer('');
  };

  const q = buyer.trim().toLowerCase();
  const suggestions = buyers
    .filter((b) => b.toLowerCase().includes(q) && b.toLowerCase() !== q)
    .slice(0, 6);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl">
          <Icon name="CheckCircle2" size={18} className="mr-2" />
          {t.markSold}
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-2xl max-w-[360px]">
        <DialogHeader>
          <DialogTitle>{t.buyerTitle}</DialogTitle>
          <DialogDescription>
            {car.make} {car.model} — {car.price} {cur.symbol}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">{t.buyerLabel}</Label>
          <div className="relative">
            <Input
              value={buyer}
              onChange={(e) => setBuyer(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setTimeout(() => setFocused(false), 150)}
              placeholder={t.buyerPlaceholder}
              className="rounded-xl h-11"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && buyer.trim() && confirm(true)}
            />
            {focused && suggestions.length > 0 && (
              <div className="absolute z-10 left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg overflow-hidden max-h-48 overflow-y-auto">
                {suggestions.map((b) => (
                  <button
                    key={b}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setBuyer(b)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted transition-colors"
                  >
                    <Icon name="History" size={14} className="text-muted-foreground shrink-0" />
                    {b}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Button
            onClick={() => confirm(true)}
            disabled={!buyer.trim()}
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl h-11 font-semibold"
          >
            <Icon name="CheckCircle2" size={18} className="mr-2" />
            {t.buyerConfirm}
          </Button>
          <Button variant="ghost" onClick={() => confirm(false)} className="w-full rounded-xl text-muted-foreground">
            {t.buyerSkip}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const SendCarDialog = ({ car }: { car: Car }) => {
  const { settings, t, cur } = useSettings();
  const groups = settings.groups;
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);
  const [sending, setSending] = useState(false);

  const toggle = (id: number) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const send = async () => {
    if (selected.length === 0) {
      toast.error(t.pickAtLeastOne);
      return;
    }
    setSending(true);
    try {
      const chosen = groups.filter((g) => selected.includes(g.id));
      const results = await sendCarsToGroups([car], chosen, settings.broadcastText, cur.symbol);
      const lines = results.map((r) => t.sentToGroup(r.group, r.sent, r.total));
      toast.success(t.broadcastDone, { description: lines.join('\n') });
      setOpen(false);
      setSelected([]);
    } catch {
      toast.error(t.broadcastFailed);
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full rounded-xl border-[#229ED9]/40 text-[#229ED9] hover:bg-[#229ED9]/10">
          <Icon name="Send" size={18} className="mr-2" />
          {t.sendCar}
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-2xl max-w-[360px]">
        <DialogHeader>
          <DialogTitle>{t.sendCarTitle}</DialogTitle>
          <DialogDescription>
            {car.make} {car.model} — {car.price} {cur.symbol}
          </DialogDescription>
        </DialogHeader>

        {groups.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">{t.noGroupsHint}</p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">{t.selectGroups}</p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {groups.map((g) => {
                const on = selected.includes(g.id);
                return (
                  <button
                    key={g.id}
                    onClick={() => toggle(g.id)}
                    className={`w-full flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${on ? 'border-primary bg-primary/10' : 'border-border bg-card'}`}
                  >
                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${on ? 'bg-primary border-primary text-white' : 'border-muted-foreground/40'}`}
                    >
                      {on && <Icon name="Check" size={14} />}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-sm truncate">{g.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{g.link}</div>
                    </div>
                  </button>
                );
              })}
            </div>
            <Button
              onClick={send}
              disabled={sending}
              className="w-full gradient-brand text-white rounded-xl h-11 font-semibold hover:opacity-90"
            >
              <Icon name={sending ? 'Loader2' : 'Send'} size={18} className={`mr-2 ${sending ? 'animate-spin' : ''}`} />
              {sending ? t.sending : t.sendSelected}
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export const Broadcast = ({ count, cars }: { count: number; cars: Car[] }) => {
  const { settings, t, cur } = useSettings();
  const groups = settings.groups;
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (cars.length === 0) {
      toast.error(t.broadcastNoCars);
      return;
    }
    setSending(true);
    try {
      const results = await sendCarsToGroups(cars, groups, settings.broadcastText, cur.symbol);
      const lines = results.map((r) => t.sentToGroup(r.group, r.sent, r.total));
      toast.success(t.broadcastDone, { description: lines.join('\n') });
    } catch {
      toast.error(t.broadcastFailed);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl font-bold uppercase">{t.broadcastTitle}</h2>

      {groups.length === 0 ? (
        <div className="bg-secondary rounded-2xl p-5 flex flex-col items-center text-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-[#229ED9] flex items-center justify-center text-white">
            <Icon name="Send" size={28} />
          </div>
          <p className="text-sm text-secondary-foreground">
            {t.broadcastNoGroups}
          </p>
        </div>
      ) : (
        <>
          <div className="bg-muted rounded-xl p-4 text-sm">
            <p className="font-medium mb-1">{t.readyToSend}</p>
            <p className="text-muted-foreground">{t.broadcastSummary(count, groups.length)}</p>
          </div>
          <div className="space-y-2">
            {groups.map((g) => (
              <div key={g.id} className="flex items-center gap-3 bg-card border border-border rounded-xl p-3">
                <div className="w-10 h-10 rounded-xl bg-[#229ED9] flex items-center justify-center text-white shrink-0">
                  <Icon name="Send" size={18} />
                </div>
                <div className="min-w-0">
                  <div className="font-medium truncate">{g.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{g.link}</div>
                </div>
              </div>
            ))}
          </div>
          <Button
            onClick={send}
            disabled={sending}
            className="w-full gradient-brand text-white rounded-xl h-12 text-base font-semibold hover:opacity-90"
          >
            <Icon name={sending ? 'Loader2' : 'Send'} size={20} className={`mr-2 ${sending ? 'animate-spin' : ''}`} />
            {sending ? t.sending : t.broadcast}
          </Button>
        </>
      )}
    </div>
  );
};

export const SettingsPanel = () => {
  const { settings, setSettings, t } = useSettings();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [link, setLink] = useState('');

  const update = (patch: Partial<Settings>) => setSettings({ ...settings, ...patch });

  const addGroup = () => {
    if (!name.trim() || !link.trim()) return;
    update({ groups: [...settings.groups, { id: Date.now(), name: name.trim(), link: link.trim() }] });
    setName('');
    setLink('');
    setAdding(false);
  };

  const removeGroup = (id: number) =>
    update({ groups: settings.groups.filter((g) => g.id !== id) });

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl font-bold uppercase">{t.settingsTitle}</h2>

      {/* Язык */}
      <section className="space-y-2">
        <Label className="text-sm font-semibold">{t.langSection}</Label>
        <div className="grid grid-cols-2 gap-2">
          {([['ru', 'Русский', '🇷🇺'], ['en', 'English', '🇬🇧']] as const).map(([code, label, flag]) => (
            <button
              key={code}
              onClick={() => update({ lang: code })}
              className={`flex items-center justify-center gap-2 h-11 rounded-xl border text-sm font-medium transition-all ${settings.lang === code ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-foreground'}`}
            >
              <span>{flag}</span>{label}
            </button>
          ))}
        </div>
      </section>

      {/* Валюта */}
      <section className="space-y-2">
        <Label className="text-sm font-semibold">{t.currencySection}</Label>
        <div className="grid grid-cols-3 gap-2">
          {CURRENCIES.map((c) => (
            <button
              key={c.code}
              onClick={() => update({ currency: c.code })}
              className={`flex flex-col items-center justify-center h-16 rounded-xl border transition-all ${settings.currency === c.code ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-foreground'}`}
            >
              <span className="font-display text-lg font-bold">{c.symbol}</span>
              <span className="text-[10px] text-muted-foreground">{c.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Telegram-группы */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold">{t.groupsSection}</Label>
          {!adding && (
            <button onClick={() => setAdding(true)} className="text-primary text-sm font-medium flex items-center gap-1">
              <Icon name="Plus" size={16} />{t.addGroup}
            </button>
          )}
        </div>

        {settings.groups.length === 0 && !adding && (
          <p className="text-sm text-muted-foreground bg-muted rounded-xl p-4">{t.noGroups}</p>
        )}

        <div className="space-y-2">
          {settings.groups.map((g) => (
            <div key={g.id} className="flex items-center gap-3 bg-card border border-border rounded-xl p-3">
              <div className="w-10 h-10 rounded-xl bg-[#229ED9] flex items-center justify-center text-white shrink-0">
                <Icon name="Send" size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium truncate">{g.name}</div>
                <div className="text-xs text-muted-foreground truncate">{g.link}</div>
              </div>
              <button onClick={() => removeGroup(g.id)} className="text-muted-foreground hover:text-destructive p-1">
                <Icon name="Trash2" size={18} />
              </button>
            </div>
          ))}
        </div>

        {adding && (
          <div className="bg-card border border-border rounded-2xl p-4 space-y-3 animate-scale-in">
            <Input placeholder={t.groupName} value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl" />
            <Input placeholder={t.groupLink} value={link} onChange={(e) => setLink(e.target.value)} className="rounded-xl" />
            <div className="flex gap-2">
              <Button onClick={addGroup} className="flex-1 gradient-brand text-white rounded-xl">
                <Icon name="Check" size={18} className="mr-1" />{t.create}
              </Button>
              <Button variant="outline" onClick={() => { setAdding(false); setName(''); setLink(''); }} className="rounded-xl">
                {t.cancel}
              </Button>
            </div>
          </div>
        )}
      </section>

      {/* Шаблон рассылки */}
      <section className="space-y-2">
        <Label className="text-sm font-semibold">{t.broadcastTemplate}</Label>
        <Textarea
          value={settings.broadcastText}
          onChange={(e) => update({ broadcastText: e.target.value })}
          className="rounded-xl min-h-28 font-mono text-xs"
        />
        <p className="text-xs text-muted-foreground">
          {'{make} {model} {year} {price} {mileage} {engine}'}
        </p>
      </section>
    </div>
  );
};
