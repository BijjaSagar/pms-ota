export const RATEPLAN_PRESETS = [
  { id: 'cp', label: 'CP', detail: 'Continental plan with breakfast.' },
  { id: 'ep', label: 'EP', detail: 'European plan, room only.' },
  { id: 'special', label: 'Special Rate', detail: 'Limited-period promotional rate.' },
  { id: 'dayuse-6', label: 'Dayuse rateplan 6hr', detail: 'Six-hour daytime stay.' },
  { id: 'dayuse-3', label: 'Dayuse rateplan 3hr', detail: 'Three-hour daytime stay.' },
  { id: 'dayuse-9', label: 'Dayuse rateplan 9hr', detail: 'Nine-hour daytime stay.' },
];

export const EMPTY_ROOM_EXTRA = {
  description: '',
  active: true,
  rateplans: [],
};

export const defaultRateplansFor = (room, index) => {
  const name = String(room?.roomName ?? room?.roomType ?? '').toLowerCase();
  if (/hour|dayuse|day use/.test(name)) {
    return RATEPLAN_PRESETS.filter((plan) => plan.id.startsWith('dayuse')).map((plan) => ({ ...plan }));
  }
  const plans = [RATEPLAN_PRESETS[0], RATEPLAN_PRESETS[1], RATEPLAN_PRESETS[2]];
  if (index === 2) plans.push({ ...RATEPLAN_PRESETS[0], id: 'cp-extra', label: 'CP (Weekend)' });
  return plans.map((plan) => ({ ...plan }));
};
