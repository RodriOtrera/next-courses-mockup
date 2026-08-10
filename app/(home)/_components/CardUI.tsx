import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { EbookOutput } from "@/lib/db/actions/products_actions";
import { File } from "lucide-react";
import localfont from "next/font/local";
import Image from "next/image";
import { twMerge } from "tailwind-merge";
import BuyProductButton from "./BuyProductButton";
import PaypalInterface from "./PaypalInterface";
import { ebookPaypalAction, obtainEbookAction } from "@/lib/db/actions/ebooks/paypal_checkout";
import Stat from "./Stat";
import { cardColors, type KeysOfCardColors } from "./cardColors";
import styles from "./components.module.css";
import TrackProductView from "@/components/analytics/TrackProductView";
const RoadRage = localfont({ src: "../font/Road_Rage.otf" });

const CardUI: React.FC<
  PartialBy<EbookOutput, "img_url" | "price_usd"> & {
    canBeOpen?: boolean;
    downloadLink?: boolean;
    pdf_url?: string;
    action: () => void;
  }
> = ({
  title,
  card_color,
  description,
  stats_names,
  stats_values,
  img_url,
  id,
  canBeOpen = true,
  price,
  price_usd,
  downloadLink = false,
  pdf_url,
  action,
}) => {
  const colors = cardColors[card_color as KeysOfCardColors];

  return (
    <div
      style={{ perspective: 1000 }}
      className={`relative pb-12  ${RoadRage.className}`}
    >
      {/* Ambient colored glow beneath the card */}
      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[200px] h-[60px] rounded-full blur-[40px] opacity-30 transition-opacity duration-500 group-hover:opacity-50"
        style={{ backgroundColor: colors.primaryColor }}
      />

      <div
        className={twMerge(
          "card mx-4 h-[440px] w-[280px] group flex cursor-pointer flex-col overflow-hidden rounded-lg bg-gradient-to-br from-70% via-black via-[5%] to-slate-900 shadow-lg shadow-black",
          colors.backgroundColor,
          styles.card
        )}
      >
        {/* Top edge highlight */}
        <div
          className="h-[1px] w-full shrink-0"
          style={{
            background: `linear-gradient(90deg, transparent 10%, ${colors.primaryColor}80 50%, transparent 90%)`,
          }}
        />

        <div className="relative flex h-[225px] flex-col items-center">
          {/* Radial glow behind the book cover */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[160px] h-[160px] rounded-full blur-[50px] opacity-20 pointer-events-none"
            style={{ backgroundColor: colors.primaryColor }}
          />

          {img_url ? (
            <div
              className="
               flex
              h-[225px]
              w-[225px]
              justify-center
          "
            >
              <Image
                className="object-cover p-4 drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
                fill={true}
                style={{
                  cursor: "pointer",
                  pointerEvents: "none",
                  userSelect: "none",
                }}
                src={img_url}
                alt=""
              />
            </div>
          ) : (
            <div className="relative flex h-[150px] w-[200px] flex-col items-center justify-center rounded-xl text-center text-gray-400 ">
              <File />
            </div>
          )}

          <div className="absolute top-[150px] flex flex-col justify-start px-4">
            <h1
              style={
                {
                  "--textcolor": colors.primaryColor,
                } as React.CSSProperties
              }
              className={twMerge(
                " h-16   flex justify-center items-end mb-2 text-center text-2xl tracking-widest",
                colors.titleColor,
                styles.text
              )}
            >
              {title.length == 0 ? "TITULO" : title.toUpperCase()}
            </h1>
            <div className="flex h-40 flex-col justify-between ">
              <div>
                <Stat
                  percentageColor={colors.primaryColor}
                  percentage={stats_values.stat1}
                  title={stats_names.stat1}
                />
                <Stat
                  percentageColor={colors.primaryColor}
                  percentage={stats_values.stat2}
                  title={stats_names.stat2}
                />
                <Stat
                  percentageColor={colors.primaryColor}
                  percentage={stats_values.stat3}
                  title={stats_names.stat3}
                />
              </div>

              {canBeOpen ? (
                <div className="self-end mt-8 my-full">
                  <Dialog>
                    <DialogTrigger>
                      <h1
                        style={{
                          "--bgcolor": colors.primaryColor,
                        }}
                        className={twMerge(
                          "relative overflow-hidden rounded-md border-[1px] px-2 py-1 font-bold tracking-wider shadow-lg mb-2",
                          styles.buttonText,
                          styles.btnShimmer,
                          !canBeOpen && "hidden"
                        )}
                      >
                        ADQUIRIR
                      </h1>
                    </DialogTrigger>
                    <DialogContent className=" p-0 max-h-[80vh] max-w-[95vw] md:max-w-[1000px] overflow-y-auto">
                      {/* Inside DialogContent on purpose. These cards sit in a
                          grid, so firing on render would count impressions as
                          product views and make conversion look far worse than
                          it is. Radix unmounts this subtree while closed, so
                          mounting here fires exactly when the card is opened.
                          Kept as a child rather than an onOpenChange handler
                          because CardUI is a server component and can't pass a
                          closure to a client one. */}
                      <TrackProductView
                        productId={id}
                        productType="ebook"
                        productName={title}
                        price={price ?? undefined}
                        currency="ARS"
                      />
                      <VisuallyHidden><DialogTitle>{title}</DialogTitle></VisuallyHidden>
                      <div className="flex flex-wrap sm:flex  rounded-md  md:px-20 py-20 ">
                        <div className="flex justify-center md:pr-20 scale-75 md:scale-100">
                          <CardUI
                            action={action}
                            canBeOpen={false}
                            pdf_url=""
                            description={description}
                            price={price}
                            price_usd={price_usd}
                            img_url={img_url}
                            card_color={card_color}
                            stats_names={stats_names}
                            stats_values={stats_values}
                            title={title}
                            id={id}
                          />
                        </div>
                        <div className="flex px-4 flex-col flex-1 ">
                          <h1 className="text-3xl pb-4 text-white font-bold">
                            {title.toUpperCase()}
                          </h1>
                          <p className=" text-sm text-gray-400 ">
                            {description}
                          </p>
                          <div className="flex-1" />

                          <BuyProductButton
                            price={price}
                            productId={id}
                            productType="ebook"
                          />

                          {price_usd != null && price_usd > 0 && (
                            <>
                              <div className="flex items-center gap-2 w-full my-2">
                                <div className="h-px flex-1 bg-white/20" />
                                <span className="text-xs text-white/50">o</span>
                                <div className="h-px flex-1 bg-white/20" />
                              </div>
                              <PaypalInterface
                                productId={id}
                                productType="ebook"
                                action={ebookPaypalAction.bind(null, id)}
                                onApproveAction={obtainEbookAction}
                              />
                            </>
                          )}
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              ) : null}
            </div>
            {pdf_url && (
              <form action={action} className="flex justify-end">
                <button
                  style={{
                    "--bgcolor": colors.primaryColor,
                  }}
                  className={twMerge(
                    "relative overflow-hidden rounded-md border-[1px] px-2 py-1 font-bold tracking-wider shadow-lg mb-2",
                    styles.buttonText,
                    styles.btnShimmer
                  )}
                >
                  DESCARGAR
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardUI;
