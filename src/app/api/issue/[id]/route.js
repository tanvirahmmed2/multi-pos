import { query } from '@/lib/db';
import { isManagementRole } from '@/lib/auth';

export async function DELETE(req, { params }) {
  try {
    const auth = await isManagementRole();
    if (!auth.success) {
      return Response.json({ error: auth.message }, { status: 403 });
    }

    const { id } = await params;
    const issueId = parseInt(id, 10);

    // Fetch issue details to verify existence and check permissions
    const issueRes = await query('SELECT sender_id FROM issues WHERE issue_id = $1', [issueId]);
    
    if (issueRes.rows.length === 0) {
      return Response.json({ error: 'Issue log not found' }, { status: 404 });
    }

    const issue = issueRes.rows[0];

    // Access control: admins can delete any issue. Others can only delete issues they sent.
    if (auth.user.role !== 'admin' && issue.sender_id !== auth.user.user_id) {
      return Response.json({ error: 'Permission denied: You can only delete issues you have sent' }, { status: 403 });
    }

    await query('DELETE FROM issues WHERE issue_id = $1', [issueId]);

    return Response.json({ message: 'Issue log deleted successfully' }, { status: 200 });

  } catch (error) {
    console.error('Error deleting issue:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
