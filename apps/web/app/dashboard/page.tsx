import dynamic from "next/dynamic"

const DashboardClient = dynamic(() => import("../../components/dashboard-client").then((module) => module.DashboardClient), {
  ssr: false,
})

export default function DashboardPage() {
  return <DashboardClient />
}
