// How each property status from the API is shown to the partner.
export const STATUS_INFO = {
  DRAFT: { label: 'Draft', hint: 'Not submitted yet.', tone: 'wait' },
  UNDER_REVIEW: { label: 'Under review', hint: 'Our team is checking the details.', tone: 'wait' },
  CHANGES_REQUESTED: { label: 'Changes needed', hint: 'Update the details and submit again.', tone: 'bad' },
  LIVE: { label: 'Live', hint: 'This property has been approved.', tone: 'good' },
  REJECTED: { label: 'Not approved', hint: 'This listing was not approved.', tone: 'bad' },
  SUSPENDED: { label: 'Suspended', hint: 'This listing is offline.', tone: 'bad' },
};
