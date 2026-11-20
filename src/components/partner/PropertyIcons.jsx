// TriponX property-type icons — drawn for the Partner Hub (not from an icon library).
// One style for all: 48×48 grid, 2px round strokes in currentColor, plus a soft tinted fill ("duo" shape)
// so each icon reads as a two-tone illustration. Colour comes from the parent (currentColor).
const DUO = { fill: 'currentColor', fillOpacity: 0.16, stroke: 'none' };

function Svg({ size = 40, children, ...rest }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...rest}>
      {children}
    </svg>
  );
}

const WAVES = 'M4 43c3 0 3-2 6-2s3 2 6 2 3-2 6-2 3 2 6 2 3-2 6-2 3 2 6 2 3-2 6-2';

const ICONS = {
  // ----- categories -----
  stay: ( // concierge bell
    <>
      <path {...DUO} d="M10 33a14 14 0 0 1 28 0z" />
      <path d="M10 33a14 14 0 0 1 28 0" />
      <path d="M6 37h36" />
      <path d="M24 19v-4M20.5 15h7" />
      <path d="M17 28a8 8 0 0 1 4.5-4.5" />
    </>
  ),
  home: ( // house with key
    <>
      <path {...DUO} d="M10 40V20l14-11 14 11v20z" />
      <path d="M6 22 24 8l18 14" />
      <path d="M10 19v21h28V19" />
      <path d="M19 40v-9h7v9" />
      <circle cx="33" cy="29" r="3" />
      <path d="M33 32v5M33 35h2" />
    </>
  ),

  // ----- hotels & stays -----
  hotel: (
    <>
      <rect {...DUO} x="12" y="8" width="24" height="34" rx="2" />
      <rect x="12" y="8" width="24" height="34" rx="2" />
      <path d="M7 42h34" />
      <path d="M18 15h2M28 15h2M18 21h2M28 21h2M18 27h2M28 27h2" />
      <path d="M21 42v-7h6v7" />
    </>
  ),
  resort: ( // palm, sun and sea
    <>
      <circle {...DUO} cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="5" />
      <path d="M29 39c0-7-1-13-5-19" />
      <path d="M24 20c-4-3-9-3-12 0 4-1 8 0 11 2" />
      <path d="M24 20c3-4 8-5 12-2-4 0-7 1-10 4" />
      <path d="M24 20c0-4 2-8 6-9-1 3-2 6-3 9" />
      <path d={WAVES} />
    </>
  ),
  boutique: ( // cut gem
    <>
      <path {...DUO} d="M24 41 7 20l7-10h20l7 10z" />
      <path d="M24 41 7 20l7-10h20l7 10z" />
      <path d="M7 20h34" />
      <path d="M19 10l-3 10 8 21 8-21-3-10" />
    </>
  ),
  palace: ( // dome with two minarets
    <>
      <path {...DUO} d="M14 42V27h20v15z" />
      <path d="M5 42h38" />
      <path d="M14 42V27h20v15" />
      <path d="M15 27c0-6 4-9 9-12 5 3 9 6 9 12" />
      <path d="M24 15v-5" />
      <path d="M7 42V23l2.5-3 2.5 3v19M36 42V23l2.5-3 2.5 3v19" />
      <path d="M21 42v-6a3 3 0 0 1 6 0v6" />
    </>
  ),
  lodge: ( // A-frame cabin and pine
    <>
      <path {...DUO} d="M6 40 20 14l14 26z" />
      <path d="M4 40h40" />
      <path d="M6 40 20 14l14 26" />
      <path d="M17 40v-7h6v7" />
      <path d="M20 22v4" />
      <path d="M38 12l-5 9h3l-4 8h12l-4-8h3z" />
      <path d="M38 29v11" />
    </>
  ),
  guesthouse: ( // house with a hanging sign
    <>
      <path {...DUO} d="M10 40V22l14-11 14 11v18z" />
      <path d="M6 24 24 10l18 14" />
      <path d="M10 21v19h28V21" />
      <path d="M20 40v-9h8v9" />
      <path d="M14 26h4v4h-4z" />
      <path d="M38 27h5M41 27v2" />
      <rect x="38.5" y="29" width="5" height="4" rx="1" />
    </>
  ),
  houseboat: ( // kettuvallam
    <>
      <path {...DUO} d="M6 31h36l-4 7H10z" />
      <path d="M6 31h36l-4 7H10z" />
      <path d="M12 31v-6c4-6 20-6 24 0v6" />
      <path d="M18 23v8M24 22v9M30 23v8" />
      <path d={WAVES} />
    </>
  ),
  motel: ( // low block with roadside sign
    <>
      <path {...DUO} d="M6 26h24v14H6z" />
      <path d="M2 40h44" />
      <path d="M4 26h28" />
      <path d="M6 26v14h24V26" />
      <path d="M11 40v-7h4v7M21 40v-7h4v7" />
      <path d="M40 40V16" />
      <rect x="34" y="8" width="12" height="8" rx="1.5" />
      <path d="M37 14v-4l3 2.5 3-2.5v4" />
    </>
  ),

  // ----- homes & villas -----
  villa: ( // flat-roof villa with pool
    <>
      <path {...DUO} d="M24 34V14h16v20z" />
      <path d="M6 20h20M22 14h20" />
      <path d="M8 34V20h16v14M24 34V14h16v20" />
      <path d="M28 20h8v8h-8z" />
      <path d="M13 34v-6h5v6" />
      <path d="M5 34h38" />
      <path d={WAVES} />
    </>
  ),
  homestay: ( // home with a heart
    <>
      <path {...DUO} d="M10 40V22l14-11 14 11v18z" />
      <path d="M6 24 24 10l18 14" />
      <path d="M10 21v19h28V21" />
      <path d="M24 35s-6-3.6-6-7.5a3 3 0 0 1 6-1 3 3 0 0 1 6 1c0 3.9-6 7.5-6 7.5z" />
    </>
  ),
  serviced: ( // apartment tower with balconies
    <>
      <rect {...DUO} x="14" y="6" width="20" height="36" rx="1.5" />
      <rect x="14" y="6" width="20" height="36" rx="1.5" />
      <path d="M8 42h32" />
      <path d="M11 15h26M11 24h26M11 33h26" />
      <path d="M20 10v2M28 10v2M20 19v2M28 19v2M20 28v2M28 28v2" />
      <path d="M22 42v-5h4v5" />
    </>
  ),
  cottage: ( // cottage with chimney smoke
    <>
      <path {...DUO} d="M10 40V24l12-10 12 10v16z" />
      <path d="M4 40h40" />
      <path d="M6 26 22 13l16 13" />
      <path d="M10 23v17h24V23" />
      <path d="M30 17v-6h4v9" />
      <path d="M32 7c-2-1.2-1.4-3 .4-3.6S33.6 1.6 32 1" />
      <path d="M18 40v-8h6v8" />
      <path d="M27 28h4v4h-4z" />
    </>
  ),
  farmstay: ( // barn and silo
    <>
      <path {...DUO} d="M6 40V22l10-8 10 8v18z" />
      <path d="M2 40h44" />
      <path d="M4 23 16 13l12 10" />
      <path d="M6 21v19h20V21" />
      <path d="M11 40v-9h10v9M11 31l10 9M21 31l-10 9" />
      <path d="M30 40V17a5 5 0 0 1 10 0v23" />
      <path d="M30 25h10M30 32h10" />
    </>
  ),
  camp: ( // glamping dome under the stars
    <>
      <path {...DUO} d="M8 40a16 16 0 0 1 32 0z" />
      <path d="M4 40h40" />
      <path d="M8 40a16 16 0 0 1 32 0" />
      <path d="M19 40l5-11 5 11" />
      <path d="M38 7l1 2.2 2.2 1-2.2 1L38 14l-1-2.8-2.2-1 2.2-1z" />
      <path d="M12 5a4.5 4.5 0 1 0 5 6.5A3.6 3.6 0 0 1 12 5z" />
    </>
  ),
};

export function PropertyIcon({ type, size = 40, className }) {
  const art = ICONS[type] ?? ICONS.hotel;
  return <Svg size={size} className={className}>{art}</Svg>;
}
