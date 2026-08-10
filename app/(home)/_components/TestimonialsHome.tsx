import { getTestimonials } from "@/lib/db/actions/home/get_testimonials";
import SliderItems from "./SliderItems";
import HomeTestimonialContainer from "./HomeTestimonialContainer";

export default async function TestimonialsHome({}) {
  const testimonios = await getTestimonials();

  return (
    <SliderItems
      itemWidth={320}
      itemHeight={200}
      animationDuration={50}
      items={testimonios.map((e) => (
        <HomeTestimonialContainer {...e} key={e.id} admin={false} />
      ))}
    />
  );
}
