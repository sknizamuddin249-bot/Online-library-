import { StoreSettings, Book } from '../types';

export interface AIModificationResult {
  settingsUpdated: boolean;
  booksUpdated: boolean;
  newSettings: StoreSettings;
  newBooks: Book[];
  summaryMessageBengali: string;
  appliedChanges: string[];
}

export const THEME_PRESETS: Record<
  string,
  { name: string; primary: string; accent: string; bg: string }
> = {
  emerald: {
    name: '🌿 Emerald Forest Theme',
    primary: '#064E3B',
    accent: '#10B981',
    bg: '#F0FDF4',
  },
  royal_blue: {
    name: '🌊 Royal Navy Blue Theme',
    primary: '#0F275C',
    accent: '#2563EB',
    bg: '#F8FAFC',
  },
  crimson_red: {
    name: '🏮 Crimson Festive Theme',
    primary: '#881337',
    accent: '#E11D48',
    bg: '#FFF1F2',
  },
  luxury_gold: {
    name: '👑 Luxury Black & Gold Theme',
    primary: '#18181B',
    accent: '#D97706',
    bg: '#FAFAFA',
  },
  purple_violet: {
    name: '🔮 Royal Violet Theme',
    primary: '#3B0764',
    accent: '#8B5CF6',
    bg: '#FAF5FF',
  },
  sunset_orange: {
    name: '🌅 Sunset Classic Theme',
    primary: '#0B1B3D',
    accent: '#FF5722',
    bg: '#F5F7FA',
  },
  dark_slate: {
    name: '🌙 Midnight Dark Theme',
    primary: '#0F172A',
    accent: '#38BDF8',
    bg: '#1E293B',
  },
  warm_coffee: {
    name: '☕ Warm Coffee Theme',
    primary: '#451A03',
    accent: '#D97706',
    bg: '#FFFBEB',
  },
};

