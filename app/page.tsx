import { Contact } from "@/components/contact";
import { Prompt } from "@/components/prompt";
import { TextureBg } from "@/components/ui/texture-bg";

export default function Home() {
  return (
    <div className="relative w-full h-screen overflow-hidden">
      <TextureBg className="h-full">
        <div className="flex flex-col items-center gap-4 w-full max-w-3xl px-4 sm:px-6">
          <div className="flex flex-col items-center justify-center text-center px-4 sm:px-10 gap-2 sm:gap-4">
            <p className="text-zinc-800 max-w-sm text-sm sm:text-base font-medium">
              Query your database with natural language.
            </p>
          </div>

          <Prompt />
        </div>
        <Contact />
      </TextureBg>
    </div>
  );
}
