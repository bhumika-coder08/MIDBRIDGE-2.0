import React, { useState, useEffect } from 'react';
import {
  Coins,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  ArrowRight,
  DollarSign,
  TrendingDown,
  Info,
  RefreshCw,
  X,
  ExternalLink,
} from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout.js';
import { api } from '../services/api.js';

interface CostItem {
  id: string;
  name: string;
  category: string;
  timing: string;
  estimated_amount: number;
  currency: string;
  is_mandatory: boolean;
  source: string;
  notes?: string;
  user_edited: boolean;
}

interface FundingSource {
  id: string;
  title: string;
  funding_type: string;
  status: string;
  amount: number;
  currency: string;
  notes?: string;
}

interface CostPlanResponse {
  plan: {
    id: string;
    homeCurrency: string;
    destCurrency: string;
    exchangeRate: number;
    exchangeRateSource: string;
    lastRateUpdate: string;
  };
  summary: {
    preDepartureTotal: number;
    firstMonthTotal: number;
    monthlyRecurring: number;
    yearOneTotal: number;
    confirmedFunding: number;
    plannedFunding: number;
    estimatedFundingGap: number;
    financialReadinessPercentage: number;
    preDepartureTotalHome: number;
    yearOneTotalHome: number;
    confirmedFundingHome: number;
    estimatedFundingGapHome: number;
  };
  items: CostItem[];
  funding: FundingSource[];
  matchingScholarships: any[];
  disclaimer: string;
}

