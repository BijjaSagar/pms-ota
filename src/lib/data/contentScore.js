export const CONTENT_SCORE_SECTIONS = [
  {
    id: 'photos',
    label: 'Photos',
    current: 45,
    maximum: 45,
    sectionId: 'photos-videos',
    summary: 'Cover image, room photos and common-area gallery are complete.',
    detail: 'Your gallery has a landscape cover image, tagged room photos and common-area images. Add more only when you have better, high-resolution shots.',
    pendingTasks: [],
    nextAction: 'Keep the gallery fresh with high-quality images.',
  },
  {
    id: 'amenities',
    label: 'Amenities',
    current: 29.8,
    maximum: 30,
    sectionId: 'amenities-restaurants',
    summary: 'One amenity task is still pending.',
    detail: 'Hotel-level amenities are complete. The remaining 0.2 points are released when the missing restaurant-level amenity information is added.',
    pendingTasks: ['Add the missing amenity details for Cult’s Kitchen.'],
    nextAction: 'Complete the pending restaurant amenity details.',
  },
  {
    id: 'property-details',
    label: 'Property Details',
    current: 15,
    maximum: 15,
    sectionId: 'basic-information',
    summary: 'All mandatory property details are complete.',
    detail: 'Name, contact information, location and property description have all been provided.',
    pendingTasks: [],
    nextAction: 'Review details whenever your property information changes.',
  },
  {
    id: 'policies',
    label: 'Policies',
    current: 10,
    maximum: 10,
    sectionId: 'rules-policies',
    summary: 'All property policies are complete.',
    detail: 'Check-in and check-out times, cancellation terms and stay rules are saved for guests.',
    pendingTasks: [],
    nextAction: 'Review policies when your terms or services change.',
  },
];

export const CONTENT_SCORE_FAQS = [
  {
    question: 'How can I increase my content score?',
    answer: 'Complete the pending amenity task and keep photos, property details and policies up to date. Every completed item adds points back to the overall score.',
  },
  {
    question: 'How does the content score affect my listing?',
    answer: 'A more complete listing gives guests clearer information and helps your property present itself more confidently across channels.',
  },
  {
    question: 'Why is my score close to 100 but not complete?',
    answer: 'One amenity detail is still missing. Completing it moves the Amenities score from 29.8 to 30 and the overall score to 100.',
  },
];

export const CONTENT_SCORE_INFO = {
  title: 'How the Content Score is calculated',
  intro: 'Your score measures how complete your listing is across the four areas guests use most when deciding where to stay.',
  points: [
    'Photos are worth 45 points, including the cover image, tagged room photos and common areas.',
    'Amenities are worth 30 points across hotel facilities and individual dining spaces.',
    'Property details are worth 15 points for mandatory business and location information.',
    'Policies are worth 10 points for check-in, cancellation and stay rules.',
  ],
  note: 'Scores shown here are a demo snapshot until a content-score endpoint is connected.',
};

export function createDefaultContentScoreSnapshot() {
  return {
    total: 99.8,
    areaAverage: 95.38,
    channel: 'Goibibo',
    sections: CONTENT_SCORE_SECTIONS.map((section) => ({ ...section, pendingTasks: [...section.pendingTasks] })),
  };
}

const finiteNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const calculateTotal = (sections) => {
  const earned = sections.reduce((sum, section) => sum + finiteNumber(section.current, 0), 0);
  const possible = sections.reduce((sum, section) => sum + finiteNumber(section.maximum, 0), 0);
  if (!possible) return 0;
  return Math.round((earned / possible) * 1000) / 10;
};

export function normalizeContentScoreSnapshot(property) {
  const defaults = createDefaultContentScoreSnapshot();
  const source = property?.contentScore && typeof property.contentScore === 'object' ? property.contentScore : {};
  const sourceSections = Array.isArray(source.sections) ? source.sections : [];

  const sections = defaults.sections.map((section) => {
    const incoming = sourceSections.find((item) => item?.id === section.id);
    if (!incoming) return section;
    return {
      ...section,
      current: finiteNumber(incoming.current, section.current),
      maximum: finiteNumber(incoming.maximum, section.maximum),
      summary: typeof incoming.summary === 'string' ? incoming.summary : section.summary,
      detail: typeof incoming.detail === 'string' ? incoming.detail : section.detail,
      pendingTasks: Array.isArray(incoming.pendingTasks) ? incoming.pendingTasks : section.pendingTasks,
      nextAction: typeof incoming.nextAction === 'string' ? incoming.nextAction : section.nextAction,
    };
  });

  return {
    ...defaults,
    total: source.total === undefined ? calculateTotal(sections) : finiteNumber(source.total, defaults.total),
    areaAverage: finiteNumber(source.areaAverage, defaults.areaAverage),
    channel: typeof source.channel === 'string' ? source.channel : defaults.channel,
    sections,
  };
}

export function formatScore(value, decimals = 2) {
  return finiteNumber(value, 0).toFixed(decimals);
}

export function formatSectionScore(value) {
  return formatScore(value, 1).replace(/\.0$/, '');
}

export function getSectionStatus(section) {
  if (section.pendingTasks.length) return { label: 'In progress', tone: 'partial' };
  if (finiteNumber(section.current, 0) >= finiteNumber(section.maximum, 0)) return { label: 'Complete', tone: 'complete' };
  return { label: 'Needs attention', tone: 'empty' };
}
