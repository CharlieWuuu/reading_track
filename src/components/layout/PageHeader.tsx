export function PageHeader({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex items-center justify-between border-b border-gray-900 pb-4">
      <h2 className="text-base font-semibold">{title}</h2>
      {action}
    </div>
  );
}
