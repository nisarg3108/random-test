/**
 * Salary Component Calculator
 * Evaluates salary component formulas dynamically
 */

class SalaryComponentCalculator {
  /**
   * Calculate component value based on type and formula
   * @param {Object} component - Salary component definition
   * @param {Object} context - Calculation context
   * @returns {number} - Calculated value
   */
  static calculateComponent(component, context) {
    const { calculationType, value, formula } = component;
    const { basicSalary, grossSalary, presentDays, workingDays, baseValues = {} } = context;

    switch (calculationType) {
      case 'FIXED':
        return this.proRateValue(value || 0, presentDays, workingDays);

      case 'PERCENTAGE_OF_BASIC':
        const basicAmount = (basicSalary * (value / 100));
        return this.proRateValue(basicAmount, presentDays, workingDays);

      case 'PERCENTAGE_OF_GROSS':
        // Gross is calculated progressively, so this needs to be applied after other allowances
        return grossSalary * (value / 100);

      case 'FORMULA':
        return this.evaluateFormula(formula, context);

      default:
        return 0;
    }
  }

  /**
   * Pro-rate value by attendance
   * @param {number} monthlyAmount - Full month amount
   * @param {number} presentDays - Days present
   * @param {number} workingDays - Total working days
   * @returns {number} - Pro-rated amount
   */
  static proRateValue(monthlyAmount, presentDays, workingDays) {
    // Use 30 as standard month for salary calculations
    return (monthlyAmount / 30) * presentDays;
  }

  /**
   * Evaluate custom formula
   * Supports formulas like: "12% of (BASIC + DA)", "0.5 * BASIC", etc.
   * @param {string} formula - Formula string
   * @param {Object} context - Calculation context with all values
   * @returns {number} - Calculated result
   */
  static evaluateFormula(formula, context) {
    try {
      const { basicSalary, grossSalary, presentDays, workingDays, baseValues = {} } = context;

      // Replace keywords with actual values
      let expression = formula
        .replace(/BASIC_SALARY|BASIC/gi, basicSalary.toString())
        .replace(/GROSS_SALARY|GROSS/gi, grossSalary.toString())
        .replace(/PRESENT_DAYS/gi, presentDays.toString())
        .replace(/WORKING_DAYS/gi, workingDays.toString());

      // Replace component codes with their values
      Object.keys(baseValues).forEach(code => {
        const regex = new RegExp(code, 'gi');
        expression = expression.replace(regex, baseValues[code].toString());
      });

      // Handle percentage notation: "12% of X" -> "0.12 * X"
      expression = expression.replace(/(\d+(?:\.\d+)?)\s*%\s*(?:of\s*)?/gi, (match, percentage) => {
        return (parseFloat(percentage) / 100) + ' * ';
      });

      // Safe evaluation (only allow math operations)
      const sanitized = expression.replace(/[^0-9+\-*/.() ]/g, '');
      const result = eval(sanitized);

      return isNaN(result) ? 0 : result;
    } catch (error) {
      console.error('Formula evaluation error:', error.message, 'Formula:', formula);
      return 0;
    }
  }

  /**
   * Calculate all components for an employee
   * @param {Array} components - Array of salary component definitions
   * @param {Object} context - Calculation context
   * @returns {Object} - Calculated allowances and deductions
   */
  static calculateAllComponents(components, context) {
    const { basicSalary, presentDays, workingDays } = context;

    // First pass: Calculate FIXED and PERCENTAGE_OF_BASIC components
    const baseValues = { BASIC: basicSalary };
    const allowances = {};
    const deductions = {};
    const bonuses = {};

    // Sort: Process FIXED and PERCENTAGE_OF_BASIC first
    const sortedComponents = components.sort((a, b) => {
      const priority = { 'FIXED': 1, 'PERCENTAGE_OF_BASIC': 2, 'PERCENTAGE_OF_GROSS': 4, 'FORMULA': 3 };
      return (priority[a.calculationType] || 5) - (priority[b.calculationType] || 5);
    });

    // Calculate allowances first (they affect gross salary)
    for (const component of sortedComponents.filter(c => c.type === 'ALLOWANCE' && c.isActive)) {
      const calculatedValue = this.calculateComponent(component, {
        ...context,
        baseValues,
        grossSalary: basicSalary + Object.values(allowances).reduce((sum, val) => sum + val, 0)
      });

      allowances[component.code] = Math.round(calculatedValue * 100) / 100;
      baseValues[component.code] = calculatedValue;
    }

    // Calculate gross salary
    const allowancesTotal = Object.values(allowances).reduce((sum, val) => sum + val, 0);
    const grossSalary = basicSalary + allowancesTotal;

    // Calculate deductions (using final gross salary)
    for (const component of sortedComponents.filter(c => c.type === 'DEDUCTION' && c.isActive)) {
      const calculatedValue = this.calculateComponent(component, {
        ...context,
        baseValues,
        grossSalary
      });

      deductions[component.code] = Math.round(calculatedValue * 100) / 100;
      baseValues[component.code] = calculatedValue;
    }

    // Calculate bonuses
    for (const component of sortedComponents.filter(c => c.type === 'BONUS' && c.isActive)) {
      const calculatedValue = this.calculateComponent(component, {
        ...context,
        baseValues,
        grossSalary
      });

      bonuses[component.code] = Math.round(calculatedValue * 100) / 100;
      baseValues[component.code] = calculatedValue;
    }

    return {
      allowances,
      deductions,
      bonuses,
      allowancesTotal: Math.round(allowancesTotal * 100) / 100,
      deductionsTotal: Math.round(Object.values(deductions).reduce((sum, val) => sum + val, 0) * 100) / 100,
      bonusesTotal: Math.round(Object.values(bonuses).reduce((sum, val) => sum + val, 0) * 100) / 100
    };
  }
}

export default SalaryComponentCalculator;
