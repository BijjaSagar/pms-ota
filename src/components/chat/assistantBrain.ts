import { addons } from '../../data/addons'
import { hotels } from '../../data/hotels'
import { coupons } from '../../data/offers'
import type { Booking, Hotel, Room, SearchParams } from '../../types'
import { formatDate, nightsBetween } from '../../utils/date'
import { formatCurrency, SERVICE_FEE_RATE, TAX_RATE } from '../../utils/pricing'

export interface AssistantAction {
  label: string
  to: string
}

export interface AssistantReply {
  text: string
  quickReplies?: string[]
  hotels?: Hotel[]
  actions?: AssistantAction[]
}

export interface AssistantContext {
  search?: SearchParams
  selectedHotel?: Hotel | null
  selectedRoom?: Room | null
  confirmation?: Booking | null
}

export const defaultQuickReplies = [
  'Find a stay',
  'How booking works',
  'Cancellation policy',
  'My reservation',
]

const destinationLabels: Record<string, string> = {
  santorini: 'Santorini',
  kyoto: 'Kyoto',
  amalfi: 'Amalfi Coast',
  bali: 'Bali',
  paris: 'Paris',
  maldives: 'Maldives',
}

const destinationAliases: Record<string, string[]> = {
  santorini: ['santorini', 'oia', 'greece', 'aegean', 'caldera'],
  kyoto: ['kyoto', 'japan', 'kansai', 'higashiyama'],
  amalfi: ['amalfi', 'amalfi coast', 'positano', 'italy', 'tyrrhenian'],
  bali: ['bali', 'ubud', 'indonesia', 'jungle'],
  paris: ['paris', 'france', 'saint germain', 'seine'],
  maldives: ['maldives', 'baa atoll', 'baa', 'dharavandhoo', 'overwater'],
}

const hotelAliases: Record<string, string[]> = {
  'the-meridian-santorini': [
    'the meridian santorini',
    'meridian',
    'caldera suite',
    'aegean villa',
  ],
  'kyoto-garden-ryokan': [
    'kyoto garden ryokan',
    'kyoto garden',
    'garden ryokan',
    'machiya suite',
    'classic tatami room',
  ],
  'villa-serrano': ['villa serrano', 'serrano', 'terrace suite', 'garden villa'],
  'ubud-canopy-retreat': [
    'ubud canopy retreat',
    'ubud canopy',
    'canopy retreat',
    'canopy',
    'canopy suite',
    'river villa',
  ],
  'maison-lumiere': ['maison lumiere', 'maison', 'lumiere', 'salon suite', 'atelier suite'],
  'coral-atoll-resort': [
    'coral atoll resort',
    'coral atoll',
    'coral',
    'overwater villa',
    'two bedroom residence',
    'beach villa',
  ],
}

const hotelDetailKeywords = [
  'room',
  'suite',
  'rate',
  'price',
  'cost',
  'how much',
  'night',
  'amenit',
  'facilit',
  'wifi',
  'internet',
  'pool',
  'spa',
  'restaurant',
  'bar',
  'parking',
  'gym',
  'fitness',
  'breakfast',
  'check in',
  'check out',
  'checkin',
  'checkout',
  'cancel',
  'cancellation',
  'refund',
  'pet',
  'dog',
  'child',
  'kid',
  'family',
  'location',
  'address',
  'where is',
  'rating',
  'review',
  'house rule',
  'policy',
  'policies',
]

const pureGreetings = [
  'hi',
  'hello',
  'hey',
  'hi there',
  'hello there',
  'good morning',
  'good afternoon',
  'good evening',
]

function normalise(value: string) {
  return value
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function containsPhrase(haystack: string, phrase: string) {
  if (!phrase) return false
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`(?:^|\\s)${escaped}(?:s|es|ies)?(?:$|\\s)`).test(haystack)
}

function hasAny(haystack: string, phrases: string[]) {
  return phrases.some((phrase) => containsPhrase(haystack, phrase))
}