export const CostPlannerPage: React.FC = () => {
  const [data, setData] = useState<CostPlanResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTiming, setSelectedTiming] = useState<string>('ALL');

  // Add Item Modal
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [itemName, setItemName] = useState('');
  const [itemCategory, setItemCategory] = useState('APPLICATION');
  const [itemTiming, setItemTiming] = useState('PRE_DEPARTURE');
  const [itemAmount, setItemAmount] = useState('');
  const [itemSource, setItemSource] = useState('');
  const [itemNotes, setItemNotes] = useState('');
  const [itemMandatory, setItemMandatory] = useState(true);

  // Add Funding Modal
  const [fundModalOpen, setFundModalOpen] = useState(false);
  const [fundTitle, setFundTitle] = useState('');
  const [fundType, setFundType] = useState('SCHOLARSHIP');
  const [fundAmount, setFundAmount] = useState('');
  const [fundStatus, setFundStatus] = useState('PLANNED');

  // Rate edit
  const [rateEditOpen, setRateEditOpen] = useState(false);
  const [customRate, setCustomRate] = useState('');

  const fetchCostData = async () => {
    try {
      setLoading(true);
      const res = await api.get<CostPlanResponse>('/cost-planner');
      setData(res);
      if (res?.plan?.exchangeRate) {
        setCustomRate(res.plan.exchangeRate.toString());
      }
    } catch (err: any) {
      console.error('Failed to load cost planner:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCostData();
  }, []);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/cost-planner/items', {
        name: itemName,
        category: itemCategory,
        timing: itemTiming,
        estimatedAmount: Number(itemAmount),
        isMandatory: itemMandatory,
        source: itemSource || 'User Estimate',
        notes: itemNotes,
      });
      setItemModalOpen(false);
      setItemName('');
      setItemAmount('');
      setItemSource('');
      setItemNotes('');
      await fetchCostData();
    } catch (err: any) {
      alert(err.message || 'Failed to add cost item.');
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!window.confirm('Delete this cost entry from your plan?')) return;
    try {
      await api.delete(`/cost-planner/items/${id}`);
      await fetchCostData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete item.');
    }
  };

  const handleAddFunding = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/cost-planner/funding', {
        title: fundTitle,
        fundingType: fundType,
        amount: Number(fundAmount),
        status: fundStatus,
      });
      setFundModalOpen(false);
      setFundTitle('');
      setFundAmount('');
      await fetchCostData();
    } catch (err: any) {
      alert(err.message || 'Failed to record funding source.');
    }
  };

  const handleToggleFundingStatus = async (fundingItem: FundingSource) => {
    const nextStatus = fundingItem.status === 'AWARDED_CONFIRMED' ? 'PLANNED' : 'AWARDED_CONFIRMED';
    try {
      await api.put(`/cost-planner/funding/${fundingItem.id}`, {
        status: nextStatus,
      });
      await fetchCostData();
    } catch (err: any) {
      alert(err.message || 'Failed to update funding status.');
    }
  };

  const handleDeleteFunding = async (id: string) => {
    if (!window.confirm('Remove this funding source?')) return;
    try {
      await api.delete(`/cost-planner/funding/${id}`);
      await fetchCostData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete funding.');
    }
  };

  const handleUpdateRate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put('/cost-planner/exchange-rate', {
        exchangeRate: Number(customRate),
        source: 'User Custom Adjustment',
      });
      setRateEditOpen(false);
      await fetchCostData();
    } catch (err: any) {
      alert(err.message || 'Failed to adjust exchange rate.');
    }
  };

  const filteredItems = !data ? [] : selectedTiming === 'ALL'
    ? data.items
    : data.items.filter(i => i.timing === selectedTiming);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-[11px] font-mono text-amber-300 uppercase tracking-wider mb-2">
              <Coins className="h-3 w-3" />
              <span>Multi-Currency Cost Planner • Solvency Engine</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>MidBridge 2.0 Cost Planner</span>
            </h1>
            <p className="text-xs sm:text-sm text-white/60 mt-1 max-w-3xl">
              Model pre-departure, first-month, and year-one international relocation expenditures. Compare planned estimates against confirmed scholarships to isolate your true funding gap.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFundModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer"
            >
              <GraduationCap className="h-3.5 w-3.5 text-amber-400" />
              <span>+ Record Funding</span>
            </button>
            <button
              onClick={() => setItemModalOpen(true)}
              className="px-4 py-2 rounded-xl btn-primary text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer shadow-lg"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>+ Add Cost Item</span>
            </button>
          </div>
        </div>

        {/* Official Cost Safety Disclaimer */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 flex items-start gap-3">
          <Info className="h-4 w-4 flex-shrink-0 text-amber-400 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-semibold text-amber-300">Important Planning Notice:</span>
            <p className="text-white/70">
              Planning estimate — verify current official consular, university, and health authority fee schedules prior to payment. MidBridge 2.0 does not guarantee official visa application or blocked account rates.
            </p>
          </div>
        </div>

        {loading || !data ? (
          <div className="p-16 text-center text-xs text-white/40">Calculating financial estimates...</div>
        ) : (
          <>
            {/* Exchange Rate Bar */}
            <div className="glass-card rounded-2xl px-5 py-3 border border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-3">
                <span className="text-white/50">Currency Pair:</span>
                <span className="font-mono font-bold text-white">
                  {data.plan.homeCurrency} ⇄ {data.plan.destCurrency}
                </span>
                <span className="text-white/40">|</span>
                <span className="text-white/60">
                  1 {data.plan.homeCurrency} ≈ {data.plan.exchangeRate} {data.plan.destCurrency}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-white/5 text-[10px] text-white/50">
                  {data.plan.exchangeRateSource}
                </span>
              </div>
              <button
                onClick={() => setRateEditOpen(true)}
                className="text-cyan-400 hover:text-cyan-300 underline font-medium cursor-pointer"
              >
                Adjust Exchange Rate
              </button>
            </div>

            {/* Financial Summary KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="glass-strong rounded-2xl p-5 border border-white/15 space-y-1">
                <div className="text-[11px] font-mono text-white/50 uppercase">Pre-Departure Total</div>
                <div className="text-2xl font-mono font-bold text-white">
                  {data.plan.destCurrency} {data.summary.preDepartureTotal.toLocaleString()}
                </div>
                <div className="text-[11px] font-mono text-white/40">
                  ≈ {data.plan.homeCurrency} {data.summary.preDepartureTotalHome.toLocaleString()}
                </div>
                <div className="text-[10px] text-white/40 pt-1">Visa, biometrics, flight, blocked account</div>
              </div>

              <div className="glass-strong rounded-2xl p-5 border border-white/15 space-y-1">
                <div className="text-[11px] font-mono text-white/50 uppercase">Estimated Year-One Total</div>
                <div className="text-2xl font-mono font-bold text-white">
                  {data.plan.destCurrency} {data.summary.yearOneTotal.toLocaleString()}
                </div>
                <div className="text-[11px] font-mono text-white/40">
                  ≈ {data.plan.homeCurrency} {data.summary.yearOneTotalHome.toLocaleString()}
                </div>
                <div className="text-[10px] text-white/40 pt-1">Full 12-month living & study commitment</div>
              </div>

              <div className="glass-strong rounded-2xl p-5 border border-white/15 space-y-1">
                <div className="text-[11px] font-mono text-white/50 uppercase">Confirmed Funding</div>
                <div className="text-2xl font-mono font-bold text-emerald-400">
                  {data.plan.destCurrency} {data.summary.confirmedFunding.toLocaleString()}
                </div>
                <div className="text-[11px] font-mono text-white/40">
                  ≈ {data.plan.homeCurrency} {data.summary.confirmedFundingHome.toLocaleString()}
                </div>
                <div className="text-[10px] text-emerald-300 pt-1">Awarded scholarships & verified savings</div>
              </div>

              <div className="glass-strong rounded-2xl p-5 border border-white/15 space-y-1">
                <div className="text-[11px] font-mono text-white/50 uppercase">Estimated Funding Gap</div>
                <div className="text-2xl font-mono font-bold text-amber-400">
                  {data.plan.destCurrency} {data.summary.estimatedFundingGap.toLocaleString()}
                </div>
                <div className="text-[11px] font-mono text-white/40">
                  ≈ {data.plan.homeCurrency} {data.summary.estimatedFundingGapHome.toLocaleString()}
                </div>
                <div className="text-[10px] text-amber-300 pt-1">Remaining funds needed before travel</div>
              </div>
            </div>

            {/* Timing Filter Tabs */}
            <div className="flex items-center gap-2 border-b border-white/10 pb-2">
              {[
                { id: 'ALL', label: 'All Items' },
                { id: 'PRE_DEPARTURE', label: 'Pre-Departure (One-Time)' },
                { id: 'FIRST_MONTH', label: 'First-Month (Arrival Setup)' },
                { id: 'MONTHLY_RECURRING', label: 'Monthly Living Expenses' },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTiming(t.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                    selectedTiming === t.id
                      ? 'bg-white text-black font-semibold'
                      : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Cost Items Grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-white/50 font-mono uppercase">
                <span>Expense Breakdown ({filteredItems.length} Entries)</span>
                <span>Sorted by Category</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredItems.map(item => (
                  <div key={item.id} className="glass-card rounded-2xl p-4 border border-white/10 flex items-start justify-between gap-4">
                    <div className="space-y-1 truncate">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white/10 text-white/70">
                          {item.category.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[10px] font-mono text-white/40">
                          {item.timing.replace(/_/g, ' ')}
                        </span>
                        {item.is_mandatory && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300">
                            Mandatory
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-semibold text-white truncate">{item.name}</h4>
                      <p className="text-[11px] text-white/50 truncate">Source: {item.source}</p>
                      {item.notes && <p className="text-[11px] text-white/40 italic truncate">{item.notes}</p>}
                    </div>

                    <div className="text-right flex-shrink-0 space-y-2">
                      <div className="text-base font-mono font-bold text-white">
                        {item.currency} {Number(item.estimated_amount).toLocaleString()}
                      </div>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-white/30 hover:text-red-400 transition-colors p-1 cursor-pointer"
                        title="Delete cost entry"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Funding Sources Section */}
            <div className="glass-card rounded-2xl p-6 border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-amber-400" />
                    <span>Funding Sources & Scholarships</span>
                  </h3>
                  <p className="text-xs text-white/50">
                    Only funding recorded with status <strong>AWARDED / CONFIRMED</strong> is subtracted from your estimated funding gap.
                  </p>
                </div>
                <button
                  onClick={() => setFundModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl btn-primary text-xs font-semibold text-white cursor-pointer"
                >
                  + Add Funding
                </button>
              </div>

              {data.funding.length === 0 ? (
                <div className="p-6 text-center text-xs text-white/40 border border-dashed border-white/10 rounded-xl">
                  No funding sources recorded yet. Add your personal savings, sponsor letters, or awarded scholarships.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {data.funding.map(f => (
                    <div key={f.id} className="p-4 rounded-xl bg-black/40 border border-white/10 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-mono uppercase text-white/40">{f.funding_type}</span>
                          <button
                            onClick={() => handleToggleFundingStatus(f)}
                            className={`text-[10px] font-mono px-2 py-0.5 rounded-full cursor-pointer transition-colors ${
                              f.status === 'AWARDED_CONFIRMED'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            }`}
                          >
                            {f.status === 'AWARDED_CONFIRMED' ? 'AWARDED' : 'PLANNED'}
                          </button>
                        </div>
                        <h5 className="text-sm font-semibold text-white truncate">{f.title}</h5>
                        <div className="text-lg font-mono font-bold text-emerald-400 mt-1">
                          {f.currency} {Number(f.amount).toLocaleString()}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] pt-2 border-t border-white/5">
                        <span className="text-white/40">
                          {f.status === 'AWARDED_CONFIRMED' ? 'Active in readiness calculation' : 'Not yet confirmed'}
                        </span>
                        <button
                          onClick={() => handleDeleteFunding(f.id)}
                          className="text-white/30 hover:text-red-400 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Add Cost Item Modal */}
        {itemModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="glass-strong rounded-3xl p-6 border border-white/15 w-full max-w-md space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white">Add Cost Item</h3>
                <button onClick={() => setItemModalOpen(false)} className="text-white/40 hover:text-white cursor-pointer">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleAddItem} className="space-y-3 text-xs">
                <div>
                  <label className="block text-white/70 mb-1">Item Name</label>
                  <input
                    type="text"
                    required
                    value={itemName}
                    onChange={e => setItemName(e.target.value)}
                    placeholder="e.g. Visa Processing Fee"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-white/70 mb-1">Category</label>
                    <select
                      value={itemCategory}
                      onChange={e => setItemCategory(e.target.value)}
                      className="w-full bg-neutral-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none"
                    >
                      <option value="APPLICATION">Application</option>
                      <option value="DOCUMENTATION">Documentation</option>
                      <option value="IMMIGRATION">Immigration / Visa</option>
                      <option value="HEALTH">Health & Insurance</option>
                      <option value="EDUCATION">Education / Tuition</option>
                      <option value="FINANCIAL_REQUIREMENTS">Living Proof / Solvency</option>
                      <option value="TRAVEL">Travel / Flight</option>
                      <option value="ACCOMMODATION">Accommodation</option>
                      <option value="ARRIVAL">Arrival Setup</option>
                      <option value="EMERGENCY">Emergency Reserve</option>
                      <option value="OTHER">Other Expense</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-white/70 mb-1">Timing</label>
                    <select
                      value={itemTiming}
                      onChange={e => setItemTiming(e.target.value)}
                      className="w-full bg-neutral-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none"
                    >
                      <option value="PRE_DEPARTURE">Pre-Departure</option>
                      <option value="FIRST_MONTH">First Month</option>
                      <option value="MONTHLY_RECURRING">Monthly Recurring</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-white/70 mb-1">Estimated Amount ({data?.plan.destCurrency || 'EUR'})</label>
                  <input
                    type="number"
                    required
                    value={itemAmount}
                    onChange={e => setItemAmount(e.target.value)}
                    placeholder="e.g. 75"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-white/70 mb-1">Fee Source / Verification URL</label>
                  <input
                    type="text"
                    value={itemSource}
                    onChange={e => setItemSource(e.target.value)}
                    placeholder="e.g. Consular Website"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setItemModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="px-5 py-2 rounded-xl btn-primary text-white font-semibold cursor-pointer">
                    Add Item
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Funding Source Modal */}
        {fundModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="glass-strong rounded-3xl p-6 border border-white/15 w-full max-w-md space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white">Record Funding Source</h3>
                <button onClick={() => setFundModalOpen(false)} className="text-white/40 hover:text-white cursor-pointer">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleAddFunding} className="space-y-3 text-xs">
                <div>
                  <label className="block text-white/70 mb-1">Funding Title</label>
                  <input
                    type="text"
                    required
                    value={fundTitle}
                    onChange={e => setFundTitle(e.target.value)}
                    placeholder="e.g. DAAD Master Fellowship / Personal Savings"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-white/70 mb-1">Funding Type</label>
                    <select
                      value={fundType}
                      onChange={e => setFundType(e.target.value)}
                      className="w-full bg-neutral-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none"
                    >
                      <option value="SCHOLARSHIP">Scholarship / Fellowship</option>
                      <option value="PERSONAL_SAVINGS">Personal Savings</option>
                      <option value="SPONSOR">Family Sponsor / Guarantor</option>
                      <option value="STUDENT_LOAN">Education Loan</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-white/70 mb-1">Status</label>
                    <select
                      value={fundStatus}
                      onChange={e => setFundStatus(e.target.value)}
                      className="w-full bg-neutral-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none"
                    >
                      <option value="PLANNED">Planned / In Progress</option>
                      <option value="APPLIED">Applied / Under Review</option>
                      <option value="AWARDED_CONFIRMED">Awarded / Confirmed</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-white/70 mb-1">Amount ({data?.plan.destCurrency || 'EUR'})</label>
                  <input
                    type="number"
                    required
                    value={fundAmount}
                    onChange={e => setFundAmount(e.target.value)}
                    placeholder="e.g. 5000"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setFundModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="px-5 py-2 rounded-xl btn-primary text-white font-semibold cursor-pointer">
                    Save Funding
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Rate Edit Modal */}
        {rateEditOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="glass-strong rounded-3xl p-6 border border-white/15 w-full max-w-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white">Adjust Exchange Rate</h3>
                <button onClick={() => setRateEditOpen(false)} className="text-white/40 hover:text-white cursor-pointer">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateRate} className="space-y-3 text-xs">
                <p className="text-white/60">
                  Enter how many {data?.plan.destCurrency} equals 1 {data?.plan.homeCurrency}:
                </p>
                <div>
                  <label className="block text-white/70 mb-1">Exchange Rate</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={customRate}
                    onChange={e => setCustomRate(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setRateEditOpen(false)}
                    className="px-4 py-2 rounded-xl bg-white/5 text-white/70 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="px-5 py-2 rounded-xl btn-primary text-white font-semibold cursor-pointer">
                    Update Rate
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
