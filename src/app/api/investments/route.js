import { query } from '@/lib/db';
import { isManagementRole } from '@/lib/auth';
import { logActivity } from '@/lib/logger';

export async function GET(req) {
  try {
    const auth = await isManagementRole();
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
    const auth = await isManagementRole();
    if (!auth.success) {
      return Response.json({ error: auth.message }, { status: 403 });
    }

    const body = await req.json();
    const { investor_id, investor_name, investor_phone, investor_email, branch_id, amount, payment_method, reference_no, investment_date, note } = body;

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return Response.json({ error: 'Valid investment amount is required' }, { status: 400 });
    }

    let name = investor_name;
    let phone = investor_phone;
    let email = investor_email;

    if (investor_id) {
      const invRes = await query('SELECT name, phone, email FROM investors WHERE investor_id = $1', [investor_id]);
      if (invRes.rows.length > 0) {
        name = invRes.rows[0].name;
        phone = invRes.rows[0].phone;
        email = invRes.rows[0].email;
      }
    }

    if (!name) {
      return Response.json({ error: 'Investor name or selected investor is required' }, { status: 400 });
    }

    const staffId = auth.staff.staff_id;
    const branchVal = branch_id ? parseInt(branch_id, 10) : auth.staff.branch_id;

    const result = await query(
      `INSERT INTO investments (investor_id, branch_id, staff_id, investor_name, investor_phone, investor_email, amount, payment_method, reference_no, investment_date, note)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        investor_id ? parseInt(investor_id, 10) : null,
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

    await logActivity({
      req,
      staffId,
      action: 'CREATE_INVESTMENT',
      entity: 'investments',
      entityId: investment.investment_id,
      details: `Recorded investment of ৳${parsedAmount} from ${name}`
    });

    return Response.json(investment, { status: 201 });
  } catch (error) {
    console.error('Error creating investment:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
