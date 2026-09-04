import bg from './assets/bg.jpg';

// Fond décoratif : la photo choisie, floutée, sous un voile qui s'adapte au
// thème (rosé et clair en mode jour, assombri en mode sombre pour que le
// texte des cartes reste lisible par-dessus dans les deux cas).
// pointer-events-none + aria-hidden : purement visuel, ne gêne jamais le clavier/souris.
export function BackgroundDecor() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-pink-50 dark:bg-slate-900">
      <img src={bg} alt="" className="h-full w-full scale-110 object-cover blur-lg dark:opacity-40" />
      <div className="absolute inset-0 bg-linear-to-b from-white/80 via-pink-50/80 to-white/90 dark:from-slate-900/85 dark:via-slate-900/80 dark:to-slate-900/95" />
    </div>
  );
}
