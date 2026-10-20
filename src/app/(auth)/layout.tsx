export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-white">
      {/* Left — dark branding panel */}
      <div className="relative hidden w-[420px] shrink-0 flex-col justify-between overflow-hidden p-10 lg:flex" style={{ backgroundColor: "#111440" }}>
        {/* Subtle grid overlay */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Logo */}
        <div className="relative z-10">
          <span className="inline-flex items-center gap-2 rounded-md bg-white/10 px-3 py-1.5 text-xs font-semibold tracking-widest text-white/80 uppercase">
            ERBM
          </span>
        </div>

        {/* Hero copy */}
        <div className="relative z-10 space-y-4">
          <h2 className="text-4xl font-bold leading-tight tracking-tight text-white">
            จัดการค่าใช้จ่ายโครงการ อย่างมีประสิทธิภาพ
          </h2>
          <p className="text-sm leading-relaxed text-white/50">
            ระบบบริหารเงินทดรองจ่าย รายจ่าย และการปิดบัญชี
          </p>
        </div>

        {/* Bottom decoration */}
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-white/5 blur-3xl"
        />
      </div>

      {/* Right — form area */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        {/* Mobile logo */}
        <div className="mb-8 lg:hidden">
          <span className="inline-flex items-center gap-2 rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-semibold tracking-widest text-white uppercase">
            ERBM
          </span>
        </div>

        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
