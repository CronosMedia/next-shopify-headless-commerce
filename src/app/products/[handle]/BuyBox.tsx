"use client";
import { useMemo, useState, useEffect } from "react";
import { useCart } from "@/components/CartProvider";
import { Minus, Plus } from "lucide-react";
import Swatch from "./Swatch"; // Import the new Swatch component
import WishlistButton from "@/components/WishlistButton";
import { formatMoney } from "@/lib/utils";

type Option = { name: string; values: string[] };
export type Variant = {
  id: string;
  sku?: string | null;
  title: string;
  availableForSale: boolean;
  price: { amount: string; currencyCode: string };
  compareAtPrice?: { amount: string; currencyCode: string } | null;
  image?: {
    url: string;
    altText: string | null;
    width: number;
    height: number;
  } | null;
  selectedOptions: { name: string; value: string }[];
  metafield?: { value: string } | null; // Add metafield to Variant type
};

export default function BuyBox({
  title,
  handle,
  options,
  variants,
  onVariantChange,
  onAddToCartSuccess,
  showTitle = true,
}: {
  title: string;
  handle: string;
  options: Option[];
  variants: Variant[];
  onVariantChange?: (variant: Variant) => void;
  onAddToCartSuccess?: () => void;
  showTitle?: boolean;
}) {
  const [quantity, setQuantity] = useState(1);
  const [selection, setSelection] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    options?.forEach((o) => {
      initial[o.name] = o.values?.[0] || "";
    });
    return initial;
  });

  const selectableOptions = useMemo(
    () =>
      options.filter((option) => {
        const normalizedName = option.name.trim().toLowerCase();
        const values = option.values.filter(Boolean);
        const isDefaultTitle =
          normalizedName === "title" &&
          values.length === 1 &&
          values[0]?.trim().toLowerCase() === "default title";

        return (
          normalizedName !== "title" && !isDefaultTitle && values.length > 1
        );
      }),
    [options],
  );

  const selectedVariant = useMemo(() => {
    return (
      variants.find((v) =>
        v.selectedOptions.every((o) => selection[o.name] === o.value),
      ) || variants[0]
    );
  }, [selection, variants]);

  useEffect(() => {
    if (selectedVariant) {
      onVariantChange?.(selectedVariant);
    }
  }, [selectedVariant, onVariantChange]);

  const canAdd = selectedVariant?.availableForSale && quantity > 0;
  const { addToCart, loading } = useCart();

  const handleAddToCart = async () => {
    if (!selectedVariant) return;

    try {
      await addToCart(selectedVariant.id, quantity);
      onAddToCartSuccess?.();
    } catch {
      return;
    }
  };

  return (
    <div className="space-y-10">
      {/* Product Information */}
      {showTitle ? (
        <div className="space-y-3 border-b border-(--border) pb-6">
          <h1 className="text-xl md:text-2xl lg:text-[26px] font-medium tracking-[0.06em] uppercase text-neutral-900 leading-snug">
            {title}
          </h1>
          <div className="flex items-baseline gap-3 pt-1">
            <span className="font-[family:var(--font-geist-mono)] text-xl md:text-2xl text-[var(--accent)] tracking-wider">
              {formatMoney(
                selectedVariant?.price.amount || 0,
                selectedVariant?.price.currencyCode,
              )}
            </span>
            {selectedVariant?.compareAtPrice?.amount ? (
              <span className="font-[family:var(--font-geist-mono)] font-light text-neutral-400 line-through text-sm md:text-base ml-2">
                {formatMoney(
                  selectedVariant.compareAtPrice.amount,
                  selectedVariant.compareAtPrice.currencyCode,
                )}
              </span>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-baseline gap-3">
            <span className="font-[family:var(--font-geist-mono)] font-semibold text-2xl md:text-3xl text-[var(--accent)] tracking-wider">
              {formatMoney(
                selectedVariant?.price.amount || 0,
                selectedVariant?.price.currencyCode,
              )}
            </span>
            {selectedVariant?.compareAtPrice?.amount ? (
              <span className="font-[family:var(--font-geist-mono)] font-light text-neutral-400 line-through text-base md:text-lg ml-2">
                {formatMoney(
                  selectedVariant.compareAtPrice.amount,
                  selectedVariant.compareAtPrice.currencyCode,
                )}
              </span>
            ) : null}
          </div>
        </div>
      )}

      {/* Variant Selection */}
      {variants.length > 1 && selectableOptions.length > 0 ? (
        <div className="space-y-8 pt-2">
          {selectableOptions.map((opt) => (
            <div key={opt.name} className="space-y-3.5">
              <div className="text-[11px] md:text-xs font-semibold tracking-[0.25em] uppercase text-neutral-400">
                Alege {opt.name}
              </div>
              <div className="flex flex-wrap gap-4">
                {opt.values.map((val) => {
                  const variantForSwatch = variants.find((v) =>
                    v.selectedOptions.some(
                      (so) => so.name === opt.name && so.value === val,
                    ),
                  );
                  const swatchMetafield = variantForSwatch?.metafield;

                  return (
                    <Swatch
                      key={val}
                      name={opt.name}
                      value={val}
                      active={selection[opt.name] === val}
                      onClick={() =>
                        setSelection((s) => ({ ...s, [opt.name]: val }))
                      }
                      metafield={swatchMetafield}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {/* Purchase Actions */}
      <div className="pt-6 space-y-6">
        <div className="flex flex-col gap-6">
          {/* Quantity Selector - Minimalist Luxury */}
          <div className="flex items-center gap-6">
            <span className="text-[11px] md:text-xs font-semibold tracking-[0.2em] uppercase text-neutral-400">
              Cantitate
            </span>
            <div className="flex items-center border border-[var(--border)] rounded-none bg-white">
              <button
                className="w-10 h-10 flex items-center justify-center hover:bg-[#f9f8f6] transition-colors cursor-pointer"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
              >
                <Minus size={14} className="text-[#1a1a1a]" />
              </button>
              <input
                className="w-10 text-center outline-none text-sm font-light bg-transparent border-0 focus:ring-0"
                type="number"
                min={1}
                value={quantity}
                onChange={(e) =>
                  setQuantity(Math.max(1, Number(e.target.value) || 1))
                }
              />
              <button
                className="w-10 h-10 flex items-center justify-center hover:bg-[#f9f8f6] transition-colors cursor-pointer"
                onClick={() => setQuantity((q) => q + 1)}
                aria-label="Increase quantity"
              >
                <Plus size={14} className="text-[#1a1a1a]" />
              </button>
            </div>
          </div>

          {/* Action Buttons Group */}
          <div className="flex flex-col gap-3">
            {/* Add to Bag - Solid Coherent Button */}
            <button
              disabled={!canAdd}
              className={`w-full group h-14 flex items-center justify-center text-[13px] md:text-sm font-semibold tracking-[0.2em] uppercase transition-all duration-300 cursor-pointer ${
                canAdd
                  ? "bg-black text-white hover:bg-neutral-800"
                  : "bg-neutral-100 text-neutral-300 cursor-not-allowed border border-neutral-200/50"
              }`}
              onClick={handleAddToCart}
            >
              <span>
                {loading
                  ? "Se adaugă..."
                  : selectedVariant?.availableForSale
                    ? "Adaugă în coș"
                    : "Stoc epuizat"}
              </span>
            </button>

            {/* Wishlist Button - eMAG style but luxury brand aesthetics */}
            {selectedVariant ? (
              <WishlistButton
                item={{
                  id: selectedVariant.id,
                  handle: handle,
                  title: title,
                  featuredImage: selectedVariant.image
                    ? {
                        url: selectedVariant.image.url,
                        altText: selectedVariant.image.altText || undefined,
                      }
                    : null,
                  priceRange: {
                    minVariantPrice: selectedVariant.price,
                  },
                  variants: {
                    edges: [
                      {
                        node: {
                          id: selectedVariant.id,
                          availableForSale: selectedVariant.availableForSale,
                        },
                      },
                    ],
                  },
                }}
              />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
