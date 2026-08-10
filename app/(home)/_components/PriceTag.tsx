const arsFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

/**
 * Price badge used on the product cards. Shows the ARS price as the primary
 * value and the USD price next to it when the product has one.
 */
export default function PriceTag({
  priceArs,
  priceUsd,
  className,
}: {
  priceArs: number;
  priceUsd: number;
  className?: string;
}) {
  return (
    <span className={className}>
      {arsFormatter.format(priceArs)}{" "}
      <span className="opacity-70">ARS</span>
      {priceUsd > 0 && (
        <span className="ml-1 text-xs font-normal opacity-70">
          / {usdFormatter.format(priceUsd)}
        </span>
      )}
    </span>
  );
}
