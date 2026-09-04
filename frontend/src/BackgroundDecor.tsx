import bg from './assets/bg.jpg';

// Fond décoratif : la photo choisie, floutée et assombrie légèrement sous un
// voile rosé pour que le texte des cartes reste lisible par-dessus.
// pointer-events-none + aria-hidden : purement visuel, ne gêne jamais le clavier/souris.
export function BackgroundDecor() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-pink-50">
      <img
        src={bg}
        alt=""
        className="h-full w-full scale-110 object-cover blur-lg"
      />
      <div className="absolute inset-0 bg-linear-to-b from-white/80 via-pink-50/80 to-white/90" />
    </div>
  );
}
