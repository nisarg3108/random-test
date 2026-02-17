import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  CalendarDays,
  CreditCard,
  DollarSign,
  RefreshCw,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import Layout from '../../components/layout/Layout.jsx';
import { useBilling } from '../../hooks/useBilling.js';
import { RoleGuard } from '../../hooks/useAuth';

const BillingDashboard = () => {
  const {
    subscription,
    plans,
    payments,
    events,
    metrics,
    loading,
    error,
    actionLoading,
    refresh,
    cancelSubscription,
    changePlan,
  } = useBilling();

  const [selectedPlanId, setSelectedPlanId] = useState('');

  const paymentSummary = useMemo(() => {
    const succeeded = payments.filter((payment) => payment.status === 'SUCCEEDED').length;
    const failed = payments.filter((payment) => payment.status === 'FAILED').length;

    return { succeeded, failed };
  }, [payments]);

  const handleCancel = async () => {
    const confirmed = window.confirm('Cancel this subscription at period end?');
    if (!confirmed) return;
    await cancelSubscription(true);
  };

  const handlePlanChange = async (event) => {
    event.preventDefault();
    await changePlan(selectedPlanId);
    setSelectedPlanId('');
  };

  const selectedPlan = plans.find((plan) => plan.id === selectedPlanId) || null;
  const currentPlanPrice = subscription?.plan?.basePrice ?? null;
  const availablePlans = useMemo(
    () => plans.filter((plan) => plan.id !== subscription?.plan?.id),
    [plans, subscription?.plan?.id]
  );
  const groupedPlans = useMemo(() => {
    const sortPlans = (items) =>
      [...items].sort((a, b) => {
        if (a.basePrice !== b.basePrice) {
          return a.basePrice - b.basePrice;
        }

        return a.name.localeCompare(b.name);
      });

    const monthly = sortPlans(plans.filter((plan) => plan.billingCycle === 'MONTHLY'));
    const yearly = sortPlans(plans.filter((plan) => plan.billingCycle === 'YEARLY'));
    const other = sortPlans(plans.filter(
      (plan) => plan.billingCycle !== 'MONTHLY' && plan.billingCycle !== 'YEARLY'
    ));

    return [
      { label: 'Monthly', items: monthly },
      { label: 'Yearly', items: yearly },
      { label: 'Other', items: other }
    ].filter((group) => group.items.length > 0);
  }, [plans]);

  const getRelativePriceLabel = (plan) => {
    if (plan.isCurrentPlan || currentPlanPrice === null) return null;

    const difference = plan.basePrice - currentPlanPrice;
    const absoluteDifference = Math.abs(difference);
    const percentageDifference =
      currentPlanPrice > 0 ? (absoluteDifference / currentPlanPrice) * 100 : null;
    const percentageText =
      percentageDifference === null ? 'N/A' : `${percentageDifference.toFixed(1)}%`;
    const differenceText = `${plan.currency || 'USD'} ${absoluteDifference.toFixed(2)}`;

    if (plan.basePrice > currentPlanPrice) {
      return {
        text: '▲ premium',
        className: 'text-amber-700 bg-amber-100 border-amber-200',
        tooltip: `Premium by ${differenceText} (${percentageText}) vs current plan`,
        inlineText: `+${differenceText} (${percentageText}) vs current`,
        inlineClassName: 'text-amber-700'
      };
    }

    if (plan.basePrice < currentPlanPrice) {
      return {
        text: '▼ cheaper',
        className: 'text-emerald-700 bg-emerald-100 border-emerald-200',
        tooltip: `Cheaper by ${differenceText} (${percentageText}) vs current plan`,
        inlineText: `-${differenceText} (${percentageText}) vs current`,
        inlineClassName: 'text-emerald-700'
      };
    }

    return {
      text: '• same',
      className: 'text-slate-700 bg-slate-100 border-slate-200',
      tooltip: 'Same price as current plan',
      inlineText: 'Same price as current',
      inlineClassName: 'text-slate-600'
    };
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-16">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </Layout>
    );
  }

  return (
    <RoleGuard requiredRole="ADMIN">
      <Layout>
        <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary-900 flex items-center gap-2">
              <CreditCard className="w-7 h-7 text-blue-600" />
              Billing & Subscription
            </h1>
            <p className="text-primary-600 mt-1">Monitor your subscription, payments, and billing events</p>
          </div>

          <button
            type="button"
            onClick={refresh}
            disabled={loading || actionLoading}
            className="btn-modern btn-secondary flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {!subscription ? (
          <div className="modern-card-elevated p-8 text-center text-primary-700">
            No subscription details are available for this tenant.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="modern-card-elevated p-5">
                <p className="text-sm text-primary-600">Current Plan</p>
                <p className="text-lg font-semibold text-primary-900 mt-1">{subscription.plan?.name || '-'}</p>
              </div>

              <div className="modern-card-elevated p-5">
                <p className="text-sm text-primary-600">Status</p>
                <p className="text-lg font-semibold text-primary-900 mt-1">{subscription.status || '-'}</p>
              </div>

              <div className="modern-card-elevated p-5">
                <p className="text-sm text-primary-600">Days Remaining</p>
                <p className="text-lg font-semibold text-primary-900 mt-1">{subscription.billing?.daysRemaining ?? '-'}</p>
              </div>

              <div className="modern-card-elevated p-5">
                <p className="text-sm text-primary-600">Total Paid</p>
                <p className="text-lg font-semibold text-primary-900 mt-1">
                  {metrics?.payment?.currency || subscription.plan?.currency || 'USD'} {metrics?.payment?.totalPaid ?? 0}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="modern-card-elevated p-6 space-y-4">
                <h2 className="text-lg font-semibold text-primary-900 flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-blue-600" />
                  Subscription Details
                </h2>

                <div className="space-y-2 text-sm text-primary-700">
                  <p><span className="font-medium">Billing Cycle:</span> {subscription.plan?.billingCycle || '-'}</p>
                  <p><span className="font-medium">Current Period End:</span> {subscription.billing?.currentPeriodEnd ? new Date(subscription.billing.currentPeriodEnd).toLocaleDateString() : '-'}</p>
                  <p><span className="font-medium">Provider:</span> {subscription.billing?.provider || 'MANUAL'}</p>
                  <p><span className="font-medium">Auto Renew:</span> {subscription.billing?.autoRenew ? 'Enabled' : 'Disabled'}</p>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={actionLoading}
                    className="btn-modern btn-secondary flex items-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    Cancel at Period End
                  </button>
                </div>
              </div>

              <div className="modern-card-elevated p-6 space-y-4">
                <h2 className="text-lg font-semibold text-primary-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-blue-600" />
                  Quick Plan Change
                </h2>

                <p className="text-sm text-primary-600">
                  Select a target plan to switch the current subscription.
                </p>

                {availablePlans.length === 0 ? (
                  <div className="text-sm text-primary-700 bg-primary-50 rounded-lg p-3 border border-primary-200">
                    No alternative plans are available right now. Your tenant is already on the only active plan option.
                  </div>
                ) : (
                  <form onSubmit={handlePlanChange} className="space-y-3">
                    <select
                      value={selectedPlanId}
                      onChange={(event) => setSelectedPlanId(event.target.value)}
                      className="w-full rounded-lg border border-primary-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      <option value="">Select a plan</option>
                      {availablePlans.map((plan) => (
                        <option key={plan.id} value={plan.id}>
                          {plan.name} • {plan.currency} {plan.basePrice}
                        </option>
                      ))}
                    </select>

                    {selectedPlan && (
                      <div className="text-xs text-primary-600 bg-primary-50 rounded-lg p-3 border border-primary-200">
                        <p className="font-medium text-primary-800">{selectedPlan.name}</p>
                        <p>{selectedPlan.description || 'No description available.'}</p>
                        <p className="mt-1">Modules: {selectedPlan.moduleCount}</p>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={actionLoading || !selectedPlanId}
                      className="btn-modern btn-primary flex items-center gap-2"
                    >
                      <DollarSign className="w-4 h-4" />
                      Change Plan
                    </button>
                  </form>
                )}

                {plans.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <p className="text-xs font-medium text-primary-700">Plan Comparison</p>
                    <div className="space-y-3">
                      {groupedPlans.map((group) => (
                        <div key={group.label} className="space-y-1.5">
                          <p className="text-[11px] uppercase tracking-wide text-primary-500">{group.label}</p>
                          {group.items.map((plan) => (
                            (() => {
                              const relativeLabel = getRelativePriceLabel(plan);
                              return (
                            <div
                              key={plan.id}
                              className="flex items-center justify-between text-xs rounded-lg border border-primary-200 bg-primary-50 px-3 py-2"
                            >
                              <div className="min-w-0">
                                <p className="font-medium text-primary-900 truncate">{plan.name}</p>
                                <p className="text-primary-600 truncate">{plan.currency} {plan.basePrice} • {plan.moduleCount} modules</p>
                                {relativeLabel?.inlineText && (
                                  <p className={`truncate ${relativeLabel.inlineClassName || 'text-slate-600'}`}>
                                    {relativeLabel.inlineText}
                                  </p>
                                )}
                              </div>
                              <div className="ml-2 flex items-center gap-1.5">
                                {relativeLabel ? (
                                    <span
                                      className={`whitespace-nowrap rounded-full px-2 py-0.5 font-medium border ${relativeLabel.className}`}
                                      title={relativeLabel.tooltip}
                                      aria-label={relativeLabel.tooltip}
                                    >
                                      {relativeLabel.text}
                                    </span>
                                ) : null}
                                {plan.isCurrentPlan && (
                                  <span className="whitespace-nowrap rounded-full bg-blue-100 px-2 py-0.5 font-medium text-blue-700 border border-blue-200">
                                    Current Plan
                                  </span>
                                )}
                              </div>
                            </div>
                              );
                            })()
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="modern-card-elevated p-6">
              <h2 className="text-lg font-semibold text-primary-900 mb-4">Recent Payments</h2>
              {payments.length === 0 ? (
                <p className="text-primary-600 text-sm">No payments found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left border-b border-primary-200 text-primary-700">
                        <th className="py-2 pr-3">Date</th>
                        <th className="py-2 pr-3">Amount</th>
                        <th className="py-2 pr-3">Status</th>
                        <th className="py-2">Invoice</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((payment) => (
                        <tr key={payment.id} className="border-b border-primary-100">
                          <td className="py-2 pr-3">{payment.created ? new Date(payment.created).toLocaleDateString() : '-'}</td>
                          <td className="py-2 pr-3">{payment.currency} {payment.amount}</td>
                          <td className="py-2 pr-3">{payment.status}</td>
                          <td className="py-2">{payment.invoiceNumber || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="modern-card-elevated p-5">
                <p className="text-sm text-primary-600">Succeeded Payments</p>
                <p className="text-2xl font-semibold text-primary-900 mt-1">{paymentSummary.succeeded}</p>
              </div>
              <div className="modern-card-elevated p-5">
                <p className="text-sm text-primary-600">Failed Payments</p>
                <p className="text-2xl font-semibold text-primary-900 mt-1">{paymentSummary.failed}</p>
              </div>
              <div className="modern-card-elevated p-5">
                <p className="text-sm text-primary-600">Recent Events</p>
                <p className="text-2xl font-semibold text-primary-900 mt-1">{events.length}</p>
              </div>
            </div>
          </>
        )}
        </div>
      </Layout>
    </RoleGuard>
  );
};

export default BillingDashboard;
