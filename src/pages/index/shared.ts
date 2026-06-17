import { createContext, useContext } from 'react';
import func2url from '../../../backend/func2url.json';

export const AUTH_URL = func2url.auth;
export const CARS_URL = func2url.cars;
export const BROADCAST_URL = func2url['telegram-broadcast'];

export const MAX_PHOTOS = 15;

export type Tab = 'publish' | 'selling' | 'sold' | 'broadcast' | 'settings' | 'admin';

export type Lang = 'ru' | 'en';

export interface Currency {
  code: string;
  symbol: string;
  label: string;
}

export const CURRENCIES: Currency[] = [
  { code: 'RUB', symbol: '₽', label: 'Рубль' },
  { code: 'USD', symbol: '$', label: 'Доллар' },
  { code: 'EUR', symbol: '€', label: 'Евро' },
  { code: 'KZT', symbol: '₸', label: 'Тенге' },
  { code: 'AED', symbol: 'AED', label: 'Дирхам ОАЭ' },
  { code: 'BYN', symbol: 'Br', label: 'Бел. рубль' },
  { code: 'HKD', symbol: 'HK$', label: 'Гонконг. доллар' },
];

export interface TgGroup {
  id: number;
  name: string;
  link: string;
}

export interface Settings {
  lang: Lang;
  currency: string;
  groups: TgGroup[];
  broadcastText: string;
}

export const defaultSettings: Settings = {
  lang: 'ru',
  currency: 'RUB',
  groups: [],
  broadcastText: '🚗 {make} {model}, {year}\n💰 {price}\n📍 Пробег: {mileage} км\n⚙️ {engine}',
};

export const T = {
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
    searchSold: 'Поиск по покупателю или авто', nothingFound: 'Ничего не найдено',
    soldDate: (d: string) => `Продано: ${d}`,
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
    // bot token
    botSection: 'Telegram-бот',
    botHint: 'Создайте бота у @BotFather, отправьте /newbot и вставьте сюда полученный токен. Затем добавьте бота администратором в свои группы.',
    botTokenLabel: 'Токен бота',
    botTokenPlaceholder: '123456789:AAH...',
    botConnect: 'Подключить', botDisconnect: 'Отключить',
    botConnected: (name: string) => name ? `Подключён: @${name}` : 'Бот подключён',
    botNotConnected: 'Бот не подключён',
    botSaved: 'Бот подключён', botRemoved: 'Бот отключён',
    botInvalid: 'Неверный токен. Проверьте, что скопировали его полностью.',
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
    searchSold: 'Search by buyer or car', nothingFound: 'Nothing found',
    soldDate: (d: string) => `Sold: ${d}`,
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
    // bot token
    botSection: 'Telegram bot',
    botHint: 'Create a bot via @BotFather, send /newbot and paste the token here. Then add the bot as an admin to your groups.',
    botTokenLabel: 'Bot token',
    botTokenPlaceholder: '123456789:AAH...',
    botConnect: 'Connect', botDisconnect: 'Disconnect',
    botConnected: (name: string) => name ? `Connected: @${name}` : 'Bot connected',
    botNotConnected: 'Bot not connected',
    botSaved: 'Bot connected', botRemoved: 'Bot disconnected',
    botInvalid: 'Invalid token. Make sure you copied it completely.',
  },
};

export const SettingsContext = createContext<{
  settings: Settings;
  setSettings: (s: Settings) => void;
  t: (typeof T)['ru'];
  cur: Currency;
}>({ settings: defaultSettings, setSettings: () => {}, t: T.ru, cur: CURRENCIES[0] });

export const useSettings = () => useContext(SettingsContext);

export interface Car {
  id: number;
  make: string;
  model: string;
  price: string;
  year: string;
  mileage: string;
  engine: string;
  vin: string;
  buyer: string;
  sold_at: string | null;
  description: string;
  photos: string[];
  status: 'selling' | 'sold';
}

export const PLACEHOLDER = 'https://cdn.poehali.dev/projects/6ab20892-3900-4803-af4f-d41104923ec6/files/7551188f-b758-4ec5-99b4-c23efe804a13.jpg';

export const buildCarText = (c: Car, template: string, symbol: string) =>
  template
    .replace(/{make}/g, c.make)
    .replace(/{model}/g, c.model)
    .replace(/{year}/g, c.year)
    .replace(/{price}/g, `${c.price} ${symbol}`)
    .replace(/{mileage}/g, c.mileage)
    .replace(/{engine}/g, c.engine)
    .replace(/{description}/g, c.description);

export interface SendResult {
  group: string;
  sent: number;
  total: number;
}

export const sendCarsToGroups = async (
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

export const buildTabs = (t: (typeof T)['ru'], isAdmin: boolean): { id: Tab; label: string; icon: string }[] => [
  { id: 'publish', label: t.publish, icon: 'PlusCircle' },
  { id: 'selling', label: t.selling, icon: 'Car' },
  { id: 'sold', label: t.sold, icon: 'CheckCircle2' },
  { id: 'broadcast', label: t.broadcast, icon: 'Send' },
  { id: 'settings', label: t.settings, icon: 'Settings' },
  ...(isAdmin ? [{ id: 'admin' as Tab, label: t.admin, icon: 'ShieldCheck' }] : []),
];

export const emptyForm = { make: '', model: '', price: '', year: '', mileage: '', engine: '', vin: '', description: '' };