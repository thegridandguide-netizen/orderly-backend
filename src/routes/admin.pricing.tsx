import { createFileRoute } from "@tanstack/react-router";
import { CrudTable } from "@/components/admin/CrudTable";
import { PRICING_RULE_TYPES, PRICING_RULE_SCOPES } from "@/lib/filters";

export const Route = createFileRoute("/admin/pricing")({
  component: () => (
    <CrudTable
      table="pricing_rules"
      title="Pricing Rules"
      display={["name", "rule_type", "scope", "value", "active"]}
      defaults={{ active: true, scope: "all", rule_type: "tax_percent" }}
      fields={[
        { key: "name" },
        { key: "rule_type", type: "select", options: PRICING_RULE_TYPES },
        { key: "scope", type: "select", options: PRICING_RULE_SCOPES },
        { key: "value", type: "number" },
        { key: "starts_at", type: "date", optional: true },
        { key: "ends_at", type: "date", optional: true },
        { key: "notes", type: "textarea", optional: true },
        { key: "active", type: "boolean" },
      ]}
    />
  ),
});
