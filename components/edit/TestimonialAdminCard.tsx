import { TestimonialSelectWithCourse } from "@/lib/db/actions/courses/get_courses";
import { deleteTestimonial, updateTestimonial } from "@/lib/db/actions/testimonials_actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Rating } from "@/components/course/Rating";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DialogFooter, DialogClose } from "@/components/ui/dialog";
import EditDialog from "@/components/edit/EditDialog";
import RatingInput from "@/components/edit/RatingInput";
import { PencilIcon, QuoteIcon, Trash2Icon } from "lucide-react";

interface TestimonialAdminCardProps {
    testimonial: TestimonialSelectWithCourse;
    courseId: string;
}

const TestimonialAdminCard = ({ testimonial, courseId }: TestimonialAdminCardProps) => {
    return (
        <div className="group relative flex flex-col rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm p-5 transition-colors duration-300 hover:border-white/[0.15] hover:bg-white/[0.05]">
            <QuoteIcon className="absolute top-4 right-4 w-5 h-5 text-red-500/20 group-hover:text-red-500/40 transition-colors" />
            <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 ring-2 ring-white/[0.08]">
                    {!!testimonial.user.image && (
                        <AvatarImage src={testimonial.user.image} />
                    )}
                    <AvatarFallback className="bg-red-500/10 text-red-400 text-xs font-semibold">
                        {testimonial.user.name
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
            <p className="mt-3 text-[13px] leading-relaxed text-white/50 flex-1">
                {testimonial.content}
            </p>
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/[0.06]">
                <form action={deleteTestimonial}>
                    <input type="hidden" name="testimonial_id" value={testimonial.id} />
                    <input type="hidden" name="course_id" value={courseId} />
                    <Button
                        className="text-red-500/60 hover:text-red-500 hover:bg-red-500/10"
                        variant="ghost"
                        size="icon"
                        type="submit"
                    >
                        <Trash2Icon className="w-4 h-4" />
                    </Button>
                </form>
                <EditDialog
                    classname=""
                    buttonTitle="Editar"
                    dialogTitle="Editar Testimonio"
                    icon={<PencilIcon className="w-4 h-4" />}
                >
                    <form action={updateTestimonial} className="flex flex-col gap-4">
                        <input type="hidden" name="testimonial_id" value={testimonial.id} />
                        <input type="hidden" name="course_id" value={courseId} />
                        <RatingInput defaultValue={testimonial.rating} />
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-white/70">Contenido</label>
                            <Textarea
                                name="content"
                                defaultValue={testimonial.content}
                                rows={4}
                            />
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="submit">Actualizar</Button>
                            </DialogClose>
                        </DialogFooter>
                    </form>
                </EditDialog>
            </div>
        </div>
    );
};

export default TestimonialAdminCard;
