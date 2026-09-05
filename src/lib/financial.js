import { query } from '@/lib/db';

/**
 * Check if share investment system is active. Always returns true as share system is core.
 */
export async function checkShareInvestmentEnabled() {
  return true;
}

/**
 * Get current system available balance.
 */
export async function getAvailableBalance() {
  try {
    const res = await query('SELECT available_balance FROM available_balance ORDER BY balance_id ASC LIMIT 1');
    if (res.rows.length > 0) {
      return parseFloat(res.rows[0].available_balance || 0);
    }
    return 0;
  } catch (error) {
    console.error('Error getting available balance:', error);
    return 0;
  }
}

/**
 * Atomically update available balance (positive delta adds, negative delta deducts).
 */
export async function updateAvailableBalance(deltaAmount) {
  try {
    const amount = parseFloat(deltaAmount || 0);
    if (isNaN(amount) || amount === 0) return true;

    const checkRes = await query('SELECT balance_id, available_balance FROM available_balance ORDER BY balance_id ASC LIMIT 1');
    if (checkRes.rows.length > 0) {
      await query(
        `UPDATE available_balance 
         SET available_balance = available_balance + $1, updated_at = NOW() 
         WHERE balance_id = $2`,
        [amount, checkRes.rows[0].balance_id]
      );
    } else {
      await query(
        `INSERT INTO available_balance (available_balance) VALUES ($1)`,
        [Math.max(0, amount)]
      );
    }
    return true;
  } catch (error) {
    console.error('Error updating available balance:', error);
    return false;
  }
}

/**
 * Recalculate investor equity share percentage based on investment totals.
 */
export async function recalculateInvestorShares() {
  try {
    const grandTotalRes = await query(
      `SELECT COALESCE(SUM(amount), 0) AS global_total FROM investments WHERE investor_id IS NOT NULL`
    );
    const globalTotal = parseFloat(grandTotalRes.rows[0]?.global_total || 0);

    const investorTotalsRes = await query(`
      SELECT investor_id, COALESCE(SUM(amount), 0) AS total_investment
      FROM investments
      WHERE investor_id IS NOT NULL
      GROUP BY investor_id
    `);

    const investorTotalsMap = {};
    investorTotalsRes.rows.forEach(row => {
      investorTotalsMap[row.investor_id] = parseFloat(row.total_investment || 0);
    });

    const investorsRes = await query(`SELECT investor_id, is_active FROM investors`);
    for (const inv of investorsRes.rows) {
      const invTotal = investorTotalsMap[inv.investor_id] || 0;
      const sharePct = (globalTotal > 0 && invTotal > 0)
        ? Math.round((invTotal / globalTotal) * 100 * 100) / 100
        : 0.00;

      const existingShare = await query(`SELECT share_id FROM shares WHERE investor_id = $1 LIMIT 1`, [inv.investor_id]);
      if (existingShare.rows.length > 0) {
        await query(
          `UPDATE shares SET share_percentage = $1, status = $2, updated_at = NOW() WHERE investor_id = $3`,
          [sharePct, inv.is_active ? 'active' : 'inactive', inv.investor_id]
        );
      } else if (sharePct > 0 || invTotal > 0) {
        await query(
          `INSERT INTO shares (investor_id, share_percentage, status) VALUES ($1, $2, $3)`,
          [inv.investor_id, sharePct, inv.is_active ? 'active' : 'inactive']
        );
      }
    }
    return true;
  } catch (error) {
    console.error('Error recalculating shares:', error);
    return false;
  }
}

/**
 * Allocate gross sales profit to investors according to their share percentage.
 * Gross Profit per variant = (sale_price - purchase_price) * quantity
 */
