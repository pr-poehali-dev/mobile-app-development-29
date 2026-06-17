import { useState, useRef } from 'react';
import Icon from '@/components/ui/icon';
import { Car, useSettings } from './shared';

export const Tag = ({ icon, text }: { icon: string; text: string }) =>
  text ? (
    <span className="inline-flex items-center gap-1 text-xs bg-muted text-foreground px-2.5 py-1 rounded-lg">
      <Icon name={icon} size={13} />
      {text}
    </span>
  ) : null;

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
