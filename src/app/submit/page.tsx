// src/app/submit/page.tsx
import ItemForm from "@/components/ItemForm";

export default function SubmitPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Report a Found Item</h1>
      <ItemForm />
    </div>
  );
}
