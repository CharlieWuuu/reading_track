/** 心得是長文，用寬行距，看起來就是一段文章 */
export function NoteBlock({ note }: { note: string }) {
  return (
    <p className="max-w-3xl text-[15px] leading-[1.9] whitespace-pre-wrap text-gray-800 md:text-base">
      {note}
    </p>
  );
}
