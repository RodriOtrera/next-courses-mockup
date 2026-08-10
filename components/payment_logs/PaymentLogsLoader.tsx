import { getPaymentLogs } from "@/lib/db/actions/payment_logs_action";
import PaymentLogs from "./PaymentLogs";

export default async function PaymentLogsLoader() {
    const paymentLogs = await getPaymentLogs();

    return (
        <PaymentLogs paymentLogs={paymentLogs} />
    )
}
