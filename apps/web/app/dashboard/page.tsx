import { DashboardLiveData } from "../../components/dashboard-client"

export default function DashboardPage() {
  return (
    <main className="grid dashboard-shell signature-shell">
      <section className="dashboard-shell-header signature-hero-strip">
        <h1 className="dashboard-page-title">Dashboard</h1>
        <p className="muted dashboard-page-subtitle route-context-subtitle is-visible">
          Live account state with 5s polling.
        </p>
      </section>

      <DashboardLiveData />
    </main>
  )
}
