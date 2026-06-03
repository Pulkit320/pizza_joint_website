/**
 * @file        AdminDashboard.jsx
 * @module      AdminDashboard
 * @description Page-level component representing the admin dashboard view.
 * @layer       route
 * @author      Architect Agent
 * @version     1.0.0
 */

import React from 'react';

/**
 * @function  AdminDashboard
 * @summary   Renders the administrative dashboard page layout
 * @returns   {React.ReactElement} The dashboard HTML template
 */
function AdminDashboard() {
  return (
    <main className="admin-dashboard">
      <h1>Admin Dashboard</h1>
      <section className="admin-content">
        <p>Welcome to the Pizza Joint Admin Panel.</p>
      </section>
    </main>
  );
}

export default AdminDashboard;
