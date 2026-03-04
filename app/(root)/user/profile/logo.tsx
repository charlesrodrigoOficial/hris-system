import Image from "next/image";

const Logo = () => {
  return (
    <div className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 z-20 w-[410px] border-l-8 border-l-slate border-b-8 border-b-slate-400 rounded-sm bg-white p-8 shadow-2xl">
      <div className="relative h-12 w-full">
        <Image
          src="/images/favicon.png"
          alt="Intelura Logo"
          fill
          className="object-contain"
          priority
        />
      </div>
    </div>
  );
};

export default Logo;