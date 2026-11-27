export const FINANCIAL_STORAGE_KEY = 'triponx.partner.financialBankDetails';

export const FINANCIAL_PHASES = [
  { id: 'payout', label: 'Payout', shortLabel: 'Bank', title: 'Bank & payout details', description: 'Where payouts are sent and how the account is verified.' },
  { id: 'tax', label: 'Tax identity', shortLabel: 'Tax', title: 'PAN & GST details', description: 'Business tax identities used for invoices and reporting.' },
  { id: 'compliance', label: 'Compliance', shortLabel: 'Compliance', title: 'TAN, MSME & company details', description: 'Statutory declarations and registration information.' },
  { id: 'documents', label: 'Documents', shortLabel: 'Documents', title: 'Private documents', description: 'Proof documents visible only to you and the TriponX team.' },
  { id: 'review', label: 'Review', shortLabel: 'Review', title: 'Review & confirm', description: 'Check the saved details before confirming this section.' },
];

export const MSME_CATEGORY_OPTIONS = ['Micro', 'Small', 'Medium'];
export const COMPANY_TYPE_OPTIONS = [
  'Proprietorship',
  'Partnership',
  'LLP',
  'Private Limited',
  'Public Limited',
  'Trust',
  'Society',
  'Other',
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
  msmeNumber: 'MSME number',
  companyRegistered: 'Company registration',
  companyType: 'Entity type',
  companyRegistrationNumber: 'Registration number',
  companyRegistrationName: 'Registered entity name',
  registrationDate: 'Registration date',
  declaration: 'Declaration',
};

export const DOCUMENT_TYPES = [
  { type: 'OWNERSHIP', label: 'Ownership / company registration proof', hint: 'PDF or photo, up to 10 MB' },
  { type: 'CANCELLED_CHEQUE', label: 'Cancelled cheque', hint: 'Or the first page of the passbook' },
];

const compact = (value) => String(value ?? '').replace(/\s/g, '').toUpperCase();
const textValue = (value) => String(value ?? '').trim();
const PAN_PATTERN = /^[A-Z]{3}[ABCFGHJLPT][A-Z]\d{4}[A-Z]$/;
const GSTIN_PATTERN = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const IFSC_PATTERN = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const TAN_PATTERN = /^[A-Z]{4}\d{4}[A-Z]$/;

export function createDefaultFinancialForm() {
  return {
    accountHolder: '',
    bankName: '',
    accountNumber: '',
    confirmAccount: '',
    ifsc: '',
    legalName: '',
    pan: '',
    hotelPan: '',
    hasGst: '',
    gstin: '',
    gstEntityName: '',
    hasTan: '',
    tanNumber: '',
    msmeRegistered: '',
    msmeCategory: '',
    msmeNumber: '',
    companyRegistered: '',
    companyType: '',
    companyRegistrationNumber: '',
    companyRegistrationName: '',
    registrationDate: '',
    declaration: false,
    saved: { pan: false, gstin: false, account: false },
  };
}

export function normalizeFinancialForm(legal, draft) {
  const defaults = createDefaultFinancialForm();
  const merged = { ...defaults, ...(draft ?? {}), saved: { ...defaults.saved, ...(draft?.saved ?? {}) } };
  const source = legal && typeof legal === 'object' ? legal : {};

  if (!merged.legalName && source.legalName) merged.legalName = source.legalName;
  if (!merged.accountHolder && source.accountHolder) merged.accountHolder = source.accountHolder;
  if (!merged.bankName && source.bankName) merged.bankName = source.bankName;
  if (!merged.ifsc && source.ifsc) merged.ifsc = source.ifsc;
  if (typeof source.hasGst === 'boolean' && !draft?.hasGst) merged.hasGst = source.hasGst ? 'yes' : 'no';
  if (typeof source.declaration === 'boolean' && draft?.declaration === undefined) merged.declaration = Boolean(source.declaration);

  merged.saved = {
    pan: Boolean(source.panLast4 || (!draft?.pan && source.pan)),
    gstin: Boolean(source.gstinLast4 || (!draft?.gstin && source.gstin)),
    account: Boolean(source.accountLast4 || (!draft?.accountNumber && source.accountNumber)),
  };
  return merged;
}

