import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Car, useSettings, sendCarsToGroups } from './shared';

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
