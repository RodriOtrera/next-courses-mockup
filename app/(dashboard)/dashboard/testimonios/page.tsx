import { getTestimonials } from "@/lib/db/actions/home/get_testimonials";
import HomeTestimonialContainer from "@/app/(home)/_components/HomeTestimonialContainer";
import TestimonialHomeDialog from "@/app/(home)/_components/TestimonialHomeDialog";
import { TestimonialCards } from "@/app/(home)/_components/TestimonialsStacked";

export default async function TestimoniosPage({}) {
  const testimonialsOfPage = await getTestimonials();

  return (
    <div className="min-h-screen py-10 px-6 md:px-12">
      {/* Header + Create */}
      <div className="flex items-center justify-between mb-10 max-w-5xl mx-auto">
        <div>
          <h1 className="text-2xl font-black uppercase text-white">
            Testimonios
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            {testimonialsOfPage.length} testimonio
            {testimonialsOfPage.length !== 1 ? "s" : ""} publicados
          </p>
        </div>
        <TestimonialHomeDialog />
      </div>

      {/* Live Preview */}
      {testimonialsOfPage.length > 0 && (
        <div className="max-w-5xl mx-auto mb-14">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
              Vista previa en vivo
            </span>
          </div>

          {/* Preview container styled like the homepage section */}
          <div className="rounded-xl border border-white/[0.06] bg-[#050505] p-6 sm:p-10 overflow-hidden">
            <div className="max-w-4xl mx-auto">
              <TestimonialCards
                testimonials={testimonialsOfPage}
                cardHeight="h-[400px] sm:h-[280px]"
              />
            </div>
          </div>
        </div>
      )}

      {/* Admin Grid */}
      {testimonialsOfPage.length > 0 && (
        <div className="max-w-5xl mx-auto">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-500 mb-4">
            Administrar testimonios
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {testimonialsOfPage.map((e) => (
              <HomeTestimonialContainer admin={true} {...e} key={e.id} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
