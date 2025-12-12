import { Card } from '@/components/ui/card';

export default function SettingsPage() {
  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage your application settings
        </p>
      </div>

      <Card className="p-12 text-center">
        <p className="text-gray-500 text-lg mb-2">Settings Coming Soon</p>
        <p className="text-sm text-gray-400">
          This section will include company information, categories, and invoice customization
        </p>
      </Card>
    </div>
  );
}
