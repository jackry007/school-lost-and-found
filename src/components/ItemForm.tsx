"use client";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/lib/supabaseClient";
const schema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  category: z.string().optional(),
  location_found: z.string().optional(),
  date_found: z.string().min(4),
  photo: z.any().optional(),
});
type FormData = z.infer<typeof schema>;
export default function ItemForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });
  const onSubmit = async (data: FormData) => {
    let photo_url: string | null = null;
    9;
    const fileList = (data as any).photo as FileList | undefined;
    if (fileList && fileList[0]) {
      const file = fileList[0];
      const path = `${Date.now()}_${file.name}`;
      const { error: upErr } = await supabase.storage
        .from("itemphotos")
        .upload(path, file);
      if (upErr) {
        alert(upErr.message);
        return;
      }
      const { data: pub } = supabase.storage
        .from("itemphotos")
        .getPublicUrl(path);
      photo_url = pub.publicUrl;
    }
    const { error } = await supabase.from("items").insert({
      title: data.title,
      description: data.description ?? null,
      category: data.category ?? null,
      location_found: data.location_found ?? null,
      date_found: data.date_found,
      photo_url,
    });
    if (error) {
      alert(error.message);
      return;
    }
    alert("Item submitted! (Staff review not required for listing)");
    reset();
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-xl">
      <input
        placeholder="Item title"
        className="input"
        {...register("title")}
      />
      <textarea
        placeholder="Description"
        className="textarea"
        {...register("description")}
      />
      <input
        placeholder="Category (e.g., Electronics)"
        className="input"
        {...register("category")}
      />
      <input
        placeholder="Location found (e.g., Library)"
        className="input"
        {...register("location_found")}
      />
      <input type="date" className="input" {...register("date_found")} />
      <input
        type="file"
        accept="image/*"
        className="input"
        {...register("photo")}
      />
      <button disabled={isSubmitting} className="btn">
        Submit
      </button>
      {Object.values(errors).length > 0 && (
        <p className="text-red-600 textsm">Fix form errors above.</p>
      )}
      <style jsx>{`
        .input {
          width: 100%;
          border: 1px solid #e5e7eb;
          border-radius: . 75rem;
          padding: 0.6rem;
        }
        .textarea {
          width: 100%;
          border: 1px solid #e5e7eb;
          border-radius: . 75rem;
          padding: 0.6rem;
          min-height: 120px;
        }
        .btn {
          background: black;
          color: white;
          padding: 0.6rem 1rem;
          border-radius: . 75rem;
        }
      `}</style>
    </form>
  );
}
