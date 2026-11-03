import { useEffect, useState } from "react";
import { UserPlus, Trash2, RefreshCw } from "lucide-react";
import { authService } from "../services/authService.js";
import { Button, Modal } from "./ui.jsx";

export function UserManagementModal({ currentUser, onClose }) {
  const [users, setUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [assignedRoles, setAssignedRoles] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ fullName: "", email: "", password: "" });

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [userRows, requestRows] = await Promise.all([authService.users(), authService.requests()]);
      setUsers(userRows);
      setRequests(requestRows);
    }
    catch (e) { setError(e.message || "Unable to load users."); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password.length < 12) { setError("Use a password with at least 12 characters."); return; }
    setCreating(true);
    try {
      await authService.createAdmin(form.fullName, form.email, form.password);
      setForm({ fullName: "", email: "", password: "" });
      await load();
    } catch (e) { setError(e.message || "Unable to create Admin."); }
    finally { setCreating(false); }
  };

  const decideRequest = async (request, decision) => {
    setError("");
    try {
      await authService.decide(request.id, decision, assignedRoles[request.id] || "Viewer");
      await load();
    } catch (e) { setError(e.message || "Unable to update registration request."); }
  };

  const remove = async (user) => {
    if (!window.confirm(`Delete ${user.fullName} (${user.email})? This cannot be undone.`)) return;
    setError("");
    try { await authService.deleteUser(user.id); await load(); }
    catch (e) { setError(e.message || "Unable to delete user."); }
  };

  return <Modal title="User Management" onClose={onClose} className="users-modal">
    <div className="modal-body">
      <div className="user-management-heading">
        <div><h3>Manage application access</h3><p>Create additional Admin accounts or remove users who no longer need access.</p></div>
        <Button variant="secondary" onClick={load} disabled={loading}><RefreshCw size={15}/> Refresh</Button>
      </div>
      <form className="admin-create-form" onSubmit={create}>
        <h3><UserPlus size={17}/> Add another Admin</h3>
        <div className="admin-create-fields">
          <label className="form-field"><span>Full name</span><input required minLength={2} value={form.fullName} onChange={e => setForm({...form, fullName:e.target.value})}/></label>
          <label className="form-field"><span>Work email</span><input required type="email" value={form.email} onChange={e => setForm({...form, email:e.target.value})}/></label>
          <label className="form-field"><span>Temporary password (12+ characters)</span><input required type="password" minLength={12} value={form.password} onChange={e => setForm({...form, password:e.target.value})}/></label>
        </div>
        <div className="admin-create-actions"><Button type="submit" disabled={creating}>{creating ? "Creating…" : "Create Admin"}</Button></div>
      </form>
      {error && <div className="alert error">{error}</div>}
      <div className="user-management-heading"><div><h3>Registration requests</h3><p>{requests.filter(r => r.status === "Pending Approval").length} awaiting approval</p></div></div>
      <div className="table-wrap user-list-table"><table>
        <thead><tr><th>Name</th><th>Email</th><th>Requested role</th><th>Registered</th><th>Decision</th></tr></thead>
        <tbody>{requests.filter(r => r.status === "Pending Approval").map(request => <tr key={request.id}>
          <td>{request.fullName}</td><td>{request.email}</td><td>{request.requestedRole}</td>
          <td>{request.registeredAt ? new Date(request.registeredAt).toLocaleDateString() : "—"}</td>
          <td><div className="registration-actions"><select aria-label="Assigned role" value={assignedRoles[request.id] || "Viewer"} onChange={e => setAssignedRoles({...assignedRoles, [request.id]:e.target.value})}><option>Viewer</option><option>Super User</option></select><Button onClick={() => decideRequest(request, "approve")}>Approve</Button><Button variant="danger" onClick={() => decideRequest(request, "reject")}>Reject</Button></div></td>
        </tr>)}</tbody>
      </table></div>
            <div className="user-management-heading"><div><h3>Existing users</h3><p>{users.length} account(s)</p></div></div>
      {loading ? <p>Loading users…</p> : <div className="table-wrap user-list-table"><table>
        <thead><tr><th>User</th><th>Email</th><th>Role</th><th>Status</th><th>Action</th></tr></thead>
        <tbody>{users.map(user => <tr key={user.id}>
          <td>{user.fullName}</td><td>{user.email}</td><td>{user.role}</td><td>{user.status}</td>
          <td>{user.id === currentUser.id ? <span className="muted-note">Current account</span> : <Button variant="danger" onClick={() => remove(user)}><Trash2 size={14}/> Delete</Button>}</td>
        </tr>)}</tbody>
      </table></div>}
    </div>
  </Modal>;
}
