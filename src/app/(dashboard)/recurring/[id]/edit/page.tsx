'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormSelect as Select } from '@/components/ui/form-select';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';

export default function EditRecurringPage() {
  const router = useRouter();
  const params = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'EXPENSE',
    category: '',
    subcategory: '',
    payee: '',
    amount: '',
    currency: 'BDT',
    frequency: 'MONTHLY',
    dayOfMonth: '1',
    startDate: '',
    endDate: '',
    paymentTerms: '',
    description: '',
    active: true,
  });

  useEffect(() => {
    fetchTemplate();
  }, []);

  const fetchTemplate = async () => {
    try {
      const response = await fetch('/api/recurring');
      if (!response.ok) throw new Error('Failed to fetch templates');

      const data = await response.json();
      const template = data.data.find((t: any) => t.id === params.id);

      if (template) {
        setFormData({
          name: template.name || '',
          type: template.type || 'EXPENSE',
          category: template.category || '',
          subcategory: template.subcategory || '',
          payee: template.payee || '',
          amount: template.amount?.toString() || '',
          currency: template.currency || 'BDT',
          frequency: template.frequency || 'MONTHLY',
          dayOfMonth: template.dayOfMonth?.toString() || '1',
          startDate: template.startDate ? new Date(template.startDate).toISOString().split('T')[0] : '',
          endDate: template.endDate ? new Date(template.endDate).toISOString().split('T')[0] : '',
          paymentTerms: template.paymentTerms || '',
          description: template.description || '',
          active: template.active ?? true,
        });
      }
    } catch (error) {
      console.error('Error fetching template:', error);
      alert('Failed to load template');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/recurring/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
          dayOfMonth: parseInt(formData.dayOfMonth),
          endDate: formData.endDate || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update recurring template');
      }

      router.push('/recurring');
      router.refresh();
    } catch (error) {
      console.error('Error updating template:', error);
      alert('Failed to update recurring template');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Edit Recurring Template</h1>
        <p className="mt-1 text-sm text-gray-600">
          Update the recurring transaction template
        </p>
      </div>

      <Card className="max-w-3xl p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Template Name */}
          <div>
            <Label htmlFor="name">Template Name *</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="e.g., Monthly Salary - John Doe"
            />
          </div>

          {/* Type and Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">Type *</Label>
              <Select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
              >
                <option value="EXPENSE">Expense</option>
                <option value="INCOME">Income</option>
              </Select>
            </div>

            <div>
              <Label htmlFor="category">Category *</Label>
              <Input
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                placeholder="e.g., Salaries, Subscriptions"
              />
            </div>
          </div>

          {/* Subcategory and Payee */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="subcategory">Subcategory</Label>
              <Input
                id="subcategory"
                name="subcategory"
                value={formData.subcategory}
                onChange={handleChange}
                placeholder="Optional"
              />
            </div>

            <div>
              <Label htmlFor="payee">Payee/Client Name *</Label>
              <Input
                id="payee"
                name="payee"
                value={formData.payee}
                onChange={handleChange}
                required
                placeholder="Name of person/company"
              />
            </div>
          </div>

          {/* Amount and Currency */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={handleChange}
                required
                placeholder="0.00"
              />
            </div>

            <div>
              <Label htmlFor="currency">Currency *</Label>
              <Select
                id="currency"
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                required
              >
                <option value="BDT">BDT - Bangladesh Taka</option>
                <option value="USD">USD - US Dollar</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="EUR">EUR - Euro</option>
              </Select>
            </div>
          </div>

          {/* Frequency and Day of Month */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="frequency">Frequency *</Label>
              <Select
                id="frequency"
                name="frequency"
                value={formData.frequency}
                onChange={handleChange}
                required
              >
                <option value="MONTHLY">Monthly</option>
                <option value="QUARTERLY">Quarterly</option>
                <option value="YEARLY">Yearly</option>
              </Select>
            </div>

            <div>
              <Label htmlFor="dayOfMonth">Day of Month *</Label>
              <Input
                id="dayOfMonth"
                name="dayOfMonth"
                type="number"
                min="1"
                max="31"
                value={formData.dayOfMonth}
                onChange={handleChange}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Day of month when transaction should be generated (1-31)
              </p>
            </div>
          </div>

          {/* Start Date and End Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                name="startDate"
                type="date"
                value={formData.startDate}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <Label htmlFor="endDate">End Date (Optional)</Label>
              <Input
                id="endDate"
                name="endDate"
                type="date"
                value={formData.endDate}
                onChange={handleChange}
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave empty for no end date
              </p>
            </div>
          </div>

          {/* Payment Terms */}
          <div>
            <Label htmlFor="paymentTerms">Payment Terms</Label>
            <Input
              id="paymentTerms"
              name="paymentTerms"
              value={formData.paymentTerms}
              onChange={handleChange}
              placeholder="e.g., Paid 10th of Following Month, Net 30"
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              placeholder="Additional details about this recurring transaction"
            />
          </div>

          {/* Active Status */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="active"
              name="active"
              checked={formData.active}
              onChange={handleChange}
              className="rounded"
            />
            <Label htmlFor="active" className="font-normal cursor-pointer">
              Active (generate transactions automatically)
            </Label>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Update Template'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
