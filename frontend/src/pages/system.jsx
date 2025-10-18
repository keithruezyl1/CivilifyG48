import { useEffect, useMemo, useState } from 'react';
import { API_URL, getAuthToken } from '../utils/auth';
import { useNavigate } from 'react-router-dom';

const SystemAdminPage = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionBusy, setActionBusy] = useState(null);
  const token = useMemo(() => getAuthToken(), []);

  const headers = useMemo(() => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }), [token]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/admin/users`, { headers });
      if (!res.ok) throw new Error('Failed to load users');
      const body = await res.json();
      const list = body?.data || [];
      setUsers(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const updateRole = async (userId, nextRole) => {
    try {
      setActionBusy(userId + ':' + nextRole);
      const res = await fetch(`${API_URL}/admin/users/${encodeURIComponent(userId)}/role`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ role: nextRole })
      });
      if (!res.ok) throw new Error('Failed to update role');
      await fetchUsers();
    } catch (e) {
      console.error(e);
    } finally {
      setActionBusy(null);
    }
  };

  const deleteUser = async (userId) => {
    if (!confirm('Delete this user?')) return;
    try {
      setActionBusy(userId + ':DELETE');
      const res = await fetch(`${API_URL}/admin/users/${encodeURIComponent(userId)}`, {
        method: 'DELETE',
        headers
      });
      if (!res.ok) throw new Error('Failed to delete user');
      await fetchUsers();
    } catch (e) {
      console.error(e);
    } finally {
      setActionBusy(null);
    }
  };

  const renderActions = (u) => {
    const isBusyPromote = actionBusy === (u.userId + ':ROLE_ADMIN');
    const isBusyDemote = actionBusy === (u.userId + ':ROLE_USER');
    const isBusyDelete = actionBusy === (u.userId + ':DELETE');
    const role = u.role || 'ROLE_USER';
    return (
      <div style={{ display: 'flex', gap: 8 }}>
        {role !== 'ROLE_ADMIN' && (
          <button disabled={isBusyPromote} onClick={() => updateRole(u.userId, 'ROLE_ADMIN')} style={styles.btnPrimary}>
            {isBusyPromote ? 'Promoting…' : 'Promote to Admin'}
          </button>
        )}
        {role !== 'ROLE_USER' && (
          <button disabled={isBusyDemote} onClick={() => updateRole(u.userId, 'ROLE_USER')} style={styles.btnSecondary}>
            {isBusyDemote ? 'Demoting…' : 'Demote to User'}
          </button>
        )}
        <button disabled={isBusyDelete} onClick={() => deleteUser(u.userId)} style={styles.btnDanger}>
          {isBusyDelete ? 'Deleting…' : 'Delete'}
        </button>
      </div>
    );
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>System Admin</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={fetchUsers} style={styles.btnGhost}>Refresh</button>
          <button onClick={() => navigate('/admin')} style={styles.btnGhost}>Go to Admin</button>
        </div>
      </div>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Users</h2>
        {loading ? (
          <div style={{ padding: 16 }}>Loading users…</div>
        ) : users.length === 0 ? (
          <div style={{ padding: 16 }}>No users found.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>User ID</th>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>Username</th>
                  <th style={styles.th}>Role</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.userId || u.email}>
                    <td style={styles.td}>{u.userId || '-'}</td>
                    <td style={styles.td}>{u.email}</td>
                    <td style={styles.td}>{u.username || '-'}</td>
                    <td style={styles.td}><span style={styles.roleBadge}>{u.role || 'ROLE_USER'}</span></td>
                    <td style={styles.td}>{renderActions(u)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>System Settings</h2>
        <p style={{ color: '#6b7280', margin: 0 }}>RBAC is active. Hierarchy: SYSTEM_ADMIN &gt; ADMIN &gt; USER.</p>
      </section>
    </div>
  );
};

const styles = {
  container: { maxWidth: 1100, margin: '24px auto', padding: '0 16px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { margin: 0, fontSize: 24 },
  section: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: 600, padding: '12px 16px', borderBottom: '1px solid #e5e7eb', margin: 0 },
  table: { width: '100%', borderCollapse: 'separate', borderSpacing: 0 },
  th: { textAlign: 'left', fontSize: 13, color: '#6b7280', padding: '12px 16px', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' },
  td: { fontSize: 14, padding: '12px 16px', borderBottom: '1px solid #f3f4f6' },
  roleBadge: { background: '#f3f4f6', color: '#111827', fontSize: 12, padding: '4px 8px', borderRadius: 999, display: 'inline-block' },
  btnPrimary: { background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 12px', cursor: 'pointer' },
  btnSecondary: { background: '#6b7280', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 12px', cursor: 'pointer' },
  btnDanger: { background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 12px', cursor: 'pointer' },
  btnGhost: { background: '#fff', color: '#111827', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', cursor: 'pointer' }
};

export default SystemAdminPage;


