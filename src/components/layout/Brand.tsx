export default function Brand({ inverted = false }: { inverted?: boolean }) {
  return (
    <span className="inline-flex items-center gap-3 sm:gap-6" aria-label="Sense Infotech ERBM">
      <span className="inline-flex items-center" aria-hidden>
        <span className="font-serif text-[44px] font-normal leading-[0.8] tracking-[-0.12em] text-primary sm:text-[54px]">S</span>
        <span className={`ml-1 flex flex-col pt-2 text-left sm:pt-3 ${inverted ? "text-white" : "text-text-primary"}`}>
          <span className="text-xs font-bold leading-3 sm:text-[14px]">Sense</span>
          <span className="mt-0.5 text-[8px] leading-3 tracking-[0.02em] sm:text-[9px]">Infotech</span>
        </span>
      </span>
      <span className={`border-l pl-3 text-xs font-bold leading-6 sm:pl-6 sm:text-sm ${inverted ? "border-white/20 text-white" : "border-border text-text-primary"}`}>ERBM</span>
    </span>
  );
}