function formatList(items: string[]) {
  if (items.length <= 1) return items[0] ?? ''
  if (items.length === 2) return `${items[0]} and ${items[1]}`
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`
}

function findHotel(input: string): Hotel | undefined {
  let found: Hotel | undefined
  let bestLength = 0

  for (const hotel of hotels) {
    const aliases = hotelAliases[hotel.slug] ?? []
    for (const alias of aliases) {
      if (containsPhrase(input, alias) && alias.length > bestLength) {
        found = hotel
        bestLength = alias.length
      }
    }
  }

  return found
}

function detectDestination(input: string) {
  let match: string | undefined
  let bestLength = 0

  for (const [key, aliases] of Object.entries(destinationAliases)) {
    for (const alias of aliases) {
      if (containsPhrase(input, alias) && alias.length > bestLength) {
        match = key
        bestLength = alias.length
      }
    }
  }

  return match
}

function matchesDestination(hotel: Hotel, key: string) {
  const haystack = normalise(
    [hotel.location.city, hotel.location.country, hotel.location.region].join(' '),
  )
  return destinationAliases[key].some((alias) => containsPhrase(haystack, alias))
}

function parseBudget(input: string) {
  const prefix = input.match(
    /(?:under|below|less than|max|up to|budget(?: of)?)\s*([\d,]+)/,
  )
  if (prefix) return Number(prefix[1].replace(/,/g, ''))

  const suffix = input.match(
    /([\d,]+)\s*(?:per night|a night|night|inr|rupees|dollars?)/,
  )
  return suffix ? Number(suffix[1].replace(/,/g, '')) : undefined
}

function hasPool(hotel: Hotel) {
  return (
    hotel.amenities.some((amenity) => /pool/i.test(amenity)) ||
    hotel.rooms.some((room) => room.amenities.some((amenity) => /pool/i.test(amenity)))
  )
}

function isPetFriendly(hotel: Hotel) {
  return (
    hotel.amenities.includes('Pet friendly') ||
    /welcome/i.test(hotel.policies.pets)
  )
}

function hotelsLink(destination: string | undefined, context: AssistantContext) {
  const params = new URLSearchParams()
  if (destination) params.set('destination', destination)
  if (context.search) {
    params.set('checkIn', context.search.checkIn)
    params.set('checkOut', context.search.checkOut)
    params.set('guests', String(context.search.guests))
    params.set('rooms', String(context.search.rooms))
    params.set('adults', String(context.search.adults))
    params.set('kids', String(context.search.kids))
  }
  const query = params.toString()
  return query ? `/hotels?${query}` : '/hotels'
}

function addonUnitLabel(unit: string) {
  switch (unit) {
    case 'night':
      return 'per night'
    case 'person':
      return 'per person'
    case 'person-night':
      return 'per guest per night'
    default:
      return 'per stay'
  }
}

export function getWelcomeReply(context: AssistantContext = {}): AssistantReply {
  const contextLine = context.confirmation
    ? ` I can see your confirmed reservation at ${context.confirmation.hotel.name}.`
    : context.selectedHotel
      ? ` I can see you are looking at ${context.selectedHotel.name}.`
      : ''

  return {
    text: `Hi, I am Aurelia's robot concierge.${contextLine} Ask me anything about hotels, rooms, the booking process or your reservation.`,
    quickReplies: context.confirmation
      ? ['My reservation', 'Cancellation policy', 'Book another stay', 'Contact the concierge']
      : context.selectedHotel
        ? ['Show rooms here', 'Cancellation policy', 'Is breakfast included?', 'Find another stay']
        : defaultQuickReplies,
  }
}

interface RecommendationResult {
  hotels: Hotel[]
  destination?: string
  budget?: number
  labels: string[]
  relaxed: boolean
}

function findRecommendations(rawInput: string): RecommendationResult {
  const input = normalise(rawInput)
  const destination = detectDestination(input)
  const budget = parseBudget(input)
  const base = destination
    ? hotels.filter((hotel) => matchesDestination(hotel, destination))
    : [...hotels]

  let pool = base
  let relaxed = false
  const labels: string[] = []

  const apply = (predicate: (hotel: Hotel) => boolean, label: string) => {
    const next = pool.filter(predicate)
    if (next.length > 0) {
      pool = next
      labels.push(label)
    } else {
      relaxed = true
    }
  }

  if (hasAny(input, ['pool', 'swimming'])) {
    apply(hasPool, 'a pool')
  }
  if (hasAny(input, ['spa', 'wellness'])) {
    apply((hotel) => hotel.amenities.includes('Spa'), 'a spa')
  }
  if (hasAny(input, ['beach', 'beachfront', 'sea view'])) {
    apply(
      (hotel) =>
        hotel.amenities.includes('Beach access') ||
        hotel.tags.includes('Sea view') ||
        hotel.tags.includes('Private island'),
      'beach access',
    )
  }
  if (hasAny(input, ['pet', 'pets', 'dog', 'cat'])) {
    apply(isPetFriendly, 'pet-friendly rooms')
  }
  if (hasAny(input, ['family', 'families', 'kid', 'kids', 'children'])) {
    apply(
      (hotel) =>
        hotel.rooms.some((room) => room.maxGuests >= 4) || hotel.tags.includes('Family'),
      'space for families',
    )
  }
  if (hasAny(input, ['wifi', 'internet'])) {
    apply((hotel) => hotel.amenities.includes('Free WiFi'), 'WiFi')
  }
  if (hasAny(input, ['parking', 'car park'])) {
    apply((hotel) => hotel.amenities.includes('Parking'), 'parking')
  }
  if (hasAny(input, ['gym', 'fitness'])) {
    apply((hotel) => hotel.amenities.includes('Fitness center'), 'a fitness centre')
  }
  if (hasAny(input, ['breakfast'])) {
    apply((hotel) => hotel.amenities.includes('Breakfast included'), 'breakfast included')
  }
  if (hasAny(input, ['transfer', 'airport'])) {
    apply((hotel) => hotel.amenities.includes('Airport transfer'), 'airport transfers')
  }
  if (hasAny(input, ['villa'])) {
    apply((hotel) => hotel.propertyType === 'Villa', 'villa stays')
  }
  if (hasAny(input, ['ryokan'])) {
    apply((hotel) => hotel.propertyType === 'Ryokan', 'ryokan stays')
  }
  if (hasAny(input, ['boutique'])) {
    apply((hotel) => hotel.propertyType === 'Boutique', 'boutique stays')
  }
  if (hasAny(input, ['resort'])) {
    apply((hotel) => hotel.propertyType === 'Resort', 'resort stays')
  }
  if (hasAny(input, ['romantic', 'honeymoon', 'couple'])) {
    apply(
      (hotel) => hotel.tags.includes('Honeymoon') || hotel.tags.includes('Romantic'),
      'romantic stays',
    )
  }

  if (budget) {
    apply((hotel) => hotel.pricePerNight <= budget, `rates under ${formatCurrency(budget)}`)
  }

  const isBudget = hasAny(input, ['cheap', 'budget', 'affordable', 'save', 'deal'])
  const isBest = hasAny(input, ['best', 'top rated', 'highest rated', 'recommend'])
  const isLuxury = hasAny(input, ['luxury', 'luxurious', 'five star', '5 star', 'splurge'])

  const sorted = [...pool]
  if (isBudget) {
    sorted.sort((a, b) => a.pricePerNight - b.pricePerNight)
  } else if (isLuxury) {
    sorted.sort((a, b) => b.pricePerNight - a.pricePerNight)
  } else if (isBest) {
    sorted.sort((a, b) => b.rating - a.rating)
  } else {
    sorted.sort(
      (a, b) => Number(b.featured) - Number(a.featured) || b.rating - a.rating,
    )
  }

  return {
    hotels: sorted.slice(0, 3),
    destination,
    budget,
    labels,
    relaxed,
  }
}

