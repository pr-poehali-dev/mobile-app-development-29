import { useState, useRef, useEffect, createContext, useContext } from 'react';
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
import AuthScreen from '@/components/AuthScreen';
import AdminPanel from '@/components/AdminPanel';
import { toast } from 'sonner';
import func2url from '../../backend/func2url.json';

const AUTH_URL = func2url.auth;
const CARS_URL = func2url.cars;
const BROADCAST_URL = func2url['telegram-broadcast'];

const MAX_PHOTOS = 15;

type Tab = 'publish' | 'selling' | 'sold' | 'broadcast' | 'settings' | 'admin';

type Lang = 'ru' | 'en';

interface Currency {
  code: string;
  symbol: string;
  label: string;
}

const CURRENCIES: Currency[] = [
  { code: 'RUB', symbol: '₽', label: 'Рубль' },
  { code: 'USD', symbol: '$', label: 'Доллар' },
  { code: 'EUR', symbol: '€', label: 'Евро' },
  { code: 'KZT', symbol: '₸', label: 'Тенге' },
  { code: 'AED', symbol: 'AED', label: 'Дирхам ОАЭ' },
  { code: 'BYN', symbol: 'Br', label: 'Бел. рубль' },
];

interface TgGroup {
  id: number;
  name: string;
  link: string;
}

interface Settings {
  lang: Lang;
  currency: string;
  groups: TgGroup[];
  broadcastText: string;
}

const defaultSettings: Settings = {
  lang: 'ru',
  currency: 'RUB',
  groups: [],
  broadcastText: '🚗 {make} {model}, {year}\n💰 {price}\n📍 Пробег: {mileage} км\n⚙️ {engine}',
};

const T = {
  ru: {
    publish: 'Опубликовать', selling: 'В продаже', sold: 'Продано', broadcast: 'Рассылка', settings: 'Настройки',
    settingsTitle: 'Настройки', langSection: 'Язык приложения', currencySection: 'Валюта в объявлениях',
    groupsSection: 'Telegram-группы для рассылки', addGroup: 'Добавить группу', groupName: 'Название группы',
    groupLink: 'Ссылка или @username', noGroups: 'Пока нет групп. Добавьте первую для рассылки.',
    broadcastTemplate: 'Шаблон объявления', save: 'Сохранить', delete: 'Удалить',
    create: 'Создать группу', cancel: 'Отмена',
    // tabs
    admin: 'Админ',
    // header
    appTitle: 'Продажа авто', appSubtitle: 'Загружай, редактируй и отправляй в Telegram',
    statSelling: 'в продаже', statSold: 'продано',
    // car list
    emptySelling: 'Пока нет авто в продаже. Опубликуйте первое!',
    emptySold: 'Здесь появятся проданные авто.',
    markSold: 'Отметить проданным', restore: 'Вернуть в продажу',
    soldBadge: 'Продано',
    makeCount: (n: number) => `${n} шт.`,
    buyerTitle: 'Кому продано?', buyerLabel: 'Покупатель',
    buyerPlaceholder: 'Имя, телефон или заметка',
    buyerConfirm: 'Подтвердить продажу', buyerSkip: 'Без покупателя',
    buyerTag: (name: string) => `Покупатель: ${name}`,
    mileageValue: (m: string) => `${m} км`,
    // publish form
    newAd: 'Новое объявление', photos: 'Фотографии', mainPhoto: 'Главное', addPhoto: 'Добавить',
    openCamera: 'Открыть камеру', upToPhotos: (n: number) => `до ${n} фотографий`,
    make: 'Марка', model: 'Модель', year: 'Год', engine: 'Двигатель',
    selectMake: 'Выбрать марку', selectModel: 'Выбрать модель', selectMakeFirst: 'Сначала выберите марку',
    priceLabel: (s: string) => `Цена, ${s}`, pricePlaceholder: '6 950 000',
    mileageLabel: 'Пробег, км', mileagePlaceholder: '18 400',
    vinLabel: 'VIN', vinPlaceholder: 'Например, XW8ZZZ...',
    description: 'Описание', descriptionPlaceholder: 'Состояние, комплектация, история...',
    enterManually: '✏️ Ввести вручную',
    selectField: (l: string) => `Выбрать ${l.toLowerCase()}`,
    enterField: (l: string) => `Введите ${l.toLowerCase()}`,
    // broadcast
    broadcastTitle: 'Рассылка в Telegram',
    broadcastNoGroups: 'Сначала добавьте Telegram-группы в разделе «Настройки», чтобы запускать рассылку.',
    readyToSend: 'К отправке готово:',
    broadcastSummary: (count: number, groups: number) => `${count} авто будут разосланы в ${groups} групп(ы).`,
    sending: 'Отправляем...', broadcastDone: 'Рассылка завершена',
    broadcastNoCars: 'Нет авто в продаже для рассылки.',
    sentToGroup: (name: string, sent: number, total: number) => `${name}: отправлено ${sent} из ${total}`,
    broadcastFailed: 'Не удалось отправить. Проверьте, что бот добавлен в группы как админ.',
    sendCar: 'Разослать', sendCarTitle: 'Куда разослать?',
    selectGroups: 'Выберите группы для отправки этого авто:',
    sendSelected: 'Отправить', noGroupsHint: 'Сначала добавьте группы в настройках.',
    pickAtLeastOne: 'Выберите хотя бы одну группу.',
    // admin panel
    adminTitle: 'Админ-панель', usersStat: 'Пользователей', adsStat: 'Всего объявлений',
    badgeAdmin: 'админ', badgeBlocked: 'заблокирован',
    userCounts: (ads: number, sel: number, sld: number) => `${ads} объявл. · ${sel} в продаже · ${sld} продано`,
    block: 'Заблокировать', unblock: 'Разблокировать',
    noAds: 'Нет объявлений',
    statusSold: 'продано', statusSelling: 'в продаже',
    deleteAria: 'Удалить',
    confirmDeleteCar: 'Удалить объявление?', confirmBlockUser: 'Заблокировать пользователя?',
    confirmUnblockUser: 'Разблокировать пользователя?',
    confirmDeleteCarDesc: (title: string) => `«${title}» будет удалено без возможности восстановления.`,
    confirmBlockUserDesc: (login: string) => `«${login}» потеряет доступ ко входу в приложение.`,
    confirmUnblockUserDesc: (login: string) => `«${login}» снова сможет входить в приложение.`,
    confirm: 'Подтвердить',
    loadError: 'Не удалось загрузить данные',
  },
  en: {
    publish: 'Publish', selling: 'For sale', sold: 'Sold', broadcast: 'Broadcast', settings: 'Settings',
    settingsTitle: 'Settings', langSection: 'App language', currencySection: 'Currency in ads',
    groupsSection: 'Telegram groups for broadcast', addGroup: 'Add group', groupName: 'Group name',
    groupLink: 'Link or @username', noGroups: 'No groups yet. Add the first one for broadcast.',
    broadcastTemplate: 'Ad template', save: 'Save', delete: 'Delete',
    create: 'Create group', cancel: 'Cancel',
    // tabs
    admin: 'Admin',
    // header
    appTitle: 'Car sales', appSubtitle: 'Upload, edit and send to Telegram',
    statSelling: 'for sale', statSold: 'sold',
    // car list
    emptySelling: 'No cars for sale yet. Publish the first one!',
    emptySold: 'Sold cars will appear here.',
    markSold: 'Mark as sold', restore: 'Return to sale',
    soldBadge: 'Sold',
    makeCount: (n: number) => `${n} pcs`,
    buyerTitle: 'Sold to whom?', buyerLabel: 'Buyer',
    buyerPlaceholder: 'Name, phone or note',
    buyerConfirm: 'Confirm sale', buyerSkip: 'No buyer',
    buyerTag: (name: string) => `Buyer: ${name}`,
    mileageValue: (m: string) => `${m} km`,
    // publish form
    newAd: 'New ad', photos: 'Photos', mainPhoto: 'Main', addPhoto: 'Add',
    openCamera: 'Open camera', upToPhotos: (n: number) => `up to ${n} photos`,
    make: 'Make', model: 'Model', year: 'Year', engine: 'Engine',
    selectMake: 'Select make', selectModel: 'Select model', selectMakeFirst: 'Select make first',
    priceLabel: (s: string) => `Price, ${s}`, pricePlaceholder: '6 950 000',
    mileageLabel: 'Mileage, km', mileagePlaceholder: '18 400',
    vinLabel: 'VIN', vinPlaceholder: 'e.g. XW8ZZZ...',
    description: 'Description', descriptionPlaceholder: 'Condition, options, history...',
    enterManually: '✏️ Enter manually',
    selectField: (l: string) => `Select ${l.toLowerCase()}`,
    enterField: (l: string) => `Enter ${l.toLowerCase()}`,
    // broadcast
    broadcastTitle: 'Broadcast to Telegram',
    broadcastNoGroups: 'First add Telegram groups in the «Settings» section to start broadcasting.',
    readyToSend: 'Ready to send:',
    broadcastSummary: (count: number, groups: number) => `${count} car(s) will be sent to ${groups} group(s).`,
    sending: 'Sending...', broadcastDone: 'Broadcast complete',
    broadcastNoCars: 'No cars for sale to broadcast.',
    sentToGroup: (name: string, sent: number, total: number) => `${name}: sent ${sent} of ${total}`,
    broadcastFailed: 'Failed to send. Make sure the bot is added to groups as admin.',
    sendCar: 'Send', sendCarTitle: 'Where to send?',
    selectGroups: 'Select groups to send this car:',
    sendSelected: 'Send', noGroupsHint: 'First add groups in settings.',
    pickAtLeastOne: 'Select at least one group.',
    // admin panel
    adminTitle: 'Admin panel', usersStat: 'Users', adsStat: 'Total ads',
    badgeAdmin: 'admin', badgeBlocked: 'blocked',
    userCounts: (ads: number, sel: number, sld: number) => `${ads} ads · ${sel} for sale · ${sld} sold`,
    block: 'Block', unblock: 'Unblock',
    noAds: 'No ads',
    statusSold: 'sold', statusSelling: 'for sale',
    deleteAria: 'Delete',
    confirmDeleteCar: 'Delete ad?', confirmBlockUser: 'Block user?',
    confirmUnblockUser: 'Unblock user?',
    confirmDeleteCarDesc: (title: string) => `«${title}» will be deleted permanently.`,
    confirmBlockUserDesc: (login: string) => `«${login}» will lose access to log in to the app.`,
    confirmUnblockUserDesc: (login: string) => `«${login}» will be able to log in to the app again.`,
    confirm: 'Confirm',
    loadError: 'Failed to load data',
  },
};

