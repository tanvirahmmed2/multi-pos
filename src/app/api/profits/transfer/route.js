import { isManagementRole } from '@/lib/auth';
import { logActivity } from '@/lib/logger';
import { checkShareInvestmentEnabled, transferProfitToInvestment } from '@/lib/financial';

export async function POST(req) {
  try {
    const isEnabled = await checkShareInvestmentEnabled();
    if (!isEnabled) {
      return Response.json({ error: 'Share Investment Mode is disabled', disabled: true }, { status: 403 });
    }

    const auth = await isManagementRole();
    if (!auth.success) {
      return Response.json({ error: auth.message }, { status: 403 });
    }

    const body = await req.json();
    const { investor_id, amount } = body;

    const investorId = parseInt(investor_id, 10);
    const transferAmount = parseFloat(amount);

    if (isNaN(investorId)) {
      return Response.json({ error: 'Valid investor ID is required' }, { status: 400 });
    }
    if (isNaN(transferAmount) || transferAmount <= 0) {
      return Response.json({ error: 'Valid transfer amount is required' }, { status: 400 });
    }

    const result = await transferProfitToInvestment(investorId, transferAmount, auth.staff.staff_id);
    if (!result.success) {
      return Response.json({ error: result.error }, { status: 400 });
    }

    await logActivity({
      req,
      staffId: auth.staff.staff_id,
      action: 'TRANSFER_PROFIT_TO_INVESTMENT',
      entity: 'investors',
      entityId: investorId,
      details: `Transferred ৳${transferAmount} profits into capital investment for Investor #${investorId}`
    });

    return Response.json({
      message: 'Profit successfully transferred to capital investment',
      transferred: result.transferred
    }, { status: 200 });
  } catch (error) {
    console.error('Error in profit transfer:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