function recommendationReply(input: string, context: AssistantContext): AssistantReply {
  const result = findRecommendations(input)

  if (result.hotels.length === 0) {
    return {
      text: "I couldn't find a match for all of those filters. Our collection covers Santorini, Kyoto, the Amalfi Coast, Bali, Paris and the Maldives. Try one destination, or tell me a must-have such as a pool, spa or family rooms.",
      actions: [{ label: 'Browse all stays', to: hotelsLink(undefined, context) }],
      quickReplies: ['Santorini', 'Kyoto', 'Family-friendly stays', 'Stays with a pool'],
    }
  }

  const count = result.hotels.length
  const destinationLabel = result.destination
    ? destinationLabels[result.destination]
    : undefined
  const filtersText =
    result.labels.length > 0 ? ` with ${formatList(result.labels)}` : ''
  const intro = destinationLabel
    ? `Here ${count === 1 ? 'is' : 'are'} ${count} ${destinationLabel} ${
        count === 1 ? 'stay' : 'stays'
      }${filtersText}.`
    : `Here ${count === 1 ? 'is one stay' : `are ${count} stays`} from the collection${filtersText}.`
  const relaxedText = result.relaxed
    ? ' I could not match every filter, so these are the closest options.'
    : ''
  const budgetText =
    result.budget && result.hotels.every((hotel) => hotel.pricePerNight <= result.budget!)
      ? ` I kept the nightly rate at ${formatCurrency(result.budget)} or less.`
      : ''
  const dateText = context.search
    ? `\n\nYour dates: ${formatDate(context.search.checkIn, 'short')} – ${formatDate(
        context.search.checkOut,
        'short',
      )} · ${context.search.guests} ${
        context.search.guests === 1 ? 'guest' : 'guests'
      } · ${context.search.rooms} ${
        context.search.rooms === 1 ? 'room' : 'rooms'
      }.`
    : ''

  return {
    text: `${intro}${relaxedText}${budgetText} Tap a stay to see rooms and rates.${dateText}`,
    hotels: result.hotels,
    actions: [
      {
        label: destinationLabel
          ? `Browse all ${destinationLabel} stays`
          : 'Browse all stays',
        to: hotelsLink(destinationLabel, context),
      },
    ],
    quickReplies: destinationLabel
      ? ['Stays with a pool', 'Family-friendly stays', 'How booking works', 'See all destinations']
      : ['Santorini', 'Kyoto', 'Family-friendly stays', 'How booking works'],
  }
}

function findRoomByName(hotel: Hotel, input: string) {
  return hotel.rooms.find((room) => containsPhrase(input, normalise(room.name)))
}

