'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from 'lucide-react';
import {
  getDateRangePresets,
  getDateRange,
  type DateRangePreset,
  type DateRange,
} from '@/lib/utils/date';
import { format } from 'date-fns';

interface DateRangeSelectorProps {
  onRangeChange: (startDate: Date, endDate: Date) => void;
  initialRange?: DateRange;
}

export function DateRangeSelector({
  onRangeChange,
  initialRange,
}: DateRangeSelectorProps) {
  const [selectedPreset, setSelectedPreset] = useState<DateRangePreset>('this-month');
  const [customRange, setCustomRange] = useState<DateRange>(
    initialRange || {
      start: new Date(),
      end: new Date(),
    }
  );
  const [showCustomInputs, setShowCustomInputs] = useState(false);

  const presets = getDateRangePresets();

  const handlePresetClick = (preset: DateRangePreset) => {
    setSelectedPreset(preset);

    if (preset === 'custom') {
      setShowCustomInputs(true);
    } else {
      setShowCustomInputs(false);
      const range = getDateRange(preset);
      if (range) {
        setCustomRange(range);
        onRangeChange(range.start, range.end);
      }
    }
  };

  const handleCustomDateChange = (type: 'start' | 'end', value: string) => {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      const newRange = {
        ...customRange,
        [type]: date,
      };
      setCustomRange(newRange);

      // Only trigger onChange if both dates are valid
      if (newRange.start && newRange.end && newRange.start <= newRange.end) {
        onRangeChange(newRange.start, newRange.end);
      }
    }
  };

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="h-5 w-5 text-gray-500" />
        <h3 className="text-sm font-medium text-gray-700">Date Range</h3>
      </div>

      {/* Preset Buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        {presets.map((preset) => (
          <Button
            key={preset.value}
            variant={selectedPreset === preset.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => handlePresetClick(preset.value)}
            className={
              selectedPreset === preset.value
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : ''
            }
          >
            {preset.label}
          </Button>
        ))}
      </div>

      {/* Custom Date Inputs */}
      {showCustomInputs && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <div>
            <Label htmlFor="start-date" className="text-sm font-medium text-gray-700">
              Start Date
            </Label>
            <Input
              id="start-date"
              type="date"
              value={format(customRange.start, 'yyyy-MM-dd')}
              onChange={(e) => handleCustomDateChange('start', e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="end-date" className="text-sm font-medium text-gray-700">
              End Date
            </Label>
            <Input
              id="end-date"
              type="date"
              value={format(customRange.end, 'yyyy-MM-dd')}
              onChange={(e) => handleCustomDateChange('end', e.target.value)}
              className="mt-1"
            />
          </div>
        </div>
      )}
    </div>
  );
}
