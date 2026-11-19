// Hotel catalogue — Indian properties, priced in INR (per room, per night).
// Same shape as the original pms-ota data (src/data/hotels.ts), so every screen keeps working.
// Ids stay hotel-1..hotel-6 so saved wishlists / bookings in localStorage still resolve.
// All image URLs were checked to return 200 from images.unsplash.com.
const img = (id, width = 1400) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}&q=80`;

const udaipur = [
  img("1695956353120-54ce5e91632b"), // City Palace on Lake Pichola, golden hour
  img("1784620434437-8b33a3d62638"), // pool at sunset, traditional architecture
  img("1589901164570-f9de6556e1c1"), // City Palace from the lake
  img("1759387758817-1a1861261963"), // ornate palace courtyard
  img("1615836245337-f5b9b2303f10")  // boat by the ghats
];
const goa = [
  img("1724947053227-2335bf21d0ae"), // pool with loungers
  img("1614082242765-7c98ca0f3df3"), // beach huts and palms
  img("1560179406-1c6c60e0dc76"),    // umbrellas and loungers
  img("1512343879784-a960bf40e7f2"), // Arabian Sea
  img("1507525428034-b723cf961d3e")  // shore at golden hour
];
const jaipur = [
  img("1768131502902-77b13bbcd3cc"), // ornate palace facade at night
  img("1599661046289-e31897846e41"), // Amer Fort
  img("1772522255879-d3e23227cd5b"), // painted arches and doorways
  img("1524230507669-5ff97982bb5e"), // Hawa Mahal
  img("1524228529766-4d7fe5dc55ca")  // brass door, arched wall
];
const kumarakom = [
  img("1766483683187-28ccf8662268"), // resort buildings on a calm waterway
  img("1593693411515-c20261bcad6e"), // houseboat on the backwaters
  img("1719391083606-da1dd6454a68"), // pool with a water view
  img("1678780910715-9592ca6d2098"), // house on the shore among palms
  img("1602216056096-3b40cc0c9944")  // country boat among the trees
];
const rishikesh = [
  img("1712510817140-917938f92e5b"), // river town in the hills
  img("1607406374368-809f8ec7f118"), // Shiva statue in the Ganges
  img("1757863816269-435a72e76673"), // suspension bridge, green hills
  img("1603867106100-0d2039fc8757"), // kayaking on the river
  img("1650341259809-9314b0de9268")  // ashram on the riverbank
];
const munnar = [
  img("1491497895121-1334fc14d8c9"), // misty tea gardens, Munnar
  img("1629813538702-64c925934e19"), // tea hills at sunset
  img("1766671965039-8bc8687390ad"), // misty mountains and lake at sunrise
  img("1671804162411-e47765dc5c82"), // window onto the mountains
  img("1764012393710-be2d33971ac0")  // tea plantation hillside
];
const rooms = {
  canopyBed: img("1678786591418-2b107bdda369"),
  ornateRoom: img("1759065662057-0c008c001d8d"),
  chandelierRoom: img("1715405155683-e36aff15fd53"),
  waterViewRoom: img("1709187516056-d4929b67e89f"),
  brightBedroom: img("1648113140562-dfd9afe14abd"),
  modernBedroom: img("1641356922028-22f32c5f9fe4"),
  palaceSuite: img("1669040186487-ad7a6d6d0004"),
  windowsRoom: img("1682688604082-b913b45c2555"),
  roundTableRoom: img("1789121275143-fc27c6704729"),
  poolVilla: img("1613490493576-7fde63acd811"),
  gardenRoom: img("1600210492486-724fe5c67fb0"),
  canopySuite: img("1600596542815-ffad4c1539a9"),
  calmRoom: img("1616594039964-ae9021a400a0"),
  woodRoom: img("1598928506311-c55ded91a20c"),
  minimalRoom: img("1616486338812-3dadae4b4ace"),
  hotelRoom: img("1611892440504-42a792e24d32"),
  classicRoom: img("1582719508461-905c673771fd"),
  suiteRoom: img("1618773928121-c32242e63f39")
};

const hotels = [
  {
    id: "hotel-1",
    slug: "lakeview-haveli-udaipur",
    name: "Lakeview Haveli",
    tagline: "A restored haveli on Lake Pichola",
    propertyType: "Heritage",
    location: { city: "Udaipur", country: "India", region: "Rajasthan" },
    address: "Lal Ghat, Old City, Udaipur, Rajasthan 313001",
    description: "A 19th-century haveli on the ghats of Lake Pichola, with jharokha balconies, painted courtyards and sunset views of the City Palace.",
    story: "Lakeview Haveli was home to a family of royal jewellers for five generations. Restored by local artisans, it keeps its frescoed walls, carved jharokhas and a rooftop that looks straight across Lake Pichola to the City Palace. Mornings start with masala chai on your balcony as boats cross the lake; evenings end on the rooftop with Rajasthani thalis and the palace lit gold across the water. With only eighteen rooms, the pace stays unhurried.",
    images: udaipur,
    rating: 4.9,
    reviewCount: 612,
    stars: 5,
    pricePerNight: 14500,
    propertyDiscountRate: 0.12,
    amenities: ["Free WiFi", "Infinity pool", "Spa", "Restaurant", "Bar", "Airport transfer", "Concierge", "Air conditioning", "Breakfast included"],
    highlights: [
      { title: "City Palace views", description: "Rooftop and balconies facing the palace across Lake Pichola.", icon: "sun" },
      { title: "Ayurvedic spa", description: "Traditional abhyanga and shirodhara in the old zenana wing.", icon: "leaf" },
      { title: "Rooftop dining", description: "Royal Rajasthani thalis served by candlelight.", icon: "utensils" }
    ],
    rooms: [
      {
        id: "haveli-jharokha-suite", name: "Jharokha Suite",
        description: "A frescoed suite with a carved balcony over the lake and a four-poster bed.",
        pricePerNight: 21500, size: 55, bed: "King bed", maxGuests: 2,
        amenities: ["Lake view", "Private balcony", "Bathtub", "Tea & coffee", "Mini bar"],
        image: rooms.canopyBed, refundable: true, breakfast: true, remaining: 3
      },
      {
        id: "haveli-maharani-suite", name: "Maharani Suite",
        description: "Two rooms of mirror-work and silk, with a private terrace and lounge.",
        pricePerNight: 32000, size: 90, bed: "King bed + sofa bed", maxGuests: 4,
        amenities: ["Lake view", "Private terrace", "Butler service", "Lounge", "Bathtub"],
        image: rooms.ornateRoom, refundable: true, breakfast: true, remaining: 2
      },
      {
        id: "haveli-courtyard-room", name: "Courtyard Room",
        description: "A cosy room off the painted courtyard, with hand-block printed linen.",
        pricePerNight: 14500, size: 30, bed: "Queen bed", maxGuests: 2,
        amenities: ["Courtyard view", "Rain shower", "Tea & coffee"],
        image: rooms.chandelierRoom, refundable: false, breakfast: true, remaining: 5
      }
    ],
    reviews: [
      { id: "r1", name: "Ananya Mehta", country: "India", initials: "AM", date: "October 2026", rating: 5,
        title: "Sunsets we'll never forget",
        body: "Watching the City Palace light up from the rooftop was magical. The staff remembered how we take our chai by day two.",
        stayType: "Couple · Jharokha Suite" },
      { id: "r2", name: "Rohan Kapoor", country: "India", initials: "RK", date: "September 2026", rating: 5,
        title: "Heritage done right",
        body: "Beautifully restored without losing its soul. The shirodhara at the spa was the best I've had.",
        stayType: "Couple · Maharani Suite" },
      { id: "r3", name: "Emma Collins", country: "United Kingdom", initials: "EC", date: "August 2026", rating: 5,
        title: "Better than the photos",
        body: "We booked three nights and extended to five. Walking distance to the ghats, yet so peaceful inside.",
        stayType: "Solo · Courtyard Room" }
    ],
    policies: {
      checkIn: "From 2:00 PM", checkOut: "Until 11:00 AM",
      cancellation: "Free cancellation until 7 days before arrival. 50% charge within 7 days.",
      children: "Children of all ages are welcome. Extra beds available on request.",
      pets: "Pets are not permitted at this property.",
      houseRules: ["Alcohol allowed", "Non-smoking", "All male guests allowed", "Unmarried guests allowed"]
    },
    tags: ["Lake view", "Rooftop dining", "Honeymoon"],
    featured: true,
    distance: "0.3 km from City Palace",
    coordinates: { lat: 24.5764, lng: 73.6835 }
  },
  {
    id: "hotel-2",
    slug: "casa-azul-goa",
    name: "Casa Azul Villas",
    tagline: "Private pool villas in North Goa",
    propertyType: "Villa",
    location: { city: "Goa", country: "India", region: "North Goa" },
    address: "Assagao, Bardez, North Goa, Goa 403507",
    description: "Portuguese-style villas with private pools, a short drive from Vagator and Anjuna beaches.",
    story: "Casa Azul is a cluster of six restored Indo-Portuguese homes in leafy Assagao. Each villa keeps its oyster-shell windows, red-oxide floors and a deep verandah, now with a private plunge pool in the garden. Breakfast of poee and chorizo is served on your verandah, the beaches of Vagator and Anjuna are ten minutes away, and the in-house chef will cook a Goan fish curry dinner by the pool on request.",
    images: goa,
    rating: 4.8,
    reviewCount: 384,
    stars: 4,
    pricePerNight: 18000,
    propertyDiscountRate: 0.1,
    amenities: ["Free WiFi", "Infinity pool", "Beach access", "Restaurant", "Parking", "Pet friendly", "Air conditioning", "Breakfast included", "Garden"],
    highlights: [
      { title: "Private plunge pools", description: "Every villa has its own pool in a walled garden.", icon: "waves" },
      { title: "Goan home cooking", description: "Chef-led dinners of xacuti, cafreal and fresh catch.", icon: "utensils" },
      { title: "Beach in 10 minutes", description: "Vagator, Anjuna and Ozran beaches close by.", icon: "sun" }
    ],
    rooms: [
      {
        id: "casa-azul-garden-villa", name: "Garden Pool Villa",
        description: "One bedroom, a verandah and a plunge pool in a private garden.",
        pricePerNight: 18000, size: 85, bed: "King bed", maxGuests: 2,
        amenities: ["Private pool", "Garden", "Kitchenette", "Outdoor shower"],
        image: rooms.poolVilla, refundable: true, breakfast: true, remaining: 3
      },
      {
        id: "casa-azul-family-villa", name: "Family Pool Villa",
        description: "Two bedrooms around a courtyard pool, ideal for families and friends.",
        pricePerNight: 29500, size: 150, bed: "2 King beds", maxGuests: 5,
        amenities: ["Private pool", "Full kitchen", "Living room", "Garden", "BBQ"],
        image: rooms.brightBedroom, refundable: true, breakfast: true, remaining: 2
      },
      {
        id: "casa-azul-studio", name: "Verandah Studio",
        description: "A bright studio opening onto the shared pool and garden.",
        pricePerNight: 11500, size: 40, bed: "Queen bed", maxGuests: 2,
        amenities: ["Shared pool", "Verandah", "Kitchenette"],
        image: rooms.modernBedroom, refundable: false, breakfast: false, remaining: 4
      }
    ],
    reviews: [
      { id: "r1", name: "Priya Nair", country: "India", initials: "PN", date: "November 2026", rating: 5,
        title: "Our new favourite in Goa",
        body: "Having our own pool with the kids was perfect. The fish curry dinner by the pool was the highlight.",
        stayType: "Family · Family Pool Villa" },
      { id: "r2", name: "Karan Shah", country: "India", initials: "KS", date: "October 2026", rating: 5,
        title: "Quiet but close to everything",
        body: "Peaceful Assagao lanes, yet Vagator is ten minutes away. Lovely old-house character.",
        stayType: "Couple · Garden Pool Villa" },
      { id: "r3", name: "Lucas Meyer", country: "Germany", initials: "LM", date: "September 2026", rating: 4,
        title: "Charming villas",
        body: "Beautiful architecture and very helpful hosts. Book a scooter to explore the beaches.",
        stayType: "Friends · Verandah Studio" }
    ],
    policies: {
      checkIn: "From 1:00 PM", checkOut: "Until 12:00 PM",
      cancellation: "Free cancellation until 10 days before arrival. One night charged within 10 days.",
      children: "Children of all ages are welcome. Pool fencing available on request.",
      pets: "Pets are welcome in garden villas (fee applies).",
      houseRules: ["Alcohol allowed", "Smoking allowed in outdoor areas", "All male guests allowed", "Unmarried guests allowed"]
    },
    tags: ["Private pool", "Family", "Beach"],
    featured: true,
    distance: "3 km from Vagator Beach",
    coordinates: { lat: 15.5937, lng: 73.7639 }
  },
  {
    id: "hotel-3",
    slug: "amer-bagh-palace-jaipur",
    name: "Amer Bagh Palace",
    tagline: "A royal palace hotel near Amer Fort",
    propertyType: "Heritage",
    location: { city: "Jaipur", country: "India", region: "Rajasthan" },
    address: "Amer Road, near Jal Mahal, Jaipur, Rajasthan 302002",
    description: "A 1920s royal residence with Mughal gardens, mirror-work suites and views of the Aravalli hills.",
    story: "Built as a summer retreat for a Rajput noble family, Amer Bagh Palace sits in eight acres of Mughal gardens between the Pink City and Amer Fort. Its suites keep their original sheesh-mahal mirror work, hand-painted ceilings and antique furniture. Evenings bring folk musicians to the lawns, dinners under the stars and, on clear nights, the lit ramparts of Amer Fort on the hill.",
    images: jaipur,
    rating: 4.8,
    reviewCount: 521,
    stars: 5,
    pricePerNight: 22000,
    propertyDiscountRate: 0.15,
    amenities: ["Free WiFi", "Infinity pool", "Spa", "Restaurant", "Bar", "Fitness center", "Parking", "Airport transfer", "Concierge", "Air conditioning", "Breakfast included"],
    highlights: [
      { title: "Mughal gardens", description: "Eight acres of fountains, lawns and peacocks.", icon: "flower" },
      { title: "Sheesh mahal suites", description: "Original mirror work and hand-painted ceilings.", icon: "sparkles" },
      { title: "Royal dining", description: "Laal maas and royal Rajput recipes on the lawns.", icon: "utensils" }
    ],
    rooms: [
      {
        id: "amer-bagh-palace-suite", name: "Palace Suite",
        description: "A grand suite with sheesh-mahal mirror work, a lounge and garden views.",
        pricePerNight: 34000, size: 80, bed: "King bed", maxGuests: 3,
        amenities: ["Garden view", "Lounge", "Bathtub", "Butler service", "Mini bar"],
        image: rooms.palaceSuite, refundable: true, breakfast: true, remaining: 2
      },
      {
        id: "amer-bagh-royal-suite", name: "Royal Fort-View Suite",
        description: "Two levels with a private terrace looking out to Amer Fort.",
        pricePerNight: 48000, size: 120, bed: "King bed + sofa bed", maxGuests: 4,
        amenities: ["Fort view", "Private terrace", "Butler service", "Lounge", "Bathtub"],
        image: rooms.windowsRoom, refundable: true, breakfast: true, remaining: 1
      },
      {
        id: "amer-bagh-heritage-room", name: "Heritage Room",
        description: "Antique furniture, block-printed textiles and a view of the gardens.",
        pricePerNight: 22000, size: 42, bed: "King bed", maxGuests: 2,
        amenities: ["Garden view", "Rain shower", "Tea & coffee"],
        image: rooms.roundTableRoom, refundable: false, breakfast: true, remaining: 6
      }
    ],
    reviews: [
      { id: "r1", name: "Vikram Singh", country: "India", initials: "VS", date: "October 2026", rating: 5,
        title: "Felt like royalty",
        body: "The folk music evening on the lawns and the mirror-work suite made our anniversary unforgettable.",
        stayType: "Couple · Palace Suite" },
      { id: "r2", name: "Sarah Thompson", country: "United States", initials: "ST", date: "September 2026", rating: 5,
        title: "Jaipur's best stay",
        body: "Perfect base for Amer Fort and the old city. The concierge planned our whole day without a hitch.",
        stayType: "Family · Royal Fort-View Suite" },
      { id: "r3", name: "Neha Agarwal", country: "India", initials: "NA", date: "August 2026", rating: 4,
        title: "Gorgeous gardens",
        body: "Peacocks at breakfast! Rooms are full of character. The pool is lovely in the afternoon.",
        stayType: "Friends · Heritage Room" }
    ],
    policies: {
      checkIn: "From 2:00 PM", checkOut: "Until 12:00 PM",
      cancellation: "Free cancellation until 5 days before arrival. 50% charge within 5 days.",
      children: "Children of all ages are welcome. Babysitting on request.",
      pets: "Pets are not permitted at this property.",
      houseRules: ["Alcohol allowed", "Non-smoking", "All male guests allowed", "Unmarried guests allowed"]
    },
    tags: ["Palace", "Culture", "Gardens"],
    featured: true,
    distance: "2 km from Amer Fort",
    coordinates: { lat: 26.9539, lng: 75.8463 }
  },
  {
    id: "hotel-4",
    slug: "vembanad-lake-retreat-kumarakom",
    name: "Vembanad Lake Retreat",
    tagline: "Backwater cottages in Kumarakom",
    propertyType: "Resort",
    location: { city: "Kumarakom", country: "India", region: "Kerala" },
    address: "Kumarakom North, Kottayam, Kerala 686563",
    description: "Kerala-style cottages and a lakeside pool on the shores of Vembanad Lake, with sunset houseboat cruises.",
    story: "Spread across a coconut grove on Vembanad Lake, the retreat's cottages are built from reclaimed teak in the traditional nalukettu style. Days drift by in a rhythm set by the backwaters — Ayurvedic treatments in the morning, a lazy lunch of karimeen pollichathu, and a sunset cruise on the resort's own kettuvallam houseboat as kingfishers dart across the water.",
    images: kumarakom,
    rating: 4.7,
    reviewCount: 455,
    stars: 5,
    pricePerNight: 12500,
    propertyDiscountRate: 0.08,
    amenities: ["Free WiFi", "Infinity pool", "Spa", "Restaurant", "Bar", "Parking", "Airport transfer", "Air conditioning", "Breakfast included", "Garden"],
    highlights: [
      { title: "Houseboat cruises", description: "Sunset trips on the resort's own kettuvallam.", icon: "waves" },
      { title: "Ayurveda centre", description: "Doctor-led treatments and wellness programmes.", icon: "leaf" },
      { title: "Kerala kitchen", description: "Karimeen, appam and stew from the lake and garden.", icon: "utensils" }
    ],
    rooms: [
      {
        id: "vembanad-lake-cottage", name: "Lake-View Cottage",
        description: "A teak cottage with a sit-out facing the lake and an open-air shower.",
        pricePerNight: 16500, size: 50, bed: "King bed", maxGuests: 2,
        amenities: ["Lake view", "Sit-out", "Outdoor shower", "Tea & coffee"],
        image: rooms.waterViewRoom, refundable: true, breakfast: true, remaining: 4
      },
      {
        id: "vembanad-pool-villa", name: "Private Pool Villa",
        description: "A spacious villa with its own pool among the coconut palms.",
        pricePerNight: 26000, size: 95, bed: "King bed + day bed", maxGuests: 3,
        amenities: ["Private pool", "Garden", "Bathtub", "Butler service"],
        image: rooms.canopySuite, refundable: true, breakfast: true, remaining: 2
      },
      {
        id: "vembanad-garden-room", name: "Garden Room",
        description: "A calm room opening onto the gardens, a short walk from the lake.",
        pricePerNight: 12500, size: 34, bed: "Queen bed", maxGuests: 2,
        amenities: ["Garden view", "Rain shower", "Tea & coffee"],
        image: rooms.gardenRoom, refundable: false, breakfast: true, remaining: 6
      }
    ],
    reviews: [
      { id: "r1", name: "Meera Iyer", country: "India", initials: "MI", date: "November 2026", rating: 5,
        title: "Pure calm",
        body: "The sunset houseboat cruise and the Ayurvedic massage were exactly what we needed. Food was outstanding.",
        stayType: "Couple · Lake-View Cottage" },
      { id: "r2", name: "Arjun Menon", country: "India", initials: "AM", date: "October 2026", rating: 4,
        title: "Beautiful setting",
        body: "Lovely cottages right on the lake. Mosquito nets were a thoughtful touch in the monsoon.",
        stayType: "Family · Garden Room" },
      { id: "r3", name: "Olivia Brown", country: "Australia", initials: "OB", date: "September 2026", rating: 5,
        title: "Kerala at its best",
        body: "Waking up to kingfishers on the lake was surreal. The pool villa was worth every rupee.",
        stayType: "Couple · Private Pool Villa" }
    ],
    policies: {
      checkIn: "From 2:00 PM", checkOut: "Until 11:00 AM",
      cancellation: "Free cancellation until 7 days before arrival. One night charged within 7 days.",
      children: "Children of all ages are welcome. Life jackets provided for cruises.",
      pets: "Pets are not permitted at this property.",
      houseRules: ["Alcohol allowed", "Non-smoking", "All male guests allowed", "Unmarried guests allowed"]
    },
    tags: ["Backwaters", "Wellness", "Family"],
    featured: false,
    distance: "On Vembanad Lake",
    coordinates: { lat: 9.6176, lng: 76.4301 }
  },
  {
    id: "hotel-5",
    slug: "ganga-riverside-retreat-rishikesh",
    name: "Ganga Riverside Retreat",
    tagline: "A yoga retreat on the Ganges",
    propertyType: "Wellness",
    location: { city: "Rishikesh", country: "India", region: "Uttarakhand" },
    address: "Tapovan, near Lakshman Jhula, Rishikesh, Uttarakhand 249192",
    description: "Riverside rooms, daily yoga and sattvic meals in the foothills of the Himalayas, minutes from Lakshman Jhula.",
    story: "Set on a quiet bend of the Ganges in Tapovan, the retreat was built around a riverside yoga shala where sessions begin at sunrise. Rooms are simple, airy and warm with local wood and stone. Afternoons are for river walks, rafting or reading on the terrace; evenings for the Ganga aarti at the ghats, followed by a sattvic dinner from the organic kitchen garden.",
    images: rishikesh,
    rating: 4.7,
    reviewCount: 298,
    stars: 4,
    pricePerNight: 8500,
    propertyDiscountRate: 0.1,
    amenities: ["Free WiFi", "Spa", "Restaurant", "Fitness center", "Parking", "Airport transfer", "Breakfast included", "Garden"],
    highlights: [
      { title: "Sunrise yoga", description: "Daily classes in the river-view shala.", icon: "sun" },
      { title: "Himalayan views", description: "Terraces looking over the Ganges to the hills.", icon: "mountain" },
      { title: "Sattvic kitchen", description: "Vegetarian meals from the organic garden.", icon: "leaf" }
    ],
    rooms: [
      {
        id: "ganga-river-room", name: "River-View Room",
        description: "Wood and stone room with a balcony over the Ganges.",
        pricePerNight: 11000, size: 32, bed: "King bed", maxGuests: 2,
        amenities: ["River view", "Balcony", "Yoga mat", "Tea & coffee"],
        image: rooms.calmRoom, refundable: true, breakfast: true, remaining: 4
      },
      {
        id: "ganga-himalaya-suite", name: "Himalaya Suite",
        description: "A corner suite with a private terrace and meditation nook.",
        pricePerNight: 16500, size: 55, bed: "King bed + day bed", maxGuests: 3,
        amenities: ["River view", "Private terrace", "Bathtub", "Meditation nook"],
        image: rooms.woodRoom, refundable: true, breakfast: true, remaining: 2
      },
      {
        id: "ganga-garden-room", name: "Garden Room",
        description: "A peaceful room overlooking the kitchen garden.",
        pricePerNight: 8500, size: 26, bed: "Queen bed", maxGuests: 2,
        amenities: ["Garden view", "Rain shower", "Yoga mat"],
        image: rooms.minimalRoom, refundable: false, breakfast: true, remaining: 6
      }
    ],
    reviews: [
      { id: "r1", name: "Aditi Sharma", country: "India", initials: "AS", date: "October 2026", rating: 5,
        title: "Exactly the reset I needed",
        body: "Sunrise yoga by the river, simple food and the evening aarti. I left feeling lighter.",
        stayType: "Solo · River-View Room" },
      { id: "r2", name: "Daniel Okafor", country: "Nigeria", initials: "DO", date: "September 2026", rating: 5,
        title: "Peaceful and genuine",
        body: "Teachers are excellent and the staff are warm. Walking distance to Lakshman Jhula.",
        stayType: "Solo · Garden Room" },
      { id: "r3", name: "Ishaan Verma", country: "India", initials: "IV", date: "August 2026", rating: 4,
        title: "Great base for rafting",
        body: "We rafted in the morning and did yoga in the evening. The Himalaya Suite terrace is wonderful.",
        stayType: "Friends · Himalaya Suite" }
    ],
    policies: {
      checkIn: "From 12:00 PM", checkOut: "Until 10:00 AM",
      cancellation: "Free cancellation until 3 days before arrival. One night charged within 3 days.",
      children: "Children over 8 are welcome.",
      pets: "Pets are not permitted at this property.",
      houseRules: ["Non-smoking", "All male guests allowed", "Unmarried guests allowed"]
    },
    tags: ["Yoga", "River view", "Himalayas"],
    featured: false,
    distance: "0.5 km from Lakshman Jhula",
    coordinates: { lat: 30.1290, lng: 78.3220 }
  },
  {
    id: "hotel-6",
    slug: "misty-peaks-tea-estate-munnar",
    name: "Misty Peaks Tea Estate",
    tagline: "A planter's bungalow in the tea hills",
    propertyType: "Boutique",
    location: { city: "Munnar", country: "India", region: "Kerala" },
    address: "Chithirapuram, Munnar, Idukki, Kerala 685565",
    description: "A colonial-era planter's bungalow on a working tea estate, with fireplaces, hill views and guided plantation walks.",
    story: "Misty Peaks sits at 1,600 metres on a working tea estate, in a planter's bungalow built in 1924. Rooms have fireplaces, teak floors and windows full of rolling green hills. Mornings start with estate tea and a walk through the plantation with the tea-maker; afternoons bring cardamom-scented cake by the fire as the mist rolls in over the valley.",
    images: munnar,
    rating: 4.8,
    reviewCount: 233,
    stars: 4,
    pricePerNight: 9800,
    propertyDiscountRate: 0.05,
    amenities: ["Free WiFi", "Restaurant", "Parking", "Pet friendly", "Breakfast included", "Garden", "Concierge"],
    highlights: [
      { title: "Tea estate walks", description: "Guided plantation walks and tastings with the tea-maker.", icon: "leaf" },
      { title: "Valley views", description: "Every room looks over the misty tea hills.", icon: "mountain" },
      { title: "Fireside evenings", description: "Fireplaces in every room for cool hill nights.", icon: "sparkles" }
    ],
    rooms: [
      {
        id: "misty-peaks-valley-room", name: "Valley-View Room",
        description: "Teak floors, a fireplace and big windows over the tea hills.",
        pricePerNight: 12500, size: 38, bed: "King bed", maxGuests: 2,
        amenities: ["Valley view", "Fireplace", "Tea & coffee", "Heater"],
        image: rooms.suiteRoom, refundable: true, breakfast: true, remaining: 3
      },
      {
        id: "misty-peaks-planters-suite", name: "Planter's Suite",
        description: "The original planter's room, with a sit-out and a clawfoot bathtub.",
        pricePerNight: 17500, size: 60, bed: "King bed + sofa bed", maxGuests: 4,
        amenities: ["Valley view", "Fireplace", "Bathtub", "Private sit-out"],
        image: rooms.classicRoom, refundable: true, breakfast: true, remaining: 1
      },
      {
        id: "misty-peaks-garden-room", name: "Garden Room",
        description: "A cosy room opening onto the bungalow's rose garden.",
        pricePerNight: 9800, size: 28, bed: "Queen bed", maxGuests: 2,
        amenities: ["Garden view", "Heater", "Tea & coffee"],
        image: rooms.hotelRoom, refundable: false, breakfast: true, remaining: 4
      }
    ],
    reviews: [
      { id: "r1", name: "Kavya Reddy", country: "India", initials: "KR", date: "November 2026", rating: 5,
        title: "Like stepping back in time",
        body: "Fireplace, fresh estate tea and that view. The plantation walk with the tea-maker was fascinating.",
        stayType: "Couple · Valley-View Room" },
      { id: "r2", name: "Thomas George", country: "India", initials: "TG", date: "October 2026", rating: 5,
        title: "Peaceful hill escape",
        body: "Far from the Munnar crowds. Our dog loved the garden and the staff made such a fuss of him.",
        stayType: "Family · Planter's Suite" },
      { id: "r3", name: "Hannah Lee", country: "Singapore", initials: "HL", date: "September 2026", rating: 4,
        title: "Charming bungalow",
        body: "Gorgeous setting. The road up is winding, so plan your arrival before dark.",
        stayType: "Solo · Garden Room" }
    ],
    policies: {
      checkIn: "From 1:00 PM", checkOut: "Until 11:00 AM",
      cancellation: "Free cancellation until 5 days before arrival. One night charged within 5 days.",
      children: "Children of all ages are welcome.",
      pets: "Pets are welcome (fee applies).",
      houseRules: ["Alcohol allowed", "Non-smoking", "All male guests allowed", "Unmarried guests allowed"]
    },
    tags: ["Tea estate", "Hills", "Couples"],
    featured: true,
    distance: "12 km from Munnar town",
    coordinates: { lat: 10.0505, lng: 77.0418 }
  }
];

const destinations = [
  { slug: "udaipur", city: "Udaipur", country: "Rajasthan", tagline: "Lakes and palaces", hotels: 48, image: udaipur[0] },
  { slug: "goa", city: "Goa", country: "India", tagline: "Beaches and villas", hotels: 86, image: goa[1] },
  { slug: "jaipur", city: "Jaipur", country: "Rajasthan", tagline: "The Pink City", hotels: 72, image: jaipur[1] },
  { slug: "kerala", city: "Kerala", country: "India", tagline: "Backwaters and tea hills", hotels: 64, image: kumarakom[1] },
  { slug: "rishikesh", city: "Rishikesh", country: "Uttarakhand", tagline: "Yoga by the Ganges", hotels: 31, image: rishikesh[0] },
  { slug: "munnar", city: "Munnar", country: "Kerala", tagline: "Misty tea gardens", hotels: 27, image: munnar[0] }
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
const propertyTypeFilters = ["Heritage", "Resort", "Villa", "Boutique", "Wellness"];

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
