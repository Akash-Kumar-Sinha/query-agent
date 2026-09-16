import { EMAIL } from "@/lib/constant";

export const Contact = () => {
  return (
    <div className="absolute top-1 right-2 text-sm">
      <a href={`mailto:${EMAIL}`} className="hover:underline">
        <div className="space-y-3">
          <p className="text-zinc-500 font-medium hover:text-zinc-800 transition-all">
            Akash Kumar Sinha | Connect
          </p>
        </div>
      </a>
    </div>
  );
};

