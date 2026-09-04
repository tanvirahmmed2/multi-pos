import { query } from '@/lib/db';
import { isAdmin } from '@/lib/auth';
import { logActivity } from '@/lib/logger';
import { updateAvailableBalance } from '@/lib/financial';

export async function DELETE(req, { params }) {
  try {
    const auth = await isAdmin();
    if (!auth.success) {
      return Response.json({ error: auth.message }, { status: 403 });
    }

    const { id } = await params;
    const txId = parseInt(id, 10);
    if (isNaN(txId)) {
      return Response.json({ error: 'Invalid transaction ID' }, { status: 400 });
    }

    const result = await query(
      'DELETE FROM balance_transactions WHERE transaction_id = $1 RETURNING *',
      [txId]
    );

    if (result.rows.length === 0) {
      return Response.json({ error: 'Balance transaction not found' }, { status: 404 });
    }

    const deletedTx = result.rows[0];
    const amount = parseFloat(deletedTx.amount || 0);

    // Deduct deleted manual deposit amount from available balance
    if (amount > 0) {
      await updateAvailableBalance(-amount);
    }

    await logActivity({
      req,
      staffId: auth.staff.staff_id,
      action: 'DELETE_BALANCE_TRANSACTION',
      entity: 'balance_transactions',
      entityId: txId,
      details: `Deleted manual balance transaction #${txId} and deducted ৳${amount} from available balance`
    });

    return Response.json({ 
      message: 'Balance transaction deleted successfully', 
      deducted: amount 
    }, { status: 200 });

  } catch (error) {
    console.error('Error deleting balance transaction:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
