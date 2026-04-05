import Image from "next/image";

const Logo = () => {
  return (
    <div className="pointer-events-none absolute right-4 top-1/2 z-20 w-[230px] -translate-y-1/2 rounded-sm border-b-2 border-l-2 border-b-slate-400 border-l-slate bg-white p-2 sm:w-[270px] sm:p-3">
      <div className="relative h-8 w-full">
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
