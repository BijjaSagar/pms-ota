// Ported from pms-ota/src/data/hotels.ts (types removed, logic unchanged).
const img = (id, width = 1400) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}&q=80`;
const santorini = [
  img("1533105079780-92b9be482077"),
  img("1570077188670-e3a8d69ac5ff"),
  img("1601581875039-e899893d520c"),
  img("1533104816931-20fa691ff6ca"),
  img("1611892440504-42a792e24d32")
];
const kyoto = [
  img("1493976040374-85c8e12f0c0e"),
  img("1528360983277-13d401cdc186"),
  img("1528164344705-47542687000d"),
  img("1568084680786-a84f91d1153c"),
  img("1590490360182-c33d57733427")
];
const amalfi = [
  img("1516483638261-f4dbaf036963"),
  img("1534445867742-43195f401b6c"),
  img("1523531294919-4bcd7c65e216"),
  img("1542314831-068cd1dbfeeb"),
  img("1618773928121-c32242e63f39")
];
const bali = [
  img("1537996194471-e657df975ab4"),
  img("1518548419970-58e3b4079ab2"),
  img("1544644181-1484b3fdfc62"),
  img("1573790387438-4da905039392"),
  img("1582719508461-905c673771fd")
];
const paris = [
  img("1502602898657-3e91760cbb34"),
  img("1499856871958-5b9627545d1a"),
  img("1522093007474-d86e9bf7ba6f"),
  img("1511739001486-6bfe10ce785f"),
  img("1578683010236-d716f9a3f461")
];
const maldives = [
  img("1544551763-46a013bb70d5"),
  img("1514282401047-d79a71a590e8"),
  img("1573843981267-be1999ff37cd"),
  img("1590523277543-a94d2e4eb00b"),
  img("1560185127-6ed189bf02f4")
];
const rooms = {
  santoriniSuite: img("1600607687939-ce8a6c25118c"),
  santoriniVilla: img("1600566753086-00f18fb6b3ea"),
  santoriniClassic: img("1560448204-e02f11c3d0e2"),
  kyotoGarden: img("1616594039964-ae9021a400a0"),
  kyotoSuite: img("1598928506311-c55ded91a20c"),
  kyotoTatami: img("1616486338812-3dadae4b4ace"),
  amalfiTerrace: img("1560185007-cde436f6a4d0"),
  amalfiVilla: img("1512917774080-9991f1c4c750"),
  amalfiGarden: img("1580587771525-78b9dba3b914"),
  baliCanopy: img("1600596542815-ffad4c1539a9"),
  baliPool: img("1613490493576-7fde63acd811"),
  baliGarden: img("1600210492486-724fe5c67fb0"),
  parisSalon: img("1596394516093-501ba68a0ba6"),
  parisSuite: img("1560184897-ae75f418493e"),
  parisClassic: img("1582719508461-905c673771fd"),
  maldivesVilla: img("1615880484746-a134be9a6ecf"),
  maldivesResidence: img("1602002418082-a4443e081dd1"),
  maldivesBeach: img("1600047509807-ba8f99d2cdde")
};
const hotels = [
  {
    id: "hotel-1",
    slug: "the-meridian-santorini",
    name: "The Meridian Santorini",
    tagline: "Cliffside suites above the Aegean",
    propertyType: "Resort",
    location: { city: "Oia", country: "Greece", region: "Santorini" },
    address: "Oia 847 02, Santorini, Greece",
    description: "A whitewashed sanctuary carved into the caldera cliffs, where every suite opens onto the endless blue of the Aegean.",
    story: "The Meridian occupies a quiet stretch of the Oia cliffside, a collection of cave suites and private terraces that have been restored by local craftsmen. Mornings begin with breakfast on your terrace as the caldera catches the first light; evenings end in the infinity pool, suspended between sky and sea. The hotel keeps only thirty suites, so the rhythm stays unhurried \u2014 exactly as the island intended.",
    images: santorini,
    rating: 4.9,
    reviewCount: 428,
    stars: 5,
    pricePerNight: 620,
    propertyDiscountRate: 0.12,
    amenities: [
      "Free WiFi",
      "Infinity pool",
      "Spa",
      "Restaurant",
      "Bar",
      "Airport transfer",
      "Concierge",
      "Air conditioning",
      "Breakfast included"
    ],
    highlights: [
      { title: "Caldera views", description: "Private terraces facing the volcanic caldera and sunset.", icon: "sun" },
      { title: "Aegean spa", description: "Salt-water therapies and cliffside treatment cabanas.", icon: "waves" },
      { title: "Chef-led dining", description: "Seasonal Cycladic menus served under the stars.", icon: "utensils" }
    ],
    rooms: [
      {
        id: "meridian-caldera-suite",
        name: "Caldera Suite",
        description: "A vaulted cave suite with a private plunge pool and uninterrupted caldera views.",
        pricePerNight: 720,
        size: 55,
        bed: "King bed",
        maxGuests: 2,
        amenities: ["Private terrace", "Plunge pool", "Rain shower", "Nespresso", "Sea view"],
        image: rooms.santoriniSuite,
        refundable: true,
        breakfast: true,
        remaining: 3
      },
      {
        id: "meridian-aegean-villa",
        name: "Aegean Villa",
        description: "Two levels of whitewashed calm with a heated pool, outdoor dining and sunset lounge.",
        pricePerNight: 980,
        size: 96,
        bed: "King bed + sofa bed",
        maxGuests: 4,
        amenities: ["Private pool", "Outdoor dining", "Butler service", "Sea view", "Lounge"],
        image: rooms.santoriniVilla,
        refundable: true,
        breakfast: true,
        remaining: 2
      },
      {
        id: "meridian-classic-room",
        name: "Classic Cave Room",
        description: "An intimate room with hand-plastered walls, linen linens and a sunlit terrace.",
        pricePerNight: 620,
        size: 32,
        bed: "Queen bed",
        maxGuests: 2,
        amenities: ["Terrace", "Rain shower", "Nespresso", "Sea view"],
        image: rooms.santoriniClassic,
        refundable: false,
        breakfast: true,
        remaining: 5
      }
    ],
    reviews: [
      {
        id: "r1",
        name: "Sofia Laurent",
        country: "France",
        initials: "SL",
        date: "October 2026",
        rating: 5,
        title: "The most beautiful week of our year",
        body: "Every detail is considered \u2014 the linen, the lighting, the breakfast that appears exactly when you want it. Watching the sunset from the plunge pool is something we will never forget.",
        stayType: "Couple \xB7 Caldera Suite"
      },
      {
        id: "r2",
        name: "Marcus Chen",
        country: "Singapore",
        initials: "MC",
        date: "September 2026",
        rating: 5,
        title: "Effortless luxury",
        body: "The team anticipated everything without ever being intrusive. The spa treatment overlooking the caldera is worth the trip alone.",
        stayType: "Couple \xB7 Aegean Villa"
      },
      {
        id: "r3",
        name: "Amelia Grant",
        country: "United Kingdom",
        initials: "AG",
        date: "August 2026",
        rating: 5,
        title: "Better than the photographs",
        body: "We booked three nights and extended to six. The privacy is remarkable for somewhere so close to Oia.",
        stayType: "Solo \xB7 Classic Cave Room"
      }
    ],
    policies: {
      checkIn: "From 3:00 PM",
      checkOut: "Until 11:00 AM",
      cancellation: "Free cancellation until 7 days before arrival. 50% charge within 7 days.",
      children: "Children over 12 are welcome. Cots available on request.",
      pets: "Pets are not permitted at this property.",
      houseRules: ["Alcohol allowed", "Non-smoking", "All male guests allowed", "Unmarried guests allowed"]
    },
    tags: ["Adults only", "Sunset views", "Honeymoon"],
    featured: true,
    distance: "0.4 km from Oia centre",
    coordinates: { lat: 36.4618, lng: 25.3753 }
  },
  {
    id: "hotel-2",
    slug: "kyoto-garden-ryokan",
    name: "Kyoto Garden Ryokan",
    tagline: "A quiet ryokan in Higashiyama",
    propertyType: "Ryokan",
    location: { city: "Kyoto", country: "Japan", region: "Kansai" },
    address: "605-0825 Kyoto, Higashiyama Ward, Japan",
    description: "A restored wooden ryokan wrapped around a moss garden, with tatami rooms, cedar baths and kaiseki dining.",
    story: "Behind a modest wooden gate in Higashiyama, the Kyoto Garden Ryokan has welcomed guests for four generations. The main house retains its original cedar beams and shoji screens, while the garden \u2014 raked gravel, moss and a single old maple \u2014 changes character with every season. Dinner is a multi-course kaiseki served in your room, and the private onsen is drawn from a local spring.",
    images: kyoto,
    rating: 4.8,
    reviewCount: 312,
    stars: 5,
    pricePerNight: 410,
    propertyDiscountRate: 0.1,
    amenities: [
      "Free WiFi",
      "Private onsen",
      "Restaurant",
      "Spa",
      "Concierge",
      "Breakfast included",
      "Air conditioning",
      "Garden"
    ],
    highlights: [
      { title: "Kaiseki dining", description: "Seasonal multi-course dinners served in your suite.", icon: "utensils" },
      { title: "Cedar onsen", description: "Private mineral baths overlooking the moss garden.", icon: "leaf" },
      { title: "Tea ceremony", description: "Morning matcha with the ryokan tea master.", icon: "flower" }
    ],
    rooms: [
      {
        id: "kyoto-garden-suite",
        name: "Garden Suite",
        description: "Tatami living room, private cedar bath and sliding doors onto the moss garden.",
        pricePerNight: 520,
        size: 48,
        bed: "Futon bedding",
        maxGuests: 2,
        amenities: ["Private onsen", "Garden view", "Kaiseki dinner", "Yukata"],
        image: rooms.kyotoGarden,
        refundable: true,
        breakfast: true,
        remaining: 2
      },
      {
        id: "kyoto-machiya-suite",
        name: "Machiya Suite",
        description: "A two-storey machiya townhouse with a courtyard, tea room and cypress bath.",
        pricePerNight: 690,
        size: 82,
        bed: "Futon bedding",
        maxGuests: 4,
        amenities: ["Private courtyard", "Cypress bath", "Tea room", "Kaiseki dinner"],
        image: rooms.kyotoSuite,
        refundable: true,
        breakfast: true,
        remaining: 1
      },
      {
        id: "kyoto-tatami-room",
        name: "Classic Tatami Room",
        description: "A serene tatami room with a private veranda facing the maple garden.",
        pricePerNight: 410,
        size: 28,
        bed: "Futon bedding",
        maxGuests: 2,
        amenities: ["Garden view", "Shared onsen", "Breakfast", "Yukata"],
        image: rooms.kyotoTatami,
        refundable: false,
        breakfast: true,
        remaining: 4
      }
    ],
    reviews: [
      {
        id: "r4",
        name: "Harriet Mills",
        country: "Australia",
        initials: "HM",
        date: "October 2026",
        rating: 5,
        title: "A lesson in stillness",
        body: "The garden alone is worth the journey. Dinner was a procession of small, perfect things, and the private onsen after a day of temples was heaven.",
        stayType: "Couple \xB7 Garden Suite"
      },
      {
        id: "r5",
        name: "Daniel Okafor",
        country: "United States",
        initials: "DO",
        date: "September 2026",
        rating: 5,
        title: "Impeccable hospitality",
        body: "Four generations of care show in every gesture. The tea ceremony on our final morning was a beautiful way to say goodbye.",
        stayType: "Solo \xB7 Classic Tatami Room"
      },
      {
        id: "r6",
        name: "Isabella Rossi",
        country: "Italy",
        initials: "IR",
        date: "August 2026",
        rating: 4,
        title: "Beautiful, traditional, restorative",
        body: "Beds are low and the pace is slow \u2014 that is the point. Bring a book and let the city wait.",
        stayType: "Couple \xB7 Garden Suite"
      }
    ],
    policies: {
      checkIn: "From 4:00 PM",
      checkOut: "Until 10:00 AM",
      cancellation: "Free cancellation until 14 days before arrival. 100% charge within 14 days.",
      children: "Children over 10 are welcome. Family suites available.",
      pets: "Pets are not permitted at this property.",
      houseRules: ["Alcohol allowed", "Non-smoking", "All male guests allowed", "Unmarried guests allowed"]
    },
    tags: ["Culture", "Garden", "Fine dining"],
    featured: true,
    distance: "1.2 km from Kiyomizu-dera",
    coordinates: { lat: 34.9977, lng: 135.7809 }
  },
  {
    id: "hotel-3",
    slug: "villa-serrano",
    name: "Villa Serrano",
    tagline: "A private villa on the Amalfi cliffs",
    propertyType: "Villa",
    location: { city: "Positano", country: "Italy", region: "Amalfi Coast" },
    address: "Via Marina Grande 12, 84017 Positano, Italy",
    description: "A family-owned villa spilling down the cliffs of Positano, with lemon terraces, a sea-water pool and a private chef.",
    story: "Villa Serrano has been in the same family since 1927, when it was built as a summer house among the lemon terraces. Today it holds nine elegant rooms and a handful of private apartments, all connected by bougainvillea-covered paths that lead down to the pool and the sea. Breakfast is laid out on the terrace; lunch is whatever the chef brings back from the market in Positano.",
    images: amalfi,
    rating: 4.9,
    reviewCount: 198,
    stars: 5,
    pricePerNight: 780,
    propertyDiscountRate: 0.15,
    amenities: [
      "Free WiFi",
      "Sea-water pool",
      "Restaurant",
      "Beach access",
      "Spa",
      "Bar",
      "Airport transfer",
      "Parking",
      "Concierge"
    ],
    highlights: [
      { title: "Private beach club", description: "Steps down to sunbeds on the Tyrrhenian Sea.", icon: "waves" },
      { title: "Lemon terraces", description: "Fragrant gardens and shaded dining above the coast.", icon: "leaf" },
      { title: "In-villa chef", description: "Market-led menus and a cellar of local wines.", icon: "wine" }
    ],
    rooms: [
      {
        id: "serrano-terrace-suite",
        name: "Terrace Suite",
        description: "A bright suite with a wide private terrace overlooking the pool and the sea.",
        pricePerNight: 880,
        size: 60,
        bed: "King bed",
        maxGuests: 2,
        amenities: ["Private terrace", "Sea view", "Soaking tub", "Breakfast", "Minibar"],
        image: rooms.amalfiTerrace,
        refundable: true,
        breakfast: true,
        remaining: 3
      },
      {
        id: "serrano-garden-villa",
        name: "Garden Villa",
        description: "A two-bedroom villa set among lemon trees with a private pool and outdoor kitchen.",
        pricePerNight: 1240,
        size: 120,
        bed: "2 king beds",
        maxGuests: 5,
        amenities: ["Private pool", "Outdoor kitchen", "Lemon garden", "Daily housekeeping"],
        image: rooms.amalfiVilla,
        refundable: true,
        breakfast: true,
        remaining: 1
      },
      {
        id: "serrano-garden-room",
        name: "Garden Room",
        description: "A quiet room opening onto the bougainvillea courtyard, with vaulted ceilings.",
        pricePerNight: 780,
        size: 38,
        bed: "Queen bed",
        maxGuests: 2,
        amenities: ["Courtyard view", "Rain shower", "Breakfast", "Minibar"],
        image: rooms.amalfiGarden,
        refundable: false,
        breakfast: true,
        remaining: 4
      }
    ],
    reviews: [
      {
        id: "r7",
        name: "Clara Moreau",
        country: "France",
        initials: "CM",
        date: "October 2026",
        rating: 5,
        title: "La dolce vita, properly done",
        body: "The family made us feel like guests in their home. Breakfast on the terrace with the sea below is the stuff of dreams.",
        stayType: "Couple \xB7 Terrace Suite"
      },
      {
        id: "r8",
        name: "James Whitfield",
        country: "United Kingdom",
        initials: "JW",
        date: "September 2026",
        rating: 5,
        title: "A villa worth returning to",
        body: "We took the Garden Villa with friends and barely left. The private chef dinner was the highlight of our Italian holiday.",
        stayType: "Group \xB7 Garden Villa"
      },
      {
        id: "r9",
        name: "Noor Al-Sayed",
        country: "United Arab Emirates",
        initials: "NA",
        date: "July 2026",
        rating: 4,
        title: "Charming and authentic",
        body: "Lots of steps, as you would expect in Positano, but every corner is beautiful. Staff could not have been kinder.",
        stayType: "Family \xB7 Garden Room"
      }
    ],
    policies: {
      checkIn: "From 2:00 PM",
      checkOut: "Until 11:00 AM",
      cancellation: "Free cancellation until 10 days before arrival. 50% charge within 10 days.",
      children: "Families are welcome. Cots and extra beds available.",
      pets: "Small pets welcome on request.",
      houseRules: ["Alcohol allowed", "Pets allowed", "Non-smoking", "All male guests allowed", "Unmarried guests allowed"]
    },
    tags: ["Family", "Private pool", "Sea view"],
    featured: true,
    distance: "0.6 km from Positano beach",
    coordinates: { lat: 40.6281, lng: 14.4849 }
  },
  {
    id: "hotel-4",
    slug: "ubud-canopy-retreat",
    name: "Ubud Canopy Retreat",
    tagline: "Treehouse suites in the Balinese jungle",
    propertyType: "Resort",
    location: { city: "Ubud", country: "Indonesia", region: "Bali" },
    address: "Jalan Raya Sanggingan, Ubud, Bali, Indonesia",
    description: "Suspended above the Ayung River valley, this eco-retreat pairs open-air suites with rice-terrace views and a jungle spa.",
    story: "Ubud Canopy Retreat was built around the trees rather than over them. Each suite is an open pavilion of teak and alang-alang thatch, positioned for the sound of the river and the movement of the valley. There is a spring-fed pool, an open-air yoga shala, and a restaurant that sources almost everything from the surrounding farms. Monkeys visit at dawn; the rest of the day belongs to birdsong.",
    images: bali,
    rating: 4.7,
    reviewCount: 264,
    stars: 5,
    pricePerNight: 295,
    propertyDiscountRate: 0.08,
    amenities: [
      "Free WiFi",
      "Infinity pool",
      "Spa",
      "Restaurant",
      "Bar",
      "Fitness center",
      "Airport transfer",
      "Breakfast included",
      "Air conditioning"
    ],
    highlights: [
      { title: "Jungle infinity pool", description: "A spring-fed pool suspended over the valley.", icon: "waves" },
      { title: "Open-air spa", description: "Balinese healing rituals among the treetops.", icon: "leaf" },
      { title: "Sunrise yoga", description: "Daily practice in the river-view shala.", icon: "sun" }
    ],
    rooms: [
      {
        id: "bali-canopy-suite",
        name: "Canopy Suite",
        description: "An open-air pavilion with a hanging daybed, outdoor shower and valley views.",
        pricePerNight: 340,
        size: 52,
        bed: "King bed",
        maxGuests: 2,
        amenities: ["Valley view", "Hanging daybed", "Outdoor shower", "Breakfast"],
        image: rooms.baliCanopy,
        refundable: true,
        breakfast: true,
        remaining: 5
      },
      {
        id: "bali-river-villa",
        name: "River Villa",
        description: "A private villa with a plunge pool, riverside deck and dedicated butler.",
        pricePerNight: 520,
        size: 88,
        bed: "King bed + daybed",
        maxGuests: 3,
        amenities: ["Plunge pool", "Riverside deck", "Butler service", "Breakfast"],
        image: rooms.baliPool,
        refundable: true,
        breakfast: true,
        remaining: 2
      },
      {
        id: "bali-garden-room",
        name: "Garden Room",
        description: "A calm room surrounded by heliconia and palms, steps from the yoga shala.",
        pricePerNight: 295,
        size: 36,
        bed: "Queen bed",
        maxGuests: 2,
        amenities: ["Garden view", "Outdoor shower", "Breakfast", "Yoga access"],
        image: rooms.baliGarden,
        refundable: false,
        breakfast: true,
        remaining: 6
      }
    ],
    reviews: [
      {
        id: "r10",
        name: "Elena Petrova",
        country: "Germany",
        initials: "EP",
        date: "October 2026",
        rating: 5,
        title: "Waking up in the treetops",
        body: "The Canopy Suite felt like a private treehouse. Yoga at sunrise, then a long breakfast looking over the valley \u2014 pure restoration.",
        stayType: "Solo \xB7 Canopy Suite"
      },
      {
        id: "r11",
        name: "Tom Bradley",
        country: "New Zealand",
        initials: "TB",
        date: "September 2026",
        rating: 4,
        title: "Wonderfully wild",
        body: "Expect insects, frogs and the occasional monkey \u2014 it is a jungle, after all. The staff handle everything with a smile.",
        stayType: "Couple \xB7 River Villa"
      },
      {
        id: "r12",
        name: "Priya Nair",
        country: "India",
        initials: "PN",
        date: "August 2026",
        rating: 5,
        title: "The spa is extraordinary",
        body: "I booked one treatment and ended up going every day. The setting, the therapists, the sound of the river \u2014 exceptional.",
        stayType: "Couple \xB7 Canopy Suite"
      }
    ],
    policies: {
      checkIn: "From 2:00 PM",
      checkOut: "Until 12:00 PM",
      cancellation: "Free cancellation until 5 days before arrival. 100% charge within 5 days.",
      children: "Children over 6 are welcome. Family villas available.",
      pets: "Pets are not permitted at this property.",
      houseRules: ["Alcohol allowed", "Non-smoking", "All male guests allowed", "Unmarried guests allowed"]
    },
    tags: ["Eco retreat", "Wellness", "Jungle"],
    featured: false,
    distance: "3.1 km from Ubud centre",
    coordinates: { lat: -8.5069, lng: 115.2625 }
  },
  {
    id: "hotel-5",
    slug: "maison-lumiere",
    name: "Maison Lumi\xE8re",
    tagline: "A boutique townhouse in Saint-Germain",
    propertyType: "Boutique",
    location: { city: "Paris", country: "France", region: "\xCEle-de-France" },
    address: "18 Rue de Verneuil, 75007 Paris, France",
    description: "An 18th-century h\xF4tel particulier turned twenty-room boutique hotel, with a hidden courtyard and a salon devoted to reading.",
    story: "Maison Lumi\xE8re hides behind a heavy blue door on the Rue de Verneuil, a few minutes from the Seine. The house was built for a family of collectors and still feels that way: parquet floors, marble fireplaces, modern art and a courtyard garden where breakfast is served in good weather. There is no lobby noise, no chain formality \u2014 just twenty rooms, a small bar and a team who know the neighbourhood intimately.",
    images: paris,
    rating: 4.8,
    reviewCount: 356,
    stars: 5,
    pricePerNight: 540,
    propertyDiscountRate: 0.1,
    amenities: [
      "Free WiFi",
      "Restaurant",
      "Bar",
      "Spa",
      "Concierge",
      "Air conditioning",
      "Breakfast included",
      "Laundry",
      "Pet friendly"
    ],
    highlights: [
      { title: "Hidden courtyard", description: "A walled garden for breakfast and quiet afternoons.", icon: "flower" },
      { title: "Art collection", description: "Modern works set among original 18th-century details.", icon: "sparkles" },
      { title: "Saint-Germain address", description: "Galleries, caf\xE9s and the Seine within a short walk.", icon: "wine" }
    ],
    rooms: [
      {
        id: "paris-salon-suite",
        name: "Salon Suite",
        description: "A corner suite with a marble fireplace, reading salon and courtyard views.",
        pricePerNight: 680,
        size: 58,
        bed: "King bed",
        maxGuests: 2,
        amenities: ["Courtyard view", "Fireplace", "Reading salon", "Breakfast"],
        image: rooms.parisSalon,
        refundable: true,
        breakfast: true,
        remaining: 3
      },
      {
        id: "paris-atelier-suite",
        name: "Atelier Suite",
        description: "A top-floor suite with skylights, a freestanding tub and a private terrace.",
        pricePerNight: 820,
        size: 70,
        bed: "King bed + sofa bed",
        maxGuests: 3,
        amenities: ["Private terrace", "Freestanding tub", "Skyline view", "Breakfast"],
        image: rooms.parisSuite,
        refundable: true,
        breakfast: true,
        remaining: 1
      },
      {
        id: "paris-classic-room",
        name: "Classic Room",
        description: "A serene room with tall windows, oak floors and a marble bathroom.",
        pricePerNight: 540,
        size: 30,
        bed: "Queen bed",
        maxGuests: 2,
        amenities: ["Courtyard view", "Marble bathroom", "Breakfast", "Minibar"],
        image: rooms.parisClassic,
        refundable: false,
        breakfast: true,
        remaining: 5
      }
    ],
    reviews: [
      {
        id: "r13",
        name: "Charlotte Reed",
        country: "United States",
        initials: "CR",
        date: "October 2026",
        rating: 5,
        title: "Our new Paris home",
        body: "The courtyard, the library, the breakfast \u2014 it all feels like a very stylish friend\u2019s house. The team remembered our names from the first morning.",
        stayType: "Couple \xB7 Salon Suite"
      },
      {
        id: "r14",
        name: "Hiroshi Tanaka",
        country: "Japan",
        initials: "HT",
        date: "September 2026",
        rating: 5,
        title: "Quiet, cultured, central",
        body: "An elegant antidote to big-hotel Paris. We walked everywhere and slept beautifully.",
        stayType: "Couple \xB7 Classic Room"
      },
      {
        id: "r15",
        name: "Marina Costa",
        country: "Brazil",
        initials: "MC",
        date: "August 2026",
        rating: 4,
        title: "Beautiful townhouse",
        body: "The Atelier Suite terrace is a treat. Breakfast could start a little earlier, but the pastries were worth waiting for.",
        stayType: "Solo \xB7 Atelier Suite"
      }
    ],
    policies: {
      checkIn: "From 3:00 PM",
      checkOut: "Until 12:00 PM",
      cancellation: "Free cancellation until 48 hours before arrival.",
      children: "Children are welcome. Cots available on request.",
      pets: "Small pets welcome with prior notice.",
      houseRules: ["Alcohol allowed", "Pets allowed", "Non-smoking", "All male guests allowed", "Unmarried guests allowed"]
    },
    tags: ["City break", "Design", "Romantic"],
    featured: false,
    distance: "0.5 km from Mus\xE9e d\u2019Orsay",
    coordinates: { lat: 48.8574, lng: 2.3303 }
  },
  {
    id: "hotel-6",
    slug: "coral-atoll-resort",
    name: "Coral Atoll Resort",
    tagline: "Overwater villas in the Maldives",
    propertyType: "Resort",
    location: { city: "Baa Atoll", country: "Maldives", region: "Baa Atoll" },
    address: "Dharavandhoo, Baa Atoll, Maldives",
    description: "A private-island resort with overwater villas, a house reef teeming with life and a barefoot, no-news philosophy.",
    story: "Coral Atoll Resort occupies a single island ringed by a protected house reef. Guests arrive by seaplane and are asked, gently, to leave their shoes behind. The overwater villas have glass floors and private ladders into the lagoon, while the beach villas sit under the palms. Days are spent between the reef, the spa and the sandbank at the edge of the atoll \u2014 dinner is often served there, under nothing but stars.",
    images: maldives,
    rating: 5,
    reviewCount: 176,
    stars: 5,
    pricePerNight: 920,
    propertyDiscountRate: 0.12,
    amenities: [
      "Free WiFi",
      "Infinity pool",
      "Spa",
      "Restaurant",
      "Bar",
      "Beach access",
      "Fitness center",
      "Airport transfer",
      "Breakfast included",
      "Air conditioning"
    ],
    highlights: [
      { title: "House reef", description: "Direct access to coral gardens and manta rays.", icon: "waves" },
      { title: "Sandbank dining", description: "Private dinners on a sandbank at the atoll\u2019s edge.", icon: "sparkles" },
      { title: "Overwater spa", description: "Glass-floor treatment rooms above the lagoon.", icon: "leaf" }
    ],
    rooms: [
      {
        id: "maldives-overwater-villa",
        name: "Overwater Villa",
        description: "A glass-floored villa on stilts with a private deck, pool and lagoon ladder.",
        pricePerNight: 1180,
        size: 92,
        bed: "King bed",
        maxGuests: 2,
        amenities: ["Private pool", "Glass floor", "Lagoon access", "Butler service", "Sun deck"],
        image: rooms.maldivesVilla,
        refundable: true,
        breakfast: true,
        remaining: 4
      },
      {
        id: "maldives-residence",
        name: "Two-Bedroom Residence",
        description: "A generous overwater residence with two bedrooms, a pool and a dining pavilion.",
        pricePerNight: 1860,
        size: 180,
        bed: "2 king beds",
        maxGuests: 4,
        amenities: ["Private pool", "Two bedrooms", "Dining pavilion", "Butler service"],
        image: rooms.maldivesResidence,
        refundable: true,
        breakfast: true,
        remaining: 2
      },
      {
        id: "maldives-beach-villa",
        name: "Beach Villa",
        description: "A shaded villa facing the lagoon, with an outdoor bath and a hammock between palms.",
        pricePerNight: 920,
        size: 76,
        bed: "King bed",
        maxGuests: 3,
        amenities: ["Beachfront", "Outdoor bath", "Hammock", "Breakfast"],
        image: rooms.maldivesBeach,
        refundable: false,
        breakfast: true,
        remaining: 6
      }
    ],
    reviews: [
      {
        id: "r16",
        name: "Olivia Hargrove",
        country: "United Kingdom",
        initials: "OH",
        date: "October 2026",
        rating: 5,
        title: "Barefoot perfection",
        body: "We saw a manta ray from the deck on our first morning. The villa, the reef, the sandbank dinner \u2014 all extraordinary.",
        stayType: "Couple \xB7 Overwater Villa"
      },
      {
        id: "r17",
        name: "Lucas Moreira",
        country: "Portugal",
        initials: "LM",
        date: "September 2026",
        rating: 5,
        title: "The reef is the star",
        body: "Snorkelling straight off the villa ladder is the whole point. The team keep everything effortless and warm.",
        stayType: "Couple \xB7 Beach Villa"
      },
      {
        id: "r18",
        name: "Ana Kova\u010D",
        country: "Croatia",
        initials: "AK",
        date: "July 2026",
        rating: 5,
        title: "A once-in-a-lifetime family trip",
        body: "The residence gave us space with the children and still felt private. The kids still talk about the glass floor.",
        stayType: "Family \xB7 Two-Bedroom Residence"
      }
    ],
    policies: {
      checkIn: "From 2:00 PM",
      checkOut: "Until 12:00 PM",
      cancellation: "Free cancellation until 21 days before arrival. 100% charge within 21 days.",
      children: "Families are welcome. Kids club available from age 4.",
      pets: "Pets are not permitted at this property.",
      houseRules: ["Alcohol allowed", "Non-smoking", "All male guests allowed", "Unmarried guests allowed"]
    },
    tags: ["Private island", "Diving", "Honeymoon"],
    featured: true,
    distance: "Seaplane transfer 35 min",
    coordinates: { lat: 5.1571, lng: 73.0698 }
  }
];
const destinations = [
  {
    slug: "santorini",
    city: "Santorini",
    country: "Greece",
    tagline: "Caldera sunsets",
    hotels: 42,
    image: santorini[0]
  },
  {
    slug: "kyoto",
    city: "Kyoto",
    country: "Japan",
    tagline: "Temples and tea houses",
    hotels: 36,
    image: kyoto[0]
  },
  {
    slug: "amalfi",
    city: "Amalfi Coast",
    country: "Italy",
    tagline: "Cliffside la dolce vita",
    hotels: 28,
    image: amalfi[0]
  },
  {
    slug: "bali",
    city: "Bali",
    country: "Indonesia",
    tagline: "Jungle and rice terraces",
    hotels: 54,
    image: bali[0]
  },
  {
    slug: "paris",
    city: "Paris",
    country: "France",
    tagline: "The art of living",
    hotels: 61,
    image: paris[0]
  },
  {
    slug: "maldives",
    city: "Maldives",
    country: "Baa Atoll",
    tagline: "Overwater escapism",
    hotels: 19,
    image: maldives[0]
  }
];
const amenityFilters = [
  "Infinity pool",
  "Spa",
  "Beach access",
  "Restaurant",
  "Bar",
  "Fitness center",
  "Free WiFi",
  "Parking",
  "Airport transfer",
  "Pet friendly",
  "Breakfast included",
  "Air conditioning"
];
const propertyTypeFilters = ["Resort", "Boutique", "Villa", "Ryokan", "City Hotel"];
function getHotelBySlug(slug) {
  return hotels.find((hotel) => hotel.slug === slug);
}
function getHotelById(id) {
  return hotels.find((hotel) => hotel.id === id);
}
export {
  amenityFilters,
  destinations,
  getHotelById,
  getHotelBySlug,
  hotels,
  propertyTypeFilters
};
