import { createFileRoute } from "@tanstack/react-router";
import { CrudTable } from "@/components/admin/CrudTable";

export const Route = createFileRoute("/admin/listings")({
  component: () => (
    <CrudTable
      table="vendor_listings"
      title="Vendor Listings"
      display={["title", "category", "city", "price_from", "is_active"]}
      defaults={{ is_active: true }}
      fields={[
        { key: "title" },
        { key: "category", optional: true },
        { key: "city", optional: true },
        { key: "description", type: "textarea", optional: true },
        { key: "price_from", type: "number", optional: true },
        { key: "price_to", type: "number", optional: true },
        { key: "cover_image_url", optional: true },
        { key: "badge", optional: true },
        { key: "vendor_profile_id", optional: true },
        { key: "is_active", type: "boolean" },
      ]}
    />
  ),
});
