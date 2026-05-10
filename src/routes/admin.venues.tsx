import { createFileRoute } from "@tanstack/react-router";
import { CrudTable } from "@/components/admin/CrudTable";

export const Route = createFileRoute("/admin/venues")({
  component: () => (
    <CrudTable
      table="venues"
      title="Venues"
      display={["name", "city", "venue_type", "rental_price", "is_active"]}
      defaults={{ is_active: true, handpicked: false }}
      fields={[
        { key: "name" },
        { key: "venue_type", optional: true },
        { key: "description", type: "textarea", optional: true },
        { key: "address", optional: true },
        { key: "area", optional: true },
        { key: "city", optional: true },
        { key: "capacity_min", type: "number", optional: true },
        { key: "capacity_max", type: "number", optional: true },
        { key: "rooms", type: "number", optional: true },
        { key: "veg_price", type: "number", optional: true },
        { key: "non_veg_price", type: "number", optional: true },
        { key: "rental_price", type: "number", optional: true },
        { key: "cover_image_url", optional: true },
        { key: "handpicked", type: "boolean" },
        { key: "is_active", type: "boolean" },
      ]}
    />
  ),
});
