type Item = {
  id: string;
  title: string;
  location: string;
  category: string;
  date: string; // ISO yyyy-mm-dd
  thumb?: string;
};

export function ItemCard({ item }: { item: Item }) {
  return (
    <article className="card hover:shadow-sm transition">
      {/* Image */}
      <div className="aspect-[4/3] overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800">
        {item.thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.thumb}
            alt={item.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-gray-500 dark:text-gray-400">
            No image
          </div>
        )}
      </div>

      {/* Content */}
      <div className="mt-3 space-y-1">
        <h3 className="font-medium leading-tight">{item.title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {item.location} • {item.category}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500">
          Found {new Date(item.date).toLocaleDateString()}
        </p>
      </div>
    </article>
  );
}
