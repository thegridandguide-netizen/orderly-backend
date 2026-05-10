import { createFileRoute } from "@tanstack/react-router";
import { CrudTable } from "@/components/admin/CrudTable";

export const Route = createFileRoute("/admin/photos")({
  component: () => (
    <CrudTable
      table="photos"
      title="Photos"
      display={["title", "category", "city", "image_url"]}
      fields={[
        { key: "image_url" },
        { key: "title", optional: true },
        { key: "category", optional: true },
        { key: "city", optional: true },
        { key: "album_id", optional: true },
      ]}
    />
  ),
});
