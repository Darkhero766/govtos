import type { ScamSignature } from '../types/models';

// Synthetic signatures only. Domains use .example and phone values are intentionally invalid demo values.
export const mockSignatures: ScamSignature[] = [
  { kind: 'upi', value: 'refund-help@upi', label: 'demo refund impersonation UPI', risk_reason: 'The handle is a synthetic signature associated with a refund impersonation scenario.' },
  { kind: 'phone', value: '+910000000001', label: 'demo fake bank caller', risk_reason: 'This synthetic number is tagged in the demo dataset as a fake bank-caller pattern.' },
  { kind: 'url', value: 'https://demo-bank-help.example', label: 'demo fake bank support URL', risk_reason: 'The synthetic domain is tagged as a bank-support impersonation example.' },
  { kind: 'upi', value: 'kyc-update@upi', label: 'demo KYC impersonation UPI', risk_reason: 'The synthetic handle is associated with a KYC-update impersonation scenario.' },
  { kind: 'upi', value: 'cashback-claim@upi', label: 'demo cashback lure UPI', risk_reason: 'The synthetic handle is associated with a cashback lure scenario.' },
  { kind: 'upi', value: 'parcel-refund@upi', label: 'demo parcel refund UPI', risk_reason: 'The synthetic handle is associated with a parcel-refund impersonation scenario.' },
  { kind: 'upi', value: 'support-desk@upi', label: 'demo support impersonation UPI', risk_reason: 'The synthetic handle is associated with a support impersonation scenario.' },
  { kind: 'phone', value: '+910000000002', label: 'demo courier caller', risk_reason: 'This synthetic number is tagged as a courier-impersonation pattern.' },
  { kind: 'phone', value: '+910000000003', label: 'demo KYC caller', risk_reason: 'This synthetic number is tagged as a KYC-impersonation pattern.' },
  { kind: 'phone', value: '+910000000004', label: 'demo refund caller', risk_reason: 'This synthetic number is tagged as a refund-impersonation pattern.' },
  { kind: 'phone', value: '+910000000005', label: 'demo delivery caller', risk_reason: 'This synthetic number is tagged as a delivery-fee lure pattern.' },
  { kind: 'phone', value: '+910000000006', label: 'demo account-warning caller', risk_reason: 'This synthetic number is tagged as an account-warning impersonation pattern.' },
  { kind: 'url', value: 'https://kyc-alert.example', label: 'demo KYC alert URL', risk_reason: 'The synthetic domain is tagged as a KYC-alert impersonation example.' },
  { kind: 'url', value: 'https://refund-portal.example', label: 'demo refund portal URL', risk_reason: 'The synthetic domain is tagged as a refund-portal impersonation example.' },
  { kind: 'url', value: 'https://parcel-support.example', label: 'demo parcel support URL', risk_reason: 'The synthetic domain is tagged as a parcel-support impersonation example.' },
  { kind: 'url', value: 'https://cashback-now.example', label: 'demo cashback URL', risk_reason: 'The synthetic domain is tagged as a cashback lure example.' },
  { kind: 'url', value: 'https://account-verify.example', label: 'demo account verification URL', risk_reason: 'The synthetic domain is tagged as an account-verification impersonation example.' },
  { kind: 'url', value: 'https://support-desk.example', label: 'demo support desk URL', risk_reason: 'The synthetic domain is tagged as a support impersonation example.' },
  { kind: 'upi', value: 'delivery-fee@upi', label: 'demo delivery fee UPI', risk_reason: 'The synthetic handle is associated with a delivery-fee lure scenario.' },
  { kind: 'upi', value: 'account-verify@upi', label: 'demo account verification UPI', risk_reason: 'The synthetic handle is associated with an account-verification impersonation scenario.' },
  { kind: 'upi', value: 'prize-claim@upi', label: 'demo prize claim UPI', risk_reason: 'The synthetic handle is associated with a prize-claim lure scenario.' },
  { kind: 'phone', value: '+910000000007', label: 'demo prize caller', risk_reason: 'This synthetic number is tagged as a prize-claim lure pattern.' },
  { kind: 'phone', value: '+910000000008', label: 'demo parcel caller', risk_reason: 'This synthetic number is tagged as a parcel-impersonation pattern.' },
  { kind: 'phone', value: '+910000000009', label: 'demo payment support caller', risk_reason: 'This synthetic number is tagged as a payment-support impersonation pattern.' },
];