function hotelReply(
  hotel: Hotel,
  input: string,
  context: AssistantContext,
): AssistantReply {
  const detailLink = `/hotels/${hotel.slug}`
  const prices = hotel.rooms.map((room) => room.pricePerNight)
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  const quickReplies = [
    `Rooms at ${hotel.name}`,
    `Cancellation at ${hotel.name}`,
    `Breakfast at ${hotel.name}`,
    `Amenities at ${hotel.name}`,
  ]
  const viewRooms: AssistantAction = { label: 'View rooms & rates', to: detailLink }

  if (hasAny(input, ['rating', 'review', 'reviews', 'guest score'])) {
    const featuredReview = hotel.reviews[0]
    return {
      text: `${hotel.name} is rated ${hotel.rating.toFixed(1)}/5 from ${
        hotel.reviewCount
      } verified stays.${featuredReview ? `\n\n"${featuredReview.title}" — ${featuredReview.name}, ${featuredReview.date}.` : ''}`,
      actions: [{ label: 'Read guest reviews', to: `${detailLink}#reviews` }],
      quickReplies,
    }
  }

  if (hasAny(input, ['cancel', 'cancellation', 'refund', 'free cancellation'])) {
    return {
      text: `Cancellation at ${hotel.name}: ${hotel.policies.cancellation}\n\n${
        hotel.rooms.some((room) => room.refundable)
          ? 'Refundable rates are marked on each room, so you can choose the flexibility you need.'
          : 'The rooms at this property use non-refundable rates.'
      }`,
      actions: [viewRooms],
      quickReplies: [
        `Check-in at ${hotel.name}`,
        'How does payment work?',
        'Find another stay',
      ],
    }
  }

  if (hasAny(input, ['check in', 'check out', 'checkin', 'checkout', 'arrival'])) {
    const earlyCheckIn = addons.find((addon) => addon.id === 'early-check-in')?.price ?? 30
    const lateCheckOut = addons.find((addon) => addon.id === 'late-check-out')?.price ?? 35
    return {
      text: `Check-in at ${hotel.name} is ${hotel.policies.checkIn.toLowerCase()}; check-out is ${hotel.policies.checkOut.toLowerCase()}.\n\nEarly check-in (from 11:00 AM, ${formatCurrency(
        earlyCheckIn,
      )}) and late check-out (until 2:00 PM, ${formatCurrency(
        lateCheckOut,
      )}) can be added at checkout.`,
      actions: [viewRooms],
      quickReplies: ['What are the cancellation policies?', 'How does payment work?', 'Find another stay'],
    }
  }

  if (hasAny(input, ['pet', 'pets', 'dog', 'cat', 'animal'])) {
    const petHotels = hotels.filter(
      (candidate) => candidate.id !== hotel.id && isPetFriendly(candidate),
    )
    return {
      text: `${hotel.name}: ${hotel.policies.pets}${
        isPetFriendly(hotel) || petHotels.length === 0
          ? ''
          : `\n\nPet-friendly alternatives: ${petHotels
              .map((candidate) => candidate.name)
              .join(', ')}.`
      }`,
      actions: [
        viewRooms,
        ...petHotels.slice(0, 1).map((candidate) => ({
          label: `See ${candidate.name}`,
          to: `/hotels/${candidate.slug}`,
        })),
      ],
      quickReplies,
    }
  }

  if (hasAny(input, ['child', 'children', 'kid', 'kids', 'family', 'families', 'cot', 'baby'])) {
    const familyRooms = hotel.rooms.filter((room) => room.maxGuests >= 4)
    return {
      text: `${hotel.name}: ${hotel.policies.children}${
        familyRooms.length > 0
          ? `\n\nLarger options: ${familyRooms
              .map((room) => `${room.name} (sleeps ${room.maxGuests})`)
              .join(', ')}.`
          : ''
      }`,
      actions: [viewRooms],
      quickReplies,
    }
  }

  if (hasAny(input, ['breakfast', 'meal', 'food', 'eat'])) {
    const breakfastIncluded = hotel.rooms.every((room) => room.breakfast)
    return {
      text: breakfastIncluded
        ? `Breakfast is included in every room rate at ${hotel.name}.`
        : `Breakfast is available at ${hotel.name}; check the room details for what is included.`,
      actions: [viewRooms],
      quickReplies,
    }
  }

  if (hasAny(input, ['house rule', 'rules', 'smoking', 'smoke', 'alcohol', 'unmarried'])) {
    return {
      text: `House rules at ${hotel.name}: ${hotel.policies.houseRules.join(' · ')}.`,
      actions: [{ label: 'See all property information', to: `${detailLink}#important-info` }],
      quickReplies,
    }
  }

  if (hasAny(input, ['where', 'location', 'address', 'map', 'distance', 'near', 'get there'])) {
    return {
      text: `${hotel.name} is at ${hotel.address}. ${hotel.distance}. You can open the map on the hotel page.`,
      actions: [{ label: 'View location', to: `${detailLink}#overview` }],
      quickReplies,
    }
  }

  if (
    hasAny(input, [
      'amenit',
      'facilit',
      'wifi',
      'internet',
      'pool',
      'spa',
      'restaurant',
      'bar',
      'parking',
      'gym',
      'fitness',
      'airport transfer',
      'service',
    ])
  ) {
    const notes: string[] = []
    const poolAmenities = hotel.amenities.filter((amenity) => /pool/i.test(amenity))

    if (hasAny(input, ['wifi', 'internet'])) {
      notes.push(
        hotel.amenities.includes('Free WiFi')
          ? 'Free WiFi is available.'
          : 'Free WiFi is not listed.',
      )
    }
    if (hasAny(input, ['pool'])) {
      notes.push(
        poolAmenities.length > 0
          ? `Pool: ${poolAmenities.join(', ')}.`
          : 'No pool is listed at this property.',
      )
    }
    if (hasAny(input, ['spa'])) {
      notes.push(
        hotel.amenities.includes('Spa') ? 'A spa is available.' : 'No spa is listed.',
      )
    }
    if (hasAny(input, ['parking'])) {
      notes.push(
        hotel.amenities.includes('Parking')
          ? 'Parking is available.'
          : 'On-site parking is not listed.',
      )
    }
    if (hasAny(input, ['gym', 'fitness'])) {
      notes.push(
        hotel.amenities.includes('Fitness center')
          ? 'A fitness centre is available.'
          : 'No fitness centre is listed.',
      )
    }
    if (hasAny(input, ['airport transfer'])) {
      notes.push(
        hotel.amenities.includes('Airport transfer')
          ? 'Airport transfers can be arranged.'
          : 'Airport transfers are not listed.',
      )
    }

    return {
      text: `${hotel.name} facilities: ${hotel.amenities.join(', ')}.${
        notes.length > 0 ? `\n\n${notes.join(' ')}` : ''
      }`,
      actions: [viewRooms],
      quickReplies,
    }
  }

  if (
    hasAny(input, [
      'room',
      'suite',
      'villa',
      'rate',
      'price',
      'cost',
      'how much',
      'night',
      'tax',
    ])
  ) {
    const requestedRoom = findRoomByName(hotel, input)
    const roomLines = hotel.rooms
      .map(
        (room) =>
          `• ${room.name} — ${formatCurrency(room.pricePerNight)}/night · sleeps ${
            room.maxGuests
          }${room.refundable ? ' · free cancellation' : ' · non-refundable'}`,
      )
      .join('\n')
    const priceSummary = requestedRoom
      ? `${requestedRoom.name} at ${hotel.name} is ${formatCurrency(
          requestedRoom.pricePerNight,
        )} per night and sleeps ${requestedRoom.maxGuests}.`
      : `${hotel.name} rooms range from ${formatCurrency(minPrice)} to ${formatCurrency(
          maxPrice,
        )} per night.`
    return {
      text: `${priceSummary}\n${roomLines}\n\nTaxes (${Math.round(
        TAX_RATE * 100,
      )}%) and a ${Math.round(SERVICE_FEE_RATE * 100)}% service fee are added at checkout.`,
      actions: [viewRooms],
      quickReplies,
    }
  }

  if (hasAny(input, ['pay', 'payment', 'card', 'paypal', 'deposit'])) {
    return paymentReply(context)
  }

  if (hasAny(input, ['book', 'reserve', 'reservation', 'availability', 'available'])) {
    const remaining = hotel.rooms
      .map(
        (room) =>
          `${room.name} — ${room.remaining} ${
            room.remaining === 1 ? 'room' : 'rooms'
          } left`,
      )
      .join('\n')
    const selectedRoom = context.selectedRoom
    return {
      text: `You can reserve ${hotel.name} from ${formatCurrency(
        minPrice,
      )} per night.\n${remaining}\n\n${
        selectedRoom && selectedRoom.id && hotel.rooms.some((room) => room.id === selectedRoom.id)
          ? `${selectedRoom.name} is currently selected in your booking. `
          : ''
      }Availability here is indicative for this demo; confirm your dates on the hotel page.`,
      actions: [viewRooms],
      quickReplies: ['Cancellation policy', 'Is breakfast included?', 'How does payment work?', 'Find another stay'],
    }
  }

  return {
    text: `${hotel.name} is a ${hotel.stars}-star ${hotel.propertyType.toLowerCase()} in ${
      hotel.location.city
    }, ${hotel.location.country} — ${hotel.tagline.toLowerCase()}. Rated ${hotel.rating.toFixed(
      1,
    )} from ${hotel.reviewCount} stays, with rooms from ${formatCurrency(
      minPrice,
    )} per night. ${hotel.distance}.`,
    actions: [
      viewRooms,
      { label: 'See photos', to: `/hotels/${hotel.slug}/photos` },
    ],
    quickReplies,
  }
}

