const API_BASE = '/api';

export interface Family {
  id: number;
  name: string;
  email?: string;
  avatar_url?: string;
  total_monthly_income: number;
}

export interface MonthlyPlan {
  id: number;
  family_id: number;
  month: string;
  spend_budget: number;
  save_budget: number;
  effective_save_budget?: number;
  unused_discretionary?: number;
  invest_budget: number;
  discretionary_budget: number;
  custom_spend?: number;
  custom_invest?: number;
  custom_discretionary?: number;
  market_trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
}

export interface Purchase {
  id: number;
  plan_id: number;
  item_name: string;
  amount: number;
  category: string;
  priority_weight: number;
  budget_type?: 'ESSENTIAL' | 'DISCRETIONARY';
  status: 'ACCEPTED' | 'DEFERRED' | 'PENDING';
  decision_reason?: string;
}

export interface Goal {
  id: number;
  family_id: number;
  description: string;
  target_amount: number;
  horizon_years: number;
  user_importance: number;
  status: string;
  priority_rank?: number;
  calculated_score?: number;
  allocated_invest_amount?: number;
  custom_allocated_amount?: number | null;
  is_custom_allocated?: boolean;
  urgency_score?: number;
  amount_ratio_score?: number;
  importance_score?: number;
  explanation?: string;
}

export interface SpendingLog {
  id: number;
  plan_id: number;
  period_type: 'WEEKLY' | 'MONTHLY';
  period_name: string;
  essentials_spent: number;
  discretionary_spent: number;
  savings_added: number;
  notes?: string;
  created_at?: string;
}

export interface MarketSnapshot {
  id: number;
  date: string;
  index_value: number;
  trend_direction: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  change_percent: number;
}

export interface KnapsackResult {
  accepted: Purchase[];
  deferred: Purchase[];
  totalCost: number;
  totalValue: number;
  capacity: number;
  dpMatrix: {
    itemNames: string[];
    capacityHeaders: number[];
    grid: number[][];
  };
  explanations: Record<number, { accepted: boolean; reason: string }>;
}

export async function loginUser(email: string, password: string): Promise<{ family: Family; message: string }> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) {
    const errData = await res.json();
    throw new Error(errData.error || 'Login failed');
  }
  return res.json();
}

export async function registerUser(data: {
  name: string;
  email: string;
  password: string;
  total_monthly_income: number;
}): Promise<{ family: Family; message: string }> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const errData = await res.json();
    throw new Error(errData.error || 'Registration failed');
  }
  return res.json();
}

export async function fetchFamilies(): Promise<Family[]> {
  const res = await fetch(`${API_BASE}/families`);
  if (!res.ok) throw new Error('Failed to fetch families');
  return res.json();
}

export async function createFamily(name: string, total_monthly_income: number): Promise<Family> {
  const res = await fetch(`${API_BASE}/families`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, total_monthly_income })
  });
  if (!res.ok) throw new Error('Failed to create family');
  return res.json();
}

export async function updateFamily(id: number, name?: string, total_monthly_income?: number, avatar_url?: string): Promise<Family> {
  const res = await fetch(`${API_BASE}/families/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, total_monthly_income, avatar_url })
  });
  if (!res.ok) throw new Error('Failed to update family');
  return res.json();
}

export async function fetchPlanData(familyId: number, month?: string) {
  const query = month ? `?family_id=${familyId}&month=${month}` : `?family_id=${familyId}`;
  const res = await fetch(`${API_BASE}/plans${query}`);
  if (!res.ok) throw new Error('Failed to fetch monthly plan');
  return res.json();
}

export async function updatePlanBudget(
  planId: number,
  data: {
    spend_budget?: number;
    invest_budget?: number;
    discretionary_budget?: number;
    reset_defaults?: boolean;
  }
) {
  const res = await fetch(`${API_BASE}/plans/${planId}/budget`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to update budget allocation');
  return res.json();
}

export async function optimizePurchases(planId: number): Promise<{ knapsackResult: KnapsackResult; message: string }> {
  const res = await fetch(`${API_BASE}/plans/${planId}/optimize`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to optimize purchases');
  return res.json();
}

export async function addPurchase(purchase: {
  plan_id: number;
  item_name: string;
  amount: number;
  category: string;
  priority_weight: number;
  budget_type?: 'ESSENTIAL' | 'DISCRETIONARY';
}): Promise<Purchase> {
  const res = await fetch(`${API_BASE}/purchases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(purchase)
  });
  if (!res.ok) throw new Error('Failed to add purchase');
  return res.json();
}

export async function deletePurchase(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/purchases/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete purchase');
}

export async function fetchSpendingLogs(planId: number) {
  const res = await fetch(`${API_BASE}/spending?plan_id=${planId}`);
  if (!res.ok) throw new Error('Failed to fetch spending logs');
  return res.json();
}

export async function addSpendingLog(log: {
  plan_id: number;
  period_type?: 'WEEKLY' | 'MONTHLY' | 'SINGLE';
  period_name?: string;
  source_type?: 'ESSENTIALS' | 'DISCRETIONARY' | 'SAVINGS' | 'MULTI';
  amount?: number;
  category?: string;
  essentials_spent?: number;
  discretionary_spent?: number;
  savings_added?: number;
  notes?: string;
}) {
  const res = await fetch(`${API_BASE}/spending`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(log)
  });
  if (!res.ok) throw new Error('Failed to log actual spending');
  return res.json();
}

