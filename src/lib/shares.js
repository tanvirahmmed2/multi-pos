import { query } from '@/lib/db';

export async function recalculateShares() {
  try {
    // 1. Fetch grand total of all investments
    const grandTotalRes = await query(
      `SELECT COALESCE(SUM(amount), 0) AS global_total FROM investments WHERE investor_id IS NOT NULL`
    );
    const globalTotal = parseFloat(grandTotalRes.rows[0]?.global_total || 0);

    // 2. Fetch investment total grouped by investor
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

    // 3. Fetch all investors
    const investorsRes = await query(`SELECT investor_id, is_active FROM investors`);
    const investors = investorsRes.rows;

    for (const inv of investors) {
      const invTotal = investorTotalsMap[inv.investor_id] || 0;
      const sharePct = (globalTotal > 0 && invTotal > 0)
        ? Math.round((invTotal / globalTotal) * 100 * 100) / 100
        : 0.00;

      // Check if share entry exists for investor
      const existingShare = await query(
        `SELECT share_id FROM shares WHERE investor_id = $1 LIMIT 1`,
        [inv.investor_id]
      );

      if (existingShare.rows.length > 0) {
        await query(
          `UPDATE shares
           SET share_percentage = $1,
               status = $2,
               updated_at = NOW()
           WHERE investor_id = $3`,
          [sharePct, inv.is_active ? 'active' : 'inactive', inv.investor_id]
        );
      } else if (sharePct > 0 || invTotal > 0) {
        await query(
          `INSERT INTO shares (investor_id, share_percentage, status)
           VALUES ($1, $2, $3)`,
          [inv.investor_id, sharePct, inv.is_active ? 'active' : 'inactive']
        );
      }
    }

    return { success: true, globalTotal };
  } catch (error) {
    console.error('Error recalculating shares:', error);
    return { success: false, error: error.message };
  }
}
