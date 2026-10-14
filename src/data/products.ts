export type ModelType = 'headphones' | 'watch' | 'perfume' | 'keyboard'

/** Material groups a 3D model is built from; colorways recolor them. */
export type MaterialSlot = 'primary' | 'secondary' | 'accent' | 'metal' | 'soft' | 'glass'

export type Category = 'audio' | 'watches' | 'beauty' | 'peripherals'

export interface Colorway {
  id: string
  name: string
  /** Swatch shown in the UI. */
  swatch: string
  slots: Partial<Record<MaterialSlot, string>>
}

export interface Product {
  id: string
  name: string
  category: Category
  model: ModelType
  price: number
  tagline: string
  description: string
  badge?: string
  /** Resting yaw of the model in the catalog, so the grid isn't a row of identical poses. */
  restYaw: number
  colorways: Colorway[]
  option: { label: string; values: string[] }
}

export const CATEGORY_LABELS: Record<Category, string> = {
  audio: 'Аудіо',
  watches: 'Годинники',
  beauty: 'Парфуми',
  peripherals: 'Периферія',
}

/** Parts revealed by the exploded view, outermost first. */
export const MODEL_STRUCTURE: Record<ModelType, string[]> = {
  headphones: ['Оголів’я з алюмінію', 'Подушка оголів’я', 'Телескопічні слайдери', 'Чашки з драйверами 40 мм', 'Амбушури з пам’яттю форми', 'Зовнішні панелі'],
  watch: ['Сапфірове скло', 'Безель', 'Стрілки', 'Циферблат', 'Корпус 42 мм', 'Заводна головка', 'Ремінець'],
  perfume: ['Ковпачок', 'Атомайзер', 'Горловина', 'Кільце-фіксатор', 'Флакон з оптичного скла', 'Аромат', 'Шильдик'],
  keyboard: ['Кейкапи PBT', 'Модифікатори', 'Перемикачі hot-swap', 'Алюмінієва пластина', 'Корпус'],
}

