import z from 'zod';
const productType = z.enum(['ebook', 'product'])


const defaultPropsProducts = z.object({
    price: z.number(),
    description: z.string(),
    img_url: z.string(),
    pdf_url: z.string(),

})


const ebook = z.object({
    stats: z.object({
        stat2: z.number(), 
        stat1: z.number(),
        stat3: z.number(),

    }),
    productType: z.literal(productType.enum.ebook),
    color: z.string()
})

const program = z.object({
    programCategory: z.string(),
    productType: z.literal(productType.enum.product),

})

const productCreation = z.discriminatedUnion('productType', [
    ebook,
    program
])

const product = z.intersection(productCreation, defaultPropsProducts);


type ProductType = z.infer<typeof product>;
type ProgramType = Extract<ProductType, { productType: 'product' }>
type EbookType = Extract<ProductType, { productType: 'ebook' }>




async function generateProduct
    <T extends ProductType['productType'], K extends Extract<ProductType, { productType: T }>>
    (key: T, product: K) {
    if (product.productType == 'ebook') {
      (product as EbookType)
    }
}





async function generateProduct2(product: ProductType) {
    if (product.productType === 'ebook') {
        //do something with the product

    }
}




