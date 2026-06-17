import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Car, Settings, CURRENCIES, useSettings, sendCarsToGroups } from './shared';

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
