-- Migration 007 — add Paystack as a payment provider
-- Paystack is the card + pan-African rail (cards, mobile money, bank transfer)
-- for members outside Kenya. M-Pesa stays the Kenyan rail. Stripe kept for
-- backward compatibility of historical rows.

alter type payment_provider add value if not exists 'paystack';

-- A generic column for the Paystack transaction reference (mirrors
-- stripe_payment_intent). Nullable; only set on Paystack payments.
alter table payments
  add column if not exists paystack_reference text;
