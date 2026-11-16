export interface CompanyBrand {
  name: string;
  initials: string;
  industry: string;
  bgGradient: string;
  textColor: string;
  borderColor: string;
  accentColor: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}

export const COMPANY_BRANDS: Record<string, CompanyBrand> = {
  swiggy: {
    name: 'Swiggy',
    initials: 'SW',
    industry: 'Food & Dining',
    bgGradient: 'from-orange-500/20 via-amber-500/10 to-transparent',
    textColor: 'text-orange-400',
    borderColor: 'border-orange-500/40',
    accentColor: '#FC8019',
    badgeBg: 'bg-orange-500/10',
    badgeText: 'text-orange-400',
    badgeBorder: 'border-orange-500/30',
  },
  phonepe: {
    name: 'PhonePe',
    initials: 'PP',
    industry: 'Payments & Fintech',
    bgGradient: 'from-purple-500/20 via-indigo-500/10 to-transparent',
    textColor: 'text-purple-400',
    borderColor: 'border-purple-500/40',
    accentColor: '#5f259f',
    badgeBg: 'bg-purple-500/10',
    badgeText: 'text-purple-400',
    badgeBorder: 'border-purple-500/30',
  },
  'hdfc bank': {
    name: 'HDFC Bank',
    initials: 'HDFC',
    industry: 'Banking & Financial Services',
    bgGradient: 'from-blue-600/20 via-cyan-600/10 to-transparent',
    textColor: 'text-blue-400',
    borderColor: 'border-blue-500/40',
    accentColor: '#004c8f',
    badgeBg: 'bg-blue-500/10',
    badgeText: 'text-blue-400',
    badgeBorder: 'border-blue-500/30',
  },
  flipkart: {
    name: 'Flipkart',
    initials: 'FK',
    industry: 'E-Commerce & Retail',
    bgGradient: 'from-amber-500/20 via-yellow-500/10 to-transparent',
    textColor: 'text-amber-400',
    borderColor: 'border-amber-500/40',
    accentColor: '#2874f0',
    badgeBg: 'bg-amber-500/10',
    badgeText: 'text-amber-400',
    badgeBorder: 'border-amber-500/30',
  },
  'bajaj auto': {
    name: 'Bajaj Auto',
    initials: 'BA',
    industry: 'Automotive & Mobility',
    bgGradient: 'from-indigo-600/20 via-slate-600/10 to-transparent',
    textColor: 'text-indigo-400',
    borderColor: 'border-indigo-500/40',
    accentColor: '#003399',
    badgeBg: 'bg-indigo-500/10',
    badgeText: 'text-indigo-400',
    badgeBorder: 'border-indigo-500/30',
  },
};

export function getCompanyBrand(companyName?: string): CompanyBrand {
  if (!companyName) {
    return {
      name: 'Agent',
      initials: 'AI',
      industry: 'Enterprise AI',
      bgGradient: 'from-cyan-500/20 to-transparent',
      textColor: 'text-cyan-400',
      borderColor: 'border-cyan-500/30',
      accentColor: '#06b6d4',
      badgeBg: 'bg-cyan-500/10',
      badgeText: 'text-cyan-400',
      badgeBorder: 'border-cyan-500/30',
    };
  }

  const key = companyName.toLowerCase().trim();
  for (const [brandKey, brand] of Object.entries(COMPANY_BRANDS)) {
    if (key.includes(brandKey) || brandKey.includes(key)) {
      return brand;
    }
  }

  return {
    name: companyName,
    initials: companyName.slice(0, 2).toUpperCase(),
    industry: 'Enterprise Agent',
    bgGradient: 'from-slate-700/20 to-transparent',
    textColor: 'text-slate-300',
    borderColor: 'border-slate-700',
    accentColor: '#64748b',
    badgeBg: 'bg-slate-800',
    badgeText: 'text-slate-300',
    badgeBorder: 'border-slate-700',
  };
}

