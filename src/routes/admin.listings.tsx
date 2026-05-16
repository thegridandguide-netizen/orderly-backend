import { createFileRoute } from "@tanstack/react-router";
import { CrudTable } from "@/components/admin/CrudTable";
import { cityOptions, VENDOR_CATEGORIES, loadVendorProfileOptions } from "@/lib/filters";

export const Route = createFileRoute("/admin/listings")({
  component: () => (
    <CrudTable
      table="vendor_listings"
      title="Vendor Listings"
      display={["title", "category", "city", "price_from", "is_active"]}
      defaults={{ is_active: true }}
      fields={[
        { key: "title" },
        { key: "category", type: "select", options: VENDOR_CATEGORIES, optional: true },
        { key: "city", type: "select", options: cityOptions, optional: true },
        { key: "description", type: "textarea", optional: true },
        { key: "price_from", type: "number", optional: true },
        { key: "price_to", type: "number", optional: true },
        { key: "cover_image_url", optional: true },
        { key: "gallery_image_urls", optional: true },
        { key: "badge", optional: true },
        { key: "vendor_profile_id", label: "Vendor", type: "select", optionsAsync: loadVendorProfileOptions, optional: true },
        { key: "is_active", type: "boolean" },
      ]}
    />
  ),
});