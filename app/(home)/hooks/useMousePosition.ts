import { useState, useEffect } from "react";

const useMousePosition = () => {
    const [mousePosition, setMousePosition] = useState<{ x: number, y: number }>({ x: 0, y: 0 });

    const updateMousePosition = (e: MouseEvent) => {
        setMousePosition({ x: e.pageX, y: e.pageY });
    };

    useEffect(() => {
        window.addEventListener("mousemove", updateMousePosition);

        return () => window.removeEventListener("mousemove", updateMousePosition);
    }, []);

    return mousePosition;
};

export default useMousePosition;
