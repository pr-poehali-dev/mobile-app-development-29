import { useRef } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MAX_PHOTOS, useSettings, emptyForm } from './shared';
import { MAKES, MODELS, getYears, getEngines } from './carData';

export const SelectField = ({ label, options, value, onChange, placeholder, allowCustom }: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  allowCustom?: boolean;
}) => {
  const { t } = useSettings();
  const knownValues = [...options, ...(allowCustom ? ['Другая'] : [])];
  const isCustom = allowCustom && value !== '' && !options.includes(value) && value !== 'Другая';
  const selectValue = isCustom ? 'Другая' : value;

  return (
    <div>
      <Label className="text-sm font-medium mb-1.5 block">{label}</Label>
      <div className="relative">
        <select
          value={selectValue}
          onChange={(e) => {
            if (e.target.value === 'Другая') onChange('__custom__');
            else onChange(e.target.value);
          }}
          className={`w-full h-10 rounded-xl border border-input bg-background px-3 pr-9 text-sm appearance-none outline-none focus:ring-2 focus:ring-ring transition-colors ${selectValue ? 'text-foreground font-medium' : 'text-muted-foreground'}`}
        >
          <option value="">{placeholder || t.selectField(label)}</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
          {allowCustom && <option value="Другая">{t.enterManually}</option>}
        </select>
        <Icon name="ChevronDown" size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
      </div>
      {(isCustom || value === '__custom__') && (
        <Input
          autoFocus
          placeholder={t.enterField(label)}
          value={value === '__custom__' ? '' : value}
          onChange={(e) => onChange(e.target.value)}
          className="rounded-xl mt-2"
        />
      )}
    </div>
  );
};

export const PublishForm = ({
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
  const models = form.make ? (MODELS[form.make] || []) : [];
  const years = getYears(form.make, form.model);
  const engines = getEngines(form.make, form.model);
  const { cur, t } = useSettings();

  return (
    <div className="space-y-5">
      <h2 className="font-display text-2xl font-bold uppercase">{t.newAd}</h2>

      {/* Photo grid */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">{t.photos}</span>
          <span className="text-xs text-muted-foreground">{photos.length} / {MAX_PHOTOS}</span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {photos.map((src, idx) => (
            <div key={idx} className="relative aspect-square rounded-xl overflow-hidden bg-muted animate-scale-in">
              <img src={src} alt="" className="w-full h-full object-cover" />
              {idx === 0 && (
                <span className="absolute top-1 left-1 bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                  {t.mainPhoto}
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
              <span className="text-[10px] text-muted-foreground">{t.addPhoto}</span>
            </button>
          )}
        </div>

        <input ref={inputRef} type="file" accept="image/*" capture="environment" multiple className="hidden" onChange={handlePhotos} />

        {photos.length === 0 && (
          <button
            onClick={() => inputRef.current?.click()}
            className="w-full mt-2 aspect-video rounded-2xl border-2 border-dashed border-border bg-muted/50 flex flex-col items-center justify-center hover:border-primary transition-colors"
          >
            <Icon name="Camera" size={40} className="text-muted-foreground mb-2" />
            <span className="text-sm text-muted-foreground font-medium">{t.openCamera}</span>
            <span className="text-xs text-muted-foreground mt-1">{t.upToPhotos(MAX_PHOTOS)}</span>
          </button>
        )}
      </div>

      <div className="space-y-3">
        <SelectField
          label={t.make}
          options={MAKES}
          value={form.make}
          onChange={(v) => setForm({ ...form, make: v, model: '', year: '', engine: '' })}
          placeholder={t.selectMake}
          allowCustom
        />
        <SelectField
          label={t.model}
          options={models}
          value={form.model}
          onChange={(v) => setForm({ ...form, model: v, year: '', engine: '' })}
          placeholder={form.make ? t.selectModel : t.selectMakeFirst}
          allowCustom
        />
        <div className="grid grid-cols-2 gap-3">
          <SelectField
            label={t.year}
            options={years}
            value={form.year}
            onChange={(v) => setForm({ ...form, year: v })}
            placeholder={t.year}
          />
          <SelectField
            label={t.engine}
            options={engines}
            value={form.engine}
            onChange={(v) => setForm({ ...form, engine: v })}
            placeholder={t.engine}
          />
        </div>
        <Field label={t.priceLabel(cur.symbol)} placeholder={t.pricePlaceholder} value={form.price} onChange={(v) => setForm({ ...form, price: v })} />
        <Field label={t.mileageLabel} placeholder={t.mileagePlaceholder} value={form.mileage} onChange={(v) => setForm({ ...form, mileage: v })} />
        <Field label={t.vinLabel} placeholder={t.vinPlaceholder} value={form.vin} onChange={(v) => setForm({ ...form, vin: v.toUpperCase() })} />
        <div>
          <Label className="text-sm font-medium mb-1.5 block">{t.description}</Label>
          <Textarea
            placeholder={t.descriptionPlaceholder}
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
        {t.publish}
      </Button>
    </div>
  );
};

export const Field = ({ label, placeholder, value, onChange }: {
  label: string; placeholder: string; value: string; onChange: (v: string) => void;
}) => (
  <div>
    <Label className="text-sm font-medium mb-1.5 block">{label}</Label>
    <Input placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} className="rounded-xl" />
  </div>
);
