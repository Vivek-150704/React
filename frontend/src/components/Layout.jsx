import { BarChart3, FileSpreadsheet, LogOut, Menu, ShieldCheck, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "./ui.jsx";
import { UserManagementModal } from "./UserManagementModal.jsx";

export function Layout({ children, page, user, onNavigate, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [usersOpen, setUsersOpen] = useState(false);
  const profileRef = useRef(null);
  const initials = user.fullName.split(" ").filter(Boolean).map((part) => part[0]).slice(0, 2).join("").toUpperCase();

  useEffect(() => {
    if (!profileOpen) return undefined;
    const closeOutside = (event) => { if (!profileRef.current?.contains(event.target)) setProfileOpen(false); };
    const closeEscape = (event) => { if (event.key === "Escape") setProfileOpen(false); };
    document.addEventListener("mousedown", closeOutside);
    document.addEventListener("keydown", closeEscape);
    return () => {
      document.removeEventListener("mousedown", closeOutside);
      document.removeEventListener("keydown", closeEscape);
    };
  }, [profileOpen]);

  const navigate = (nextPage) => { onNavigate(nextPage); setMenuOpen(false); };

  return (
    <div className="app-shell">
      <aside className={menuOpen ? "sidebar open" : "sidebar"}>
        <div className="brand">
          <div className="brand-mark">M</div><div><strong>MARS</strong><span>Fines &amp; Fees</span></div>
          <button className="mobile-close" onClick={() => setMenuOpen(false)} aria-label="Close navigation"><X size={20}/></button>
        </div>
        <nav aria-label="Primary navigation">
          <button className={page === "dashboard" ? "active" : ""} onClick={() => navigate("dashboard")}><BarChart3 size={19}/><span>Executive Summary</span></button>
          <button className={page === "fines" ? "active" : ""} onClick={() => navigate("fines")}><FileSpreadsheet size={19}/><span>Fines Details</span></button>
        </nav>
        <div className="sidebar-bottom" ref={profileRef}>
          {profileOpen && (
            <section className="profile-popover profile-actions-only" role="dialog" aria-label="Profile actions">
              {user.role === "Admin" && <Button variant="secondary" className="profile-signout" onClick={() => { setUsersOpen(true); setProfileOpen(false); }}>User Management</Button>}
              <Button variant="secondary" className="profile-signout" onClick={onLogout}><LogOut size={16}/> Sign out</Button>
            </section>
          )}
          <button className="profile" onClick={() => setProfileOpen((open) => !open)} aria-expanded={profileOpen} aria-haspopup="dialog">
            <div className="avatar">{initials}</div><div><strong>{user.fullName}</strong><span>{user.role}</span></div><ShieldCheck size={17}/>
          </button>
        </div>
      </aside>
      {menuOpen && <button className="nav-scrim" onClick={() => setMenuOpen(false)} aria-label="Close navigation"/>}
      <main className="main"><button className="menu-btn" onClick={() => setMenuOpen(true)} aria-label="Open navigation"><Menu size={21}/></button><div className="content">{children}</div></main>
      {usersOpen && <UserManagementModal currentUser={user} onClose={() => setUsersOpen(false)}/>}
    </div>
  );
}
