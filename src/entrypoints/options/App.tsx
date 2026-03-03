import { PhenoChartLogo } from '../../components/PhenoChartLogo';
import { Divider } from '../../components/Divider';
import { SettingsForm } from '../../components/SettingsForm';

export default function App() {
  return (
    <div className="min-h-screen bg-pheno-bg p-8">
      <div className="mx-auto max-w-md">
        <PhenoChartLogo size="md" className="mb-6" />
        <Divider className="mb-6" />
        <SettingsForm />
      </div>
    </div>
  );
}
