import './styles/app.css'

function App() {
  return (
    <main className="erp-shell">
      <section className="hero-card">
        <p className="eyebrow">School ERP</p>
        <h1>Admin access control is now live</h1>
        <p>
          Users and roles are now managed through the backend with permission-aware routes,
          and the frontend shell is ready for the next admin screens.
        </p>
      </section>

      <section className="feature-grid">
        <article className="feature-card">
          <h2>Users</h2>
          <p>Create, review, and manage staff accounts with role-based permissions.</p>
        </article>
        <article className="feature-card">
          <h2>Roles</h2>
          <p>Define reusable permission sets for administrators, teachers, and support staff.</p>
        </article>
        <article className="feature-card">
          <h2>Security</h2>
          <p>Protected endpoints enforce the access policy from the API layer.</p>
        </article>
      </section>
    </main>
  )
}

export default App
