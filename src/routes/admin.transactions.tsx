import { createFileRoute } from "@tanstack/react-router";
import { CrudTable } from "@/components/admin/CrudTable";

export const Route = createFileRoute("/admin/transactions")({
  component: () => (
    <CrudTable
      table="transactions"
      title="Transactions"
      display={["reference", "gateway", "amount", "status", "created_at"]}
      defaults={{ gateway: "manual", status: "initiated", currency: "BDT" }}
      fields={[
        { key: "booking_id" },
        { key: "user_id" },
        { key: "gateway", type: "select", options: ["manual", "bkash", "nagad", "rocket", "bank", "card", "stripe"] },
        { key: "status", type: "select", options: ["initiated", "success", "failed", "refunded"] },
        { key: "amount", type: "number" },
        { key: "currency" },
        { key: "reference", optional: true },
      ]}
    />
  ),
});
