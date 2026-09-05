import { query } from '@/lib/db';
import { isAdmin } from '@/lib/auth';
import { logActivity } from '@/lib/logger';
import { recalculateInvestorShares, updateAvailableBalance } from '@/lib/financial';

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
        inv.*,
        COALESCE(i.name, inv.investor_name) AS investor_display_name,
        i.phone AS investor_phone_contact,
        i.email AS investor_email_contact,
        s.name AS staff_name,
        b.name AS branch_name
      FROM investments inv
      LEFT JOIN investors i ON inv.investor_id = i.investor_id
      LEFT JOIN staffs s ON inv.staff_id = s.staff_id
      LEFT JOIN branches b ON inv.branch_id = b.branch_id
    `;

    const params = [];
    if (investorId) {
      sql += ` WHERE inv.investor_id = $1`;
      params.push(investorId);
    }

    sql += ` ORDER BY inv.investment_id DESC`;

    const result = await query(sql, params);
    return Response.json(result.rows, { status: 200 });
  } catch (error) {
    console.error('Error fetching investments:', error);
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
    const { investor_id, investor_name, investor_phone, investor_email, branch_id, amount, payment_method, reference_no, investment_date, note } = body;

    const parsedInvestorId = investor_id ? parseInt(investor_id, 10) : null;
    if (!parsedInvestorId || isNaN(parsedInvestorId)) {
      return Response.json({ error: 'Investor selection is mandatory. Please select an investor or create a new investor first.' }, { status: 400 });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return Response.json({ error: 'Valid investment amount is required' }, { status: 400 });
    }

    const invRes = await query('SELECT name, phone, email FROM investors WHERE investor_id = $1', [parsedInvestorId]);
    if (invRes.rows.length === 0) {
      return Response.json({ error: 'Selected investor record not found' }, { status: 404 });
    }

    const name = invRes.rows[0].name;
    const phone = investor_phone || invRes.rows[0].phone;
    const email = investor_email || invRes.rows[0].email;

    const staffId = auth.staff.staff_id;
    const branchVal = branch_id ? parseInt(branch_id, 10) : auth.staff.branch_id;

    const result = await query(
      `INSERT INTO investments (investor_id, branch_id, staff_id, investor_name, investor_phone, investor_email, amount, payment_method, reference_no, investment_date, note)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        parsedInvestorId,
        branchVal || null,
        staffId || null,
        name,
        phone || null,
        email || null,
        parsedAmount,
        payment_method || 'bank_transfer',
        reference_no || null,
        investment_date || new Date(),
        note || null
      ]
    );

    const investment = result.rows[0];

    // Add new investment amount directly to available balance!
    await updateAvailableBalance(parsedAmount);

    await logActivity({
      req,
      staffId,
      action: 'CREATE_INVESTMENT',
      entity: 'investments',
      entityId: investment.investment_id,
      details: `Recorded capital investment of ৳${parsedAmount} from investor ${name}`
    });

    // Automatically recalculate investor equity shares
    await recalculateInvestorShares();

    return Response.json(investment, { status: 201 });
  } catch (error) {
    console.error('Error creating investment:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
