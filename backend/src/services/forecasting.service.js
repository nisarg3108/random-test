class ForecastingService {
  /**
   * Generate sales forecasts using time series analysis
   */
  async generateForecast(historicalData, options = {}) {
    try {
      const {
        method = 'linear',
        periodsAhead = 30,
        confidence = 0.95
      } = options;

      // Prepare data
      const timeseries = this.prepareTimeSeries(historicalData);

      if (timeseries.length < 3) {
        throw new Error('Insufficient data for forecasting. Need at least 3 data points.');
      }

      let forecast;
      switch (method) {
        case 'linear':
          forecast = this.linearRegression(timeseries, periodsAhead);
          break;
        case 'exponential':
          forecast = this.exponentialSmoothing(timeseries, periodsAhead);
          break;
        case 'movingAverage':
          forecast = this.movingAverage(timeseries, periodsAhead);
          break;
        default:
          forecast = this.linearRegression(timeseries, periodsAhead);
      }

      // Calculate confidence intervals
      forecast.predictions = forecast.predictions.map(pred => {
        const interval = this.calculateConfidenceInterval(
          pred.value,
          forecast.variance || 0,
          confidence
        );
        return {
          ...pred,
          lowerBound: interval.lower,
          upperBound: interval.upper,
          confidence
        };
      });

      // Calculate trend indicators
      forecast.trend = this.calculateTrend(timeseries);
      forecast.seasonality = this.detectSeasonality(timeseries);
      forecast.accuracy = this.calculateAccuracy(timeseries, method);

      return forecast;
    } catch (error) {
      throw new Error(`Forecasting failed: ${error.message}`);
    }
  }

  /**
   * Prepare time series data from raw analytics
   */
  prepareTimeSeries(data) {
    if (!Array.isArray(data) || data.length === 0) {
      return [];
    }

    // Sort by date and extract values
    return data
      .map(item => ({
        date: new Date(item.date || item.createdAt),
        value: parseFloat(item.revenue || item.amount || item.value || 0)
      }))
      .sort((a, b) => a.date - b.date)
      .filter(item => !isNaN(item.value));
  }

  /**
   * Linear regression forecasting
   */
  linearRegression(data, periods) {
    const n = data.length;
    const x = data.map((_, i) => i);
    const y = data.map(d => d.value);

    // Calculate linear regression coefficients
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate variance for confidence intervals
    const predictions_historical = x.map(xi => slope * xi + intercept);
    const residuals = y.map((yi, i) => yi - predictions_historical[i]);
    const variance = residuals.reduce((sum, r) => sum + r * r, 0) / (n - 2);

    // Generate future predictions
    const predictions = [];
    const lastDate = data[n - 1].date;

    for (let i = 1; i <= periods; i++) {
      const futureX = n + i - 1;
      const predictedValue = slope * futureX + intercept;
      
      const futureDate = new Date(lastDate);
      futureDate.setDate(futureDate.getDate() + i);

      predictions.push({
        date: futureDate.toISOString().split('T')[0],
        value: Math.max(0, predictedValue), // Ensure non-negative
        method: 'linear_regression'
      });
    }

    return {
      method: 'linear_regression',
      slope,
      intercept,
      variance,
      predictions,
      historicalData: data.map((d, i) => ({
        date: d.date.toISOString().split('T')[0],
        actual: d.value,
        fitted: predictions_historical[i]
      }))
    };
  }

  /**
   * Exponential smoothing forecasting
   */
  exponentialSmoothing(data, periods, alpha = 0.3) {
    const n = data.length;
    const smoothed = [data[0].value];

    // Calculate smoothed values
    for (let i = 1; i < n; i++) {
      const value = alpha * data[i].value + (1 - alpha) * smoothed[i - 1];
      smoothed.push(value);
    }

    // Calculate variance
    const residuals = data.map((d, i) => d.value - smoothed[i]);
    const variance = residuals.reduce((sum, r) => sum + r * r, 0) / n;

    // Generate forecasts
    const predictions = [];
    const lastSmoothed = smoothed[n - 1];
    const lastDate = data[n - 1].date;

    for (let i = 1; i <= periods; i++) {
      const futureDate = new Date(lastDate);
      futureDate.setDate(futureDate.getDate() + i);

      predictions.push({
        date: futureDate.toISOString().split('T')[0],
        value: Math.max(0, lastSmoothed),
        method: 'exponential_smoothing'
      });
    }

    return {
      method: 'exponential_smoothing',
      alpha,
      variance,
      predictions,
      historicalData: data.map((d, i) => ({
        date: d.date.toISOString().split('T')[0],
        actual: d.value,
        fitted: smoothed[i]
      }))
    };
  }

  /**
   * Moving average forecasting
   */
  movingAverage(data, periods, window = 7) {
    const n = data.length;
    const fitted = [];

    // Calculate moving averages
    for (let i = 0; i < n; i++) {
      const start = Math.max(0, i - window + 1);
      const windowData = data.slice(start, i + 1);
      const avg = windowData.reduce((sum, d) => sum + d.value, 0) / windowData.length;
      fitted.push(avg);
    }

    // Calculate variance
    const residuals = data.map((d, i) => d.value - fitted[i]);
    const variance = residuals.reduce((sum, r) => sum + r * r, 0) / n;

    // Generate forecasts (use last moving average)
    const predictions = [];
    const lastAvg = fitted[n - 1];
    const lastDate = data[n - 1].date;

    for (let i = 1; i <= periods; i++) {
      const futureDate = new Date(lastDate);
      futureDate.setDate(futureDate.getDate() + i);

      predictions.push({
        date: futureDate.toISOString().split('T')[0],
        value: Math.max(0, lastAvg),
        method: 'moving_average'
      });
    }

    return {
      method: 'moving_average',
      window,
      variance,
      predictions,
      historicalData: data.map((d, i) => ({
        date: d.date.toISOString().split('T')[0],
        actual: d.value,
        fitted: fitted[i]
      }))
    };
  }

  /**
   * Calculate confidence interval
   */
  calculateConfidenceInterval(value, variance, confidence) {
    // Using normal distribution approximation
    const zScores = {
      0.90: 1.645,
      0.95: 1.96,
      0.99: 2.576
    };

    const z = zScores[confidence] || 1.96;
    const stdError = Math.sqrt(variance);
    const margin = z * stdError;

    return {
      lower: Math.max(0, value - margin),
      upper: value + margin
    };
  }

  /**
   * Calculate trend (increasing, decreasing, stable)
   */
  calculateTrend(data) {
    if (data.length < 2) return 'insufficient_data';

    const n = data.length;
    const recentData = data.slice(Math.max(0, n - 10)); // Last 10 points

    const x = recentData.map((_, i) => i);
    const y = recentData.map(d => d.value);

    const n_recent = recentData.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n_recent * sumXY - sumX * sumY) / (n_recent * sumX2 - sumX * sumX);

    const avgValue = sumY / n_recent;
    const slopePercent = (slope / avgValue) * 100;

    if (Math.abs(slopePercent) < 2) return 'stable';
    return slopePercent > 0 ? 'increasing' : 'decreasing';
  }

  /**
   * Detect seasonality in data
   */
  detectSeasonality(data) {
    if (data.length < 14) return { detected: false };

    // Simple seasonality detection using 7-day cycle
    const weeklyPattern = [];
    
    for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
      const dayData = data.filter((_, i) => i % 7 === dayOfWeek);
      if (dayData.length > 0) {
        const avg = dayData.reduce((sum, d) => sum + d.value, 0) / dayData.length;
        weeklyPattern.push(avg);
      }
    }

    const overallAvg = data.reduce((sum, d) => sum + d.value, 0) / data.length;
    const variance = weeklyPattern.reduce((sum, val) => {
      return sum + Math.pow(val - overallAvg, 2);
    }, 0) / weeklyPattern.length;

    const coefficientOfVariation = Math.sqrt(variance) / overallAvg;

    return {
      detected: coefficientOfVariation > 0.15,
      pattern: 'weekly',
      strength: coefficientOfVariation > 0.3 ? 'strong' : (coefficientOfVariation > 0.15 ? 'moderate' : 'weak')
    };
  }

  /**
   * Calculate forecast accuracy metrics
   */
  calculateAccuracy(data, method) {
    if (data.length < 5) {
      return { mape: null, rmse: null, message: 'Insufficient data for accuracy calculation' };
    }

    // Use last 20% of data for validation
    const splitIndex = Math.floor(data.length * 0.8);
    const trainData = data.slice(0, splitIndex);
    const testData = data.slice(splitIndex);

    // Generate predictions for test period
    let predictions;
    if (method === 'linear') {
      predictions = this.linearRegression(trainData, testData.length).predictions;
    } else if (method === 'exponential') {
      predictions = this.exponentialSmoothing(trainData, testData.length).predictions;
    } else {
      predictions = this.movingAverage(trainData, testData.length).predictions;
    }

    // Calculate MAPE (Mean Absolute Percentage Error)
    let mapeSum = 0;
    let rmseSum = 0;
    let validPoints = 0;

    testData.forEach((actual, i) => {
      if (i < predictions.length && actual.value > 0) {
        const predicted = predictions[i].value;
        const error = Math.abs(actual.value - predicted);
        mapeSum += (error / actual.value) * 100;
        rmseSum += Math.pow(error, 2);
        validPoints++;
      }
    });

    const mape = validPoints > 0 ? mapeSum / validPoints : null;
    const rmse = validPoints > 0 ? Math.sqrt(rmseSum / validPoints) : null;

    return {
      mape: mape ? mape.toFixed(2) + '%' : null,
      rmse: rmse ? rmse.toFixed(2) : null,
      interpretation: this.interpretAccuracy(mape)
    };
  }

  /**
   * Interpret accuracy metrics
   */
  interpretAccuracy(mape) {
    if (mape === null) return 'unknown';
    if (mape < 10) return 'excellent';
    if (mape < 20) return 'good';
    if (mape < 30) return 'reasonable';
    return 'poor';
  }
}

export default new ForecastingService();
