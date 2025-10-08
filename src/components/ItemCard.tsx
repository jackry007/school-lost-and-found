import Link from "next/link";
import { Item } from "@/lib/types";
export default function ItemCard({ item }: { item: Item }) {
  return (
    <Link
      href={`/items/${item.id}`}
      className="block border rounded-xl p-4
hover:shadow"
    >
      {item.photo_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.photo_url}
          alt={item.title}
          className="w-full h-48
object-cover rounded"
        />
      )}
      <h3 className="mt-2 font-semibold">{item.title}</h3>
      <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
      <div className="text-xs mt-2 text-gray-500">
        Found: {item.location_found ?? "—"} ·{" "}
        {new Date(item.date_found).toLocaleDateString()}
      </div>
    </Link>
  );
}