function confirmationReply(confirmation?: Booking | null): AssistantReply {
  if (!confirmation) {
    return {
      text: "I cannot see a confirmed reservation in this session. If you have just booked, open the confirmation email or the confirmation page from that booking. Otherwise I can help you start a new search.",
      actions: [{ label: 'Browse stays', to: '/hotels' }],
      quickReplies: ['How booking works', 'Cancellation policy', 'Contact the concierge', 'Find a stay'],
    }
  }

  const nights = nightsBetween(confirmation.search.checkIn, confirmation.search.checkOut)
  const stay = `${formatDate(confirmation.search.checkIn, 'short')} – ${formatDate(
    confirmation.search.checkOut,
    'short',
  )}`
  const extras =
    confirmation.addons.length > 0
      ? ` Add-ons: ${confirmation.addons.map((addon) => addon.name).join(', ')}.`
      : ''
  const payment =
    confirmation.paymentMode === 'later'
      ? 'payable at the property'
      : `paid in this demo${confirmation.paymentLast4 ? ` (${confirmation.paymentLast4})` : ''}`

  return {
    text: `Yes — booking ${confirmation.reference} is confirmed at ${
      confirmation.hotel.name
    } (${confirmation.room.name}) for ${stay}, ${nights} ${
      nights === 1 ? 'night' : 'nights'
    }.\n\nTotal ${formatCurrency(confirmation.price.total)}, ${payment}.${extras}\nCheck-in ${confirmation.hotel.policies.checkIn.toLowerCase()}; the confirmation was sent to ${confirmation.email}.`,
    actions: [
      {
        label: 'View confirmation',
        to: `/confirmation/${confirmation.reference}`,
      },
      {
        label: 'Cancellation policy',
        to: `/hotels/${confirmation.hotel.slug}#important-info`,
      },
    ],
    quickReplies: [
      'How do I change my dates?',
      'Cancellation policy',
      'Book another stay',
      'Contact the concierge',
    ],
  }
}

