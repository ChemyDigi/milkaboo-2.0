"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

interface CowHeadTrackerProps {
  onMoo?: () => void;
  greetingActive?: boolean;
}

export default function CowHeadTracker({ onMoo, greetingActive = false }: CowHeadTrackerProps) {
  const headRef = useRef<HTMLDivElement>(null);
  const [headTransform, setHeadTransform] = useState({
    rotateX: 0,
    rotateY: 0,
    rotateZ: 0,
    translateX: 0,
    translateY: 0,
    translateZ: 0,
  });
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    let animId: number;
    let targetX = 0;
    let targetY = 0;
    let curX = 0;
    let curY = 0;

    const onPointerMove = (e: MouseEvent) => {
      const el = headRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height * 0.5;

      // Normalized coordinates relative to cow head (-1 to 1 across the viewport)
      const dx = (e.clientX - centerX) / (window.innerWidth * 0.45);
      const dy = (e.clientY - centerY) / (window.innerHeight * 0.45);

      targetX = Math.max(-1, Math.min(1, dx));
      targetY = Math.max(-1, Math.min(1, dy));
    };

    const updateGaze = () => {
      // Smooth interpolation for lifelike, responsive 3D head movement (no video)
      curX += (targetX - curX) * 0.1;
      curY += (targetY - curY) * 0.1;

      // 3D Head rotation:
      // When cursor moves right (curX > 0) -> head turns right (rotateY > 0)
      // When cursor moves down (curY > 0) -> head tilts down (rotateX < 0)
      setHeadTransform({
        rotateY: curX * 22, // up to 22 degrees left/right turn
        rotateX: -curY * 16, // up to 16 degrees up/down tilt
        rotateZ: curX * 3.5, // slight natural ear/neck banking
        translateX: curX * 7, // slight translation toward cursor
        translateY: curY * 5,
        translateZ: 15, // bring head forward in 3D perspective
      });

      // Micro eye pupil tracking within the head
      setEyeOffset({
        x: curX * 3.5,
        y: curY * 2.5,
      });

      animId = requestAnimationFrame(updateGaze);
    };

    window.addEventListener("mousemove", onPointerMove, { passive: true });
    animId = requestAnimationFrame(updateGaze);

    return () => {
      window.removeEventListener("mousemove", onPointerMove);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div
      ref={headRef}
      onClick={onMoo}
      className="group relative w-full h-full cursor-pointer select-none"
      style={{
        perspective: "800px",
        perspectiveOrigin: "50% 50%",
      }}
      aria-label="Milka Boo 3D mascot cow head"
    >
      {/* Interactive Moo speech bubble */}
      <div
        className={`absolute -top-14 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-2xl bg-white px-3.5 py-1.5 shadow-2xl transition-all duration-300 pointer-events-none z-40 ${
          greetingActive
            ? "opacity-100 scale-100 -translate-y-2"
            : "opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100"
        }`}
      >
        <p className="font-['Lato',sans-serif] text-xs font-bold text-[#241a33]">
          {greetingActive ? "🐮 Moo! Welcome to Milka Boo! ✨" : "👋 Move your cursor to look around!"}
        </p>
        <div className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 bg-white" />
      </div>

      {/* Volumetric 3D Head Container */}
      <div
        className="relative w-full h-full"
        style={{
          transformStyle: "preserve-3d",
          transformOrigin: "50% 88%", // anchored at the cow's neck collar
          transform: `perspective(800px) rotateY(${headTransform.rotateY}deg) rotateX(${headTransform.rotateX}deg) rotateZ(${headTransform.rotateZ}deg) translate3d(${headTransform.translateX}px, ${headTransform.translateY}px, ${headTransform.translateZ}px)`,
          transition: "transform 25ms linear",
          filter: "drop-shadow(0 8px 16px rgba(36, 26, 51, 0.28))",
        }}
      >
        {/* The Full Cow Head Layer (cutout) */}
        <Image
          src="/images/cow_head_cutout.png"
          alt="Milka Boo Cow 3D Head"
          fill
          priority
          sizes="(max-width: 768px) 30vw, 22vw"
          className="object-contain object-center pointer-events-none select-none"
        />

        {/* Dynamic Eye Pupil Tracking Overlays (integrated inside the 3D head) */}
        {/* Left Eye Pupil */}
        <div
          className="absolute rounded-full pointer-events-none overflow-hidden"
          style={{
            left: "34%",
            top: "52%",
            width: "8%",
            height: "14%",
            transform: `translate3d(${eyeOffset.x}px, ${eyeOffset.y}px, 2px)`,
            transition: "transform 20ms linear",
          }}
        >
          <div className="w-full h-full rounded-full bg-[#1e1528] relative">
            <span className="absolute top-[16%] left-[20%] w-[38%] h-[38%] rounded-full bg-white/90" />
            <span className="absolute bottom-[20%] right-[22%] w-[18%] h-[18%] rounded-full bg-white/70" />
          </div>
        </div>

        {/* Right Eye Pupil */}
        <div
          className="absolute rounded-full pointer-events-none overflow-hidden"
          style={{
            left: "58.5%",
            top: "52%",
            width: "8%",
            height: "14%",
            transform: `translate3d(${eyeOffset.x}px, ${eyeOffset.y}px, 2px)`,
            transition: "transform 20ms linear",
          }}
        >
          <div className="w-full h-full rounded-full bg-[#1e1528] relative">
            <span className="absolute top-[16%] left-[20%] w-[38%] h-[38%] rounded-full bg-white/90" />
            <span className="absolute bottom-[20%] right-[22%] w-[18%] h-[18%] rounded-full bg-white/70" />
          </div>
        </div>
      </div>
    </div>
  );
}
