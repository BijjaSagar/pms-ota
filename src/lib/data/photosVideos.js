const img = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1200&q=80`;

const DEMO_IMAGE_URLS = [
  img('1695956353120-54ce5e91632b'),
  img('1784620434437-8b33a3d62638'),
  img('1589901164570-f9de6556e1c1'),
  img('1759387758817-1a1861261963'),
  img('1615836245337-f5b9b2303f10'),
  img('1724947053227-2335bf21d0ae'),
  img('1614082242765-7c98ca0f3df3'),
  img('1560179406-1c6c60e0dc76'),
  img('1512343879784-a960bf40e7f2'),
  img('1507525428034-b723cf961d3e'),
  img('1768131502902-77b13bbcd3cc'),
  img('1599661046289-e31897846e41'),
  img('1772522255879-d3e23227cd5b'),
  img('1524230507669-5ff97982bb5e'),
  img('1524228529766-4d7fe5dc55ca'),
  img('1766483683187-28ccf8662268'),
  img('1593693411515-c20261bcad6e'),
  img('1719391083606-da1dd6454a68'),
  img('1678780910715-9592ca6d2098'),
  img('1602216056096-3b40cc0c9944'),
  img('1712510817140-917938f92e5b'),
  img('1607406374368-809f8ec7f118'),
  img('1757863816269-435a72e76673'),
  img('1603867106100-0d2039fc8757'),
  img('1650341259809-9314b0de9268'),
  img('1491497895121-1334fc14d8c9'),
  img('1629813538702-64c925934e19'),
  img('1766671965039-8bc8687390ad'),
  img('1671804162411-e47765dc5c82'),
  img('1764012393710-be2d33971ac0'),
  img('1678786591418-2b107bdda369'),
  img('1759065662057-0c008c001d8d'),
  img('1715405155683-e36aff15fd53'),
  img('1709187516056-d4929b67e89f'),
  img('1648113140562-dfd9afe14abd'),
  img('1641356922028-22f32c5f9fe4'),
  img('1669040186487-ad7a6d6d0004'),
  img('1682688604082-b913b45c2555'),
  img('1789121275143-fc27c6704729'),
  img('1613490493576-7fde63acd811'),
  img('1600210492486-724fe5c67fb0'),
  img('1600596542815-ffad4c1539a9'),
  img('1616594039964-ae9021a400a0'),
  img('1598928506311-c55ded91a20c'),
  img('1616486338812-3dadae4b4ace'),
  img('1611892440504-42a792e24d32'),
  img('1582719508461-905c673771fd'),
  img('1618773928121-c32242e63f39'),
];

export const PHOTO_TAGS = [
  { id: 'bathroom-washroom', label: 'Bathroom/Washroom' },
  { id: 'dining-area', label: 'Dining Area' },
  { id: 'entrance', label: 'Entrance' },
  { id: 'facade', label: 'Facade' },
  { id: 'jacuzzi', label: 'Jacuzzi' },
  { id: 'lobby-common-area', label: 'Lobby/Common Area' },
  { id: 'reception', label: 'Reception' },
  { id: 'room', label: 'Room' },
  { id: 'terrace', label: 'Terrace' },
  { id: 'view', label: 'View (from Property/Room)' },
];

export const PHOTO_TAG_OPTIONS = PHOTO_TAGS.map(({ id, label }) => ({ value: id, label }));

export const MEDIA_GROUPS = [
  { id: 'cult-kitchen', label: "Cult's Kitchen", kind: 'restaurant' },
  { id: 'family-studio-mini-kitchenette', label: 'Family Studio with Mini Kitchenette', kind: 'room' },
  { id: 'superior-studio', label: 'Superior Studio', kind: 'room' },
  { id: 'family-studio', label: 'Family Studio', kind: 'room' },
];

export const PHOTO_TAG_COUNTS = {
  'bathroom-washroom': 2,
  'dining-area': 5,
  entrance: 2,
  facade: 1,
  jacuzzi: 1,
  'lobby-common-area': 8,
  reception: 4,
  room: 27,
  terrace: 1,
  view: 1,
};

export const MEDIA_GROUP_COUNTS = {
  'cult-kitchen': 12,
  'family-studio-mini-kitchenette': 8,
  'superior-studio': 12,
  'family-studio': 20,
};

const TAG_TITLES = {
  'bathroom-washroom': ['Guest bathroom', 'Washroom vanity'],
  'dining-area': ['Dining area', 'Breakfast setup', 'Restaurant corner', 'Table for two'],
  entrance: ['Main entrance', 'Property gateway'],
  facade: ['Property facade'],
  jacuzzi: ['Jacuzzi deck'],
  'lobby-common-area': ['Lounge seating', 'Common area', 'Reading corner', 'Corridor details'],
  reception: ['Reception desk', 'Welcome lobby', 'Front counter', 'Guest check-in'],
  room: ['Bedroom view', 'Studio interior', 'Living space', 'Work desk', 'Window nook', 'Room detail'],
  terrace: ['Terrace seating'],
  view: ['Property view'],
};

const GROUP_SEQUENCE = MEDIA_GROUPS.flatMap((group) => Array(MEDIA_GROUP_COUNTS[group.id]).fill(group.id));

const buildSeedMedia = () => {
  const items = [];
  PHOTO_TAGS.forEach(({ id: tagId }) => {
    const titles = TAG_TITLES[tagId] ?? ['Property photo'];
    for (let index = 0; index < (PHOTO_TAG_COUNTS[tagId] ?? 0); index += 1) {
      const sequence = items.length;
      const baseTitle = titles[index % titles.length];
      const round = Math.floor(index / titles.length);
      items.push({
        id: `seed-${String(sequence + 1).padStart(2, '0')}`,
        name: round ? `${baseTitle} ${round + 1}` : baseTitle,
        url: DEMO_IMAGE_URLS[sequence % DEMO_IMAGE_URLS.length],
        type: 'image',
        tag: tagId,
        groupId: GROUP_SEQUENCE[sequence],
        seeded: true,
      });
    }
  });
  return items;
};

export const SEED_MEDIA = buildSeedMedia();

const SMART_TAG_RANK = {
  reception: 0,
  'lobby-common-area': 1,
  entrance: 2,
  facade: 3,
  'dining-area': 4,
  view: 5,
  terrace: 6,
  room: 7,
  'bathroom-washroom': 8,
  jacuzzi: 9,
};

const SMART_GROUP_RANK = Object.fromEntries(MEDIA_GROUPS.map((group, index) => [group.id, index]));

export function createInitialPhotosVideosState() {
  return {
    coverId: SEED_MEDIA.find((item) => item.tag === 'reception')?.id ?? SEED_MEDIA[0]?.id ?? null,
    smartReorder: false,
    order: SEED_MEDIA.map((item) => item.id),
    items: SEED_MEDIA.map((item) => ({ ...item })),
    assignments: Object.fromEntries(MEDIA_GROUPS.map((group) => [
      group.id,
      SEED_MEDIA.filter((item) => item.groupId === group.id).map((item) => item.id),
    ])),
  };
}

export function normalizePhotosVideosState(saved) {
  const initial = createInitialPhotosVideosState();
  if (!saved || !Array.isArray(saved.items) || !Array.isArray(saved.order)) return initial;

  const items = saved.items.filter((item) => item && typeof item.id === 'string');
  if (!items.length) return initial;
  const itemIds = new Set(items.map((item) => item.id));
  const seenOrder = new Set();
  const order = saved.order.filter((id) => {
    if (!itemIds.has(id) || seenOrder.has(id)) return false;
    seenOrder.add(id);
    return true;
  });
  items.forEach((item) => {
    if (!seenOrder.has(item.id)) order.push(item.id);
  });

  const assignments = {};
  const assigned = new Set();
  MEDIA_GROUPS.forEach((group) => {
    const ids = Array.isArray(saved.assignments?.[group.id]) ? saved.assignments[group.id] : [];
    assignments[group.id] = ids.filter((id) => {
      if (!itemIds.has(id) || assigned.has(id)) return false;
      assigned.add(id);
      return true;
    });
  });
  const fallbackGroupId = MEDIA_GROUPS[0]?.id;
  items.forEach((item) => {
    if (!assigned.has(item.id) && fallbackGroupId) assignments[fallbackGroupId].push(item.id);
  });

  return {
    coverId: itemIds.has(saved.coverId) ? saved.coverId : initial.coverId,
    smartReorder: Boolean(saved.smartReorder),
    order,
    items,
    assignments,
  };
}

export function smartReorderMedia(state) {
  const positions = Object.fromEntries(state.order.map((id, index) => [id, index]));
  const itemsById = Object.fromEntries(state.items.map((item) => [item.id, item]));
  const groupIdById = {};
  MEDIA_GROUPS.forEach((group) => {
    (state.assignments[group.id] ?? []).forEach((id) => { groupIdById[id] = group.id; });
  });

  return [...state.order].sort((leftId, rightId) => {
    if (leftId === state.coverId) return -1;
    if (rightId === state.coverId) return 1;
    const left = itemsById[leftId];
    const right = itemsById[rightId];
    if (!left || !right) return 0;
    const leftVideo = left.type === 'video' ? 1 : 0;
    const rightVideo = right.type === 'video' ? 1 : 0;
    if (leftVideo !== rightVideo) return leftVideo - rightVideo;
    const tagDifference = (SMART_TAG_RANK[left.tag] ?? 99) - (SMART_TAG_RANK[right.tag] ?? 99);
    if (tagDifference) return tagDifference;
    const groupDifference = (SMART_GROUP_RANK[groupIdById[leftId]] ?? 99) - (SMART_GROUP_RANK[groupIdById[rightId]] ?? 99);
    if (groupDifference) return groupDifference;
    return (positions[leftId] ?? 0) - (positions[rightId] ?? 0);
  });
}

export function countMediaByTag(items) {
  return PHOTO_TAGS.reduce((counts, { id }) => {
    counts[id] = items.filter((item) => item.tag === id).length;
    return counts;
  }, {});
}

export function countMediaByGroup(assignments) {
  return MEDIA_GROUPS.reduce((counts, group) => {
    counts[group.id] = (assignments[group.id] ?? []).length;
    return counts;
  }, {});
}

export function assignmentForMedia(assignments, mediaId) {
  return MEDIA_GROUPS.find((group) => (assignments[group.id] ?? []).includes(mediaId))?.id ?? '';
}

export function makeMediaId(prefix = 'local') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
