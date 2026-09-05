import { query } from '@/lib/db';
import { isAdmin } from '@/lib/auth';
import { logActivity } from '@/lib/logger';
import { getAvailableBalance, updateAvailableBalance, recalculateInvestorShares } from '@/lib/financial';

export async function GET(req) {
  try {
    const auth = await isAdmin();
    if (!auth.success) {
      return Response.json({ error: auth.message }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const investorId = searchParams.get('investor_id');

    let sql = `
      SELECT 
        w.*,
        COALESCE(i.name, w.investor_name) AS investor_display_name,
        i.phone AS investor_phone_contact,
        i.email AS investor_email_contact,
        s.name AS staff_name,
        b.name AS branch_name
      FROM withdrawals w
      LEFT JOIN investors i ON w.investor_id = i.investor_id
      LEFT JOIN staffs s ON w.staff_id = s.staff_id
      LEFT JOIN branches b ON w.branch_id = b.branch_id
    `;

    const params = [];
    if (investorId) {
      sql += ` WHERE w.investor_id = $1`;
      params.push(investorId);
    }

    sql += ` ORDER BY w.withdrawal_id DESC`;

    const result = await query(sql, params);
    return Response.json(result.rows, { status: 200 });
  } catch (error) {
    console.error('Error fetching withdrawals:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const auth = await isAdmin();
    if (!auth.success) {
      return Response.json({ error: auth.message }, { status: 403 });
    }

    const body = await req.json();
    const { investor_id, branch_id, amount, payment_method, account_details, status, note, withdrawal_type } = body;

    const parsedInvestorId = investor_id ? parseInt(investor_id, 10) : null;
    if (!parsedInvestorId || isNaN(parsedInvestorId)) {
      return Response.json({ error: 'Investor selection is mandatory. Please select an investor for withdrawal.' }, { status: 400 });
    }

    const invRes = await query('SELECT name, phone, email FROM investors WHERE investor_id = $1', [parsedInvestorId]);
    if (invRes.rows.length === 0) {
      return Response.json({ error: 'Selected investor not found' }, { status: 404 });
    }
    const investor = invRes.rows[0];

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return Response.json({ error: 'Valid withdrawal amount is required' }, { status: 400 });
    }

    const systemBalance = await getAvailableBalance();
    if (parsedAmount > systemBalance) {
      return Response.json({ 
        error: `Insufficient system available balance (৳${systemBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}). Requested withdrawal amount (৳${parsedAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}) exceeds store available balance.` 
      }, { status: 400 });
    }

    // Fetch investor balances
    const profitRes = await query(
      `SELECT COALESCE(SUM(amount), 0)::float AS total_profit FROM profits WHERE investor_id = $1`,
      [parsedInvestorId]
    );
    const availableProfit = Math.max(0, parseFloat(profitRes.rows[0]?.total_profit || 0));

    const invSumRes = await query(
      `SELECT COALESCE(SUM(amount), 0)::float AS total_investment FROM investments WHERE investor_id = $1`,
      [parsedInvestorId]
    );
    const totalInvestment = Math.max(0, parseFloat(invSumRes.rows[0]?.total_investment || 0));

    const totalInvestorFunds = availableProfit + totalInvestment;

    if (parsedAmount > totalInvestorFunds) {
      return Response.json({
        error: `Requested withdrawal (৳${parsedAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}) exceeds investor's total available balance of ৳${totalInvestorFunds.toLocaleString(undefined, { minimumFractionDigits: 2 })} (Profit: ৳${availableProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}, Capital: ৳${totalInvestment.toLocaleString(undefined, { minimumFractionDigits: 2 })}).`
      }, { status: 400 });
    }

    const staffId = auth.staff.staff_id;
    const branchVal = branch_id ? parseInt(branch_id, 10) : auth.staff.branch_id;

    // Automatic profit & investment deduction logic:
    // 1. Exhaust available profit first (creating negative profit entry in `profits`)
    // 2. If withdrawal exceeds available profit, take remaining amount from capital investment (creating negative investment entry in `investments`)
    // 3. Recalculate investor equity shares if capital investment is reduced
    // 4. Deduct total withdrawal amount from system available balance
    let actualType = 'profit';
    let profitDeduction = 0;
    let capitalDeduction = 0;

    if (parsedAmount <= availableProfit) {
      actualType = 'profit';
      profitDeduction = parsedAmount;
      capitalDeduction = 0;
    } else {
      actualType = 'investment';
      profitDeduction = Math.max(0, availableProfit);
      capitalDeduction = parsedAmount - profitDeduction;
    }

    let finalNote = note || '';
    if (profitDeduction > 0 && capitalDeduction > 0) {
      finalNote = `${finalNote ? `${finalNote} ` : ''}(Deducted ৳${profitDeduction.toFixed(2)} from profit and ৳${capitalDeduction.toFixed(2)} from capital investment)`.trim();
    } else if (capitalDeduction > 0) {
      finalNote = `${finalNote ? `${finalNote} ` : ''}(Deducted ৳${capitalDeduction.toFixed(2)} from capital investment)`.trim();
    } else if (profitDeduction > 0) {
      finalNote = `${finalNote ? `${finalNote} ` : ''}(Deducted ৳${profitDeduction.toFixed(2)} from profit)`.trim();
    }

    const result = await query(
      `INSERT INTO withdrawals (investor_id, branch_id, staff_id, investor_name, amount, payment_method, account_details, status, note, withdrawal_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        parsedInvestorId,
        branchVal || null,
        staffId || null,
        investor.name,
        parsedAmount,
        payment_method || 'cash',
        account_details || null,
        status || 'completed',
        finalNote || null,
        actualType
      ]
    );
    const withdrawal = result.rows[0];

    // Deduct withdrawal amount from available balance
    await updateAvailableBalance(-parsedAmount);

    if (profitDeduction > 0) {
      await query(
        `INSERT INTO profits (investor_id, profit_date, amount, note)
         VALUES ($1, CURRENT_DATE, $2, $3)`,
        [parsedInvestorId, -profitDeduction, `Profit withdrawal #${withdrawal.withdrawal_id}`]
      );
    }

    if (capitalDeduction > 0) {
      await query(
        `INSERT INTO investments (investor_id, branch_id, staff_id, investor_name, investor_phone, investor_email, amount, payment_method, note)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          parsedInvestorId,
          branchVal || null,
          staffId || null,
          investor.name,
          investor.phone || null,
          investor.email || null,
          -capitalDeduction,
          payment_method || 'cash',
          `Capital investment reduction #${withdrawal.withdrawal_id}`
        ]
      );
      await recalculateInvestorShares();
    }

    await logActivity({
      req,
      staffId,
      action: 'CREATE_WITHDRAWAL',
      entity: 'withdrawals',
      entityId: withdrawal.withdrawal_id,
      details: `Recorded ${actualType} withdrawal of ৳${parsedAmount} for investor ${investor.name}`
    });

    return Response.json(withdrawal, { status: 201 });

  } catch (error) {
    console.error('Error creating withdrawal:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
