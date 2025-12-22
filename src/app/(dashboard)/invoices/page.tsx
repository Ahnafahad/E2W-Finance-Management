'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Upload, FileCode, Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface LineItem {
  title: string;
  description?: string;
  details: string[];
  amount: number;
}

const SAMPLE_JSON = {
  metadata: {
    client: 'ExplorePro',
    chargedTo: 'Herman Tse',
    project: "Founder's Essentials Package",
    duration: '22 Oct – 23 Dec 2025',
    invoiceNumber: 'INV-DEC-2025',
    notes: 'Payment due within 30 days.',
  },
  currency: 'GBP',
  lineItems: [
    {
      title: 'Discovery & Strategy Phase',
      description: 'Initial consultation and planning',
      details: [
        'Initial consultation & 5 discovery meetings (bundled)',
        'Requirements gathering & analysis',
      ],
      amount: 100.0,
    },
    {
      title: 'Product Documentation',
      description: 'Comprehensive PRD and technical specifications',
      details: [
        'Comprehensive Product Requirements Document (PRD)',
        'Technical specifications & user flows',
      ],
      amount: 120.0,
    },
  ],
  totals: {
    subtotal: 220.0,
    tax: 0,
    discount: 0,
    total: 220.0,
  },
};

export default function InvoicesPage() {
  // Manual Entry State
  const [client, setClient] = useState('');
  const [chargedTo, setChargedTo] = useState('');
  const [project, setProject] = useState('');
  const [duration, setDuration] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [currency, setCurrency] = useState('GBP');
  const [notes, setNotes] = useState('');
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { title: '', description: '', details: [], amount: 0 },
  ]);

  // JSON Entry State
  const [jsonInput, setJsonInput] = useState(JSON.stringify(SAMPLE_JSON, null, 2));
  const [jsonError, setJsonError] = useState('');

  // Loading States
  const [generatingManual, setGeneratingManual] = useState(false);
  const [generatingJson, setGeneratingJson] = useState(false);

  const addLineItem = () => {
    setLineItems([...lineItems, { title: '', description: '', details: [], amount: 0 }]);
  };

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const updateLineItem = (index: number, field: keyof LineItem, value: any) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    setLineItems(updated);
  };

  const addDetail = (itemIndex: number, detail: string) => {
    if (!detail.trim()) return;
    const updated = [...lineItems];
    updated[itemIndex].details = [...updated[itemIndex].details, detail];
    setLineItems(updated);
  };

  const removeDetail = (itemIndex: number, detailIndex: number) => {
    const updated = [...lineItems];
    updated[itemIndex].details = updated[itemIndex].details.filter((_, i) => i !== detailIndex);
    setLineItems(updated);
  };

  const calculateTotal = () => {
    return lineItems.reduce((sum, item) => sum + (item.amount || 0), 0);
  };

  const handleGenerateManual = async () => {
    // Validation
    if (!client.trim()) {
      alert('Please enter a client name');
      return;
    }

    if (lineItems.length === 0 || lineItems.every(item => !item.title.trim())) {
      alert('Please add at least one line item with a title');
      return;
    }

    setGeneratingManual(true);

    try {
      const invoiceData = {
        metadata: {
          client,
          chargedTo: chargedTo || undefined,
          project: project || undefined,
          duration: duration || undefined,
          invoiceNumber: invoiceNumber || undefined,
          notes: notes || undefined,
        },
        currency,
        lineItems: lineItems.filter(item => item.title.trim()),
        totals: {
          total: calculateTotal(),
        },
        invoiceDate: new Date().toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
      };

      const response = await fetch('/api/invoices/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoiceData),
      });

      if (!response.ok) throw new Error('Failed to generate invoice');

      // Extract transaction info from headers
      const transactionId = response.headers.get('X-Transaction-Id');
      const generatedInvoiceNumber = response.headers.get('X-Invoice-Number');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${generatedInvoiceNumber || invoiceNumber || client.replace(/\s/g, '-')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      alert(`Invoice generated successfully!\n\nInvoice #: ${generatedInvoiceNumber}\n\nA revenue transaction has been created and saved to the system.\nYou can view it in the Transactions page.`);
    } catch (error) {
      console.error('Error generating invoice:', error);
      alert('Failed to generate invoice. Please try again.');
    } finally {
      setGeneratingManual(false);
    }
  };

  const handleGenerateJson = async () => {
    setJsonError('');

    try {
      const parsedData = JSON.parse(jsonInput);

      // Validate required fields
      if (!parsedData.lineItems || parsedData.lineItems.length === 0) {
        throw new Error('JSON must contain at least one line item');
      }

      setGeneratingJson(true);

      const response = await fetch('/api/invoices/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...parsedData,
          invoiceDate: parsedData.invoiceDate || new Date().toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          }),
        }),
      });

      if (!response.ok) throw new Error('Failed to generate invoice');

      // Extract transaction info from headers
      const transactionId = response.headers.get('X-Transaction-Id');
      const generatedInvoiceNumber = response.headers.get('X-Invoice-Number');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const fileName = generatedInvoiceNumber ||
                      parsedData.metadata?.invoiceNumber ||
                      parsedData.metadata?.client?.replace(/\s/g, '-') ||
                      'invoice';
      a.download = `${fileName}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      alert(`Invoice generated successfully!\n\nInvoice #: ${generatedInvoiceNumber}\n\nA revenue transaction has been created and saved to the system.\nYou can view it in the Transactions page.`);
    } catch (error: any) {
      console.error('Error generating invoice:', error);
      if (error instanceof SyntaxError) {
        setJsonError('Invalid JSON format. Please check your syntax.');
      } else {
        setJsonError(error.message || 'Failed to generate invoice');
      }
    } finally {
      setGeneratingJson(false);
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Client Invoices</h1>
        <p className="mt-1 text-sm text-gray-600">
          Create professional invoices with detailed breakdowns
        </p>
      </div>

      <Tabs defaultValue="manual" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="manual" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Manual Entry
          </TabsTrigger>
          <TabsTrigger value="json" className="flex items-center gap-2">
            <FileCode className="h-4 w-4" />
            JSON Import
          </TabsTrigger>
        </TabsList>

        {/* Manual Entry Tab */}
        <TabsContent value="manual" className="mt-6">
          <Card className="p-6">
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="client">Client Name *</Label>
                  <Input
                    id="client"
                    value={client}
                    onChange={(e) => setClient(e.target.value)}
                    placeholder="e.g., ExplorePro"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="chargedTo">Charged To (Person)</Label>
                  <Input
                    id="chargedTo"
                    value={chargedTo}
                    onChange={(e) => setChargedTo(e.target.value)}
                    placeholder="e.g., Herman Tse"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="project">Project Name</Label>
                  <Input
                    id="project"
                    value={project}
                    onChange={(e) => setProject(e.target.value)}
                    placeholder="e.g., Founder's Essentials Package"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="duration">Duration</Label>
                  <Input
                    id="duration"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="e.g., 22 Oct – 23 Dec 2025"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="invoiceNumber">Invoice Number</Label>
                  <Input
                    id="invoiceNumber"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    placeholder="e.g., INV-DEC-2025"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="BDT">BDT (৳)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Line Items */}
              <div className="border-t pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Line Items</h3>
                  <Button onClick={addLineItem} size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>

                <div className="space-y-4">
                  {lineItems.map((item, index) => (
                    <Card key={index} className="p-4 bg-gray-50">
                      <div className="space-y-3">
                        <div className="flex gap-4">
                          <div className="flex-1">
                            <Label>Title *</Label>
                            <Input
                              value={item.title}
                              onChange={(e) => updateLineItem(index, 'title', e.target.value)}
                              placeholder="e.g., Discovery & Strategy Phase"
                              className="mt-1"
                            />
                          </div>
                          <div className="w-32">
                            <Label>Amount *</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={item.amount || ''}
                              onChange={(e) => updateLineItem(index, 'amount', parseFloat(e.target.value) || 0)}
                              placeholder="0.00"
                              className="mt-1"
                            />
                          </div>
                          <div className="flex items-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeLineItem(index)}
                              disabled={lineItems.length === 1}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>

                        <div>
                          <Label>Description</Label>
                          <Input
                            value={item.description || ''}
                            onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                            placeholder="Brief description of this item"
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <Label>Details (bullet points)</Label>
                          <div className="mt-1 space-y-2">
                            {item.details.map((detail, dIndex) => (
                              <div key={dIndex} className="flex gap-2 items-center">
                                <span className="text-sm text-gray-600">•</span>
                                <Input
                                  value={detail}
                                  onChange={(e) => {
                                    const updated = [...lineItems];
                                    updated[index].details[dIndex] = e.target.value;
                                    setLineItems(updated);
                                  }}
                                  className="flex-1"
                                />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeDetail(index, dIndex)}
                                >
                                  <Trash2 className="h-3 w-3 text-red-500" />
                                </Button>
                              </div>
                            ))}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => addDetail(index, '')}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Add Detail
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g., Payment due within 30 days."
                  rows={2}
                  className="mt-1"
                />
              </div>

              {/* Total & Generate */}
              <div className="flex justify-between items-center pt-4 border-t">
                <div className="text-lg font-semibold">
                  Total: {currency} {calculateTotal().toFixed(2)}
                </div>
                <Button
                  onClick={handleGenerateManual}
                  disabled={generatingManual}
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  {generatingManual ? 'Generating...' : 'Generate Invoice'}
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* JSON Import Tab */}
        <TabsContent value="json" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* JSON Input */}
            <Card className="p-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="json-input">Invoice JSON</Label>
                  <p className="text-xs text-gray-500 mt-1">
                    Paste or edit your invoice data in JSON format
                  </p>
                  <Textarea
                    id="json-input"
                    value={jsonInput}
                    onChange={(e) => {
                      setJsonInput(e.target.value);
                      setJsonError('');
                    }}
                    rows={20}
                    className="mt-2 font-mono text-sm"
                  />
                  {jsonError && (
                    <p className="text-sm text-red-600 mt-2">{jsonError}</p>
                  )}
                </div>

                <Button
                  onClick={handleGenerateJson}
                  disabled={generatingJson}
                  className="w-full flex items-center justify-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  {generatingJson ? 'Generating...' : 'Generate from JSON'}
                </Button>
              </div>
            </Card>

            {/* JSON Format Guide */}
            <Card className="p-6 bg-gray-50">
              <h3 className="text-lg font-semibold mb-4">JSON Format Guide</h3>
              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="font-medium mb-2">Required Fields:</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li><code>lineItems</code> - Array of invoice items</li>
                    <li><code>lineItems[].title</code> - Item title</li>
                    <li><code>lineItems[].amount</code> - Item amount</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Optional Fields:</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li><code>metadata.client</code> - Client/company name</li>
                    <li><code>metadata.chargedTo</code> - Individual person being charged</li>
                    <li><code>metadata.project</code> - Project name</li>
                    <li><code>metadata.duration</code> - Duration string</li>
                    <li><code>metadata.invoiceNumber</code> - Invoice number</li>
                    <li><code>metadata.notes</code> - Additional notes</li>
                    <li><code>currency</code> - Currency code (GBP, USD, EUR, BDT)</li>
                    <li><code>lineItems[].description</code> - Item description</li>
                    <li><code>lineItems[].details</code> - Array of detail strings</li>
                    <li><code>totals.subtotal</code> - Subtotal amount</li>
                    <li><code>totals.tax</code> - Tax amount</li>
                    <li><code>totals.discount</code> - Discount amount</li>
                    <li><code>totals.total</code> - Total amount</li>
                  </ul>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-xs text-gray-600">
                    The sample JSON on the left shows all available fields. You can remove
                    any optional fields you don't need.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
