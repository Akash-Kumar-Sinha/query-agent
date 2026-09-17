import { Contact } from "@/components/contact";
import { Prompt } from "@/components/prompt";
import { TextureBg } from "@/components/ui/texture-bg";
import { Logo } from "@/components/Logo/logo";

export default function Home() {
  return (
    <div className="relative w-full h-screen overflow-hidden">
      <TextureBg className="h-full">
        <header className="w-full flex items-center justify-between px-4 sm:px-8 py-3.5 fixed top-0 left-0 z-20 pointer-events-none">
          <div className="pointer-events-auto">
            <Logo size={28} />
          </div>
          <div className="pointer-events-auto">
            <Contact />
          </div>
        </header>

        <div className="flex flex-col items-center gap-4 w-full max-w-3xl px-4 sm:px-6">
          <Prompt />
        </div>
      </TextureBg>
    </div>
  );
}
