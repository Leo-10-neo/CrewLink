export const EVENT_TYPES = [
  {
    id: 'corporate',
    name: 'Corporate Events',
    emoji: '🏢',
    description: 'Conferences, Seminars, Business meetings, Product launches, Trade shows, Award ceremonies, Team-building events, Networking events, Company annual meetings, Training/workshops',
    color: 'blue',
    subCategories: [
      { name: 'Conferences', imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80' },
      { name: 'Seminars', imageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80' },
      { name: 'Business meetings', imageUrl: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&q=80' },
      { name: 'Product launches', imageUrl: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800&q=80' },
      { name: 'Trade shows', imageUrl: 'https://images.unsplash.com/photo-1561489413-985b06da5bee?w=800&q=80' },
      { name: 'Award ceremonies', imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80' },
      { name: 'Team-building events', imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80' },
      { name: 'Networking events', imageUrl: 'https://images.unsplash.com/photo-1515169067868-5387ec356754?w=800&q=80' },
      { name: 'Company annual meetings', imageUrl: 'https://images.unsplash.com/photo-1556761175-4b46a572b786?w=800&q=80' },
      { name: 'Training/workshops', imageUrl: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&q=80' },
    ]
  },
  {
    id: 'social',
    name: 'Social Events',
    emoji: '💍',
    description: 'Birthday parties, Weddings, Engagements, Anniversaries, Reunions, Get-togethers',
    color: 'rose',
    subCategories: [
      { name: 'Birthday parties', imageUrl: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&q=80' },
      { name: 'Weddings', imageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80' },
      { name: 'Engagements', imageUrl: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=800&q=80' },
      { name: 'Anniversaries', imageUrl: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&q=80' },
      { name: 'Reunions', imageUrl: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=800&q=80' },
      { name: 'Get-togethers', imageUrl: 'https://images.pexels.com/photos/3171837/pexels-photo-3171837.jpeg?auto=compress&cs=tinysrgb&w=800' },
    ]
  },
  {
    id: 'entertainment',
    name: 'Entertainment Events',
    emoji: '🎭',
    description: 'Music concerts, DJ nights, Comedy shows, Movie screenings, Cultural shows, Festivals',
    color: 'purple',
    subCategories: [
      { name: 'Music concerts', imageUrl: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&q=80' },
      { name: 'DJ nights', imageUrl: 'https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg?auto=compress&cs=tinysrgb&w=800' },
      { name: 'Comedy shows', imageUrl: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=800&q=80' },
      { name: 'Movie screenings', imageUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&q=80' },
      { name: 'Cultural shows', imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&q=80' },
      { name: 'Festivals', imageUrl: 'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=800' },
    ]
  },
  {
    id: 'religious-cultural',
    name: 'Religious & Cultural Events',
    emoji: '🕊️',
    description: 'Religious festivals, Cultural festivals, Processions, Traditional celebrations, Spiritual gatherings',
    color: 'teal',
    subCategories: [
      { name: 'Religious festivals', imageUrl: 'https://images.unsplash.com/photo-1519996529931-28324d5a630e?w=800&q=80' },
      { name: 'Cultural festivals', imageUrl: 'https://images.unsplash.com/photo-1533613220915-609f661a6fe1?w=800&q=80' },
      { name: 'Processions', imageUrl: 'https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?w=800&q=80' },
      { name: 'Traditional celebrations', imageUrl: 'https://images.pexels.com/photos/1449058/pexels-photo-1449058.jpeg?auto=compress&cs=tinysrgb&w=800' },
      { name: 'Spiritual gatherings', imageUrl: 'https://images.unsplash.com/photo-1528728329032-2972f65dfb3f?w=800&q=80' },
    ]
  },
];

export const getEventTypeById = (id) => {
  return EVENT_TYPES.find(type => type.id === id);
};

export const getEventTypesByIds = (ids) => {
  return EVENT_TYPES.filter(type => ids.includes(type.id));
};

export const EVENT_TYPE_COLORS = {
  blue: 'bg-blue-100 text-blue-700 border-blue-200',
  indigo: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  purple: 'bg-purple-100 text-purple-700 border-purple-200',
  pink: 'bg-pink-100 text-pink-700 border-pink-200',
  green: 'bg-green-100 text-green-700 border-green-200',
  rose: 'bg-rose-100 text-rose-700 border-rose-200',
  yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  orange: 'bg-orange-100 text-orange-700 border-orange-200',
  cyan: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  teal: 'bg-teal-100 text-teal-700 border-teal-200',
  violet: 'bg-violet-100 text-violet-700 border-violet-200',
  red: 'bg-red-100 text-red-700 border-red-200',
  fuchsia: 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200',
  lime: 'bg-lime-100 text-lime-700 border-lime-200',
  amber: 'bg-amber-100 text-amber-700 border-amber-200',
  slate: 'bg-slate-100 text-slate-700 border-slate-200',
  zinc: 'bg-zinc-100 text-zinc-700 border-zinc-200',
};

export const getEventTypeColorClass = (color) => {
  return EVENT_TYPE_COLORS[color] || 'bg-gray-100 text-gray-700 border-gray-200';
};
