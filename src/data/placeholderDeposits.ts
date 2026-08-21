import { DepositRecord } from '../services/financeService'

/** Sample rows so Deposit History can be reviewed before the API returns real deposits. */
export const SAMPLE_DEPOSITS: DepositRecord[] = [
  {
    _id: 'sample-deposit-1',
    coin: 'BTC',
    amount: 17000,
    status: 'approved',
    address: '0xfc806fb2fcbfb7ea5f29106b1d874d12d8fa49f4',
    txHash: '0xfcbd41615767324318630736361973350e4f25419350235dc6ebe5f45d01a905',
    description: 'Deposit 17000 USDT via BTC - Pending approval',
    balanceBefore: 78215.2,
    balanceAfter: 95215.2,
    createdAt: '2026-03-17T05:41:19.000Z',
  },
  {
    _id: 'sample-deposit-2',
    coin: 'ETH',
    amount: 500,
    status: 'pending',
    address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
    description: 'Deposit 500 USDT via ETH - Pending approval',
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'sample-deposit-3',
    coin: 'USDT',
    amount: 250,
    status: 'rejected',
    address: 'TYASr5UV6HEcXatwdFQfmLVUqQQQMUxHLS',
    description: 'Deposit 250 USDT via USDT - Pending approval',
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
  },
]
