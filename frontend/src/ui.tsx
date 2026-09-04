import type { LucideIcon } from 'lucide-react';
import type { ButtonHTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

// Un seul endroit pour le look des boutons/inputs/cartes : ça garantit que
// tout se ressemble dans l'app (même police, même arrondi, même focus)
// plutôt que de recopier des classes Tailwind légèrement différentes partout.

export const card = 'rounded-2xl border border-pink-100 bg-white/90 p-5 shadow-sm shadow-pink-100/60 backdrop-blur-sm';

export const sectionTitle = 'mb-3 text-sm font-bold uppercase tracking-wider text-pink-500';

export const pageTitle = 'text-2xl font-bold tracking-tight text-slate-900';

export const errorText = 'text-sm font-medium text-rose-700';

export const mutedText = 'text-sm text-slate-600';

const fieldBase =
  'w-full rounded-xl border border-pink-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 transition-shadow focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-300';

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
  primary: 'bg-pink-500 text-white shadow-sm shadow-pink-200 hover:bg-pink-600 focus-visible:ring-pink-400',
  secondary: 'border border-pink-200 bg-white text-pink-700 hover:bg-pink-50 focus-visible:ring-pink-300',
  ghost: 'text-slate-600 hover:bg-pink-50 hover:text-pink-700 focus-visible:ring-pink-300',
  danger: 'border border-rose-200 bg-white text-rose-700 hover:bg-rose-50 focus-visible:ring-rose-300',
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
  className = '',
  ...props
}: { icon: LucideIcon; label: string } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      aria-label={label}
      title={label}
      className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-black/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-400 ${className}`}
      {...props}
    >
      <Icon size={12} strokeWidth={2.5} aria-hidden />
    </button>
  );
}

const badgeBase = 'inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-sm font-semibold';

export const badgeTones = {
  pink: `${badgeBase} bg-pink-100 text-pink-800`,
  slate: `${badgeBase} bg-slate-100 text-slate-700`,
  violet: `${badgeBase} bg-violet-100 text-violet-800`,
  amber: `${badgeBase} bg-amber-100 text-amber-800`,
  emerald: `${badgeBase} bg-emerald-100 text-emerald-800`,
  rose: `${badgeBase} bg-rose-100 text-rose-800`,
};

export const badge = badgeTones.pink;
