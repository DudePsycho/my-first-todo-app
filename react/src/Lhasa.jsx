// THE LHASA APSO: the little helper dog under the Add button that teaches the tricks.
// Drawn like the main dog (simple shapes, ink outlines), but with a Lhasa's look:
// a long coat that drapes to the floor, long wavy ears, a soft fringe over the eyes,
// a beard, and a plumed tail curled forward over its back

export default function Lhasa() {
  return (
    <svg className="dog lhasa" viewBox="0 0 120 96" aria-hidden="true">
      {/* The tail: a plume curling forward over its back (drawn first, so it sits behind) */}
      <path className="lhasa-hair" d="M92 50 C 106 34, 96 14, 76 16 C 60 18, 58 34, 72 36 C 80 37, 82 30, 78 28 C 86 30, 88 42, 80 47 Z" />
      {/* The long coat: narrow at the back, wider at the floor, with a wavy hem */}
      <path className="lhasa-coat" d="M40 48 C 56 42, 80 42, 94 50 C 100 62, 104 76, 104 86 Q 99 91 94 86 Q 89 91 84 86 Q 79 91 74 86 Q 69 91 64 86 Q 59 91 54 86 Q 49 91 44 86 Q 39 91 34 86 Q 31 89 28 86 C 30 74, 34 60, 40 48 Z" />
      {/* Two wavy strands, so the coat looks long and soft */}
      <path className="lhasa-strand" d="M60 47 C 56 60, 62 72, 58 84" />
      <path className="lhasa-strand" d="M80 47 C 84 60, 78 72, 82 84" />
      {/* Paws peeking out under the coat */}
      <ellipse className="lhasa-coat" cx="42" cy="90" rx="6" ry="3.5" />
      <ellipse className="lhasa-coat" cx="92" cy="90" rx="6" ry="3.5" />
      {/* The long wavy ears, hanging down both sides of the head */}
      <path className="lhasa-hair" d="M18 28 C 8 40, 10 60, 16 70 Q 20 66 23 70 Q 27 58 26 36 Z" />
      <path className="lhasa-hair" d="M50 28 C 60 40, 58 60, 52 70 Q 48 66 45 70 Q 41 58 42 36 Z" />
      {/* The head, then the soft fringe over the eyes, with the eyes just peeking out */}
      <circle className="lhasa-coat" cx="34" cy="34" r="18" />
      <path className="lhasa-hair" d="M16 31 C 16 13, 52 13, 52 31 Q 48 37 44 32 Q 39 38 34 33 Q 29 38 24 32 Q 20 37 16 31 Z" />
      <circle className="lhasa-ink" cx="27" cy="40" r="2.2" />
      <circle className="lhasa-ink" cx="41" cy="40" r="2.2" />
      {/* The beard, the nose and a small smile */}
      <path className="lhasa-coat" d="M24 45 C 24 57, 44 57, 44 45" />
      <ellipse className="lhasa-ink" cx="34" cy="45" rx="3.5" ry="2.6" />
      <path className="lhasa-strand" d="M31 50 Q 34 52 37 50" />
    </svg>
  );
}