function bookingProcessReply(): AssistantReply {
  return {
    text: 'Booking takes four steps:\n1. Search your destination and dates.\n2. Choose a room and rate.\n3. Add guest details, extras and an optional coupon.\n4. Pay now or choose pay at the property, then receive a confirmation reference.\n\nYou can start from any hotel page with "Reserve now".',
    actions: [
      { label: 'Browse stays', to: '/hotels' },
      { label: 'Booking help', to: '/#faq' },
    ],
    quickReplies: ['Payment options', 'Cancellation policy', 'Find a stay', 'Contact the concierge'],
  }
}

function paymentReply(context: AssistantContext): AssistantReply {
  const destination = context.selectedHotel ? '/checkout' : '/hotels'
  return {
    text: `You can pay now by card or PayPal, or choose "Pay later" and settle the balance at the property. This demo does not charge a real card.\n\nTaxes (${Math.round(
      TAX_RATE * 100,
    )}%) and a ${Math.round(SERVICE_FEE_RATE * 100)}% service fee are shown in the price breakdown before you confirm.`,
    actions: [
      { label: context.selectedHotel ? 'Continue to checkout' : 'Find a stay', to: destination },
      { label: 'Booking help', to: '/#faq' },
    ],
    quickReplies: ['Taxes and fees', 'Cancellation policy', 'My reservation', 'Contact the concierge'],
  }
}

function pricingReply(): AssistantReply {
  return {
    text: `Rates are per room, per night. At checkout we add ${Math.round(
      TAX_RATE * 100,
    )}% tax and a ${Math.round(
      SERVICE_FEE_RATE * 100,
    )}% service fee, plus any add-ons. Property discounts and coupons are applied before tax, and the full breakdown is always shown before you pay.`,
    actions: [
      { label: 'View offers', to: '/#offers' },
      { label: 'Find a stay', to: '/hotels' },
    ],
    quickReplies: ['What are the add-ons?', 'Payment options', 'Find a stay'],
  }
}

function offersReply(): AssistantReply {
  const lines = coupons
    .map((coupon) => `• ${coupon.code} — ${coupon.label}`)
    .join('\n')
  return {
    text: `These demo offers can be applied at checkout:\n${lines}\n\nEnter the code in the price summary before confirming. Some codes require a minimum spend or have a maximum discount.`,
    actions: [
      { label: 'Browse offers', to: '/#offers' },
      { label: 'Find a stay', to: '/hotels' },
    ],
    quickReplies: ['How booking works', 'Taxes and fees', 'Payment options'],
  }
}

function addonsReply(): AssistantReply {
  const lines = addons
    .filter((addon) => addon.inAddonList !== false)
    .map(
      (addon) =>
        `• ${addon.name} — ${formatCurrency(addon.price)} ${addonUnitLabel(addon.unit)}`,
    )
    .join('\n')

  return {
    text: `Optional extras can be added at checkout:\n${lines}\n\nEarly check-in and late check-out are also available as stay extras.`,
    actions: [
      { label: 'Continue booking', to: '/checkout' },
      { label: 'Find a stay', to: '/hotels' },
    ],
    quickReplies: ['How does payment work?', 'Cancellation policy', 'Find a stay'],
  }
}

function cancellationReply(context: AssistantContext): AssistantReply {
  return {
    text: `Cancellation terms vary by property and rate. Free cancellation windows range from 48 hours (Maison Lumière) to 21 days (Coral Atoll).\n\nEach room shows whether it is refundable, and the exact deadline is applied at checkout. To change dates or cancel, contact the concierge with your reference${
      context.confirmation ? ` (${context.confirmation.reference})` : ''
    }.`,
    actions: [
      { label: 'Read the FAQ', to: '/#faq' },
      { label: 'Contact the concierge', to: '/#concierge' },
    ],
    quickReplies: ['My reservation', 'How booking works', 'Find a stay'],
  }
}

function checkInReply(): AssistantReply {
  return {
    text: 'Check-in times range from 2:00 PM to 4:00 PM, and check-out from 10:00 AM to 12:00 PM. Your exact times are shown on the hotel page and confirmation.\n\nEarly check-in (from 11:00 AM) and late check-out (until 2:00 PM) can be added at checkout.',
    actions: [{ label: 'Find a stay', to: '/hotels' }],
    quickReplies: ['Cancellation policy', 'Is breakfast included?', 'Find a stay'],
  }
}

function petsReply(): AssistantReply {
  const petHotels = hotels.filter(isPetFriendly)
  return {
    text: `Pets are welcome at ${formatList(
      petHotels.map((hotel) => hotel.name),
    )}; small pets are accepted on request. The other properties do not permit pets.`,
    actions: petHotels.slice(0, 2).map((hotel) => ({
      label: hotel.name,
      to: `/hotels/${hotel.slug}`,
    })),
    quickReplies: ['Family-friendly stays', 'Cancellation policy', 'Find a stay'],
  }
}

function familyReply(): AssistantReply {
  const familyHotels = hotels.filter(
    (hotel) =>
      hotel.rooms.some((room) => room.maxGuests >= 4) || hotel.tags.includes('Family'),
  )
  return {
    text: `Children are welcome, though minimum ages and room capacities vary by property. Good options with space for four or more guests include ${formatList(
      familyHotels.slice(0, 4).map((hotel) => hotel.name),
    )}.\n\nFamily suites, cots and extra beds are available where the property allows.`,
    actions: familyHotels.slice(0, 2).map((hotel) => ({
      label: hotel.name,
      to: `/hotels/${hotel.slug}`,
    })),
    quickReplies: ['Family-friendly stays', 'Cancellation policy', 'Find a stay'],
  }
}