export async function allocateDailySalesProfit(grossProfitAmount, orderRef = '') {
  try {
    const profit = parseFloat(grossProfitAmount || 0);
    if (profit <= 0) return true;

    // Fetch active investors with their share percentage
    const sharesRes = await query(`
      SELECT s.investor_id, s.share_percentage
      FROM shares s
      JOIN investors i ON s.investor_id = i.investor_id
      WHERE s.status = 'active' AND i.is_active = true AND s.share_percentage > 0
    `);

    for (const shareRow of sharesRes.rows) {
      const pct = parseFloat(shareRow.share_percentage || 0);
      const allocatedProfit = Math.round((profit * (pct / 100)) * 100) / 100;

      if (allocatedProfit > 0) {
        await query(
          `INSERT INTO profits (investor_id, profit_date, amount, note)
           VALUES ($1, CURRENT_DATE, $2, $3)`,
          [
            shareRow.investor_id,
            allocatedProfit,
            orderRef ? `Daily profit from sale ${orderRef}` : 'Daily sales profit allocation'
          ]
        );
      }
    }
    return true;
  } catch (error) {
    console.error('Error allocating daily sales profit:', error);
    return false;
  }
}

/**
 * Calculate gross profit for a specific order and allocate to investors according to share percentages.
 */
export async function allocateOrderProfit(orderId) {
  try {
    const res = await query(`
      SELECT 
        COALESCE(SUM((oi.price - COALESCE(pv.purchase_price, 0)) * oi.quantity), 0) AS gross_profit
      FROM order_items oi
      LEFT JOIN product_variants pv ON 
        (oi.variant_id IS NOT NULL AND oi.variant_id = pv.variant_id)
        OR (oi.variant_id IS NULL AND pv.product_id = oi.product_id)
      WHERE oi.order_id = $1
    `, [orderId]);

    const grossProfit = parseFloat(res.rows[0]?.gross_profit || 0);
    if (grossProfit > 0) {
      await allocateDailySalesProfit(grossProfit, `Order #${orderId}`);
    }
    return true;
  } catch (error) {
    console.error('Error in allocateOrderProfit:', error);
    return false;
  }
}

/**
 * Transfer accumulated investor profits into capital investment.
 */
export async function transferProfitToInvestment(investorId, amountToTransfer, staffId = null) {
  try {
    const transferAmount = parseFloat(amountToTransfer || 0);
    if (transferAmount <= 0) {
      return { success: false, error: 'Transfer amount must be greater than zero' };
    }

    // Verify investor exists
    const invRes = await query('SELECT name, phone, email FROM investors WHERE investor_id = $1', [investorId]);
    if (invRes.rows.length === 0) {
      return { success: false, error: 'Investor not found' };
    }
    const investor = invRes.rows[0];

    // Check available un-transferred profits for investor
    const profitSumRes = await query(
      `SELECT COALESCE(SUM(amount), 0) AS total_profit FROM profits WHERE investor_id = $1`,
      [investorId]
    );
    const availableProfit = parseFloat(profitSumRes.rows[0].total_profit || 0);

    if (transferAmount > availableProfit) {
      return { success: false, error: `Transfer amount (${transferAmount}) exceeds available investor profits (${availableProfit})` };
    }

    // Deduct profit record by inserting negative entry or updating profit logs
    await query(
      `INSERT INTO profits (investor_id, profit_date, amount, note)
       VALUES ($1, CURRENT_DATE, $2, $3)`,
      [investorId, -transferAmount, 'Transferred to capital investment']
    );

    // Create investment record
    await query(
      `INSERT INTO investments (investor_id, staff_id, investor_name, investor_phone, investor_email, amount, payment_method, reference_no, investment_date, note)
       VALUES ($1, $2, $3, $4, $5, $6, 'profit_transfer', $7, NOW(), 'Capital investment converted from profit allocation')`,
      [
        investorId,
        staffId,
        investor.name,
        investor.phone || null,
        investor.email || null,
        transferAmount,
        `PROFIT-TRANSFER-${Date.now()}`
      ]
    );

    // Recalculate investor equity shares
    await recalculateInvestorShares();

    return { success: true, transferred: transferAmount };
  } catch (error) {
    console.error('Error transferring profit to investment:', error);
    return { success: false, error: error.message };
  }
}
