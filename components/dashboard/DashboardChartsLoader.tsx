import { getPaymentLogs } from "@/lib/db/actions/payment_logs_action";
import DashboardCharts from "./DashboardCharts";

export default async function DashboardChartsLoader() {
  const paymentLogs = await getPaymentLogs();
  return <DashboardCharts paymentLogs={paymentLogs} />;
}