export function interpretAndApplyAdminPrompt(
  prompt: string,
  currentSettings: StoreSettings,
  currentBooks: Book[]
): AIModificationResult {
  const text = prompt.trim();
  const lower = text.toLowerCase();

  let newSettings: StoreSettings = { ...currentSettings };
  let newBooks: Book[] = [...currentBooks];
  const appliedChanges: string[] = [];

  // 1. Color Themes
  if (
    lower.includes('green') ||
    lower.includes('emerald') ||
    lower.includes('nature')
  ) {
    newSettings.primaryColor = THEME_PRESETS.emerald.primary;
    newSettings.accentColor = THEME_PRESETS.emerald.accent;
    newSettings.bgColor = THEME_PRESETS.emerald.bg;
    appliedChanges.push('Theme Color: Emerald Forest Green');
  } else if (
    lower.includes('blue') ||
    lower.includes('navy') ||
    lower.includes('royal')
  ) {
    newSettings.primaryColor = THEME_PRESETS.royal_blue.primary;
    newSettings.accentColor = THEME_PRESETS.royal_blue.accent;
    newSettings.bgColor = THEME_PRESETS.royal_blue.bg;
    appliedChanges.push('Theme Color: Royal Navy Blue');
  } else if (
    lower.includes('red') ||
    lower.includes('crimson') ||
    lower.includes('festive') ||
    lower.includes('eid') ||
    lower.includes('puja')
  ) {
    newSettings.primaryColor = THEME_PRESETS.crimson_red.primary;
    newSettings.accentColor = THEME_PRESETS.crimson_red.accent;
    newSettings.bgColor = THEME_PRESETS.crimson_red.bg;
    appliedChanges.push('Theme Color: Crimson Festive Red');
  } else if (
    lower.includes('gold') ||
    lower.includes('luxury') ||
    lower.includes('black')
  ) {
    newSettings.primaryColor = THEME_PRESETS.luxury_gold.primary;
    newSettings.accentColor = THEME_PRESETS.luxury_gold.accent;
    newSettings.bgColor = THEME_PRESETS.luxury_gold.bg;
    appliedChanges.push('Theme Color: Luxury Black & Gold');
  } else if (
    lower.includes('purple') ||
    lower.includes('violet')
  ) {
    newSettings.primaryColor = THEME_PRESETS.purple_violet.primary;
    newSettings.accentColor = THEME_PRESETS.purple_violet.accent;
    newSettings.bgColor = THEME_PRESETS.purple_violet.bg;
    appliedChanges.push('Theme Color: Royal Purple Violet');
  } else if (
    lower.includes('dark') ||
    lower.includes('night') ||
    lower.includes('midnight')
  ) {
    newSettings.primaryColor = THEME_PRESETS.dark_slate.primary;
    newSettings.accentColor = THEME_PRESETS.dark_slate.accent;
    newSettings.bgColor = THEME_PRESETS.dark_slate.bg;
    appliedChanges.push('Theme Color: Midnight Dark');
  } else if (
    lower.includes('orange') ||
    lower.includes('sunset')
  ) {
    newSettings.primaryColor = THEME_PRESETS.sunset_orange.primary;
    newSettings.accentColor = THEME_PRESETS.sunset_orange.accent;
    newSettings.bgColor = THEME_PRESETS.sunset_orange.bg;
    appliedChanges.push('Theme Color: Classic Sunset Orange');
  } else if (
    lower.includes('coffee') ||
    lower.includes('brown')
  ) {
    newSettings.primaryColor = THEME_PRESETS.warm_coffee.primary;
    newSettings.accentColor = THEME_PRESETS.warm_coffee.accent;
    newSettings.bgColor = THEME_PRESETS.warm_coffee.bg;
    appliedChanges.push('Theme Color: Warm Coffee');
  }

  // 2. Custom Title Extraction
  const quotedMatch = text.match(/['"‘“]([^'"‘“]+)['"’”]/);
  if (
    quotedMatch &&
    (lower.includes('title') || lower.includes('store') || lower.includes('name'))
  ) {
    newSettings.name = quotedMatch[1].trim();
    appliedChanges.push(`Store Name: "${newSettings.name}"`);
  } else {
    const titleMatch = text.match(/(?:title|store name|store title|name)[:\s]+([^\n,.]+)/i);
    if (titleMatch && titleMatch[1].trim().length > 2 && !titleMatch[1].includes('%')) {
      const extractedTitle = titleMatch[1]
        .replace(/(please|set|to|is)/gi, '')
        .trim();
      if (extractedTitle.length > 2) {
        newSettings.name = extractedTitle;
        appliedChanges.push(`Store Name: "${extractedTitle}"`);
      }
    }
  }

  // 3. Subtitle / Tagline extraction
  const subMatch = text.match(/(?:subtitle|tagline|sub)[:\s]+([^\n,.]+)/i);
  if (subMatch && subMatch[1].trim().length > 2) {
    const extractedSub = subMatch[1].trim();
    newSettings.sub = extractedSub;
    appliedChanges.push(`Subtitle: "${extractedSub}"`);
  }

  // 4. UPI ID Extraction
  const upiMatch = text.match(/([a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64})/i);
  if (upiMatch) {
    newSettings.upiId = upiMatch[1].trim();
    appliedChanges.push(`UPI ID Updated: ${newSettings.upiId}`);
  }

  // 5. Phone / WhatsApp Extraction
  const phoneMatches = text.match(/(?:\+?91)?[6-9]\d{9}/g);
  if (phoneMatches && phoneMatches.length > 0) {
    const rawNum = phoneMatches[0].replace(/\D/g, '');
    const clean10 = rawNum.length === 12 && rawNum.startsWith('91') ? rawNum.slice(2) : rawNum;
    if (lower.includes('whatsapp') || lower.includes('wa')) {
      newSettings.whatsappNumber = '91' + clean10;
      appliedChanges.push(`WhatsApp Number Updated: +91 ${clean10}`);
    } else {
      newSettings.phone = clean10;
      newSettings.whatsappNumber = '91' + clean10;
      appliedChanges.push(`Contact & WhatsApp Number: +91 ${clean10}`);
    }
  }

  // 6. Email Extraction
  const emailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
  if (emailMatch && !emailMatch[1].endsWith('@upi') && !emailMatch[1].endsWith('@nyes')) {
    newSettings.email = emailMatch[1].trim();
    appliedChanges.push(`Support Email: ${newSettings.email}`);
  }

  // 7. Announcement Bar Text
  const annMatch = text.match(
    /(?:announcement|notice|banner text|offer)[:\s]+([^\n.]+)/i
  );
  if (annMatch && annMatch[1].trim().length > 3) {
    newSettings.announcement = annMatch[1].trim();
    newSettings.showAnnouncement = true;
    appliedChanges.push(`Top Offer Banner: "${newSettings.announcement}"`);
  }

  // 8. Bulk Discount Percentage applied to all books
  const percMatch = text.match(/(\d{1,2})\s*%\s*(?:discount|off)/i);
  let booksChanged = false;
  if (
    percMatch &&
    (lower.includes('all') ||
      lower.includes('book') ||
      lower.includes('price'))
  ) {
    const discountPerc = parseInt(percMatch[1], 10);
    if (discountPerc > 0 && discountPerc < 100) {
      newBooks = currentBooks.map((b) => {
        const baseMrp = b.oldPrice && b.oldPrice > b.price ? b.oldPrice : Math.round(b.price * 1.3);
        const newSellingPrice = Math.round(baseMrp - (baseMrp * discountPerc) / 100);
        return {
          ...b,
          oldPrice: baseMrp,
          price: newSellingPrice,
        };
      });
      booksChanged = true;
      appliedChanges.push(`Applied ${discountPerc}% Bulk Discount across all books`);
    }
  }

  // If no direct regex matched, intelligently update theme or announcement
  if (appliedChanges.length === 0) {
    if (text.length > 4 && text.length < 60) {
      newSettings.announcement = text;
      newSettings.showAnnouncement = true;
      appliedChanges.push(`Top Announcement Bar: "${text}"`);
    } else {
      appliedChanges.push('Store configuration applied successfully.');
    }
  }

  const summaryMessage = `✨ Changes applied automatically based on your prompt:\n• ${appliedChanges.join(
    '\n• '
  )}`;

  return {
    settingsUpdated: true,
    booksUpdated: booksChanged,
    newSettings,
    newBooks,
    summaryMessageBengali: summaryMessage,
    appliedChanges,
  };
}
