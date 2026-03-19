// ============================================================
// Domain Types
// ============================================================

export type AssetType =
  | 'savings' | 'fd' | 'rd'
  | 'stocks' | 'mf_equity' | 'etf' | 'us_stocks' | 'sgb'
  | 'mf_debt' | 'ppf' | 'epf' | 'nps' | 'bonds'
  | 'property' | 'reit'
  | 'gold' | 'crypto' | 'vehicle' | 'other'

export type AssetCategory = 'bank' | 'equity' | 'debt' | 'real_estate' | 'others'

export type LiabilityType =
  | 'home_loan' | 'car_loan' | 'personal_loan'
  | 'credit_card' | 'education_loan' | 'other'

export type TransactionType = 'income' | 'expense'

export type InvestmentType = 'stock' | 'mf' | 'etf' | 'us_stock'

export type Broker = 'zerodha' | 'groww' | 'upstox' | 'manual'

export type Currency = 'INR' | 'USD' | 'EUR' | 'GBP' | 'SGD' | 'AED'

// ============================================================
// DB Row Types
// ============================================================

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  base_currency: Currency
  monthly_income: number
  is_pro: boolean
  onboarded: boolean
  created_at: string
  updated_at: string
}

export interface Asset {
  id: string
  user_id: string
  name: string
  type: AssetType
  category: AssetCategory
  current_value: number
  purchase_price: number | null
  quantity: number | null
  ticker_symbol: string | null
  currency: Currency
  institution: string | null
  notes: string | null
  is_manual_value: boolean
  last_price_refresh: string | null
  created_at: string
  updated_at: string
}

export interface Liability {
  id: string
  user_id: string
  name: string
  type: LiabilityType
  principal_amount: number
  outstanding_amount: number
  interest_rate: number | null
  emi_amount: number | null
  start_date: string | null
  end_date: string | null
  institution: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Transaction {
  id: string
  user_id: string
  type: TransactionType
  amount: number
  currency: Currency
  category: string
  sub_category: string | null
  description: string | null
  date: string
  is_recurring: boolean
  recurring_frequency: string | null
  tags: string[] | null
  created_at: string
  updated_at: string
}

export interface Investment {
  id: string
  user_id: string
  broker: Broker
  symbol: string
  isin: string | null
  name: string
  investment_type: InvestmentType
  quantity: number
  avg_cost: number
  ltp: number | null
  current_value: number | null
  invested_value: number | null
  unrealised_pnl: number | null
  unrealised_pnl_pct: number | null
  xirr: number | null
  sector: string | null
  currency: Currency
  last_refresh: string | null
  import_batch_id: string | null
  created_at: string
  updated_at: string
}

export interface NetworthSnapshot {
  id: string
  user_id: string
  snapshot_date: string
  total_assets: number
  total_liabilities: number
  net_worth: number
  breakdown: {
    equity: number
    debt: number
    real_estate: number
    others: number
  } | null
  created_at: string
}

export interface InsightCache {
  id: string
  user_id: string
  insight_type: string
  content: AIInsight
  generated_at: string
}

export interface AIInsight {
  title: string
  verdict: string
  action: string
  score?: number
  score_label?: string
}

// ============================================================
// Computed / Aggregated Types
// ============================================================

export interface NetworthSummary {
  total_assets: number
  total_liabilities: number
  net_worth: number
  equity_value: number
  debt_value: number
  real_estate_value: number
  others_value: number
}

export interface MonthlyCashflow {
  month: string
  income: number
  expenses: number
  savings: number
}

export interface AllocationItem {
  name: string
  value: number
  percentage: number
  color: string
}

// ============================================================
// Form Types
// ============================================================

export interface AssetFormData {
  name: string
  type: AssetType
  category: AssetCategory
  current_value: number
  purchase_price?: number
  quantity?: number
  ticker_symbol?: string
  currency: Currency
  institution?: string
  notes?: string
}

export interface LiabilityFormData {
  name: string
  type: LiabilityType
  principal_amount: number
  outstanding_amount: number
  interest_rate?: number
  emi_amount?: number
  start_date?: string
  end_date?: string
  institution?: string
}

export interface TransactionFormData {
  type: TransactionType
  amount: number
  category: string
  sub_category?: string
  description?: string
  date: string
  is_recurring: boolean
  recurring_frequency?: string
}

// ============================================================
// Constants
// ============================================================

export const INCOME_CATEGORIES = [
  'Salary', 'Freelance', 'Business', 'Rental income',
  'Dividends', 'Interest', 'Capital gains', 'Other income'
]

export const EXPENSE_CATEGORIES = [
  'Housing', 'EMI', 'Groceries', 'Dining', 'Transport',
  'Fuel', 'Utilities', 'Healthcare', 'Insurance',
  'Shopping', 'Entertainment', 'Travel', 'Education',
  'Personal care', 'Subscriptions', 'SIP/Investments',
  'Charity', 'Miscellaneous'
]

export const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  savings: 'Savings Account', fd: 'Fixed Deposit', rd: 'Recurring Deposit',
  stocks: 'Indian Stocks', mf_equity: 'Equity Mutual Fund', etf: 'ETF',
  us_stocks: 'US Stocks', sgb: 'Sovereign Gold Bond',
  mf_debt: 'Debt Mutual Fund', ppf: 'PPF', epf: 'EPF', nps: 'NPS', bonds: 'Bonds',
  property: 'Real Estate', reit: 'REIT',
  gold: 'Physical Gold', crypto: 'Cryptocurrency', vehicle: 'Vehicle', other: 'Other'
}

export const CATEGORY_COLORS: Record<AssetCategory, string> = {
  equity: '#10b981',
  debt: '#3b82f6',
  real_estate: '#f59e0b',
  bank: '#8b5cf6',
  others: '#6b7280',
}

export const LIABILITY_TYPE_LABELS: Record<LiabilityType, string> = {
  home_loan: 'Home Loan', car_loan: 'Car Loan', personal_loan: 'Personal Loan',
  credit_card: 'Credit Card', education_loan: 'Education Loan', other: 'Other'
}

export const formatCurrency = (amount: number, currency: Currency = 'INR'): string => {
  if (currency === 'INR') {
    if (Math.abs(amount) >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`
    if (Math.abs(amount) >= 100000) return `₹${(amount / 100000).toFixed(2)}L`
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
}

export const formatCompact = (amount: number): string => {
  if (Math.abs(amount) >= 10000000) return `${(amount / 10000000).toFixed(1)}Cr`
  if (Math.abs(amount) >= 100000) return `${(amount / 100000).toFixed(1)}L`
  if (Math.abs(amount) >= 1000) return `${(amount / 1000).toFixed(0)}K`
  return amount.toFixed(0)
}
