import { DashboardLiveData } from "../../components/dashboard-client"

export default function DashboardPage() {
  return (
    <main className="grid dashboard-shell signature-shell">
      <section className="dashboard-shell-header signature-hero-strip" style={{ padding: "var(--space-4)" }}>
        <h1 style={{ margin: "0 0 0.35rem" }}>Dashboard</h1>
        <p className="muted" style={{ margin: 0 }}>
          Live account state with 5s polling.
        </p>
      </section>

      <DashboardLiveData />
    </main>
  )
}
