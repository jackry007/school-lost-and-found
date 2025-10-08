"use client";
import { useForm } from "react-hook-form";
import { supabase } from "@/lib/supabaseClient";
export default function ClaimForm({ itemId }: { itemId: number }) {
  const { register, handleSubmit, reset } = useForm();
  const onSubmit = async (data: any) => {
    const { error } = await supabase.from("claims").insert({
      item_id: itemId,
      claimant_name: data.name,
      claimant_email: data.email,
      proof: data.proof ?? null,
    });
    if (error) {
      alert(error.message);
      return;
    }
    alert("Claim submitted! We will review it soon.");
    reset();
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <input placeholder="Your name" className="input" {...register("name")} />
      <input
        type="email"
        placeholder="Your email"
        className="input"
        {...register("email")}
      />
      <textarea
        placeholder="Proof / description (e.g., serial #, unique
marks)"
        className="textarea"
        {...register("proof")}
      />
      <button className="btn">Submit claim</button>
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
          min-height: 100px;
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
