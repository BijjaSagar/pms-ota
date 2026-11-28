// Property Information > Financial & Bank Details: form shape, validation (same rules as the API)
// and mapping from the API's finance view. Full PAN / GSTIN / account numbers live only in the
// open form; the API returns their last 4 characters, and nothing is kept in browser storage.

export const FINANCIAL_PHASES = [
  { id: 'payout', label: 'Payout', shortLabel: 'Bank', title: 'Bank & payout details', description: 'Where payouts are sent and how the account is verified.' },
  { id: 'tax', label: 'Tax identity', shortLabel: 'Tax', title: 'PAN & GST details', description: 'Business tax identities used for invoices and reporting.' },
  { id: 'compliance', label: 'Compliance', shortLabel: 'Compliance', title: 'TAN, MSME & company details', description: 'Statutory declarations and registration information.' },
  { id: 'documents', label: 'Documents', shortLabel: 'Documents', title: 'Private documents', description: 'Proof documents visible only to you and the TriponX team.' },
  { id: 'review', label: 'Review', shortLabel: 'Review', title: 'Review & confirm', description: 'Check the saved details before confirming this section.' },
];

export const MSME_CATEGORY_OPTIONS = [
  { code: 'MICRO', label: 'Micro' },
  { code: 'SMALL', label: 'Small' },
  { code: 'MEDIUM', label: 'Medium' },
];
/** Used until the API's own list arrives. */
export const DEFAULT_COMPANY_TYPES = [
  { code: 'proprietorship', label: 'Proprietorship' },
  { code: 'partnership', label: 'Partnership' },
  { code: 'llp', label: 'LLP' },
  { code: 'private-limited', label: 'Private Limited' },
  { code: 'public-limited', label: 'Public Limited' },
  { code: 'trust', label: 'Trust' },
  { code: 'society', label: 'Society' },
  { code: 'other', label: 'Other' },
];

export const FIELD_LABELS = {
  accountHolder: 'Account holder name',
  bankName: 'Bank name',
  accountNumber: 'Account number',
  confirmAccount: 'Confirm account number',
  ifsc: 'IFSC code',
  legalName: 'Legal / business name',
  pan: 'PAN',
  hotelPan: 'Hotel PAN',
  hasGst: 'GST registration',
  gstin: 'Hotel GSTIN',
  gstEntityName: 'GST entity name',
  hasTan: 'TAN number',
  tanNumber: 'TAN',
  msmeRegistered: 'MSME registration',
  msmeCategory: 'MSME category',
  msmeNumber: 'Udyam registration number',
  companyRegistered: 'Company registration',
  companyType: 'Entity type',
  companyRegistrationNumber: 'Registration number',
  companyRegistrationName: 'Registered entity name',
  companyRegisteredOn: 'Registration date',
  declaration: 'Declaration',
  payout: 'Bank & payout',
  tax: 'PAN & GST',
  compliance: 'Compliance',
  documents: 'Documents',
};

export const DOCUMENT_TYPES = {
  OWNERSHIP: { label: 'Ownership / company registration proof', hint: 'PDF or photo, up to 10 MB' },
  CANCELLED_CHEQUE: { label: 'Cancelled cheque', hint: 'Or the first page of the passbook' },
  GST_CERTIFICATE: { label: 'GST certificate', hint: 'PDF or photo, up to 10 MB' },
};

export const VERIFICATION_LABELS = {
  NOT_STARTED: 'Not verified',
  PENDING: 'Verification in progress',
  VERIFIED: 'Verified',
  FAILED: 'Verification failed',
};

