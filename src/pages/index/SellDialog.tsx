import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Car, useSettings } from './shared';

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
