// Petits tokens de style Tailwind partagés entre les pages, pour éviter de
// répéter les mêmes longues chaînes de classes utilitaires partout.

export const card = 'rounded-2xl border border-pink-100 bg-white p-5 shadow-sm shadow-pink-100/50';

export const inputBase =
  'w-full rounded-xl border border-pink-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-200';

export const selectBase = inputBase + ' pr-8';

export const btnPrimary =
  'inline-flex items-center justify-center rounded-xl bg-pink-500 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-pink-200 transition-colors hover:bg-pink-600 disabled:cursor-not-allowed disabled:opacity-50';

export const btnSecondary =
  'inline-flex items-center justify-center rounded-xl border border-pink-200 bg-white px-4 py-2 text-sm font-medium text-pink-700 transition-colors hover:bg-pink-50 disabled:cursor-not-allowed disabled:opacity-50';

export const btnGhost =
  'inline-flex items-center justify-center rounded-xl px-3 py-1.5 text-sm font-medium text-slate-500 transition-colors hover:bg-pink-50 hover:text-pink-700';

export const badge = 'inline-flex items-center rounded-full bg-pink-100 px-2.5 py-0.5 text-xs font-medium text-pink-700';

export const badgeNeutral = 'inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600';

export const errorText = 'text-sm text-rose-600';

export const mutedText = 'text-sm text-slate-500';

export const sectionTitle = 'mb-3 text-sm font-semibold uppercase tracking-wide text-pink-500';
