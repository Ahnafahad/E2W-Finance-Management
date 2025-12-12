'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Play, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface RecurringTemplate {
  id: string;
  name: string;
  type: string;
  category: string;
  payee: string;
  amount: number;
  currency: string;
  frequency: string;
  dayOfMonth: number;
  active: boolean;
  nextScheduled: string | null;
  lastGenerated: string | null;
}

export default function RecurringPage() {
  const [templates, setTemplates] = useState<RecurringTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/recurring');
      if (!response.ok) throw new Error('Failed to fetch templates');

      const data = await response.json();
      setTemplates(data.data);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const response = await fetch('/api/recurring/generate', {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to generate transactions');

      const result = await response.json();
      alert(`Generated ${result.generatedCount} transactions`);
      fetchTemplates();
    } catch (error) {
      console.error('Error generating transactions:', error);
      alert('Failed to generate transactions');
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this recurring template?')) {
      return;
    }

    try {
      const response = await fetch(`/api/recurring/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete template');

      setTemplates((prev) => prev.filter((t) => t.id !== id));
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Failed to delete template');
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Recurring Transactions</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage templates for automatically recurring expenses and income
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={handleGenerate}
            disabled={generating}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Play className="h-4 w-4" />
            {generating ? 'Generating...' : 'Generate Now'}
          </Button>
          <Link href="/recurring/new">
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Template
            </Button>
          </Link>
        </div>
      </div>

      {/* Templates List */}
      <div className="grid gap-4">
        {templates.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-gray-500">No recurring templates found</p>
            <Link href="/recurring/new">
              <Button className="mt-4">Create your first template</Button>
            </Link>
          </Card>
        ) : (
          templates.map((template) => (
            <Card key={template.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {template.name}
                    </h3>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        template.active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {template.active ? 'Active' : 'Inactive'}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        template.type === 'INCOME'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}
                    >
                      {template.type}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                    <div>
                      <span className="text-gray-500">Payee:</span>
                      <p className="font-medium text-gray-900">{template.payee}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Category:</span>
                      <p className="font-medium text-gray-900">{template.category}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Amount:</span>
                      <p className="font-medium text-gray-900">
                        {template.currency} {template.amount.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Frequency:</span>
                      <p className="font-medium text-gray-900">{template.frequency}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Day of Month:</span>
                      <p className="font-medium text-gray-900">{template.dayOfMonth}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Next Scheduled:</span>
                      <p className="font-medium text-gray-900">
                        {template.nextScheduled
                          ? format(new Date(template.nextScheduled), 'MMM dd, yyyy')
                          : 'Not scheduled'}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Last Generated:</span>
                      <p className="font-medium text-gray-900">
                        {template.lastGenerated
                          ? format(new Date(template.lastGenerated), 'MMM dd, yyyy')
                          : 'Never'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <Link href={`/recurring/${template.id}/edit`}>
                    <Button size="sm" variant="outline">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(template.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
