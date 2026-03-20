export function EmptyState({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="text-center py-12">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 text-gray-400 mb-4">
        {icon}
      </div>
      <h3 className="text-sm font-medium text-gray-900">{title}</h3>
      <p className="text-sm text-gray-500 mt-1">{description}</p>
    </div>
  );
}
