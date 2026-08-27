import { PUT as putWithdrawal, DELETE as deleteWithdrawal } from '../../withdrawals/[id]/route';

export async function PUT(req, ctx) {
  return putWithdrawal(req, ctx);
}

export async function DELETE(req, ctx) {
  return deleteWithdrawal(req, ctx);
}
