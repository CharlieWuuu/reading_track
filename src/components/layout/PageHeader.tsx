export function PageHeader({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-gray-900 pb-3 md:mb-5 md:gap-3">
      <h2 className="whitespace-nowrap text-base font-semibold">{title}</h2>
      {action}
    </div>
  );
}
