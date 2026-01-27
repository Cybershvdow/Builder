'use client';

import { useState } from 'react';
import type { WorkflowFormInput, WorkflowRunSummary } from '@/types/leads';

const RADIUS_OPTIONS = [5, 10, 15, 20, 30, 50] as const;

interface FormErrors {
  business_type?: string;
  city?: string;
  zip_code?: string;
  radius_miles?: string;
  max_results?: string;
}

export default function LeadsPage() {
  const [formData, setFormData] = useState<Partial<WorkflowFormInput>>({
    business_type: '',
    city: '',
    zip_code: '',
    radius_miles: 10,
    max_results: 100,
    campaign_name: '',
    send_emails: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<WorkflowRunSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.business_type?.trim()) {
      newErrors.business_type = 'Business type is required';
    }

    if (!formData.city?.trim()) {
      newErrors.city = 'City is required';
    }

    if (formData.zip_code && !/^\d{5}(-\d{4})?$/.test(formData.zip_code)) {
      newErrors.zip_code = 'Invalid ZIP code format';
    }

    if (formData.max_results && (formData.max_results < 1 || formData.max_results > 500)) {
      newErrors.max_results = 'Max results must be between 1 and 500';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/leads/workflow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Workflow failed');
      }

      setResult(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]:
        type === 'checkbox'
          ? checked
          : type === 'number'
            ? parseInt(value, 10) || undefined
            : value,
    }));

    // Clear error when field is modified
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-semibold text-gray-900">
              Lead Generation Workflow
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Scrape Google business listings, enrich with contact data, and optionally send outreach emails.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 py-4 space-y-6">
            {/* Business Type */}
            <div>
              <label
                htmlFor="business_type"
                className="block text-sm font-medium text-gray-700"
              >
                Business Type *
              </label>
              <input
                type="text"
                id="business_type"
                name="business_type"
                value={formData.business_type || ''}
                onChange={handleInputChange}
                placeholder="e.g., plumbers, dentists, restaurants"
                className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                  errors.business_type
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-amber-500 focus:ring-amber-500'
                }`}
              />
              {errors.business_type && (
                <p className="mt-1 text-sm text-red-600">{errors.business_type}</p>
              )}
            </div>

            {/* City and ZIP */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="city"
                  className="block text-sm font-medium text-gray-700"
                >
                  City *
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city || ''}
                  onChange={handleInputChange}
                  placeholder="e.g., Los Angeles"
                  className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                    errors.city
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:border-amber-500 focus:ring-amber-500'
                  }`}
                />
                {errors.city && (
                  <p className="mt-1 text-sm text-red-600">{errors.city}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="zip_code"
                  className="block text-sm font-medium text-gray-700"
                >
                  ZIP Code (optional)
                </label>
                <input
                  type="text"
                  id="zip_code"
                  name="zip_code"
                  value={formData.zip_code || ''}
                  onChange={handleInputChange}
                  placeholder="e.g., 90012"
                  className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                    errors.zip_code
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:border-amber-500 focus:ring-amber-500'
                  }`}
                />
                {errors.zip_code && (
                  <p className="mt-1 text-sm text-red-600">{errors.zip_code}</p>
                )}
              </div>
            </div>

            {/* Radius and Max Results */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="radius_miles"
                  className="block text-sm font-medium text-gray-700"
                >
                  Search Radius (miles)
                </label>
                <select
                  id="radius_miles"
                  name="radius_miles"
                  value={formData.radius_miles || 10}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm"
                >
                  {RADIUS_OPTIONS.map((r) => (
                    <option key={r} value={r}>
                      {r} miles
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="max_results"
                  className="block text-sm font-medium text-gray-700"
                >
                  Max Results
                </label>
                <input
                  type="number"
                  id="max_results"
                  name="max_results"
                  value={formData.max_results || 100}
                  onChange={handleInputChange}
                  min={1}
                  max={500}
                  className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                    errors.max_results
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:border-amber-500 focus:ring-amber-500'
                  }`}
                />
                {errors.max_results && (
                  <p className="mt-1 text-sm text-red-600">{errors.max_results}</p>
                )}
              </div>
            </div>

            {/* Campaign Name */}
            <div>
              <label
                htmlFor="campaign_name"
                className="block text-sm font-medium text-gray-700"
              >
                Campaign Name (optional)
              </label>
              <input
                type="text"
                id="campaign_name"
                name="campaign_name"
                value={formData.campaign_name || ''}
                onChange={handleInputChange}
                placeholder="e.g., Q1 2024 Plumber Outreach"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm"
              />
            </div>

            {/* Send Emails Toggle */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="send_emails"
                name="send_emails"
                checked={formData.send_emails || false}
                onChange={handleInputChange}
                className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
              />
              <label
                htmlFor="send_emails"
                className="ml-2 block text-sm text-gray-700"
              >
                Send outreach emails to enriched leads
              </label>
            </div>

            {formData.send_emails && (
              <div className="rounded-md bg-yellow-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-yellow-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Email Outreach Enabled
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>
                        Emails will only be sent to leads with email confidence above 70%.
                        Daily sending limits apply.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  isSubmitting
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Running Workflow...
                  </>
                ) : (
                  'Start Lead Generation'
                )}
              </button>
            </div>
          </form>

          {/* Error Display */}
          {error && (
            <div className="px-6 pb-4">
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-red-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      Workflow Failed
                    </h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{error}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Result Display */}
          {result && (
            <div className="px-6 pb-6">
              <div className="rounded-md bg-green-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-green-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1">
                    <h3 className="text-sm font-medium text-green-800">
                      Workflow {result.status}
                    </h3>
                    <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <p className="text-xs text-gray-500">Fetched</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {result.total_fetched}
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <p className="text-xs text-gray-500">Inserted</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {result.total_inserted}
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <p className="text-xs text-gray-500">Updated</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {result.total_updated}
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <p className="text-xs text-gray-500">Deduped</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {result.total_deduped}
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <p className="text-xs text-gray-500">Enriched</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {result.total_enriched}
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <p className="text-xs text-gray-500">Emailed</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {result.total_emailed}
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <p className="text-xs text-gray-500">Duration</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {result.duration_seconds}s
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <p className="text-xs text-gray-500">Errors</p>
                        <p className={`text-lg font-semibold ${result.errors.length > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                          {result.errors.length}
                        </p>
                      </div>
                    </div>

                    {result.errors.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-red-800 mb-2">Errors:</p>
                        <ul className="list-disc list-inside text-sm text-red-700">
                          {result.errors.slice(0, 5).map((err, i) => (
                            <li key={i}>
                              [{err.step}] {err.message}
                            </li>
                          ))}
                          {result.errors.length > 5 && (
                            <li>...and {result.errors.length - 5} more</li>
                          )}
                        </ul>
                      </div>
                    )}

                    <p className="mt-4 text-xs text-gray-500">
                      Run ID: {result.run_id}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <button
            onClick={async () => {
              const res = await fetch('/api/leads/sync-qualification', { method: 'POST' });
              const data = await res.json();
              alert(`Synced: ${data.data?.approved || 0} approved, ${data.data?.rejected || 0} rejected`);
            }}
            className="bg-white shadow rounded-lg p-4 text-left hover:bg-gray-50 transition-colors"
          >
            <h3 className="text-sm font-medium text-gray-900">Sync Qualifications</h3>
            <p className="mt-1 text-xs text-gray-500">
              Pull qualification decisions from Google Sheets
            </p>
          </button>

          <button
            onClick={async () => {
              const res = await fetch('/api/leads/enrich', { method: 'POST' });
              const data = await res.json();
              alert(`Enriched: ${data.data?.enriched || 0} leads`);
            }}
            className="bg-white shadow rounded-lg p-4 text-left hover:bg-gray-50 transition-colors"
          >
            <h3 className="text-sm font-medium text-gray-900">Run Enrichment</h3>
            <p className="mt-1 text-xs text-gray-500">
              Enrich approved leads with contact data
            </p>
          </button>

          <button
            onClick={async () => {
              const res = await fetch('/api/leads/email', { method: 'POST' });
              const data = await res.json();
              alert(`Sent: ${data.data?.sent || 0} emails`);
            }}
            className="bg-white shadow rounded-lg p-4 text-left hover:bg-gray-50 transition-colors"
          >
            <h3 className="text-sm font-medium text-gray-900">Send Emails</h3>
            <p className="mt-1 text-xs text-gray-500">
              Send outreach to enriched leads
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}