const compact = (value) => String(value ?? '').replace(/\s/g, '').toUpperCase();
const digits = (value) => String(value ?? '').replace(/[\s()-]/g, '');
const textValue = (value) => String(value ?? '').trim();
const yesNo = (value) => (value === true ? 'yes' : value === false ? 'no' : '');
const PAN_PATTERN = /^[A-Z]{3}[ABCFGHJLPT][A-Z]\d{4}[A-Z]$/;
const GSTIN_PATTERN = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const IFSC_PATTERN = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const TAN_PATTERN = /^[A-Z]{4}\d{5}[A-Z]$/;
const UDYAM_PATTERN = /^UDYAM-[A-Z]{2}-\d{2}-\d{7}$/;
// Same rule as the API: letters, digits, spaces and the punctuation real names use (no markup).
const NAME_PATTERN = /^[\p{L}\p{N}][\p{L}\p{M}\p{N} .,&'()\-/@#+]*$/u;
const NAME_HINT = "Use letters, digits, spaces and . , & ' ( ) - / @ # + only.";
const nameError = (value, empty) => {
  const text = textValue(value);
  if (text.length < 2) return empty;
  return NAME_PATTERN.test(text) ? null : NAME_HINT;
};
const REGISTRATION_PATTERN = /^[A-Z0-9][A-Z0-9/-]{3,29}$/;

const PHASE_KEYS = {
  payout: ['accountHolder', 'bankName', 'accountNumber', 'confirmAccount', 'ifsc'],
  tax: ['legalName', 'pan', 'hotelPan', 'removeHotelPan', 'hasGst', 'gstin', 'gstEntityName'],
  compliance: ['hasTan', 'tanNumber', 'msmeRegistered', 'msmeCategory', 'msmeNumber', 'companyRegistered', 'companyType', 'companyRegistrationNumber', 'companyRegistrationName', 'companyRegisteredOn'],
};

/** Form phases with typed changes that are not saved yet (compared with the last saved form). */
export function dirtyPhases(form, saved) {
  const same = (a, b) => (typeof a === 'string' || typeof b === 'string' ? String(a ?? '').trim() === String(b ?? '').trim() : a === b);
  return Object.keys(PHASE_KEYS).filter((phaseId) => {
    const keys = PHASE_KEYS[phaseId].filter((key) => key !== 'confirmAccount');
    // Hidden follow-up fields (e.g. GSTIN after GST = No) are not sent, so they do not count.
    const sent = phaseId === 'payout' ? payoutPayload : phaseId === 'tax' ? taxPayload : compliancePayload;
    return keys.some((key) => !same(form[key], saved[key])) && JSON.stringify(sent(form)) !== JSON.stringify(sent(saved));
  });
}

export function todayIso() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

/** The form for a finance view. Secret numbers start empty: blank keeps the saved one. */
export function formFromView(view) {
  const payout = view?.payout ?? {};
  const tax = view?.tax ?? {};
  const c = view?.compliance ?? {};
  return {
    accountHolder: payout.accountHolder ?? '',
    bankName: payout.bankName ?? '',
    accountNumber: '',
    confirmAccount: '',
    ifsc: payout.ifsc ?? '',
    legalName: tax.legalName ?? '',
    pan: '',
    hotelPan: '',
    removeHotelPan: false,
    hasGst: yesNo(tax.hasGst),
    gstin: '',
    gstEntityName: tax.gstEntityName ?? '',
    hasTan: yesNo(c.hasTan),
    tanNumber: c.tanNumber ?? '',
    msmeRegistered: yesNo(c.msmeRegistered),
    msmeCategory: c.msmeCategory ?? '',
    msmeNumber: c.msmeNumber ?? '',
    companyRegistered: yesNo(c.companyRegistered),
    companyType: c.companyType ?? '',
    companyRegistrationNumber: c.companyRegistrationNumber ?? '',
    companyRegistrationName: c.companyRegistrationName ?? '',
    companyRegisteredOn: c.companyRegisteredOn ?? '',
    declaration: Boolean(view?.confirmed),
  };
}

/** Takes one saved phase from the view and keeps what is being typed in the others. */
export function mergePhase(form, view, phaseId) {
  const fresh = formFromView(view);
  const next = { ...form, declaration: fresh.declaration };
  (PHASE_KEYS[phaseId] ?? []).forEach((key) => { next[key] = fresh[key]; });
  return next;
}

/** Account number, IFSC or holder differ from the saved ones (what needs the e-mail code). */
export function bankChangeTyped(form, saved) {
  return Boolean(digits(form.accountNumber))
    || compact(form.ifsc) !== compact(saved.ifsc)
    || textValue(form.accountHolder) !== textValue(saved.accountHolder);
}

const ACTION_LABELS = {
  PAYOUT_CHANGED: 'Bank details changed',
  BANK_CHECK: 'Bank account checked',
  BANK_CODE_SENT: 'Bank change code sent',
  BANK_CODE_FAILED: 'Wrong bank change code',
  TAX_CHANGED: 'PAN / GST changed',
  COMPLIANCE_CHANGED: 'Compliance details changed',
  DOCUMENT_UPLOADED: 'Document uploaded',
  DOCUMENT_REMOVED: 'Document removed',
  CONFIRMED: 'Details confirmed',
  LEGAL_SAVED: 'Saved in the listing wizard',
};
const CHANGE_LABELS = {
  account: 'Account', ifsc: 'IFSC', accountHolder: 'Holder', bankName: 'Bank', bankCheck: 'Check',
  legalName: 'Legal name', pan: 'PAN', hotelPan: 'Hotel PAN', hasGst: 'GST', gstin: 'GSTIN', gstEntityName: 'GST entity',
  hasTan: 'TAN', tanNumber: 'TAN number', msmeRegistered: 'MSME', msmeCategory: 'MSME category', msmeNumber: 'Udyam number',
  companyRegistered: 'Company', companyType: 'Entity type', companyRegistrationNumber: 'Registration no.',
  companyRegistrationName: 'Registered name', companyRegisteredOn: 'Registered on',
  OWNERSHIP: 'Ownership proof', CANCELLED_CHEQUE: 'Cancelled cheque', GST_CERTIFICATE: 'GST certificate',
};
const shown = (value) => (value === null || value === undefined ? '—' : value === 'true' ? 'Yes' : value === 'false' ? 'No' : value);

/** An audit event as the "Recent activity" list shows it. */
export function describeActivity(event) {
  return {
    title: ACTION_LABELS[event.action] ?? event.action,
    when: new Date(event.at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
    where: [event.device, event.ip].filter(Boolean).join(' · '),
    changes: event.changes.map((change) => {
      const label = CHANGE_LABELS[change.field] ?? change.field;
      const value = (v) => (change.field === 'bankCheck' ? VERIFICATION_LABELS[v] ?? shown(v) : shown(v));
      if (change.from === null) return `${label}: ${value(change.to)}`;
      if (change.to === null) return `${label}: ${value(change.from)} removed`;
      return `${label}: ${value(change.from)} → ${value(change.to)}`;
    }),
    alert: event.alertStatus === 'SENT' ? 'Alert sent' : event.alertStatus === 'FAILED' ? 'Alert not delivered' : null,
    warn: event.action === 'BANK_CODE_FAILED' || event.alertStatus === 'FAILED',
  };
}

export function payoutPayload(form) {
  const account = digits(form.accountNumber);
  return {
    accountHolder: textValue(form.accountHolder),
    bankName: textValue(form.bankName),
    accountNumber: account || undefined,
    confirmAccount: account ? digits(form.confirmAccount) : undefined,
    ifsc: compact(form.ifsc),
  };
}

export function taxPayload(form) {
  const hasGst = form.hasGst === 'yes';
  const hotelPan = compact(form.hotelPan);
  return {
    legalName: textValue(form.legalName),
    pan: compact(form.pan) || undefined,
    hotelPan: hotelPan || (form.removeHotelPan ? null : undefined),
    hasGst,
    gstin: hasGst ? compact(form.gstin) || undefined : undefined,
    gstEntityName: hasGst ? textValue(form.gstEntityName) : undefined,
  };
}

export function compliancePayload(form) {
  const tan = form.hasTan === 'yes';
  const msme = form.msmeRegistered === 'yes';
  const company = form.companyRegistered === 'yes';
  return {
    hasTan: tan,
    tanNumber: tan ? compact(form.tanNumber) : undefined,
    msmeRegistered: msme,
    msmeCategory: msme ? form.msmeCategory : undefined,
    msmeNumber: msme ? compact(form.msmeNumber) : undefined,
    companyRegistered: company,
    companyType: company ? form.companyType : undefined,
    companyRegistrationNumber: company ? compact(form.companyRegistrationNumber) : undefined,
    companyRegistrationName: company ? textValue(form.companyRegistrationName) : undefined,
    companyRegisteredOn: company ? form.companyRegisteredOn : undefined,
  };
}

function validatePayout(form, view) {
  const errors = {};
  const holder = nameError(form.accountHolder, 'Enter the account holder name (at least 2 characters).');
  if (holder) errors.accountHolder = holder;
  const bank = nameError(form.bankName, 'Enter the bank name.');
  if (bank) errors.bankName = bank;
  const account = digits(form.accountNumber);
  if (account ? !/^\d{9,18}$/.test(account) : !view?.payout?.accountLast4) errors.accountNumber = 'Enter a valid account number (9 to 18 digits).';
  if (account && digits(form.confirmAccount) !== account) errors.confirmAccount = 'Account numbers do not match.';
  if (!IFSC_PATTERN.test(compact(form.ifsc))) errors.ifsc = 'Enter a valid IFSC, e.g. HDFC0001234.';
  return errors;
}

function validateTax(form, view) {
  const errors = {};
  const legal = nameError(form.legalName, 'Enter the legal or business name.');
  if (legal) errors.legalName = legal;
  const pan = compact(form.pan);
  if (pan ? !PAN_PATTERN.test(pan) : !view?.tax?.panLast4) errors.pan = 'Enter a valid PAN, e.g. AAPFU0939F.';
  if (form.hotelPan && !PAN_PATTERN.test(compact(form.hotelPan))) errors.hotelPan = 'Enter a valid hotel PAN, e.g. AAACL1234C.';
  if (form.hasGst !== 'yes' && form.hasGst !== 'no') errors.hasGst = 'Tell us whether you are registered for GST.';
  if (form.hasGst === 'yes') {
    const gstin = compact(form.gstin);
    if (gstin ? !GSTIN_PATTERN.test(gstin) : !view?.tax?.gstinLast4) errors.gstin = 'Enter a valid 15-character GSTIN.';
    else if (pan && gstin && gstin.slice(2, 12) !== pan) errors.gstin = 'This GSTIN belongs to a different PAN.';
    const entity = nameError(form.gstEntityName, 'Enter the name registered on the GST certificate.');
    if (entity) errors.gstEntityName = entity;
  }
  return errors;
}

function validateCompliance(form, companyTypes) {
  const errors = {};
  if (form.hasTan !== 'yes' && form.hasTan !== 'no') errors.hasTan = 'Tell us whether you have a TAN.';
  if (form.hasTan === 'yes' && !TAN_PATTERN.test(compact(form.tanNumber))) errors.tanNumber = 'Enter a valid 10-character TAN, e.g. PNEL12345C.';
  if (form.msmeRegistered !== 'yes' && form.msmeRegistered !== 'no') errors.msmeRegistered = 'Tell us whether you are MSME registered.';
  if (form.msmeRegistered === 'yes') {
    if (!MSME_CATEGORY_OPTIONS.some((option) => option.code === form.msmeCategory)) errors.msmeCategory = 'Choose an MSME category.';
    if (!UDYAM_PATTERN.test(compact(form.msmeNumber))) errors.msmeNumber = 'Enter the Udyam number, e.g. UDYAM-MH-26-0012345.';
  }
  if (form.companyRegistered !== 'yes' && form.companyRegistered !== 'no') errors.companyRegistered = 'Tell us whether the company is registered.';
  if (form.companyRegistered === 'yes') {
    if (!companyTypes.some((option) => option.code === form.companyType)) errors.companyType = 'Choose the entity type.';
    if (!REGISTRATION_PATTERN.test(compact(form.companyRegistrationNumber))) errors.companyRegistrationNumber = 'Enter 4 to 30 letters, digits, / or -.';
    const registered = nameError(form.companyRegistrationName, 'Enter the registered entity name.');
    if (registered) errors.companyRegistrationName = registered;
    if (!form.companyRegisteredOn) errors.companyRegisteredOn = 'Choose the registration date.';
    else if (form.companyRegisteredOn > todayIso()) errors.companyRegisteredOn = 'The registration date can not be in the future.';
    else if (form.companyRegisteredOn < '1800-01-01') errors.companyRegisteredOn = 'Enter a date from 1800 onwards.';
  }
  return errors;
}

export const companyTypesOf = (view) => (view?.companyTypes?.length ? view.companyTypes : DEFAULT_COMPANY_TYPES);

export function validateFinancialPhase(phaseId, form, view) {
  if (phaseId === 'payout') return validatePayout(form, view);
  if (phaseId === 'tax') return validateTax(form, view);
  if (phaseId === 'compliance') return validateCompliance(form, companyTypesOf(view));
  if (phaseId === 'review' && !form.declaration) return { declaration: 'Accept the declaration to confirm.' };
  return {};
}

/**
 * What is left per phase, from the saved view (the server's progress), so a typed but unsaved
 * phase is not shown as done. Form phases count the fields still invalid in the form.
 */
export function phaseCompletion(form, view) {
  const result = {};
  ['payout', 'tax', 'compliance'].forEach((id) => {
    const left = Object.keys(validateFinancialPhase(id, form, view)).length;
    result[id] = left || (view?.progress?.[id] === false ? 1 : 0);
  });
  const uploaded = new Set((view?.documents ?? []).map((doc) => doc.type));
  result.documents = (view?.requiredDocuments ?? []).filter((type) => !uploaded.has(type)).length;
  return result;
}

export const labelOf = (options, code) => options.find((option) => option.code === code)?.label ?? code ?? '';

export const maskedValue = (last4, label = 'Saved') => (last4 ? `${label} · ending ${last4}` : 'Not provided');

export function maskSensitive(value, last4, label = 'Saved') {
  const text = compact(value);
  if (text) return text.length <= 4 ? text : `${'•'.repeat(Math.min(10, text.length - 4))}${text.slice(-4)}`;
  return maskedValue(last4, label);
}
