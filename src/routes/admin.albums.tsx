import { createFileRoute } from "@tanstack/react-router";
import { CrudTable } from "@/components/admin/CrudTable";

export const Route = createFileRoute("/admin/albums")({
  component: () => (
    <CrudTable
      table="albums"
      title="Albums"
      display={["title", "city", "featured"]}
      defaults={{ featured: false }}
      fields={[
        { key: "title" },
        { key: "city", optional: true },
        { key: "cover_image_url", optional: true },
        { key: "featured", type: "boolean" },
      ]}
    />
  ),
});