function breakfastReply(): AssistantReply {
  return {
    text: 'Breakfast is included in the room rates across the collection. Specific service times and styles vary by property; the hotel page lists the details.',
    actions: [{ label: 'Find a stay', to: '/hotels' }],
    quickReplies: ['Stays with breakfast', 'Cancellation policy', 'Find a stay'],
  }
}

function amenitiesReply(context: AssistantContext): AssistantReply {
  return {
    text: 'Every stay lists its full facilities on the hotel page — pools, spas, restaurants, WiFi, airport transfers and more. Tell me a must-have and I can narrow the collection.',
    actions: [{ label: 'Browse stays', to: hotelsLink(undefined, context) }],
    quickReplies: [
      'Stays with a pool',
      'Stays with a spa',
      'Pet-friendly stays',
      'Find a stay',
    ],
  }
}

function destinationsReply(context: AssistantContext): AssistantReply {
  return {
    text: 'The collection currently spans six destinations: Santorini in Greece, Kyoto in Japan, the Amalfi Coast in Italy, Bali in Indonesia, Paris in France and the Maldives.\n\nTell me what kind of trip you have in mind and I can narrow it down.',
    actions: [{ label: 'Browse all stays', to: hotelsLink(undefined, context) }],
    quickReplies: ['Santorini', 'Kyoto', 'Amalfi Coast', 'Maldives'],
  }
}

function bestTimeReply(): AssistantReply {
  return {
    text: 'A rough guide: Santorini and the Amalfi Coast are loveliest from May to October, Kyoto in spring or autumn, Bali in the drier April to October months, Paris in spring and early autumn, and the Maldives from November to April.\n\nShoulder seasons usually mean quieter stays and better rates.',
    actions: [{ label: 'Find a stay', to: '/hotels' }],
    quickReplies: ['Santorini', 'Kyoto', 'Maldives', 'Find a stay'],
  }
}

function contactReply(): AssistantReply {
  return {
    text: 'The concierge is available daily, 7:00 AM – 11:00 PM ET.\n\nPhone: +1 (800) 555-0182\nEmail: concierge@aurelia.travel\n\nFor booking changes, include your AUR reference.',
    actions: [
      { label: 'Contact concierge', to: '/#concierge' },
      { label: 'Read the FAQ', to: '/#faq' },
    ],
    quickReplies: ['My reservation', 'Cancellation policy', 'Find a stay'],
  }
}

function accessibilityReply(): AssistantReply {
  return {
    text: 'Accessibility features vary by property and are not fully listed in this demo. The concierge can confirm step-free access, adapted rooms and any other requirements before you book.',
    actions: [{ label: 'Contact the concierge', to: '/#concierge' }],
    quickReplies: ['Contact the concierge', 'Find a stay', 'How booking works'],
  }
}

function invoiceReply(): AssistantReply {
  return {
    text: 'You can add a GSTIN and business name in the guest details at checkout, and the confirmation page shows the final price breakdown. For a business invoice or receipt, contact the concierge with your booking reference.',
    actions: [
      { label: 'Contact the concierge', to: '/#concierge' },
      { label: 'Booking help', to: '/#faq' },
    ],
    quickReplies: ['Payment options', 'Taxes and fees', 'Contact the concierge'],
  }
}

function fallbackReply(): AssistantReply {
  return {
    text: 'I can help with hotels and destinations, rooms and rates, the booking process, payments, cancellations and reservations. Try "Find a stay in Kyoto", "What are the cancellation policies?" or "My reservation".',
    actions: [
      { label: 'Browse stays', to: '/hotels' },
      { label: 'Booking help', to: '/#faq' },
    ],
    quickReplies: defaultQuickReplies,
  }
}

