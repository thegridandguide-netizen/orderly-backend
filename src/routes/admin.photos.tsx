import { createFileRoute } from "@tanstack/react-router";
import { CrudTable } from "@/components/admin/CrudTable";
import { cityOptions, loadAlbumOptions } from "@/lib/filters";

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
        { key: "city", type: "select", options: cityOptions, optional: true },
        { key: "album_id", label: "Album", type: "select", optionsAsync: loadAlbumOptions, optional: true },
      ]}
    />
  ),
});