export async function deleteSpendingLog(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/spending/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete spending log entry');
}

export async function fetchGoalsData(familyId: number) {
  const res = await fetch(`${API_BASE}/goals?family_id=${familyId}`);
  if (!res.ok) throw new Error('Failed to fetch goals');
  return res.json();
}

export async function addGoal(goal: {
  family_id: number;
  description: string;
  target_amount: number;
  horizon_years: number;
  user_importance: number;
  custom_allocated_amount?: number | null;
}): Promise<Goal> {
  const res = await fetch(`${API_BASE}/goals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(goal)
  });
  if (!res.ok) throw new Error('Failed to add goal');
  return res.json();
}

export async function updateGoal(
  id: number,
  goal: {
    description?: string;
    target_amount?: number;
    horizon_years?: number;
    user_importance?: number;
    status?: string;
    custom_allocated_amount?: number | null;
    reset_custom_allocation?: boolean;
  }
): Promise<Goal> {
  const res = await fetch(`${API_BASE}/goals/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(goal)
  });
  if (!res.ok) throw new Error('Failed to update goal');
  return res.json();
}

export async function deleteGoal(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/goals/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete goal');
}

export async function fetchMarketData(): Promise<{ snapshot: MarketSnapshot; history: MarketSnapshot[] }> {
  const res = await fetch(`${API_BASE}/market`);
  if (!res.ok) throw new Error('Failed to fetch market data');
  return res.json();
}

export async function simulateMarketTrend(trend_direction: 'BULLISH' | 'BEARISH' | 'NEUTRAL', family_id?: number) {
  const res = await fetch(`${API_BASE}/market/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ trend_direction, family_id })
  });
  if (!res.ok) throw new Error('Failed to simulate market trend');
  return res.json();
}

// ── Debts & Loans Interfaces & APIs ─────────────────────────────────
export interface Debt {
  id: number;
  family_id: number;
  name: string;
  principal_amount: number;
  interest_rate: number;
  minimum_payment: number;
  debt_type: string;
}

export async function fetchDebts(familyId: number) {
  const res = await fetch(`${API_BASE}/debts?family_id=${familyId}`);
  if (!res.ok) throw new Error('Failed to fetch debts');
  return res.json();
}

export async function addDebt(debt: {
  family_id: number;
  name: string;
  principal_amount: number;
  interest_rate: number;
  minimum_payment: number;
  debt_type?: string;
}): Promise<Debt> {
  const res = await fetch(`${API_BASE}/debts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(debt)
  });
  if (!res.ok) throw new Error('Failed to add debt record');
  return res.json();
}

export async function deleteDebt(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/debts/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete debt record');
}

// ── Recurring Bills Interfaces & APIs ──────────────────────────────
export interface Bill {
  id: number;
  family_id: number;
  name: string;
  amount: number;
  due_day: number;
  category: string;
  is_paid: boolean;
}

export async function fetchBills(familyId: number) {
  const res = await fetch(`${API_BASE}/bills?family_id=${familyId}`);
  if (!res.ok) throw new Error('Failed to fetch bills');
  return res.json();
}

export async function addBill(bill: {
  family_id: number;
  name: string;
  amount: number;
  due_day: number;
  category?: string;
}): Promise<Bill> {
  const res = await fetch(`${API_BASE}/bills`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bill)
  });
  if (!res.ok) throw new Error('Failed to add bill');
  return res.json();
}

export async function toggleBillPaid(id: number): Promise<Bill> {
  const res = await fetch(`${API_BASE}/bills/${id}/toggle`, { method: 'PUT' });
  if (!res.ok) throw new Error('Failed to update bill payment status');
  return res.json();
}

export async function deleteBill(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/bills/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete bill');
}

// ── Assets & Net Worth Interfaces & APIs ────────────────────────────
export interface Asset {
  id: number;
  family_id: number;
  name: string;
  value: number;
  category: string;
  is_liquid: boolean;
}

export async function fetchAssets(familyId: number) {
  const res = await fetch(`${API_BASE}/assets?family_id=${familyId}`);
  if (!res.ok) throw new Error('Failed to fetch assets');
  return res.json();
}

export async function addAsset(asset: {
  family_id: number;
  name: string;
  value: number;
  category?: string;
  is_liquid?: boolean;
}): Promise<Asset> {
  const res = await fetch(`${API_BASE}/assets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(asset)
  });
  if (!res.ok) throw new Error('Failed to add asset');
  return res.json();
}

export async function deleteAsset(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/assets/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete asset');
}

// ── Monthly Audit & Safe Locker APIs ────────────────────────────────
export async function fetchAuditData(familyId: number) {
  const res = await fetch(`${API_BASE}/audit?family_id=${familyId}`);
  if (!res.ok) throw new Error('Failed to fetch audit and safe locker data');
  return res.json();
}

export async function submitMonthlyAudit(audit: {
  family_id: number;
  audit_month: string;
  actual_essentials: number;
  actual_discretionary: number;
  secret_saving_amount?: number;
  long_term_goal_amount?: number;
  notes?: string;
}) {
  const res = await fetch(`${API_BASE}/audit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(audit)
  });
  if (!res.ok) throw new Error('Failed to submit monthly audit');
  return res.json();
}

export async function deleteMonthlyAudit(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/audit/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete monthly audit entry');
}