export const products: Product[] = [
  {
    id: 'aero-max',
    name: 'Aero Max',
    category: 'audio',
    model: 'headphones',
    price: 12999,
    tagline: 'Активне шумозаглушення',
    description: 'Повнорозмірні навушники з адаптивним шумозаглушенням, 40-мм драйверами та 30 годинами роботи.',
    badge: 'Хіт',
    restYaw: -0.55,
    colorways: [
      { id: 'graphite', name: 'Графіт', swatch: '#2b2d31', slots: { primary: '#2b2d31', secondary: '#3a3d42', accent: '#9aa3ad', metal: '#c9ccd2', soft: '#1d1e21' } },
      { id: 'sand', name: 'Пісок', swatch: '#d8cbb6', slots: { primary: '#d8cbb6', secondary: '#efe7da', accent: '#b08d57', metal: '#d9c6a3', soft: '#b9a78d' } },
      { id: 'ocean', name: 'Океан', swatch: '#1f3b63', slots: { primary: '#1f3b63', secondary: '#2c4f80', accent: '#7fb3ff', metal: '#cfd6e0', soft: '#16233a' } },
    ],
    option: { label: 'Комплектація', values: ['Стандарт', 'З кейсом'] },
  },
  {
    id: 'chrono-s',
    name: 'Chrono S',
    category: 'watches',
    model: 'watch',
    price: 18499,
    tagline: 'Автоматичний механізм',
    description: 'Класичний годинник зі сталевим корпусом, сапфіровим склом і запасом ходу 72 години.',
    badge: 'Новинка',
    restYaw: -0.4,
    colorways: [
      { id: 'steel', name: 'Сталь', swatch: '#c9ccd2', slots: { metal: '#d3d6db', primary: '#2f3136', secondary: '#10131a', accent: '#4f7cff' } },
      { id: 'gold', name: 'Золото', swatch: '#d8b46a', slots: { metal: '#d8b46a', primary: '#5a3a24', secondary: '#f3ede1', accent: '#8a6a2b' } },
      { id: 'midnight', name: 'Опівніч', swatch: '#3a3d44', slots: { metal: '#3a3d44', primary: '#1a1c22', secondary: '#0b0d12', accent: '#ff8a3d' } },
    ],
    option: { label: 'Розмір корпусу', values: ['40 мм', '42 мм', '44 мм'] },
  },
  {
    id: 'noir-essence',
    name: 'Noir Essence',
    category: 'beauty',
    model: 'perfume',
    price: 4290,
    tagline: 'Парфумована вода',
    description: 'Теплий аромат з нотами бурштину, ветиверу та чорного перцю у флаконі з оптичного скла.',
    restYaw: -0.65,
    colorways: [
      { id: 'amber', name: 'Бурштин', swatch: '#c7782a', slots: { primary: '#c7782a', secondary: '#16161a', accent: '#d4b06a', metal: '#d8b46a' } },
      { id: 'rose', name: 'Троянда', swatch: '#e58fa3', slots: { primary: '#e58fa3', secondary: '#f3e6e8', accent: '#c9a27e', metal: '#e6c9a8' } },
      { id: 'ice', name: 'Лід', swatch: '#9fd3ff', slots: { primary: '#9fd3ff', secondary: '#e9eef3', accent: '#a9b6c6', metal: '#d6dce4' } },
    ],
    option: { label: 'Об’єм', values: ['50 мл', '100 мл'] },
  },
  {
    id: 'mech-65',
    name: 'Mech 65',
    category: 'peripherals',
    model: 'keyboard',
    price: 6799,
    tagline: 'Механічна клавіатура 65%',
    description: 'Компактна механічна клавіатура з алюмінієвою пластиною, hot-swap перемикачами та кейкапами PBT.',
    restYaw: -0.35,
    colorways: [
      { id: 'carbon', name: 'Карбон', swatch: '#2a2c31', slots: { primary: '#2a2c31', secondary: '#3a3d44', accent: '#ff6b35', metal: '#9aa0a8', soft: '#111214' } },
      { id: 'retro', name: 'Ретро', swatch: '#d8d2c4', slots: { primary: '#d8d2c4', secondary: '#ece6d6', accent: '#c4473b', metal: '#b9bcc2', soft: '#5a5a5a' } },
      { id: 'mint', name: 'М’ята', swatch: '#bfe3d0', slots: { primary: '#bfe3d0', secondary: '#f4f7f5', accent: '#2f9d7e', metal: '#c3c8cc', soft: '#3d4a45' } },
    ],
    option: { label: 'Перемикачі', values: ['Linear', 'Tactile', 'Silent'] },
  },
  {
    id: 'aero-lite',
    name: 'Aero Lite',
    category: 'audio',
    model: 'headphones',
    price: 7499,
    tagline: 'Легкі та складні',
    description: 'Полегшена модель для щоденних поїздок: 220 г, швидке заряджання та мультипоінт.',
    restYaw: 0.5,
    colorways: [
      { id: 'cloud', name: 'Хмара', swatch: '#eceef1', slots: { primary: '#eceef1', secondary: '#ffffff', accent: '#ff5a4e', metal: '#d6d9de', soft: '#d9dce2' } },
      { id: 'coral', name: 'Корал', swatch: '#ff6f61', slots: { primary: '#ff6f61', secondary: '#ffd2cc', accent: '#ffffff', metal: '#e8e2df', soft: '#e0574b' } },
    ],
    option: { label: 'Комплектація', values: ['Стандарт', 'З кейсом'] },
  },
  {
    id: 'chrono-sport',
    name: 'Chrono Sport',
    category: 'watches',
    model: 'watch',
    price: 11999,
    tagline: 'Для тренувань',
    description: 'Спортивний хронограф з гумовим ремінцем, водозахистом 100 м і люмінесцентними стрілками.',
    restYaw: 0.45,
    colorways: [
      { id: 'volt', name: 'Вольт', swatch: '#c6f432', slots: { metal: '#c0c4ca', primary: '#c6f432', secondary: '#15171b', accent: '#c6f432' } },
      { id: 'glacier', name: 'Льодовик', swatch: '#9fd8ff', slots: { metal: '#e3e7ec', primary: '#9fd8ff', secondary: '#f5f8fb', accent: '#2563eb' } },
    ],
    option: { label: 'Розмір корпусу', values: ['40 мм', '44 мм'] },
  },
  {
    id: 'bloom',
    name: 'Bloom',
    category: 'beauty',
    model: 'perfume',
    price: 3590,
    tagline: 'Туалетна вода',
    description: 'Свіжий квітковий аромат: півонія, груша та білий мускус. Легкий шлейф на весь день.',
    badge: 'Новинка',
    restYaw: 0.6,
    colorways: [
      { id: 'peony', name: 'Півонія', swatch: '#f06ea9', slots: { primary: '#f06ea9', secondary: '#ffffff', accent: '#e9c7d6', metal: '#e6d3c5' } },
      { id: 'citrus', name: 'Цитрус', swatch: '#f5c542', slots: { primary: '#f5c542', secondary: '#2b2b2b', accent: '#f0e2b6', metal: '#d8b46a' } },
    ],
    option: { label: 'Об’єм', values: ['30 мл', '50 мл', '100 мл'] },
  },
  {
    id: 'mech-75-studio',
    name: 'Mech 75 Studio',
    category: 'peripherals',
    model: 'keyboard',
    price: 9899,
    tagline: 'Тиха клавіатура для студії',
    description: 'Безшумні перемикачі, шумопоглинальний корпус і підсвічені модифікатори для нічної роботи.',
    restYaw: 0.4,
    colorways: [
      { id: 'lunar', name: 'Місяць', swatch: '#e9eaee', slots: { primary: '#e9eaee', secondary: '#ffffff', accent: '#4f7cff', metal: '#c9ccd2', soft: '#8a8f99' } },
      { id: 'obsidian', name: 'Обсидіан', swatch: '#121316', slots: { primary: '#121316', secondary: '#22242a', accent: '#b48cff', metal: '#6b6f77', soft: '#0a0a0c' } },
    ],
    option: { label: 'Перемикачі', values: ['Silent Linear', 'Silent Tactile'] },
  },
]

export function findProduct(id: string): Product | undefined {
  return products.find((product) => product.id === id)
}

const priceFormat = new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH', maximumFractionDigits: 0 })

export function formatPrice(value: number): string {
  return priceFormat.format(value)
}
