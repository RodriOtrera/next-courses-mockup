"use client";

import React from "react";
import { TestimonialSelectWithCourse } from "@/lib/db/actions/courses/get_courses";
import Testimonials from "./Testimonials";
import { MessageCircleHeartIcon, SparklesIcon } from "lucide-react";

interface TestimonialCarouselProps {
  testimonials: TestimonialSelectWithCourse[];
}

function MarqueeRow({
  items,
  direction = "left",
  duration = 40,
}: {
  items: TestimonialSelectWithCourse[];
  direction?: "left" | "right";
  duration?: number;
}) {
  return (
    <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,white_8%,white_92%,transparent)]">
      <div
        className={`flex items-stretch w-max gap-5 py-2 ${
          direction === "left"
            ? "animate-marquee-left"
            : "animate-marquee-right"
        }`}
        style={{ animationDuration: `${duration}s` }}
      >
        {[...items, ...items].map((t, i) => (
          <div key={`${t.id}-${i}`} className="w-[340px] shrink-0">
            <Testimonials testimonial={t} />
          </div>
        ))}
      </div>
    </div>
  );
}

const TestimonialCarousel: React.FC<TestimonialCarouselProps> = ({
  testimonials,
}) => {
  const useTwoRows = testimonials.length > 24;

  if (useTwoRows) {
    const mid = Math.ceil(testimonials.length / 2);
    const row1 = testimonials.slice(0, mid);
    const row2 = testimonials.slice(mid);

    return (
      <div className="space-y-5">
        <MarqueeRow items={row1} direction="left" duration={80} />
        <MarqueeRow items={row2} direction="right" duration={85} />
      </div>
    );
  }

  return (
    <div>
      <MarqueeRow items={testimonials} direction="left" duration={70} />
    </div>
  );
};

export default TestimonialCarousel;
