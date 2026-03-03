import type { BackgroundTask } from '../../types/chat';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

function statusLabel(status: BackgroundTask['status']): string {
  switch (status) {
    case 'extracting_fhir':
      return 'Extracting clinical data...';
    case 'chatting':
      return 'Drafting response...';
    case 'completed':
      return 'Ready';
    case 'error':
      return 'Failed';
  }
}

interface Props {
  tasks: BackgroundTask[];
  onViewTask: (taskId: string) => void;
  onDismissTask: (taskId: string) => void;
}

export function TaskTray({ tasks, onViewTask, onDismissTask }: Props) {
  if (tasks.length === 0) return null;

  return (
    <div className="flex w-full flex-col gap-2">
      <p className="font-body text-xs font-medium text-pheno-text-tertiary uppercase tracking-wide">
        Tasks
      </p>
      {tasks.map((task) => {
        const isActive =
          task.status === 'extracting_fhir' || task.status === 'chatting';
        const isCompleted = task.status === 'completed';
        const isError = task.status === 'error';

        return (
          <div
            key={task.id}
            className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 font-body text-sm transition-colors ${
              isCompleted
                ? 'border-pheno-accent/30 bg-pheno-accent-light cursor-pointer hover:border-pheno-accent/50'
                : isError
                  ? 'border-pheno-reject/30 bg-pheno-reject-light'
                  : 'border-pheno-border bg-pheno-bg-panel'
            }`}
            onClick={isCompleted ? () => onViewTask(task.id) : undefined}
          >
            {/* Status icon */}
            <div className="flex-shrink-0">
              {isActive && (
                <div className="h-2.5 w-2.5 rounded-full bg-pheno-accent animate-pulse-glow" />
              )}
              {isCompleted && (
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-pheno-accent"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
              {isError && (
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-pheno-reject"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="truncate text-pheno-text-primary text-xs font-medium">
                {task.agentName}
              </p>
              <p className="truncate text-pheno-text-tertiary text-xs">
                {statusLabel(task.status)}
              </p>
            </div>

            {/* Time + actions */}
            <div className="flex-shrink-0 flex items-center gap-2">
              <span className="font-mono text-xs text-pheno-text-tertiary">
                {timeAgo(task.createdAt)}
              </span>
              {(isCompleted || isError) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDismissTask(task.id);
                  }}
                  title="Dismiss"
                  className="text-pheno-text-tertiary hover:text-pheno-text-secondary transition-colors"
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
