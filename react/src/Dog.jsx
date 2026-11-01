// THE DOG, drawn with simple shapes. In the plain version the dog was written once in the HTML
// and copied with cloneNode(). In React it's a component, so we just use <Dog /> wherever we want one

// The bone's shape (drawn twice: an ink outline, then the paper fill on top)
function BoneShape() {
  return (
    <>
      <rect x="96" y="46" width="30" height="7" rx="3.5" />
      <circle cx="96" cy="45.5" r="4" />
      <circle cx="96" cy="53.5" r="4" />
      <circle cx="126" cy="45.5" r="4" />
      <circle cx="126" cy="53.5" r="4" />
    </>
  );
}

// withBone: the small dog at the top of the menu holds a bone (it drops it when the menu shrinks)
export default function Dog({ withBone }) {
  return (
    <svg className="dog" viewBox="0 0 130 100" aria-hidden="true">
      <path className="dog-tail" d="M30 52 C 18 46, 14 34, 20 24" />
      <line className="dog-leg leg-a" x1="36" y1="64" x2="32" y2="88" />
      <line className="dog-leg leg-b" x1="46" y1="66" x2="47" y2="90" />
      <ellipse className="dog-fill" cx="56" cy="56" rx="30" ry="17" />
      <ellipse className="dog-patch" cx="50" cy="50" rx="10" ry="6" />
      <line className="dog-leg leg-b" x1="70" y1="66" x2="69" y2="90" />
      <line className="dog-leg leg-a" x1="78" y1="63" x2="83" y2="88" />
      <rect className="dog-collar" x="72" y="38" width="9" height="22" rx="4.5" transform="rotate(-20 76.5 49)" />
      <circle className="dog-fill" cx="90" cy="34" r="18" />
      <ellipse className="dog-fill" cx="106" cy="40" rx="11" ry="8" />
      <circle className="dog-nose" cx="116" cy="37" r="3.5" />
      <path className="dog-tongue" d="M103 47 C 103 55, 110 55, 110 47" />
      <ellipse className="dog-ear" cx="82" cy="30" rx="7" ry="14" transform="rotate(18 82 30)" />
      <circle className="dog-eye" cx="96" cy="30" r="3" />
      {/* {condition && <thing />} means: only draw the thing when the condition is true */}
      {withBone && (
        <g className="bone">
          <g className="bone-outline"><BoneShape /></g>
          <g className="bone-fill"><BoneShape /></g>
        </g>
      )}
    </svg>
  );
}
