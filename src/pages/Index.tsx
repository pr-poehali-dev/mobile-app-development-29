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
  make: string;
  model: string;
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
    make: 'BMW',
    model: 'M4',
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
    make: 'Audi',
    model: 'RS6',
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

const emptyForm = { make: '', model: '', price: '', year: '', mileage: '', engine: '', description: '' };

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
    if (!form.make) return;
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

const SelectField = ({ label, options, value, onChange, placeholder, allowCustom }: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  allowCustom?: boolean;
}) => {
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
          <option value="">{placeholder || `Выбрать ${label.toLowerCase()}`}</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
          {allowCustom && <option value="Другая">✏️ Ввести вручную</option>}
        </select>
        <Icon name="ChevronDown" size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
      </div>
      {(isCustom || value === '__custom__') && (
        <Input
          autoFocus
          placeholder={`Введите ${label.toLowerCase()}`}
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

  return (
    <div className="space-y-5">
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

        <input ref={inputRef} type="file" accept="image/*" capture="environment" multiple className="hidden" onChange={handlePhotos} />

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
        <SelectField
          label="Марка"
          options={MAKES}
          value={form.make}
          onChange={(v) => setForm({ ...form, make: v, model: '', year: '', engine: '' })}
          placeholder="Выбрать марку"
          allowCustom
        />
        <SelectField
          label="Модель"
          options={models}
          value={form.model}
          onChange={(v) => setForm({ ...form, model: v, year: '', engine: '' })}
          placeholder={form.make ? 'Выбрать модель' : 'Сначала выберите марку'}
          allowCustom
        />
        <div className="grid grid-cols-2 gap-3">
          <SelectField
            label="Год"
            options={years}
            value={form.year}
            onChange={(v) => setForm({ ...form, year: v })}
            placeholder="Год"
          />
          <SelectField
            label="Двигатель"
            options={engines}
            value={form.engine}
            onChange={(v) => setForm({ ...form, engine: v })}
            placeholder="Двигатель"
          />
        </div>
        <Field label="Цена, ₽" placeholder="6 950 000" value={form.price} onChange={(v) => setForm({ ...form, price: v })} />
        <Field label="Пробег, км" placeholder="18 400" value={form.mileage} onChange={(v) => setForm({ ...form, mileage: v })} />
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
                <h3 className="font-display text-xl font-bold uppercase leading-tight">{c.make} {c.model}</h3>
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