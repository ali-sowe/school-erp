import { cn } from '@/lib/utils';

// UI Patterns doc: "Empty State — explain what is missing and provide the
// next action." Used across modules instead of every page inventing its
// own "no data" message.
function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-2 rounded-md border border-dashed p-space-7 text-center',
        className
      )}
    >
      {Icon && <Icon className="h-8 w-8 text-muted-foreground" />}
      <p className="text-sm font-medium">{title}</p>
      {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-space-2">{action}</div>}
    </div>
  );
}

export { EmptyState };
