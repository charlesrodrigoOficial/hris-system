import Image from "next/image";

const Logo = () => {
  return (
    <div className="pointer-events-none absolute right-4 top-1/2 z-20 w-[320px] -translate-y-1/2 rounded-sm border-b-8 border-l-8 border-b-slate-400 border-l-slate bg-white p-6">
      <div className="relative h-9 w-full">
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
