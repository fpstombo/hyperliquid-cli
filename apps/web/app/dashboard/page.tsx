import { DashboardLiveData } from "../../components/dashboard-client"

export default function DashboardPage() {
  return (
    <main className="grid">
      <section>
        <h1 style={{ marginBottom: "0.5rem" }}>Dashboard</h1>
        <p className="muted" style={{ marginTop: 0 }}>
          Live account state with 5s polling.
        </p>
      </section>

      <DashboardLiveData />
    </main>
  )
}
