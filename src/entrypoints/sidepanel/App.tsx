import { useState } from 'react';
import { AppProvider, useApp } from '../../context/AppContext';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { IdlePrompt } from '../../components/IdlePrompt';
import { PatientContextBar } from '../../components/PatientContextBar';
import { EncounterNarrative } from '../../components/EncounterNarrative';
import { LoadingState } from '../../components/LoadingState';
import { SectionHeader } from '../../components/SectionHeader';
import { CodeCard } from '../../components/CodeCard';
import { CodeCardAccepted } from '../../components/CodeCardAccepted';
import { CodeCardRejected } from '../../components/CodeCardRejected';
import { ReviewFooter } from '../../components/ReviewFooter';
import { SubmissionSummary } from '../../components/SubmissionSummary';
import { SettingsDrawer } from '../../components/SettingsDrawer';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';

interface ReviewStateProps {
  selection: Set<string>;
  onToggle: (id: string) => void;
}

function ReviewState({ selection, onToggle }: ReviewStateProps) {
  const { codes, reviews } = useApp();

  const conditions = codes.filter((c) => c.system === 'ICD-10-CM');
  const medications = codes.filter((c) => c.system === 'RXNORM');

  function renderCard(code: (typeof codes)[0], index: number) {
    const review = reviews.get(code.id);
    if (!review || review.decision === 'pending') {
      return (
        <CodeCard
          key={code.id}
          code={code}
          index={index}
          selected={selection.has(code.id)}
          onToggle={() => onToggle(code.id)}
        />
      );
    }
    if (review.decision === 'accepted') {
      return <CodeCardAccepted key={code.id} code={code} />;
    }
    return <CodeCardRejected key={code.id} code={code} review={review} />;
  }

  let cardIndex = 0;

  return (
    <>
      <SectionHeader
        label="Conditions"
        count={conditions.length}
        variant="condition"
      />
      {conditions.map((code) => renderCard(code, cardIndex++))}

      <SectionHeader
        label="Medications"
        count={medications.length}
        variant="medication"
      />
      {medications.map((code) => renderCard(code, cardIndex++))}
    </>
  );
}

function SubmittingOverlay() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-pheno-bg/80 animate-in fade-in duration-200">
      <p className="font-body text-sm text-pheno-text-secondary">
        Submitting...
      </p>
    </div>
  );
}

function ErrorState() {
  const { error, dispatch } = useApp();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
      <p className="font-body text-sm text-pheno-text-primary">
        {error ?? 'An unexpected error occurred.'}
      </p>
      <button
        onClick={() => dispatch({ type: 'RESET' })}
        className="rounded-md border border-pheno-border px-4 py-2 font-body text-sm text-pheno-text-secondary transition-colors hover:bg-pheno-bg-secondary"
      >
        Try Again
      </button>
    </div>
  );
}

function AppContent() {
  const { state, error } = useApp();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selection, setSelection] = useState<Set<string>>(new Set());
  useKeyboardShortcuts();

  const openSettings = () => setIsSettingsOpen(true);
  const closeSettings = () => setIsSettingsOpen(false);

  function handleToggle(id: string) {
    setSelection((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleSelectAll(ids: string[]) {
    setSelection(new Set(ids));
  }

  function handleClearSelection() {
    setSelection(new Set());
  }

  if (state === 'error') {
    return <ErrorState />;
  }

  if (state === 'idle') {
    return (
      <>
        <IdlePrompt onOpenSettings={openSettings} />
        <SettingsDrawer isOpen={isSettingsOpen} onClose={closeSettings} />
      </>
    );
  }

  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-pheno-bg">
        <PatientContextBar onOpenSettings={openSettings} />
        <EncounterNarrative />
        <LoadingState />
        <SettingsDrawer isOpen={isSettingsOpen} onClose={closeSettings} />
      </div>
    );
  }

  if (state === 'submitting') {
    return (
      <div className="min-h-screen bg-pheno-bg">
        <PatientContextBar onOpenSettings={openSettings} />
        <SubmittingOverlay />
        <SettingsDrawer isOpen={isSettingsOpen} onClose={closeSettings} />
      </div>
    );
  }

  if (state === 'submitted') {
    return (
      <div className="min-h-screen bg-pheno-bg">
        <PatientContextBar onOpenSettings={openSettings} />
        <SubmissionSummary />
        <SettingsDrawer isOpen={isSettingsOpen} onClose={closeSettings} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-pheno-bg">
      <PatientContextBar onOpenSettings={openSettings} />
      <EncounterNarrative />
      {error && (
        <div className="border-b border-pheno-reject/20 bg-pheno-reject/5 px-4 py-2">
          <p className="font-body text-xs text-pheno-reject">{error}</p>
        </div>
      )}
      <div className="flex-1">
        <ReviewState selection={selection} onToggle={handleToggle} />
      </div>
      <ReviewFooter
        selection={selection}
        onSelectAll={handleSelectAll}
        onClearSelection={handleClearSelection}
      />
      <SettingsDrawer isOpen={isSettingsOpen} onClose={closeSettings} />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    </AppProvider>
  );
}
