/**
 * demo 站的旗標。正式站兩個都不設，行為完全不變。
 *
 * DEMO_EMAIL（伺服器）：沒登入的訪客一律當成這個帳號，但只能讀。
 * NEXT_PUBLIC_DEMO_MODE（畫面）：藏掉新增與編輯，免得按了才發現不能存。
 */
export const DEMO_EMAIL = process.env.DEMO_EMAIL ?? "";

export const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "1";
