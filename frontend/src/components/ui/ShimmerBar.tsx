"use client";

export function ShimmerBar({ active }: { active: boolean }) {
  return (
    <div
      className={`sticky top-0 z-10 h-0.5 overflow-hidden ${
        active ? "opacity-100" : "opacity-0"
      } transition-opacity`}
    >
      <div className="relative h-0.5 w-full bg-black/10">
        <div className="absolute inset-y-0 left-[-30%] w-[30%] bg-black/70 animate-[loading_0.9s_ease-in-out_infinite]" />
      </div>
    </div>
  );
}
