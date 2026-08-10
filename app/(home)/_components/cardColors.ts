export type CardColors = {
    backgroundColor: string;
    titleColor: string;
    statColor: string;
    percentageColor: string;
    primaryColor: string;
};

export type KeysOfCardColors = keyof (typeof cardColors);



export const cardColors = {
    red: {
        backgroundColor: "from-red-950",
        titleColor: "text-red-600",
        percentageColor: "text-red-600",
        statColor: "bg-red-500",
        primaryColor: "#FF0000",
    },
    blue: {
        backgroundColor: "from-blue-950",
        titleColor: "text-blue-600",
        percentageColor: "text-blue-600",
        statColor: "bg-blue-500",
        primaryColor: "#0000FF",
    },
    green: {
        backgroundColor: "from-green-950",
        titleColor: "text-green-600",
        percentageColor: "text-green-600",
        statColor: "bg-green-500",
        primaryColor: "#008000",
    },

}


export const cardColorsArray: Array<CardColors> = [cardColors.blue, cardColors.red, cardColors.green];