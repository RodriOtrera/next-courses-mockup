import Image from "next/image";
import React from "react";
import { Rating } from "./Rating";

import { Button } from "../ui/button";

import MercadoPagoIcon from "../icons/MercadoPagoIcon";
import { buyCourse } from "@/lib/db/actions/courses/buy_course";
import { CourseGet } from "@/lib/db/actions/courses/get_courses";
import PaypalInterface from "@/app/(home)/_components/PaypalInterface";
import { paypalAction, obtainCourseAction } from "@/lib/db/actions/courses/paypal_checkout";
import { ClockIcon } from "lucide-react";

import { priceFormatter as formatter } from "@/lib/seo/site";

const BackGroundCourse: React.FC<CourseGet> = async ({
  img_url,
  price,
  price_usd,
  duracion,
  id,
  title,
  rating,
}) => {
  return (
    <div className="relative">
      {/* Background Image with Gradient Overlay */}
      <div className="relative h-[50vh] md:h-[60vh] overflow-hidden">
        <Image
          className="object-cover"
          fill={true}
          alt={title}
          src={img_url == null ? "/imagen-prueba-2.jpg" : img_url}
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a]/80 to-transparent" />

        {/* Content */}
        <div className="absolute inset-0 flex items-end">
          <div className="w-full max-w-6xl mx-auto px-6 pb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            {/* Course Info */}
            <div className="flex flex-col gap-3">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white leading-tight max-w-2xl">
                {title}
              </h1>
              <div className="flex items-center gap-4">
                {/* No testimonials means no rating. Falling back to a default
                    here would display a rating nobody gave — and the same value
                    feeds AggregateRating structured data. */}
                {rating !== null && (
                  <Rating
                    initialValue={rating}
                    readonly={true}
                    size="small"
                    showValue={true}
                  />
                )}
                {duracion && (
                  <div className="flex items-center gap-1.5 text-neutral-300 text-sm">
                    <ClockIcon className="w-4 h-4" />
                    {duracion}
                  </div>
                )}
              </div>
            </div>

            {/* Purchase Card */}
            <div className="flex flex-col items-center rounded-2xl backdrop-blur-xl bg-white/[0.08] border border-white/10 p-5 gap-3 w-full md:w-72 lg:w-80 shrink-0">
              <h2 className="text-lg font-bold text-white">Comprar curso</h2>

              <form action={buyCourse} className="w-full">
                <input type="hidden" name="course_id" defaultValue={id} />
                <Button
                  className="w-full text-base md:text-lg h-12"
                  variant="outline"
                >
                  <MercadoPagoIcon className="w-6 h-6 mr-2" />
                  {formatter.format(price)} ARS
                </Button>
              </form>

              {price_usd > 0 && (
                <>
                  <div className="flex items-center gap-2 w-full">
                    <div className="h-px flex-1 bg-white/20" />
                    <span className="text-xs text-white/50">o</span>
                    <div className="h-px flex-1 bg-white/20" />
                  </div>
                  <PaypalInterface
                    productId={id}
                    productType="course"
                    action={paypalAction.bind(null, id)}
                    onApproveAction={obtainCourseAction}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackGroundCourse;
