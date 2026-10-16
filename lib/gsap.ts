"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, MorphSVGPlugin, useGSAP);

export { gsap, ScrollTrigger, MorphSVGPlugin, useGSAP };
