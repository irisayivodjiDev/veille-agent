import type { LucideIcon } from 'lucide-react';
import type { ButtonHTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

// Un seul endroit pour le look des boutons/inputs/cartes : ça garantit que
// tout se ressemble dans l'app (même police, même arrondi, même focus)
// plutôt que de recopier des classes Tailwind légèrement différentes partout.
// Les variantes dark: sont ici aussi, donc le mode sombre se propage partout
// sans avoir à toucher chaque page.

export const card =
  'rounded-2xl border border-pink-100 bg-white/90 p-5 shadow-sm shadow-pink-100/60 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-800/90 dark:shadow-none';

export const sectionTitle = 'mb-3 text-sm font-bold uppercase tracking-wider text-pink-500 dark:text-pink-400';

export const pageTitle = 'text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50';

export const errorText = 'text-sm font-medium text-rose-700 dark:text-rose-400';

export const mutedText = 'text-sm text-slate-600 dark:text-slate-400';

const fieldBase =
  'w-full rounded-xl border border-pink-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 transition-shadow focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-pink-400 dark:focus:ring-pink-400/40';

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${fieldBase} ${props.className ?? ''}`} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${fieldBase} ${props.className ?? ''}`} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${fieldBase} w-auto pr-8 ${props.className ?? ''}`} />;
}

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

const buttonBase =
  'inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

const buttonVariants: Record<Variant, string> = {
  primary:
    'bg-pink-500 text-white shadow-sm shadow-pink-200 hover:bg-pink-600 focus-visible:ring-pink-400 dark:shadow-none dark:focus-visible:ring-offset-slate-900',
  secondary:
    'border border-pink-200 bg-white text-pink-700 hover:bg-pink-50 focus-visible:ring-pink-300 dark:border-slate-600 dark:bg-slate-800 dark:text-pink-300 dark:hover:bg-slate-700 dark:focus-visible:ring-offset-slate-900',
  ghost:
    'text-slate-600 hover:bg-pink-50 hover:text-pink-700 focus-visible:ring-pink-300 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-pink-300 dark:focus-visible:ring-offset-slate-900',
  danger:
    'border border-rose-200 bg-white text-rose-700 hover:bg-rose-50 focus-visible:ring-rose-300 dark:border-rose-900 dark:bg-slate-800 dark:text-rose-400 dark:hover:bg-rose-950 dark:focus-visible:ring-offset-slate-900',
};

export function Button({
  variant = 'secondary',
  icon: Icon,
  className = '',
  children,
  ...props
}: {
  variant?: Variant;
  icon?: LucideIcon;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={`${buttonBase} ${buttonVariants[variant]} ${className}`} {...props}>
      {Icon && <Icon size={16} strokeWidth={2.25} aria-hidden />}
      {children}
    </button>
  );
}

export function IconButton({
  icon: Icon,
  label,
  iconSize = 12,
  className = '',
  ...props
}: { icon: LucideIcon; label: string; iconSize?: number } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      aria-label={label}
      title={label}
      className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-black/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-400 dark:hover:bg-white/10 ${className}`}
      {...props}
    >
      <Icon size={iconSize} strokeWidth={2.5} aria-hidden />
    </button>
  );
}

const badgeBase = 'inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-sm font-semibold';

export const badgeTones = {
  pink: `${badgeBase} bg-pink-100 text-pink-800 dark:bg-pink-500/20 dark:text-pink-300`,
  slate: `${badgeBase} bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300`,
  violet: `${badgeBase} bg-violet-100 text-violet-800 dark:bg-violet-500/20 dark:text-violet-300`,
  amber: `${badgeBase} bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300`,
  emerald: `${badgeBase} bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300`,
  rose: `${badgeBase} bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300`,
};

export const badge = badgeTones.pink;

export function Pagination({
  page,
  pageCount,
  onChange,
}: {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
}) {
  if (pageCount <= 1) return null;

  return (
    <div className="mt-4 flex items-center justify-center gap-3">
      <Button variant="secondary" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        Précédent
      </Button>
      <span className={mutedText}>
        Page {page} / {pageCount}
      </span>
      <Button variant="secondary" disabled={page >= pageCount} onClick={() => onChange(page + 1)}>
        Suivant
      </Button>
    </div>
  );
}