const SettingsContext = createContext<{
  settings: Settings;
  setSettings: (s: Settings) => void;
  t: (typeof T)['ru'];
  cur: Currency;
}>({ settings: defaultSettings, setSettings: () => {}, t: T.ru, cur: CURRENCIES[0] });

export const useSettings = () => useContext(SettingsContext);

interface Car {
  id: number;
  make: string;
  model: string;
  price: string;
  year: string;
  mileage: string;
  engine: string;
  vin: string;
  buyer: string;
  description: string;
  photos: string[];
  status: 'selling' | 'sold';
}

const PLACEHOLDER = 'https://cdn.poehali.dev/projects/6ab20892-3900-4803-af4f-d41104923ec6/files/7551188f-b758-4ec5-99b4-c23efe804a13.jpg';

const buildCarText = (c: Car, template: string, symbol: string) =>
  template
    .replace(/{make}/g, c.make)
    .replace(/{model}/g, c.model)
    .replace(/{year}/g, c.year)
    .replace(/{price}/g, `${c.price} ${symbol}`)
    .replace(/{mileage}/g, c.mileage)
    .replace(/{engine}/g, c.engine)
    .replace(/{description}/g, c.description);

interface SendResult {
  group: string;
  sent: number;
  total: number;
}

const sendCarsToGroups = async (
  cars: Car[],
  groups: TgGroup[],
  template: string,
  symbol: string,
): Promise<SendResult[]> => {
  const res = await fetch(BROADCAST_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Auth-Token': localStorage.getItem('autosell_token') || '' },
    body: JSON.stringify({
      action: 'send',
      groups: groups.map((g) => ({ name: g.name, link: g.link })),
      messages: cars.map((c) => ({ carId: c.id, text: buildCarText(c, template, symbol), photos: c.photos })),
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.results) {
    throw new Error(data.error || 'failed');
  }
  return data.results as SendResult[];
};

const buildTabs = (t: (typeof T)['ru'], isAdmin: boolean): { id: Tab; label: string; icon: string }[] => [
  { id: 'publish', label: t.publish, icon: 'PlusCircle' },
  { id: 'selling', label: t.selling, icon: 'Car' },
  { id: 'sold', label: t.sold, icon: 'CheckCircle2' },
  { id: 'broadcast', label: t.broadcast, icon: 'Send' },
  { id: 'settings', label: t.settings, icon: 'Settings' },
  ...(isAdmin ? [{ id: 'admin' as Tab, label: t.admin, icon: 'ShieldCheck' }] : []),
];

interface ModelSpec {
  years: [number, number]; // [от, до]
  engines: string[];
}

interface CarData {
  models: Record<string, ModelSpec>;
}

const CAR_DB: Record<string, CarData> = {
  BMW: {
    models: {
      'X5': { years: [2010, 2025], engines: ['2.0 / 190 л.с.', '2.0 / 249 л.с.', '3.0 / 249 л.с.', '3.0 / 340 л.с.', '3.0 / 400 л.с.', '4.4 / 530 л.с. (M)'] },
      'X6': { years: [2010, 2025], engines: ['3.0 / 249 л.с.', '3.0 / 340 л.с.', '4.4 / 530 л.с. (M)'] },
      'X3': { years: [2010, 2025], engines: ['2.0 / 150 л.с.', '2.0 / 184 л.с.', '2.0 / 249 л.с.', '3.0 / 360 л.с. (M)'] },
      'X4': { years: [2014, 2025], engines: ['2.0 / 184 л.с.', '2.0 / 249 л.с.', '3.0 / 360 л.с. (M)'] },
      'X7': { years: [2019, 2025], engines: ['3.0 / 340 л.с.', '4.4 / 530 л.с. (M)'] },
      'M3': { years: [2010, 2025], engines: ['4.0 / 420 л.с. (E90)', '3.0 / 431 л.с.', '3.0 / 480 л.с.', '3.0 / 510 л.с. Competition'] },
      'M4': { years: [2014, 2025], engines: ['3.0 / 431 л.с.', '3.0 / 480 л.с.', '3.0 / 510 л.с. Competition'] },
      'M5': { years: [2011, 2025], engines: ['4.4 / 560 л.с. (F10)', '4.4 / 600 л.с.', '4.4 / 625 л.с. Competition'] },
      'M6': { years: [2011, 2018], engines: ['4.4 / 560 л.с.', '4.4 / 600 л.с. Competition'] },
      '1 серия': { years: [2010, 2025], engines: ['1.5 / 116 л.с.', '2.0 / 136 л.с.', '2.0 / 170 л.с.', '2.0 / 231 л.с. (M135i)'] },
      '2 серия': { years: [2013, 2025], engines: ['1.5 / 136 л.с.', '2.0 / 184 л.с.', '2.0 / 306 л.с. (M240i)'] },
      '3 серия': { years: [2010, 2025], engines: ['1.6 / 136 л.с.', '2.0 / 156 л.с.', '2.0 / 184 л.с.', '2.0 / 258 л.с.', '3.0 / 374 л.с. (M340i)'] },
      '4 серия': { years: [2013, 2025], engines: ['2.0 / 184 л.с.', '2.0 / 252 л.с.', '3.0 / 326 л.с.'] },
      '5 серия': { years: [2010, 2025], engines: ['2.0 / 163 л.с.', '2.0 / 184 л.с.', '2.0 / 252 л.с.', '3.0 / 340 л.с.', '3.0 / 381 л.с. (M550i)'] },
      '6 серия': { years: [2010, 2018], engines: ['3.0 / 320 л.с.', '4.4 / 450 л.с.', '4.4 / 560 л.с. (M6)'] },
      '7 серия': { years: [2010, 2025], engines: ['3.0 / 265 л.с.', '3.0 / 320 л.с.', '4.4 / 530 л.с. (M760i)', 'Электро 544 л.с. (i7)'] },
      'i3': { years: [2013, 2022], engines: ['Электро 170 л.с.', 'Электро 184 л.с.'] },
      'i4': { years: [2021, 2025], engines: ['Электро 340 л.с.', 'Электро 544 л.с. (M50)'] },
      'iX': { years: [2021, 2025], engines: ['Электро 326 л.с.', 'Электро 523 л.с.', 'Электро 619 л.с. (M60)'] },
    },
  },
  Mercedes: {
    models: {
      'A-Class': { years: [2012, 2025], engines: ['1.3 / 136 л.с.', '1.3 / 163 л.с.', '2.0 / 306 л.с. (AMG A45)'] },
      'B-Class': { years: [2011, 2025], engines: ['1.3 / 136 л.с.', '1.5 / 116 л.с.', 'Электро 179 л.с. (EQB)'] },
      'C-Class': { years: [2010, 2025], engines: ['1.5 / 184 л.с.', '2.0 / 204 л.с.', '2.0 / 258 л.с.', '3.0 / 476 л.с. (AMG C63)'] },
      'E-Class': { years: [2010, 2025], engines: ['2.0 / 184 л.с.', '2.0 / 197 л.с.', '2.0 / 258 л.с.', '3.0 / 367 л.с.', '4.0 / 612 л.с. (AMG E63)'] },
      'S-Class': { years: [2010, 2025], engines: ['3.0 / 258 л.с.', '3.0 / 367 л.с.', '4.0 / 463 л.с.', '4.0 / 612 л.с. (AMG S63)', 'Электро 659 л.с. (EQS)'] },
      'GLA': { years: [2013, 2025], engines: ['1.3 / 136 л.с.', '2.0 / 224 л.с.', '2.0 / 306 л.с. (AMG GLA45)'] },
      'GLB': { years: [2019, 2025], engines: ['1.3 / 136 л.с.', '2.0 / 224 л.с.', '2.0 / 306 л.с. (AMG GLB35)'] },
      'GLC': { years: [2015, 2025], engines: ['2.0 / 204 л.с.', '2.0 / 258 л.с.', '4.0 / 510 л.с. (AMG GLC63)'] },
      'GLE': { years: [2015, 2025], engines: ['2.0 / 197 л.с.', '3.0 / 367 л.с.', '4.0 / 612 л.с. (AMG GLE63)'] },
      'GLS': { years: [2012, 2025], engines: ['3.0 / 367 л.с.', '4.0 / 612 л.с. (AMG GLS63)'] },
      'AMG GT': { years: [2015, 2025], engines: ['4.0 / 476 л.с.', '4.0 / 530 л.с.', '4.0 / 585 л.с. (R)'] },
      'G-Class': { years: [2010, 2025], engines: ['3.0 / 272 л.с.', '4.0 / 422 л.с.', '4.0 / 585 л.с. (AMG G63)', 'Электро 587 л.с. (EQG)'] },
      'CLA': { years: [2013, 2025], engines: ['1.3 / 163 л.с.', '2.0 / 224 л.с.', '2.0 / 306 л.с. (AMG)'] },
      'CLS': { years: [2010, 2025], engines: ['3.0 / 258 л.с.', '3.0 / 367 л.с.', '4.0 / 612 л.с. (AMG CLS63)'] },
      'EQC': { years: [2019, 2024], engines: ['Электро 408 л.с.'] },
      'EQS': { years: [2021, 2025], engines: ['Электро 333 л.с.', 'Электро 516 л.с.', 'Электро 761 л.с. (AMG)'] },
    },
  },
  Audi: {
    models: {
      'A3': { years: [2010, 2025], engines: ['1.0 / 116 л.с.', '1.4 / 150 л.с.', '2.0 / 190 л.с.', '2.5 / 400 л.с. (RS3)'] },
      'A4': { years: [2010, 2025], engines: ['1.8 / 120 л.с.', '2.0 / 150 л.с.', '2.0 / 190 л.с.', '2.0 / 245 л.с.', '2.9 / 450 л.с. (RS4)'] },
      'A5': { years: [2010, 2025], engines: ['1.8 / 170 л.с.', '2.0 / 190 л.с.', '2.0 / 245 л.с.', '2.9 / 450 л.с. (RS5)'] },
      'A6': { years: [2010, 2025], engines: ['2.0 / 150 л.с.', '2.0 / 204 л.с.', '3.0 / 340 л.с.', '2.9 / 450 л.с. (RS6)'] },
      'A7': { years: [2010, 2025], engines: ['2.0 / 245 л.с.', '3.0 / 340 л.с.', '2.9 / 450 л.с. (RS7)'] },
      'A8': { years: [2010, 2025], engines: ['3.0 / 218 л.с.', '3.0 / 340 л.с.', '4.0 / 460 л.с.', '4.0 / 630 л.с. (S8)'] },
      'Q3': { years: [2011, 2025], engines: ['1.4 / 150 л.с.', '2.0 / 180 л.с.', '2.0 / 230 л.с. (RS Q3)'] },
      'Q5': { years: [2010, 2025], engines: ['2.0 / 180 л.с.', '2.0 / 204 л.с.', '2.0 / 265 л.с.', '2.9 / 450 л.с. (RSQ5)'] },
      'Q7': { years: [2010, 2025], engines: ['3.0 / 245 л.с.', '3.0 / 272 л.с.', '3.0 / 340 л.с.', '4.0 / 600 л.с. (SQ7)'] },
      'Q8': { years: [2018, 2025], engines: ['3.0 / 286 л.с.', '3.0 / 340 л.с.', '4.0 / 600 л.с. (RSQ8)'] },
      'RS3': { years: [2011, 2025], engines: ['2.5 / 340 л.с.', '2.5 / 400 л.с.'] },
      'RS4': { years: [2012, 2025], engines: ['4.2 / 450 л.с. (B8)', '2.9 / 450 л.с.'] },
      'RS6': { years: [2012, 2025], engines: ['4.0 / 560 л.с. (C7)', '4.0 / 600 л.с.', '4.0 / 630 л.с. Performance'] },
      'TT': { years: [2010, 2023], engines: ['1.8 / 160 л.с.', '2.0 / 197 л.с.', '2.0 / 230 л.с.', '2.5 / 400 л.с. (TT RS)'] },
      'R8': { years: [2010, 2025], engines: ['4.2 / 430 л.с. (V8)', '5.2 / 540 л.с.', '5.2 / 620 л.с. (Performance)'] },
      'e-tron': { years: [2019, 2025], engines: ['Электро 313 л.с.', 'Электро 408 л.с.', 'Электро 503 л.с. (S)'] },
    },
  },
  Toyota: {
    models: {
      'Camry': { years: [2010, 2025], engines: ['2.0 / 150 л.с.', '2.5 / 181 л.с.', '3.5 / 249 л.с.', '2.5 / 218 л.с. Hybrid'] },
      'Land Cruiser 200': { years: [2010, 2021], engines: ['4.0 / 249 л.с.', '4.5 / 309 л.с.'] },
      'Land Cruiser 300': { years: [2021, 2025], engines: ['3.3 Hybrid / 415 л.с.', '3.5 / 415 л.с.'] },
      'RAV4': { years: [2010, 2025], engines: ['2.0 / 149 л.с.', '2.5 / 180 л.с.', '2.5 / 222 л.с. Hybrid'] },
      'Highlander': { years: [2010, 2025], engines: ['2.7 / 188 л.с.', '3.5 / 273 л.с.', '2.5 / 248 л.с. Hybrid'] },
      'Prado': { years: [2010, 2025], engines: ['2.7 / 163 л.с.', '4.0 / 282 л.с.', '2.8 Diesel / 204 л.с.'] },
      'Corolla': { years: [2010, 2025], engines: ['1.4 / 97 л.с.', '1.6 / 122 л.с.', '1.8 / 140 л.с.', '2.0 / 180 л.с.'] },
      'Hilux': { years: [2010, 2025], engines: ['2.4 Diesel / 150 л.с.', '2.8 Diesel / 204 л.с.', '4.0 / 282 л.с.'] },
      'Fortuner': { years: [2015, 2025], engines: ['2.7 / 166 л.с.', '2.8 Diesel / 204 л.с.', '4.0 / 282 л.с.'] },
      'Tundra': { years: [2010, 2025], engines: ['4.6 / 310 л.с.', '5.7 / 381 л.с.', '3.5 Hybrid / 437 л.с.'] },
    },
  },
  Lexus: {
    models: {
      'RX': { years: [2010, 2025], engines: ['2.0 / 238 л.с.', '3.5 / 295 л.с.', '3.5 / 313 л.с. Hybrid', '2.4 Hybrid / 309 л.с.'] },
      'LX': { years: [2010, 2025], engines: ['5.7 / 367 л.с.', '3.5 Hybrid / 415 л.с.'] },
      'GX': { years: [2010, 2025], engines: ['4.0 / 249 л.с.', '4.6 / 296 л.с.'] },
      'ES': { years: [2012, 2025], engines: ['2.0 / 150 л.с.', '2.5 / 181 л.с.', '2.5 / 200 л.с. Hybrid'] },
      'LS': { years: [2010, 2025], engines: ['4.6 / 370 л.с.', '3.5 / 415 л.с. Hybrid', '3.5 / 416 л.с.'] },
      'NX': { years: [2014, 2025], engines: ['2.0 / 149 л.с.', '2.0 / 197 л.с.', '2.5 / 243 л.с. Hybrid', 'Электро 304 л.с. (NX 450h+)'] },
      'IS': { years: [2010, 2025], engines: ['2.0 / 245 л.с.', '2.5 / 224 л.с.', '3.5 / 316 л.с.', '5.0 / 472 л.с. (IS F)'] },
      'UX': { years: [2018, 2025], engines: ['2.0 / 150 л.с.', '2.0 / 184 л.с. Hybrid', 'Электро 204 л.с. (UX 300e)'] },
      'LC': { years: [2017, 2025], engines: ['5.0 / 477 л.с.', '3.5 Hybrid / 359 л.с.'] },
      'RC': { years: [2014, 2025], engines: ['2.0 / 245 л.с.', '3.5 / 316 л.с.', '5.0 / 472 л.с. (RC F)'] },
    },
  },
  Porsche: {
    models: {
      'Cayenne': { years: [2010, 2025], engines: ['3.0 / 300 л.с.', '3.6 / 400 л.с.', '2.9 / 440 л.с. (S)', '4.0 / 550 л.с. (Turbo)', '3.0 Hybrid / 462 л.с.'] },
      '911': { years: [2010, 2025], engines: ['3.4 / 345 л.с. (991)', '3.0 / 385 л.с.', '3.0 / 450 л.с. (S)', '3.8 / 520 л.с. (Turbo S)', '3.8 / 650 л.с. (GT3 RS)', '3.7 / 700 л.с. (Turbo S)'] },
      'Panamera': { years: [2010, 2025], engines: ['3.6 / 300 л.с.', '4.8 / 400 л.с.', '2.9 / 330 л.с.', '2.9 / 440 л.с. (4S)', '4.0 / 550 л.с. (Turbo)', 'Гибрид / 462 л.с.'] },
      'Macan': { years: [2014, 2025], engines: ['2.0 / 184 л.с.', '2.0 / 245 л.с.', '2.9 / 380 л.с. (GTS)', 'Электро 639 л.с.'] },
      'Taycan': { years: [2019, 2025], engines: ['Электро 408 л.с.', 'Электро 530 л.с. (4S)', 'Электро 761 л.с. (Turbo S)'] },
      'Boxster': { years: [2010, 2025], engines: ['2.7 / 265 л.с.', '3.4 / 315 л.с. (S)', '4.0 / 718 л.с. (GTS)', 'Электро 490 л.с. (718)'] },
      'Cayman': { years: [2010, 2025], engines: ['2.7 / 265 л.с.', '3.4 / 325 л.с. (S)', '4.0 / 420 л.с. (GT4)', 'Электро 490 л.с. (718)'] },
    },
  },
  'Land Rover': {
    models: {
      'Defender': { years: [2010, 2025], engines: ['2.0 / 300 л.с.', '3.0 / 400 л.с.', '5.0 / 525 л.с. (V8)', '2.2 Diesel / 122 л.с. (старый)'] },
      'Discovery': { years: [2010, 2025], engines: ['2.0 / 241 л.с.', '2.0 / 249 л.с.', '3.0 / 306 л.с.', '5.0 / 525 л.с. (Sport SVR)'] },
      'Discovery Sport': { years: [2014, 2025], engines: ['1.5 / 160 л.с.', '2.0 / 200 л.с.', '2.0 / 249 л.с.', '1.5 Hybrid / 309 л.с.'] },
      'Range Rover': { years: [2010, 2025], engines: ['3.0 / 275 л.с.', '3.0 / 350 л.с.', '4.4 / 530 л.с.', '5.0 / 565 л.с. (SVR)', 'Гибрид / 510 л.с.'] },
      'Range Rover Sport': { years: [2010, 2025], engines: ['2.0 / 300 л.с.', '3.0 / 400 л.с.', '5.0 / 575 л.с. (SVR)'] },
      'Range Rover Evoque': { years: [2011, 2025], engines: ['2.0 / 150 л.с.', '2.0 / 200 л.с.', '2.0 / 249 л.с.', '1.5 Hybrid / 300 л.с.'] },
      'Freelander': { years: [2010, 2015], engines: ['2.2 Diesel / 150 л.с.', '2.0 / 200 л.с.'] },
    },
  },
  Volkswagen: {
    models: {
      'Polo': { years: [2010, 2025], engines: ['1.0 / 60 л.с.', '1.0 / 80 л.с.', '1.0 / 110 л.с.', '2.0 / 207 л.с. (GTI)'] },
      'Golf': { years: [2010, 2025], engines: ['1.0 / 90 л.с.', '1.4 / 122 л.с.', '1.5 / 130 л.с.', '2.0 / 300 л.с. (GTI)', '2.0 / 320 л.с. (R)'] },
      'Passat': { years: [2010, 2025], engines: ['1.4 / 125 л.с.', '1.4 / 150 л.с.', '2.0 / 190 л.с.', '1.4 Hybrid / 218 л.с.'] },
      'Tiguan': { years: [2010, 2025], engines: ['1.4 / 122 л.с.', '1.4 / 150 л.с.', '2.0 / 190 л.с.', '2.0 / 245 л.с. (R-Line)'] },
      'Touareg': { years: [2010, 2025], engines: ['3.0 / 231 л.с.', '3.6 / 280 л.с.', '3.0 / 286 л.с.', '3.0 / 340 л.с.', '4.0 / 421 л.с.'] },
      'Touran': { years: [2010, 2025], engines: ['1.4 / 140 л.с.', '2.0 Diesel / 150 л.с.', '1.5 / 150 л.с.'] },
      'Multivan': { years: [2010, 2025], engines: ['2.0 / 150 л.с.', '2.0 / 199 л.с.', '1.4 Hybrid / 218 л.с.'] },
      'Amarok': { years: [2010, 2025], engines: ['2.0 Diesel / 140 л.с.', '3.0 Diesel / 224 л.с.', '3.0 / 272 л.с.'] },
      'ID.4': { years: [2020, 2025], engines: ['Электро 150 л.с.', 'Электро 204 л.с.', 'Электро 299 л.с. (GTX)'] },
      'ID.6': { years: [2021, 2025], engines: ['Электро 204 л.с.', 'Электро 306 л.с.'] },
    },
  },
  Kia: {
    models: {
      'Rio': { years: [2010, 2025], engines: ['1.4 / 100 л.с.', '1.6 / 123 л.с.', '1.0 / 100 л.с.'] },
      'Ceed': { years: [2010, 2025], engines: ['1.0 / 120 л.с.', '1.4 / 140 л.с.', '1.6 / 204 л.с. (GT)'] },
      'Sportage': { years: [2010, 2025], engines: ['1.6 / 132 л.с.', '2.0 / 150 л.с.', '1.6 / 177 л.с.', '1.6 Hybrid / 230 л.с.'] },
      'Sorento': { years: [2010, 2025], engines: ['2.0 / 150 л.с.', '2.4 / 174 л.с.', '2.5 / 180 л.с.', '1.6 Hybrid / 230 л.с.'] },
      'Stinger': { years: [2017, 2023], engines: ['2.0 / 255 л.с.', '2.5 / 300 л.с.', '3.3 / 368 л.с.'] },
      'Telluride': { years: [2019, 2025], engines: ['3.8 / 291 л.с.'] },
      'EV6': { years: [2021, 2025], engines: ['Электро 228 л.с.', 'Электро 325 л.с.', 'Электро 585 л.с. (GT)'] },
      'Mohave': { years: [2010, 2025], engines: ['3.0 Diesel / 250 л.с.', '3.8 / 275 л.с.'] },
    },
  },
  Hyundai: {
    models: {
      'Solaris': { years: [2010, 2025], engines: ['1.4 / 100 л.с.', '1.6 / 123 л.с.'] },
      'Elantra': { years: [2010, 2025], engines: ['1.6 / 128 л.с.', '2.0 / 150 л.с.', '2.0 / 277 л.с. (N)'] },
      'Tucson': { years: [2010, 2025], engines: ['1.6 / 132 л.с.', '2.0 / 150 л.с.', '1.6 / 177 л.с.', '1.6 Hybrid / 230 л.с.'] },
      'Santa Fe': { years: [2010, 2025], engines: ['2.0 / 150 л.с.', '2.4 / 175 л.с.', '2.5 / 190 л.с.', '1.6 Hybrid / 230 л.с.'] },
      'Palisade': { years: [2018, 2025], engines: ['3.8 / 291 л.с.', '2.2 Diesel / 202 л.с.'] },
      'Sonata': { years: [2010, 2025], engines: ['2.0 / 150 л.с.', '2.4 / 188 л.с.', '2.5 / 180 л.с.', '1.6 Hybrid / 180 л.с.'] },
      'ix35': { years: [2010, 2015], engines: ['2.0 / 150 л.с.', '2.0 Diesel / 136 л.с.'] },
      'IONIQ 5': { years: [2021, 2025], engines: ['Электро 217 л.с.', 'Электро 306 л.с.', 'Электро 584 л.с. (N)'] },
    },
  },
  Nissan: {
    models: {
      'Patrol': { years: [2010, 2025], engines: ['4.0 / 284 л.с.', '5.6 / 405 л.с.'] },
      'X-Trail': { years: [2010, 2025], engines: ['1.6 / 130 л.с.', '2.0 / 144 л.с.', '2.5 / 171 л.с.', '1.5 Hybrid / 213 л.с.'] },
      'Qashqai': { years: [2010, 2025], engines: ['1.2 / 115 л.с.', '1.3 / 140 л.с.', '2.0 / 144 л.с.', '1.5 Hybrid / 158 л.с.'] },
      'Murano': { years: [2010, 2025], engines: ['2.5 / 170 л.с.', '3.5 / 249 л.с.'] },
      'Juke': { years: [2010, 2025], engines: ['1.0 / 114 л.с.', '1.5 / 150 л.с.', '1.6 Turbo / 190 л.с.'] },
      'Navara': { years: [2010, 2025], engines: ['2.3 Diesel / 163 л.с.', '2.5 / 188 л.с.', '2.3 Diesel / 190 л.с.'] },
      'GT-R': { years: [2010, 2024], engines: ['3.8 / 550 л.с.', '3.8 / 570 л.с.', '3.8 / 600 л.с. (Nismo)'] },
      'Leaf': { years: [2010, 2025], engines: ['Электро 109 л.с.', 'Электро 150 л.с.', 'Электро 218 л.с.'] },
    },
  },
  Ford: {
    models: {
      'Focus': { years: [2010, 2025], engines: ['1.0 / 100 л.с.', '1.5 / 150 л.с.', '2.0 / 280 л.с. (ST)', '2.3 / 350 л.с. (RS)'] },
      'Fiesta': { years: [2010, 2023], engines: ['1.0 / 85 л.с.', '1.0 / 100 л.с.', '1.5 / 200 л.с. (ST)'] },
      'Kuga': { years: [2012, 2025], engines: ['1.5 / 120 л.с.', '1.5 / 150 л.с.', '2.0 / 249 л.с.', '2.5 Hybrid / 225 л.с.'] },
      'Explorer': { years: [2010, 2025], engines: ['2.0 / 240 л.с.', '2.3 / 300 л.с.', '3.0 Hybrid / 457 л.с.'] },
      'Mustang': { years: [2010, 2025], engines: ['2.3 / 290 л.с.', '3.7 / 305 л.с.', '5.0 / 450 л.с.', '5.2 / 760 л.с. (Shelby GT500)'] },
      'F-150': { years: [2010, 2025], engines: ['2.7 / 325 л.с.', '3.5 / 365 л.с.', '5.0 / 400 л.с.', '3.5 Hybrid / 430 л.с.'] },
      'Ranger': { years: [2011, 2025], engines: ['2.0 Diesel / 170 л.с.', '2.3 / 205 л.с.', '3.0 Diesel / 240 л.с.'] },
      'Bronco': { years: [2021, 2025], engines: ['2.3 / 300 л.с.', '2.7 / 330 л.с.'] },
    },
  },
  Chevrolet: {
    models: {
      'Cruze': { years: [2010, 2019], engines: ['1.4 / 140 л.с.', '1.6 / 115 л.с.', '2.0 Diesel / 163 л.с.'] },
      'Captiva': { years: [2010, 2018], engines: ['2.0 / 140 л.с.', '2.4 / 140 л.с.', '3.0 / 258 л.с.'] },
      'Tahoe': { years: [2010, 2025], engines: ['5.3 / 320 л.с.', '5.3 / 360 л.с.', '6.2 / 420 л.с.'] },
      'Suburban': { years: [2010, 2025], engines: ['5.3 / 360 л.с.', '6.2 / 420 л.с.'] },
      'Camaro': { years: [2010, 2025], engines: ['2.0 / 275 л.с.', '3.6 / 335 л.с.', '6.2 / 453 л.с. (SS)', '6.2 / 650 л.с. (ZL1)'] },
      'Corvette': { years: [2010, 2025], engines: ['6.2 / 455 л.с.', '6.2 / 650 л.с. (Z06)', '5.5 / 670 л.с. (Z06 C8)'] },
      'Traverse': { years: [2010, 2025], engines: ['2.0 / 257 л.с.', '3.6 / 314 л.с.'] },
      'Silverado': { years: [2010, 2025], engines: ['4.3 / 285 л.с.', '5.3 / 355 л.с.', '6.2 / 420 л.с.'] },
    },
  },
  Mazda: {
    models: {
      'Mazda3': { years: [2010, 2025], engines: ['1.5 / 120 л.с.', '2.0 / 150 л.с.', '2.5 / 186 л.с.', '2.5 Turbo / 265 л.с.'] },
      'Mazda6': { years: [2010, 2023], engines: ['2.0 / 145 л.с.', '2.5 / 194 л.с.', '2.2 Diesel / 150 л.с.'] },
      'CX-3': { years: [2015, 2023], engines: ['1.5 / 105 л.с.', '2.0 / 120 л.с.'] },
      'CX-5': { years: [2012, 2025], engines: ['2.0 / 150 л.с.', '2.5 / 194 л.с.', '2.5 Turbo / 230 л.с.'] },
      'CX-7': { years: [2010, 2012], engines: ['2.3 Turbo / 238 л.с.'] },
      'CX-9': { years: [2010, 2025], engines: ['3.7 / 277 л.с.', '2.5 Turbo / 228 л.с.', '2.5 Turbo / 250 л.с.'] },
      'CX-60': { years: [2022, 2025], engines: ['2.5 Hybrid / 327 л.с.', '3.3 Diesel / 254 л.с.'] },
      'MX-5': { years: [2010, 2025], engines: ['1.8 / 126 л.с.', '2.0 / 160 л.с.', '2.0 / 184 л.с.'] },
    },
  },
  Subaru: {
    models: {
      'Outback': { years: [2010, 2025], engines: ['2.5 / 167 л.с.', '2.5 / 175 л.с.', '3.6 / 256 л.с.', '2.4 Turbo / 260 л.с.'] },
      'Forester': { years: [2010, 2025], engines: ['2.0 / 150 л.с.', '2.5 / 171 л.с.', '2.0 Hybrid / 150 л.с.'] },
      'XV / Crosstrek': { years: [2011, 2025], engines: ['2.0 / 156 л.с.', '2.0 Hybrid / 136 л.с.', '2.5 / 182 л.с.'] },
      'Impreza': { years: [2010, 2025], engines: ['1.6 / 114 л.с.', '2.0 / 150 л.с.', '2.0 / 156 л.с.'] },
      'WRX': { years: [2010, 2025], engines: ['2.0 Turbo / 268 л.с.', '2.5 Turbo / 265 л.с.', '2.4 Turbo / 275 л.с.', '2.4 Turbo / 313 л.с. (STI)'] },
      'Legacy': { years: [2010, 2025], engines: ['2.5 / 167 л.с.', '3.6 / 256 л.с.'] },
      'BRZ': { years: [2012, 2025], engines: ['2.0 / 200 л.с.', '2.4 / 228 л.с.'] },
    },
  },
  Mitsubishi: {
    models: {
      'Outlander': { years: [2010, 2025], engines: ['2.0 / 146 л.с.', '2.4 / 167 л.с.', '3.0 / 224 л.с.', '2.4 PHEV / 224 л.с.'] },
      'ASX': { years: [2010, 2025], engines: ['1.6 / 117 л.с.', '2.0 / 150 л.с.', '2.0 / 163 л.с.'] },
      'Pajero': { years: [2010, 2021], engines: ['3.0 / 178 л.с.', '3.5 / 202 л.с.', '3.2 Diesel / 200 л.с.'] },
      'Pajero Sport': { years: [2011, 2025], engines: ['2.4 Diesel / 181 л.с.', '3.0 / 209 л.с.'] },
      'L200': { years: [2010, 2025], engines: ['2.4 Diesel / 154 л.с.', '2.4 Diesel / 181 л.с.'] },
      'Eclipse Cross': { years: [2017, 2025], engines: ['1.5 / 163 л.с.', '2.4 PHEV / 188 л.с.'] },
      'Galant Fortis': { years: [2010, 2014], engines: ['2.0 / 147 л.с.', '2.4 / 169 л.с.'] },
    },
  },
  Honda: {
    models: {
      'Civic': { years: [2010, 2025], engines: ['1.0 / 129 л.с.', '1.5 / 182 л.с.', '2.0 / 320 л.с. (Type R)'] },
      'Accord': { years: [2010, 2025], engines: ['1.5 / 193 л.с.', '2.0 / 252 л.с.', '2.4 / 188 л.с.'] },
      'CR-V': { years: [2010, 2025], engines: ['1.5 / 173 л.с.', '2.0 / 155 л.с.', '2.0 PHEV / 184 л.с.'] },
      'Pilot': { years: [2015, 2025], engines: ['3.5 / 280 л.с.', '3.5 / 285 л.с.'] },
      'HR-V': { years: [2015, 2025], engines: ['1.5 / 130 л.с.', '1.8 / 141 л.с.', '1.5 Hybrid / 131 л.с.'] },
      'Jazz / Fit': { years: [2010, 2025], engines: ['1.2 / 90 л.с.', '1.5 / 109 л.с.', '1.5 Hybrid / 109 л.с.'] },
      'Ridgeline': { years: [2016, 2025], engines: ['3.5 / 280 л.с.'] },
    },
  },
  Volvo: {
    models: {
      'XC40': { years: [2017, 2025], engines: ['1.5 / 129 л.с.', '2.0 / 211 л.с.', '2.0 / 247 л.с.', 'Электро 408 л.с.'] },
      'XC60': { years: [2010, 2025], engines: ['2.0 / 190 л.с.', '2.0 / 250 л.с.', '2.0 PHEV / 390 л.с.'] },
      'XC90': { years: [2010, 2025], engines: ['2.0 / 250 л.с.', '2.0 / 320 л.с.', '2.0 PHEV / 390 л.с.', 'Электро 517 л.с. (EX90)'] },
      'S60': { years: [2010, 2025], engines: ['1.5 / 156 л.с.', '2.0 / 250 л.с.', '2.0 PHEV / 340 л.с.'] },
      'S90': { years: [2016, 2025], engines: ['2.0 / 235 л.с.', '2.0 / 300 л.с.', '2.0 PHEV / 390 л.с.'] },
      'V60': { years: [2010, 2025], engines: ['1.5 / 156 л.с.', '2.0 / 250 л.с.', '2.0 PHEV / 340 л.с.'] },
      'V90': { years: [2016, 2025], engines: ['2.0 / 235 л.с.', '2.0 / 300 л.с.', '2.0 PHEV / 390 л.с.'] },
    },
  },
  Jeep: {
    models: {
      'Wrangler': { years: [2010, 2025], engines: ['2.0 / 272 л.с.', '3.6 / 285 л.с.', '3.6 / 375 л.с.', '4.0 PHEV / 380 л.с.'] },
      'Grand Cherokee': { years: [2010, 2025], engines: ['3.6 / 295 л.с.', '5.7 / 360 л.с.', '6.4 / 475 л.с. (SRT)', '6.2 / 707 л.с. (Trackhawk)'] },
      'Cherokee': { years: [2013, 2025], engines: ['2.4 / 177 л.с.', '3.2 / 271 л.с.'] },
      'Renegade': { years: [2014, 2025], engines: ['1.3 / 150 л.с.', '1.3 / 180 л.с.', '1.3 PHEV / 240 л.с.'] },
      'Compass': { years: [2017, 2025], engines: ['1.3 / 130 л.с.', '1.3 / 150 л.с.', '1.3 PHEV / 240 л.с.'] },
      'Gladiator': { years: [2019, 2025], engines: ['3.6 / 285 л.с.', '3.0 Diesel / 260 л.с.'] },
    },
  },
  Infiniti: {
    models: {
      'QX56 / QX80': { years: [2010, 2025], engines: ['5.6 / 400 л.с.', '5.6 / 405 л.с.'] },
      'QX60': { years: [2012, 2025], engines: ['3.5 / 245 л.с.', '3.5 Hybrid / 250 л.с.'] },
      'QX50': { years: [2013, 2025], engines: ['2.0 / 268 л.с.', '3.7 / 325 л.с.'] },
      'Q50': { years: [2013, 2025], engines: ['2.0 / 211 л.с.', '2.0 / 245 л.с.', '3.0 / 400 л.с. (Red Sport)'] },
      'Q60': { years: [2016, 2022], engines: ['2.0 / 211 л.с.', '3.0 / 300 л.с.', '3.0 / 400 л.с. (Red Sport)'] },
      'FX35 / QX70': { years: [2010, 2017], engines: ['3.5 / 303 л.с.', '3.7 / 320 л.с.', '5.0 / 390 л.с.'] },
    },
  },
  Acura: {
    models: {
      'MDX': { years: [2010, 2025], engines: ['3.0 / 290 л.с.', '3.5 / 290 л.с.', '3.0 PHEV / 355 л.с.'] },
      'RDX': { years: [2010, 2025], engines: ['2.3 Turbo / 240 л.с.', '2.0 / 272 л.с.'] },
      'TLX': { years: [2014, 2025], engines: ['2.4 / 206 л.с.', '3.5 / 290 л.с.', '3.0 / 355 л.с. (Type S)'] },
      'ILX': { years: [2012, 2022], engines: ['2.0 / 150 л.с.', '2.4 / 201 л.с.'] },
      'NSX': { years: [2016, 2022], engines: ['3.5 Hybrid / 573 л.с.'] },
    },
  },
  Cadillac: {
    models: {
      'Escalade': { years: [2010, 2025], engines: ['6.2 / 420 л.с.', '3.0 Diesel / 277 л.с.', '6.2 PHEV / 682 л.с.'] },
      'CT6': { years: [2016, 2020], engines: ['2.0 / 265 л.с.', '3.0 / 404 л.с.', '4.2 / 550 л.с. (V)'] },
      'CT5': { years: [2019, 2025], engines: ['2.0 / 237 л.с.', '3.0 / 360 л.с.', '6.2 / 668 л.с. (V Blackwing)'] },
      'XT5': { years: [2016, 2025], engines: ['2.0 / 237 л.с.', '3.6 / 310 л.с.'] },
      'XT6': { years: [2019, 2025], engines: ['2.0 / 237 л.с.', '3.6 / 310 л.с.'] },
      'Lyriq': { years: [2022, 2025], engines: ['Электро 340 л.с.', 'Электро 500 л.с.'] },
    },
  },
  Tesla: {
    models: {
      'Model 3': { years: [2017, 2025], engines: ['Электро 283 л.с.', 'Электро 358 л.с.', 'Электро 480 л.с. (Performance)'] },
      'Model S': { years: [2012, 2025], engines: ['Электро 405 л.с.', 'Электро 670 л.с.', 'Электро 1020 л.с. (Plaid)'] },
      'Model X': { years: [2015, 2025], engines: ['Электро 405 л.с.', 'Электро 670 л.с.', 'Электро 1020 л.с. (Plaid)'] },
      'Model Y': { years: [2020, 2025], engines: ['Электро 299 л.с.', 'Электро 358 л.с.', 'Электро 534 л.с. (Performance)'] },
      'Cybertruck': { years: [2023, 2025], engines: ['Электро 600 л.с.', 'Электро 845 л.с. (Cyberbeast)'] },
      'Roadster': { years: [2010, 2012], engines: ['Электро 288 л.с.'] },
    },
  },
  Lada: {
    models: {
      'Granta': { years: [2011, 2025], engines: ['1.6 / 87 л.с.', '1.6 / 106 л.с.'] },
      'Vesta': { years: [2015, 2025], engines: ['1.6 / 106 л.с.', '1.8 / 122 л.с.'] },
      'XRAY': { years: [2015, 2022], engines: ['1.6 / 106 л.с.', '1.8 / 122 л.с.'] },
      'Niva Travel': { years: [2021, 2025], engines: ['1.7 / 83 л.с.'] },
      'Niva Legend': { years: [2010, 2025], engines: ['1.7 / 83 л.с.'] },
      'Largus': { years: [2012, 2025], engines: ['1.6 / 87 л.с.', '1.6 / 106 л.с.'] },
    },
  },
  Haval: {
    models: {
      'F7': { years: [2018, 2025], engines: ['1.5 / 150 л.с.', '2.0 / 190 л.с.'] },
      'F7x': { years: [2019, 2025], engines: ['1.5 / 150 л.с.', '2.0 / 190 л.с.'] },
      'Jolion': { years: [2021, 2025], engines: ['1.5 / 143 л.с.', '1.5 Hybrid / 188 л.с.'] },
      'H9': { years: [2014, 2025], engines: ['2.0 Turbo / 218 л.с.', '3.0 Turbo / 282 л.с.'] },
      'Dargo': { years: [2021, 2025], engines: ['2.0 / 238 л.с.'] },
      'Dargo X': { years: [2022, 2025], engines: ['2.0 / 238 л.с.', '1.5 Hybrid / 328 л.с.'] },
    },
  },
  Chery: {
    models: {
      'Tiggo 4': { years: [2017, 2025], engines: ['1.5 / 113 л.с.', '1.5 Turbo / 156 л.с.'] },
      'Tiggo 7': { years: [2016, 2025], engines: ['1.5 / 147 л.с.', '2.0 / 197 л.с.'] },
      'Tiggo 8': { years: [2018, 2025], engines: ['1.5 / 147 л.с.', '2.0 / 197 л.с.', '1.9 PHEV / 326 л.с.'] },
      'Arrizo 8': { years: [2022, 2025], engines: ['1.6 Turbo / 197 л.с.'] },
      'EXEED TXL': { years: [2020, 2025], engines: ['1.6 / 197 л.с.', '2.0 / 254 л.с.'] },
    },
  },
  Geely: {
    models: {
      'Atlas': { years: [2016, 2025], engines: ['1.8 / 140 л.с.', '2.0 / 190 л.с.'] },
      'Coolray': { years: [2019, 2025], engines: ['1.5 / 177 л.с.'] },
      'Tugella': { years: [2019, 2025], engines: ['2.0 / 238 л.с.'] },
      'Okavango': { years: [2021, 2025], engines: ['2.0 / 197 л.с.', '2.0 PHEV / 321 л.с.'] },
      'Preface': { years: [2021, 2025], engines: ['2.0 / 218 л.с.'] },
    },
  },
  Другая: {
    models: {
      'Другая модель': { years: [2010, 2025], engines: ['Бензин', 'Дизель', 'Гибрид', 'Электро'] },
    },
  },
};

const MAKES = Object.keys(CAR_DB);

const MODELS: Record<string, string[]> = Object.fromEntries(
  Object.entries(CAR_DB).map(([make, data]) => [make, Object.keys(data.models)])
);

const getYears = (make: string, model: string): string[] => {
  const spec = CAR_DB[make]?.models[model];
  if (!spec) return Array.from({ length: 20 }, (_, i) => String(2025 - i));
  const [from, to] = spec.years;
  return Array.from({ length: to - from + 1 }, (_, i) => String(to - i));
};

const getEngines = (make: string, model: string): string[] => {
  return CAR_DB[make]?.models[model]?.engines ?? ['Бензин', 'Дизель', 'Гибрид', 'Электро'];
};

const emptyForm = { make: '', model: '', price: '', year: '', mileage: '', engine: '', vin: '', description: '' };

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
      return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
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
    setCars((prev) => prev.map((c) => (c.id === id ? { ...c, status, buyer: status === 'sold' ? (buyer || '') : '' } : c)));
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
              <div className="bg-white/15 backdrop-blur rounded-2xl px-4 py-2 flex-1">
                <div className="font-display text-2xl font-bold">{selling.length}</div>
                <div className="text-xs opacity-90">{t.statSelling}</div>
              </div>
              <div className="bg-white/15 backdrop-blur rounded-2xl px-4 py-2 flex-1">
                <div className="font-display text-2xl font-bold">{sold.length}</div>
                <div className="text-xs opacity-90">{t.statSold}</div>
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
                  <SellDialog car={c} onSold={markSold} />
                </div>
              )}
            />
          )}
          {tab === 'sold' && !carsLoading && (
            <CarList
              cars={sold}
              sold
              empty={t.emptySold}
              action={(c) => (
                <Button variant="outline" onClick={() => restore(c.id)} className="w-full rounded-xl">
                  <Icon name="Undo2" size={18} className="mr-2" />
                  {t.restore}
                </Button>
              )}
            />
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

const SelectField = ({ label, options, value, onChange, placeholder, allowCustom }: {
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

const Field = ({ label, placeholder, value, onChange }: {
  label: string; placeholder: string; value: string; onChange: (v: string) => void;
}) => (
  <div>
    <Label className="text-sm font-medium mb-1.5 block">{label}</Label>
    <Input placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} className="rounded-xl" />
  </div>
);

const CarList = ({ cars, action, empty, sold, groupByMake }: {
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
            <div className="absolute top-3 right-3 bg-foreground text-background text-xs font-bold uppercase px-3 py-1 rounded-full rotate-3">
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
          {sold && c.buyer && (
            <div className="flex items-center gap-2 bg-accent/10 text-accent-foreground rounded-xl px-3 py-2 text-sm font-medium">
              <Icon name="UserCheck" size={16} className="text-accent shrink-0" />
              {t.buyerTag(c.buyer)}
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

const Tag = ({ icon, text }: { icon: string; text: string }) =>
  text ? (
    <span className="inline-flex items-center gap-1 text-xs bg-muted text-foreground px-2.5 py-1 rounded-lg">
      <Icon name={icon} size={13} />
      {text}
    </span>
  ) : null;

const SellDialog = ({ car, onSold }: { car: Car; onSold: (id: number, buyer: string) => void }) => {
  const { t, cur } = useSettings();
  const [open, setOpen] = useState(false);
  const [buyer, setBuyer] = useState('');

  const confirm = (withBuyer: boolean) => {
    onSold(car.id, withBuyer ? buyer.trim() : '');
    setOpen(false);
    setBuyer('');
  };

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
          <Input
            value={buyer}
            onChange={(e) => setBuyer(e.target.value)}
            placeholder={t.buyerPlaceholder}
            className="rounded-xl h-11"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && buyer.trim() && confirm(true)}
          />
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

const SendCarDialog = ({ car }: { car: Car }) => {
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

const Broadcast = ({ count, cars }: { count: number; cars: Car[] }) => {
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

const SettingsPanel = () => {
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

export default Index;