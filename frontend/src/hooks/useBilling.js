import { useCallback, useEffect, useState } from 'react';
import {
  cancelSubscription,
  changeSubscriptionPlan,
  getAvailablePlans,
  getBillingEvents,
  getBillingMetrics,
  getCurrentSubscription,
  getPaymentHistory,
} from '../api/billing.api.js';

export const useBilling = () => {
  const [subscription, setSubscription] = useState(null);
  const [plans, setPlans] = useState([]);
  const [payments, setPayments] = useState([]);
  const [events, setEvents] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchSubscription = useCallback(async () => {
    const data = await getCurrentSubscription();
    setSubscription(data.subscription || null);
    return data;
  }, []);

  const fetchPayments = useCallback(async () => {
    const data = await getPaymentHistory({ limit: 10, offset: 0 });
    setPayments(data.payments || []);
    return data;
  }, []);

  const fetchPlans = useCallback(async () => {
    const data = await getAvailablePlans();
    setPlans(data.plans || []);
    return data;
  }, []);

  const fetchEvents = useCallback(async () => {
    const data = await getBillingEvents({ limit: 10, offset: 0 });
    setEvents(data.events || []);
    return data;
  }, []);

  const fetchMetrics = useCallback(async () => {
    const data = await getBillingMetrics();
    setMetrics(data.metrics || null);
    return data;
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await Promise.all([
        fetchSubscription(),
        fetchPlans(),
        fetchPayments(),
        fetchEvents(),
        fetchMetrics(),
      ]);
    } catch (err) {
      setError(err.message || 'Failed to load billing information');
    } finally {
      setLoading(false);
    }
  }, [fetchEvents, fetchMetrics, fetchPayments, fetchPlans, fetchSubscription]);

  const handleCancelSubscription = useCallback(async (atPeriodEnd = true) => {
    setActionLoading(true);
    setError(null);

    try {
      await cancelSubscription(atPeriodEnd);
      await Promise.all([fetchSubscription(), fetchMetrics()]);
      return true;
    } catch (err) {
      setError(err.message || 'Failed to cancel subscription');
      return false;
    } finally {
      setActionLoading(false);
    }
  }, [fetchMetrics, fetchSubscription]);

  const handleChangePlan = useCallback(async (planId, provider = 'STRIPE') => {
    if (!planId) return false;

    setActionLoading(true);
    setError(null);

    try {
      await changeSubscriptionPlan(planId, provider);
      await Promise.all([fetchSubscription(), fetchPayments(), fetchMetrics()]);
      return true;
    } catch (err) {
      setError(err.message || 'Failed to change plan');
      return false;
    } finally {
      setActionLoading(false);
    }
  }, [fetchMetrics, fetchPayments, fetchSubscription]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    subscription,
    plans,
    payments,
    events,
    metrics,
    loading,
    error,
    actionLoading,
    refresh,
    cancelSubscription: handleCancelSubscription,
    changePlan: handleChangePlan,
  };
};
