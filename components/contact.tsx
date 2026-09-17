import { EMAIL } from "@/lib/constant";

export const Contact = () => {
  return (
    <div className="text-sm">
      <a href={`mailto:${EMAIL}`} className="hover:underline">
        <p className="text-zinc-500 font-medium hover:text-zinc-800 transition-all text-xs sm:text-sm">
          Akash Kumar Sinha | Connect
        </p>
      </a>
    </div>
  );
};

