import { createFileRoute } from "@tanstack/react-router";
import { CrudTable } from "@/components/admin/CrudTable";

export const Route = createFileRoute("/admin/categories")({
  component: () => (
    <CrudTable
      table="event_categories"
      title="Event Categories"
      display={["title", "slug", "sort_order"]}
      defaults={{ sort_order: 0 }}
      fields={[
        { key: "title" },
        { key: "slug" },
        { key: "icon", optional: true },
        { key: "sort_order", type: "number" },
      ]}
    />
  ),
});
