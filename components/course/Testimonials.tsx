import React from "react";
import { Rating } from "./Rating";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { TestimonialSelectWithCourse } from "@/lib/db/actions/courses/get_courses";
import { QuoteIcon } from "lucide-react";

interface TestimonialProps {
  testimonial: TestimonialSelectWithCourse;
}

const Testimonials: React.FC<TestimonialProps> = ({ testimonial }) => {
  return (
    <div className="group relative h-full flex flex-col rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm p-5 mx-2 transition-colors duration-300 hover:border-white/[0.15] hover:bg-white/[0.05]">
      <QuoteIcon className="absolute top-4 right-4 w-5 h-5 text-red-500/20 group-hover:text-red-500/40 transition-colors" />
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10 ring-2 ring-white/[0.08]">
          {!!testimonial.user.image && (
            <AvatarImage src={testimonial.user.image} />
          )}
          <AvatarFallback className="bg-red-500/10 text-red-400 text-xs font-semibold">
            {!!testimonial.user.name
              ? testimonial.user.name.slice(0, 2).toUpperCase()
              : "?"}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold text-white/90 leading-tight">
            {testimonial.user.name}
          </span>
          <Rating
            initialValue={+testimonial.rating}
            readonly={true}
            size="small"
            showValue={false}
          />
        </div>
      </div>
      <p className="mt-3 text-[13px] leading-relaxed text-white/50 line-clamp-4 flex-1">
        {testimonial.content}
      </p>
    </div>
  );
};

export default Testimonials;