export function getAssistantReply(
  rawInput: string,
  context: AssistantContext = {},
): AssistantReply {
  const input = normalise(rawInput)

  if (!input) {
    return {
      text: 'Ask me anything about our hotels, the booking process or your reservation.',
      quickReplies: defaultQuickReplies,
    }
  }

  if (pureGreetings.includes(input)) {
    return getWelcomeReply(context)
  }

  if (
    hasAny(input, ['thanks', 'thank you', 'thankyou', 'cheers', 'appreciate it']) &&
    input.split(' ').length <= 5
  ) {
    return {
      text: 'Happy to help. Ask me anything else about your stay — I am here for it.',
      quickReplies: defaultQuickReplies,
    }
  }

  const explicitHotel = findHotel(input)
  const destination = detectDestination(input)
  const confirmation = context.confirmation

  if (
    hasAny(input, [
      'my booking',
      'my reservation',
      'my trip',
      'booking status',
      'reservation status',
      'confirmation number',
      'booking reference',
      'my confirmation',
      'have a booking',
      'have a reservation',
    ]) &&
    !hasAny(input, ['cancel', 'cancellation', 'change', 'modify', 'refund'])
  ) {
    return confirmationReply(confirmation)
  }

  if (explicitHotel) {
    return hotelReply(explicitHotel, input, context)
  }

  if (
    hasAny(input, [
      'how do i book',
      'how to book',
      'how can i book',
      'booking process',
      'reservation process',
      'steps to book',
      'how does booking work',
      'how booking works',
    ])
  ) {
    return bookingProcessReply()
  }

  const recommendationIntent = hasAny(input, [
    'hotel',
    'hotels',
    'stay',
    'stays',
    'recommend',
    'find',
    'browse',
    'villa',
    'resort',
    'ryokan',
    'boutique',
    'options',
    'where to stay',
    'places to stay',
    'family friendly',
    'pet friendly',
  ])
  const policyQuestion = hasAny(input, [
    'check in',
    'check out',
    'cancel',
    'cancellation',
    'refund',
    'payment',
    'pay',
    'tax',
    'wifi',
    'parking',
    'breakfast',
    'amenit',
    'house rule',
    'address',
    'location',
    'pet',
    'child',
    'family',
  ])

  const refersToCurrent = hasAny(input, [
    'this hotel',
    'this stay',
    'this room',
    'current hotel',
    'my room',
    'here',
  ])

  if (context.selectedHotel && refersToCurrent) {
    return hotelReply(context.selectedHotel, input, context)
  }

  if (hasAny(input, ['best time', 'when should i', 'weather', 'season'])) {
    return bestTimeReply()
  }

  const directRecommendationIntent = hasAny(input, [
    'find',
    'browse',
    'recommend',
    'options',
    'where to stay',
    'places to stay',
    'hotels',
    'stays',
    'resorts',
    'villas',
    'ryokans',
    'boutiques',
    'stays with',
    'hotels with',
    'hotel with',
    'stays that',
    'family friendly',
    'pet friendly',
  ])

  if (destination && (!policyQuestion || directRecommendationIntent)) {
    return recommendationReply(rawInput, context)
  }

  if (destination) {
    const destinationHotels = hotels.filter((hotel) => matchesDestination(hotel, destination))
    if (destinationHotels.length === 1 && hasAny(input, hotelDetailKeywords)) {
      return hotelReply(destinationHotels[0], input, context)
    }
  }

  if (
    recommendationIntent &&
    hasAny(input, ['pet friendly', 'family friendly', 'stays with', 'hotels with', 'stays that'])
  ) {
    return recommendationReply(rawInput, context)
  }

  if (context.selectedHotel && hasAny(input, hotelDetailKeywords)) {
    return hotelReply(context.selectedHotel, input, context)
  }

  if (hasAny(input, ['pay', 'payment', 'card', 'paypal', 'charged', 'charge', 'secure payment'])) {
    return paymentReply(context)
  }
  if (
    hasAny(input, [
      'tax',
      'taxes',
      'service fee',
      'fee',
      'fees',
      'breakdown',
      'extra charges',
      'total cost',
    ])
  ) {
    return pricingReply()
  }
  if (hasAny(input, ['coupon', 'promo', 'discount', 'offer', 'offers', 'code', 'deal', 'deals'])) {
    return offersReply()
  }
  if (hasAny(input, ['breakfast'])) {
    return breakfastReply()
  }
  if (
    hasAny(input, [
      'add on',
      'addon',
      'add-ons',
      'extras',
      'extra bed',
      'airport transfer',
      'laundry',
      'spa credit',
      'early check',
      'late check',
    ])
  ) {
    return addonsReply()
  }
  if (
    hasAny(input, [
      'cancel',
      'cancellation',
      'refund',
      'change my',
      'modify',
      'reschedul',
      'reschedule',
    ])
  ) {
    return cancellationReply(context)
  }
  if (hasAny(input, ['check in', 'check out', 'checkin', 'checkout', 'arrival'])) {
    return checkInReply()
  }
  if (hasAny(input, ['pet', 'pets', 'dog', 'cat'])) {
    return petsReply()
  }
  if (hasAny(input, ['child', 'children', 'kid', 'kids', 'family', 'families'])) {
    return familyReply()
  }
  if (
    hasAny(input, [
      'destination',
      'destinations',
      'where can i go',
      'countries',
      'locations',
      'where do you',
    ])
  ) {
    return destinationsReply(context)
  }
  if (
    hasAny(input, [
      'contact',
      'concierge',
      'phone',
      'email',
      'call',
      'support',
      'help',
      'human',
      'agent',
    ])
  ) {
    return contactReply()
  }
  if (hasAny(input, ['accessib', 'wheelchair', 'disab'])) {
    return accessibilityReply()
  }
  if (hasAny(input, ['invoice', 'receipt', 'gst', 'business'])) {
    return invoiceReply()
  }
  if (hasAny(input, ['amenit', 'facilit'])) {
    return amenitiesReply(context)
  }
  if (
    hasAny(input, [
      'hotel',
      'hotels',
      'stay',
      'stays',
      'room',
      'rooms',
      'recommend',
      'find',
      'browse',
      'book',
      'reservation',
      'villa',
      'resort',
      'ryokan',
      'boutique',
      'pool',
      'spa',
      'beach',
      'cheap',
      'budget',
      'luxury',
    ])
  ) {
    return recommendationReply(rawInput, context)
  }

  return fallbackReply()
}
