'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Opportunity, OpportunityStage } from '@/types/opportunity';
import { opportunitiesService } from '@/lib/opportunities';
import { authService } from '@/lib/auth';

export default function OpportunitiesPage() {
  const router = useRouter();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [filteredOpportunities, setFilteredOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/login');
      return;
    }
    loadOpportunities();
  }, [router]);

  const loadOpportunities = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await opportunitiesService.getAllOpportunities();
      setOpportunities(data);
      setFilteredOpportunities(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load opportunities');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim() && !stageFilter) {
      setFilteredOpportunities(opportunities);
      return;
    }

    try {
      if (query.trim()) {
        const results = await opportunitiesService.searchOpportunities(query);
        let filtered = results;
        if (stageFilter) {
          filtered = results.filter(opp => opp.stage === stageFilter);
        }
        setFilteredOpportunities(filtered);
      } else {
        const filtered = opportunities.filter(opp => opp.stage === stageFilter);
        setFilteredOpportunities(filtered);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    }
  };

  const handleStageFilter = (stage: string) => {
    setStageFilter(stage);
    if (!stage && !searchQuery.trim()) {
      setFilteredOpportunities(opportunities);
      return;
    }

    let filtered = opportunities;
    if (stage) {
      filtered = filtered.filter(opp => opp.stage === stage);
    }
    if (searchQuery.trim()) {
      filtered = filtered.filter(opp =>
        opp.opportunityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opp.accountName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredOpportunities(filtered);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this opportunity?')) {
      return;
    }

    try {
      await opportunitiesService.deleteOpportunity(id);
      loadOpportunities();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete opportunity');
    }
  };

  const formatCurrency = (value: number | undefined) => {
    if (!value) return '-';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  const getStageBadgeColor = (stage: OpportunityStage) => {
    const colors = {
      [OpportunityStage.PROSPECTING]: 'bg-blue-100 text-blue-800',
      [OpportunityStage.QUALIFICATION]: 'bg-indigo-100 text-indigo-800',
      [OpportunityStage.NEEDS_ANALYSIS]: 'bg-yellow-100 text-yellow-800',
      [OpportunityStage.PROPOSAL]: 'bg-purple-100 text-purple-800',
      [OpportunityStage.NEGOTIATION]: 'bg-orange-100 text-orange-800',
      [OpportunityStage.CLOSED_WON]: 'bg-green-100 text-green-800',
      [OpportunityStage.CLOSED_LOST]: 'bg-red-100 text-red-800',
    };
    return colors[stage] || 'bg-gray-100 text-gray-800';
  };

  const getStageLabel = (stage: OpportunityStage) => {
    return stage.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading opportunities...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Opportunities</h1>
          <p className="mt-2 text-gray-600">Manage your sales opportunities</p>
        </div>

        {/* Actions Bar */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search opportunities by name or account..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          <div>
            <select
              value={stageFilter}
              onChange={(e) => handleStageFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="">All Stages</option>
              <option value={OpportunityStage.PROSPECTING}>Prospecting</option>
              <option value={OpportunityStage.QUALIFICATION}>Qualification</option>
              <option value={OpportunityStage.NEEDS_ANALYSIS}>Needs Analysis</option>
              <option value={OpportunityStage.PROPOSAL}>Proposal</option>
              <option value={OpportunityStage.NEGOTIATION}>Negotiation</option>
              <option value={OpportunityStage.CLOSED_WON}>Closed Won</option>
              <option value={OpportunityStage.CLOSED_LOST}>Closed Lost</option>
            </select>
          </div>
          <button
            onClick={() => router.push('/opportunities/new')}
            className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors whitespace-nowrap"
          >
            + New Opportunity
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Opportunities Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Opportunity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Account
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Probability
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Close Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Owner
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOpportunities.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      {searchQuery || stageFilter ? 'No opportunities found matching your filters' : 'No opportunities yet. Create your first opportunity!'}
                    </td>
                  </tr>
                ) : (
                  filteredOpportunities.map((opportunity) => (
                    <tr key={opportunity.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {opportunity.opportunityName}
                          </div>
                          <div className="text-sm text-gray-500">{opportunity.opportunityId}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{opportunity.accountName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStageBadgeColor(opportunity.stage)}`}>
                          {getStageLabel(opportunity.stage)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatCurrency(opportunity.amount)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{opportunity.probability}%</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDate(opportunity.expectedCloseDate)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{opportunity.ownerName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => router.push(`/opportunities/${opportunity.id}`)}
                          className="text-orange-600 hover:text-orange-900 mr-4"
                        >
                          View
                        </button>
                        <button
                          onClick={() => router.push(`/opportunities/${opportunity.id}/edit`)}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(opportunity.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 text-sm text-gray-600">
          Showing {filteredOpportunities.length} of {opportunities.length} opportunities
        </div>
      </div>
    </div>
  );
}
