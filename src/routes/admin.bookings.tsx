import { createFileRoute } from "@tanstack/react-router";
import { CrudTable } from "@/components/admin/CrudTable";

export const Route = createFileRoute("/admin/bookings")({
  component: () => (
    <CrudTable
      table="bookings"
      title="Bookings"
      display={["receipt_number", "status", "total_amount", "amount_paid", "event_date"]}
      fields={[
        { key: "status", type: "select", options: ["pending", "deposit_paid", "paid", "cancelled", "refunded"] },
        { key: "amount_paid", type: "number" },
        { key: "total_amount", type: "number" },
        { key: "event_date", type: "date", optional: true },
        { key: "contact_phone", optional: true },
        { key: "notes", type: "textarea", optional: true },
        { key: "payment_method", optional: true },
      ]}
    />
  ),
});
