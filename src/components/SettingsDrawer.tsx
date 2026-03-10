import { useState } from 'react';
import { SettingsForm } from './SettingsForm';
import { CreateAgentForm } from './CreateAgentForm';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAgentCreated?: () => void;
}

export function SettingsDrawer({ isOpen, onClose, onAgentCreated }: Props) {
  const [screen, setScreen] = useState<'settings' | 'create-agent'>('settings');
  const [createdAgentId, setCreatedAgentId] = useState<string | undefined>();

  function handleClose() {
    setScreen('settings');
    setCreatedAgentId(undefined);
    onClose();
  }

  function handleAgentCreated(agentId: string) {
    setCreatedAgentId(agentId);
    setScreen('settings');
    onAgentCreated?.();
  }

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/20 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={handleClose}
      />
      <div
        className={`fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-pheno-bg transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {screen === 'settings' ? (
          <SettingsForm
            onClose={handleClose}
            onCreateAgent={() => setScreen('create-agent')}
            cdsAgentIdOverride={createdAgentId}
          />
        ) : (
          <CreateAgentForm
            onBack={() => setScreen('settings')}
            onCreated={handleAgentCreated}
          />
        )}
      </div>
    </>
  );
}
