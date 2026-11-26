export const ACTION_CATEGORIES = [
  {
    id: 'listing-quality',
    title: 'Improve Listing Quality to Drive Visibility and Traffic',
    summary: 'Complete documentation that builds trust with corporate guests.',
    tasks: [
      {
        id: 'gst-invoices',
        title: 'Upload GST invoices for Corporate Bookings',
        description: 'Upload invoices with GST details for 3 of your corporate bookings.',
        priority: 'High',
        actionLabel: 'Upload Now',
        action: 'bookings-gst',
      },
    ],
  },
  {
    id: 'promotion-impact',
    title: 'Maximize Promotion Impact to Drive More Bookings for Your Property',
    summary: 'Use targeted discounts to convert more booking intent into reservations.',
    tasks: [
      {
        id: 'coupon-discounts',
        title: 'Offer Coupon Discounts to Improve Conversion',
        description: '9.5 Lakh+ customers use discount coupons to book on MMT and Goibibo every month. Try the same!',
        priority: 'Medium',
        actionLabel: 'Offer Now',
        action: 'margin-offers',
      },
    ],
  },
];

export const ACTION_FAQS = [
  {
    id: 'what-is',
    question: 'What is Action Centre?',
    paragraphs: ['An informational FAQ section explaining the purpose of the Action Center.'],
    points: [],
  },
  {
    id: 'how-works',
    question: 'How does the Action Centre work?',
    paragraphs: [
      "The Action Center analyzes the property's performance over the last 30 days and identifies areas requiring attention.",
      'It recommends customized tasks such as:',
    ],
    points: [
      'Running special discounts.',
      'Improving content score.',
      'Setting up hourly rooms.',
      'Improving property visibility.',
      'Enhancing the guest booking experience.',
    ],
    note: 'The recommendations are based on data-backed insights comparing the property performance with competitors.',
  },
  {
    id: 'act-on-all',
    question: 'Do I need to act upon all the tasks highlighted in the Action Centre?',
    paragraphs: [
      'The platform recommends completing all tasks, including low-priority tasks. However, high-priority tasks should be addressed immediately because they can have a significant impact on business performance.',
    ],
    points: [],
  },
  {
    id: 'status-refresh',
    question: 'Why is there no change in the status of the tasks I already acted upon?',
    paragraphs: ['The platform mentions that task status updates can take up to 24 hours to refresh.'],
    points: [],
  },
];
