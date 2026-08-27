import { GET as getWithdrawals, POST as postWithdrawals } from '../withdrawals/route';

export async function GET(req) {
  return getWithdrawals(req);
}

export async function POST(req) {
  return postWithdrawals(req);
}
