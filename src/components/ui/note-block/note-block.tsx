/** 心得是長文，用襯線字與寬行距，看起來就是一段文章 */
export function NoteBlock({ note }: { note: string }) {
  return (
    <p className="max-w-3xl font-serif text-[15px] leading-[1.9] whitespace-pre-wrap text-gray-800 md:text-base">
      {note}
    </p>
  );
}