export function loadFinancialDraft(propertyId) {
  try {
    const stored = window.sessionStorage.getItem(`${FINANCIAL_STORAGE_KEY}.${propertyId}.v1`);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function saveFinancialDraft(propertyId, form) {
  try {
    window.sessionStorage.setItem(`${FINANCIAL_STORAGE_KEY}.${propertyId}.v1`, JSON.stringify(form));
  } catch {
    return;
  }
}

export function toLegalApiPayload(form) {
  return {
    legalName: form.legalName,
    pan: form.pan ? compact(form.pan) : undefined,
    hasGst: form.hasGst === 'yes',
    gstin: form.hasGst === 'yes' && form.gstin ? compact(form.gstin) : undefined,
    accountHolder: form.accountHolder,
    bankName: form.bankName,
    accountNumber: form.accountNumber ? compact(form.accountNumber) : undefined,
    ifsc: compact(form.ifsc),
    declaration: Boolean(form.declaration),
  };
}

function validatePayout(form) {
  const errors = {};
  if (textValue(form.accountHolder).length < 2) errors.accountHolder = 'Enter the account holder name.';
  if (textValue(form.bankName).length < 2) errors.bankName = 'Enter the bank name.';
  const account = compact(form.accountNumber);
  if (account ? !/^\d{9,18}$/.test(account) : !form.saved?.account) errors.accountNumber = 'Enter a valid account number (9 to 18 digits).';
  if (account && compact(form.confirmAccount) !== account) errors.confirmAccount = 'Account numbers do not match.';
  if (!IFSC_PATTERN.test(compact(form.ifsc))) errors.ifsc = 'Enter a valid IFSC, e.g. HDFC0001234.';
  return errors;
}

function validateTax(form) {
  const errors = {};
  if (textValue(form.legalName).length < 2) errors.legalName = 'Enter the legal or business name.';
  const pan = compact(form.pan);
  if (pan ? !PAN_PATTERN.test(pan) : !form.saved?.pan) errors.pan = 'Enter a valid PAN, e.g. AAPFU0939F.';
  if (form.hotelPan && !PAN_PATTERN.test(compact(form.hotelPan))) errors.hotelPan = 'Enter a valid hotel PAN.';
  if (form.hasGst !== 'yes' && form.hasGst !== 'no') errors.hasGst = 'Tell us whether you are registered for GST.';
  if (form.hasGst === 'yes') {
    const gstin = compact(form.gstin);
    if (gstin ? !GSTIN_PATTERN.test(gstin) : !form.saved?.gstin) errors.gstin = 'Enter a valid 15-character GSTIN.';
    else if (pan && gstin && gstin.slice(2, 12) !== pan) errors.gstin = 'This GSTIN belongs to a different PAN.';
    if (!textValue(form.gstEntityName)) errors.gstEntityName = 'Enter the name registered on the GST certificate.';
  }
  return errors;
}

function validateCompliance(form) {
  const errors = {};
  if (form.hasTan !== 'yes' && form.hasTan !== 'no') errors.hasTan = 'Tell us whether you have a TAN.';
  if (form.hasTan === 'yes' && !TAN_PATTERN.test(compact(form.tanNumber))) errors.tanNumber = 'Enter a valid TAN, e.g. ABCD1234E.';
  if (form.msmeRegistered !== 'yes' && form.msmeRegistered !== 'no') errors.msmeRegistered = 'Tell us whether you are MSME registered.';
  if (form.msmeRegistered === 'yes') {
    if (!MSME_CATEGORY_OPTIONS.includes(form.msmeCategory)) errors.msmeCategory = 'Choose an MSME category.';
    if (!textValue(form.msmeNumber)) errors.msmeNumber = 'Enter the MSME registration number.';
  }
  if (form.companyRegistered !== 'yes' && form.companyRegistered !== 'no') errors.companyRegistered = 'Tell us whether the company is registered.';
  if (form.companyRegistered === 'yes') {
    if (!form.companyType) errors.companyType = 'Choose the entity type.';
    if (!textValue(form.companyRegistrationNumber)) errors.companyRegistrationNumber = 'Enter the company registration number.';
    if (!textValue(form.companyRegistrationName)) errors.companyRegistrationName = 'Enter the registered entity name.';
    if (!form.registrationDate) errors.registrationDate = 'Choose the registration date.';
  }
  return errors;
}

export function validateFinancialPhase(phaseId, form) {
  if (phaseId === 'payout') return validatePayout(form);
  if (phaseId === 'tax') return validateTax(form);
  if (phaseId === 'compliance') return validateCompliance(form);
  if (phaseId === 'review' && !form.declaration) return { declaration: 'Accept the declaration to confirm.' };
  return {};
}

export function phaseCompletion(form) {
  return FINANCIAL_PHASES.reduce((result, phase) => {
    result[phase.id] = Object.keys(validateFinancialPhase(phase.id, form)).length;
    return result;
  }, {});
}

export function maskedValue(value, last4, label = 'Saved') {
  if (value) return compact(value);
  if (last4) return `${label} · ending ${last4}`;
  return 'Not provided';
}

export function maskSensitive(value, last4, label = 'Saved') {
  const text = compact(value);
  if (text) return text.length <= 4 ? text : `${'•'.repeat(Math.min(10, text.length - 4))}${text.slice(-4)}`;
  if (last4) return `${label} · ending ${last4}`;
  return 'Not provided';
}
