import { ComponentType } from "react";
import { Kind } from "@/lib/db/queries/kinds";

/**
 * 內建類型的專屬呈現，用 slug 對照。
 *
 * 沒有列在這裡的（含所有自訂類型）用通用表單／通用列表——不是每種都要換皮，
 * 佳句、單字外觀跟通用表單差不多，直接退回去就好。
 */
export type KindVariant = {
  list?: ComponentType<{ kind: Kind }>;
  detail?: ComponentType<{ kind: Kind; recordId: string }>;
  form?: ComponentType<{ kind: Kind; recordId?: string; initial?: Record<string, string> }>;
};

const REGISTRY: Record<string, KindVariant> = {};

export const variantFor = (slug: string): KindVariant => REGISTRY[slug] ?? {};
