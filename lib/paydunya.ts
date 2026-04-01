// Client PayDunya — à implémenter en Phase 3
// NE JAMAIS appeler l'API PayDunya depuis le code client

const PAYDUNYA_MODE = process.env.PAYDUNYA_MODE ?? 'test'
const BASE_URL =
  PAYDUNYA_MODE === 'production'
    ? 'https://app.paydunya.com/api/v1'
    : 'https://app.paydunya.com/sandbox-api/v1'

export const paydunyaHeaders = {
  'PAYDUNYA-MASTER-KEY': process.env.PAYDUNYA_MASTER_KEY ?? '',
  'PAYDUNYA-PRIVATE-KEY': process.env.PAYDUNYA_PRIVATE_KEY ?? '',
  'PAYDUNYA-TOKEN': process.env.PAYDUNYA_TOKEN ?? '',
  'Content-Type': 'application/json',
}

export { BASE_URL as PAYDUNYA_BASE_URL }
