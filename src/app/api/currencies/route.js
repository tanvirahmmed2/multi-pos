import { query } from '@/lib/db';
import { isAdmin } from '@/lib/auth';
import { logActivity } from '@/lib/logger';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get('active');

    if (activeOnly === 'true') {
      const result = await query(
        'SELECT * FROM currencies WHERE is_active = TRUE ORDER BY currency_id ASC LIMIT 1'
      );
      if (result.rows.length === 0) {
        return Response.json(
          { currency_id: 1, code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳', is_active: true },
          { status: 200 }
        );
      }
      return Response.json(result.rows[0], { status: 200 });
    }

    const result = await query('SELECT * FROM currencies ORDER BY currency_id ASC');
    return Response.json(result.rows, { status: 200 });
  } catch (error) {
    console.error('Error fetching currencies:', error);
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
    const { code, name, symbol } = body;

    if (!code || !name || !symbol) {
      return Response.json({ error: 'Currency code, name, and symbol are required' }, { status: 400 });
    }

    const uppercaseCode = code.trim().toUpperCase();

    const result = await query(
      `INSERT INTO currencies (code, name, symbol, is_active)
       VALUES ($1, $2, $3, FALSE)
       ON CONFLICT (code) DO UPDATE 
       SET name = EXCLUDED.name, symbol = EXCLUDED.symbol
       RETURNING *`,
      [uppercaseCode, name.trim(), symbol.trim()]
    );

    const currency = result.rows[0];

    await logActivity(req, {
      staffId: auth.staff.staff_id,
      action: 'ADD_CURRENCY',
      entity: 'currencies',
      entityId: currency.currency_id,
      details: `Added currency ${currency.name} (${currency.symbol})`
    });

    return Response.json(currency, { status: 201 });
  } catch (error) {
    console.error('Error adding currency:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const auth = await isAdmin();
    if (!auth.success) {
      return Response.json({ error: auth.message }, { status: 403 });
    }

    const body = await req.json();
    const { currency_id } = body;

    if (!currency_id) {
      return Response.json({ error: 'Currency ID is required' }, { status: 400 });
    }

    await query('UPDATE currencies SET is_active = FALSE');

    const result = await query(
      'UPDATE currencies SET is_active = TRUE WHERE currency_id = $1 RETURNING *',
      [currency_id]
    );

    if (result.rows.length === 0) {
      return Response.json({ error: 'Currency not found' }, { status: 404 });
    }

    const activeCurrency = result.rows[0];

    await logActivity(req, {
      staffId: auth.staff.staff_id,
      action: 'ACTIVATE_CURRENCY',
      entity: 'currencies',
      entityId: activeCurrency.currency_id,
      details: `Activated currency ${activeCurrency.name} (${activeCurrency.symbol})`
    });

    return Response.json(activeCurrency, { status: 200 });
  } catch (error) {
    console.error('Error activating currency:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
