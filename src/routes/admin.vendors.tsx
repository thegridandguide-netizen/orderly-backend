import { createFileRoute } from "@tanstack/react-router";
import { CrudTable } from "@/components/admin/CrudTable";

export const Route = createFileRoute("/admin/vendors")({
  component: () => (
    <CrudTable
      table="vendor_profiles"
      title="Vendor Profiles"
      display={["business_name", "city", "phone", "verified"]}
      defaults={{ verified: false }}
      fields={[
        { key: "business_name" },
        { key: "user_id", optional: true },
        { key: "phone", optional: true },
        { key: "city", optional: true },
        { key: "bio", type: "textarea", optional: true },
        { key: "price_from", type: "number", optional: true },
        { key: "price_to", type: "number", optional: true },
        { key: "cover_image_url", optional: true },
        { key: "verified", type: "boolean" },
      ]}
    />
  ),
});
