"use client";

import { Rating } from "@/components/course/Rating";
import { useState } from "react";

export default function RatingInput({ defaultValue = 5 }: { defaultValue?: number }) {
    const [value, setValue] = useState(defaultValue);
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-white/70">Rating</label>
            <Rating initialValue={defaultValue} onValueChanges={setValue} size="medium" />
            <input type="hidden" name="rating" value={value} />
        </div>
    );
}
