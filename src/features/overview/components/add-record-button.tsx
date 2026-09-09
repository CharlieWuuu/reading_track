"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus } from "lucide-react";
import { ActionButton } from "@/components/ui/controls";
import { Dialog } from "@/components/ui/dialog";
import { kindHref } from "@/config/kind-routes";
import { KindGroup } from "@/config/record-kinds";
import { useKinds } from "@/hooks/use-kinds";

/**
 * 概覽頁上的新增。先選要新增哪一種，再進那一種的表單。
 */
export function AddRecordButton({ group }: { group: KindGroup }) {
  const { kinds } = useKinds();
  const [open, setOpen] = useState(false);

  const choices = kinds
    .filter((kind) => kind.group === group)
    .map((kind) => ({ kind, href: `${kindHref(kind.group, kind.slug)}/new` }));

  if (choices.length === 0) return null;

  return (
    <>
      <ActionButton onClick={() => setOpen(true)} label="新增">
        <Plus size={16} strokeWidth={2} aria-hidden />
      </ActionButton>

      {open && (
        <Dialog title="新增" onClose={() => setOpen(false)}>
          <div className="flex flex-col">
            {choices.map(({ kind, href }) => (
              <Link
                key={kind.id}
                href={href}
                onClick={() => setOpen(false)}
                className="border-rule text-item border-b py-3 font-serif font-semibold"
              >
                {kind.name}
              </Link>
            ))}
          </div>
        </Dialog>
      )}
    </>
  );
}
