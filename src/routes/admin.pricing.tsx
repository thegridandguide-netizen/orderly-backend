import { createFileRoute } from "@tanstack/react-router";
import { CrudTable } from "@/components/admin/CrudTable";

export const Route = createFileRoute("/admin/pricing")({
  component: () => (
    <CrudTable
      table="pricing_rules"
      title="Pricing Rules"
      display={["name", "rule_type", "scope", "value", "active"]}
      defaults={{ active: true, scope: "all", rule_type: "tax" }}
      fields={[
        { key: "name" },
        { key: "rule_type", type: "select", options: ["tax", "discount", "fee"] },
        { key: "scope", type: "select", options: ["all", "venues", "vendors"] },
        { key: "value", type: "number" },
        { key: "starts_at", type: "date", optional: true },
        { key: "ends_at", type: "date", optional: true },
        { key: "notes", type: "textarea", optional: true },
        { key: "active", type: "boolean" },
      ]}
    />
  ),
});
