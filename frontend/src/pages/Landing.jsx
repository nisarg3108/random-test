import { Link } from "react-router-dom";

const highlights = [
  {
    title: "Unified operations",
    description:
      "Connect finance, HR, inventory, CRM, and projects in one operating system.",
  },
  {
    title: "Real-time visibility",
    description:
      "Live dashboards, approvals, and alerts keep every team aligned instantly.",
  },
  {
    title: "Automation at scale",
    description:
      "Workflows, approvals, and policy controls cut manual effort across teams.",
  },
];

const modules = [
  "Finance and Accounting",
  "Inventory and Warehousing",
  "HR, Payroll, Attendance",
  "CRM and Sales",
  "Projects and Timesheets",
  "Assets and Maintenance",
  "Purchasing and Vendors",
  "Document Management",
  "Approvals and Workflows",
  "Reporting and Analytics",
];

const steps = [
  {
    title: "Map your org",
    description:
      "Configure departments, roles, and policies to match your operating model.",
  },
  {
    title: "Connect data",
    description:
      "Import master data, suppliers, and employees with guided templates.",
  },
  {
    title: "Launch workflows",
    description:
      "Automate approvals, payments, and exceptions with built-in controls.",
  },
];

const testimonials = [
  {
    quote:
      "We reduced month-end close from 9 days to 3 with automated approvals and reconciliations.",
    name: "Finance Director",
    company: "Manufacturing Group",
  },
  {
    quote:
      "Inventory accuracy jumped to 98% after we standardized receipts, dispatch, and audits.",
    name: "Operations Lead",
    company: "Retail Chain",
  },
  {
    quote:
      "HR and payroll finally run on the same schedule, with zero manual handoffs.",
    name: "People Ops Manager",
    company: "Technology Firm",
  },
];

const faqs = [
  {
    question: "Is it cloud-based?",
    answer:
      "Yes. The platform is delivered as a secure SaaS experience with dedicated workspaces.",
  },
  {
    question: "Can we enable only the modules we need?",
    answer:
      "Absolutely. Start with core finance or HR, then add modules as your team grows.",
  },
  {
    question: "How long does onboarding take?",
    answer:
      "Most teams are live in 2 to 6 weeks depending on data volume and approvals.",
  },
  {
    question: "Do you support role-based access?",
    answer:
      "Yes. Granular RBAC with approval chains, audit trails, and activity logs.",
  },
];

function Landing() {
  return (
    <div className="landing-page">
      <header className="landing-nav">
        <div className="landing-shell">
          <div className="landing-brand">
            <span className="landing-logo">UEO</span>
            <div>
              <p className="landing-title font-display">UEO RMS</p>
              <p className="landing-subtitle">Unified ERP Platform</p>
            </div>
          </div>
          <nav className="landing-links">
            <a href="#features">Features</a>
            <a href="#modules">Modules</a>
            <a href="#security">Security</a>
            <a href="#pricing">Pricing</a>
            <a href="#faq">FAQ</a>
          </nav>
          <div className="landing-actions">
            <Link className="btn-ghost" to="/login">
              Sign in
            </Link>
            <Link className="btn-solid" to="/register">
              Request demo
            </Link>
          </div>
        </div>
      </header>

      <section className="landing-hero">
        <div className="landing-shell hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">Operate your business from one intelligent workspace</p>
            <h1 className="hero-title font-display">
              The ERP control room for finance, HR, inventory, and growth teams.
            </h1>
            <p className="hero-description">
              UEO RMS connects your critical operations with real-time approvals,
              dashboards, and automation. Replace scattered tools with a single
              system that scales with your organization.
            </p>
            <div className="hero-actions">
              <Link className="btn-solid" to="/register">
                Get platform access
              </Link>
              <Link className="btn-outline" to="/login">
                Access workspace
              </Link>
            </div>
            <div className="hero-stats">
              <div>
                <p className="stat-value">48%</p>
                <p className="stat-label">faster approvals</p>
              </div>
              <div>
                <p className="stat-value">99.2%</p>
                <p className="stat-label">inventory accuracy</p>
              </div>
              <div>
                <p className="stat-value">24/7</p>
                <p className="stat-label">real-time visibility</p>
              </div>
            </div>
          </div>
          <div className="hero-visual">
            <div className="visual-card main">
              <div className="visual-header">
                <span className="dot green" />
                <span className="dot amber" />
                <span className="dot red" />
                <p>Operations overview</p>
              </div>
              <div className="visual-body">
                <div className="visual-metric">
                  <p>Cash flow</p>
                  <strong>$2.4M</strong>
                  <span>+12.4% this month</span>
                </div>
                <div className="visual-grid">
                  <div>
                    <p>Inventory</p>
                    <strong>128k</strong>
                  </div>
                  <div>
                    <p>Open approvals</p>
                    <strong>38</strong>
                  </div>
                  <div>
                    <p>Payroll status</p>
                    <strong>On time</strong>
                  </div>
                  <div>
                    <p>Projects</p>
                    <strong>94%</strong>
                  </div>
                </div>
              </div>
            </div>
            <div className="visual-card sub">
              <p>Automated approval chain</p>
              <div className="chip-row">
                <span>Finance</span>
                <span>HR</span>
                <span>Ops</span>
              </div>
              <div className="progress">
                <div className="progress-bar" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="landing-section">
        <div className="landing-shell">
          <div className="section-heading">
            <h2 className="font-display">Everything operations teams need, in one place</h2>
            <p>
              Replace manual handoffs with connected workflows, approvals, and
              analytics that keep every department aligned.
            </p>
          </div>
          <div className="feature-grid">
            {highlights.map((item) => (
              <div key={item.title} className="feature-card">
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="modules" className="landing-section alt">
        <div className="landing-shell modules-grid">
          <div>
            <h2 className="font-display">Modular suite, unified data</h2>
            <p>
              Enable only what you need today and expand confidently. Every
              module shares a single source of truth.
            </p>
            <div className="module-cta">
              <Link className="btn-solid" to="/register">
                See the platform
              </Link>
              <Link className="btn-ghost" to="/login">
                Existing customer
              </Link>
            </div>
          </div>
          <div className="module-list">
            {modules.map((item) => (
              <div key={item} className="module-pill">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-shell">
          <div className="section-heading">
            <h2 className="font-display">Go live fast with guided onboarding</h2>
            <p>
              Configure, connect, and automate in weeks with built-in templates
              and expert support.
            </p>
          </div>
          <div className="steps-grid">
            {steps.map((step, index) => (
              <div key={step.title} className="step-card">
                <span>{index + 1}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="security" className="landing-section alt">
        <div className="landing-shell security-grid">
          <div>
            <h2 className="font-display">Security-first, audit-ready</h2>
            <p>
              Fine-grained access controls, approval trails, and real-time
              monitoring are built in, so you stay compliant without extra work.
            </p>
          </div>
          <div className="security-cards">
            <div className="security-card">
              <h3>Role-based access</h3>
              <p>Granular permissions with approval routing and audit logs.</p>
            </div>
            <div className="security-card">
              <h3>Data integrity</h3>
              <p>Automated validations and reconciliations keep records clean.</p>
            </div>
            <div className="security-card">
              <h3>Operational alerts</h3>
              <p>Get notified instantly when approvals, budgets, or SLAs drift.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-shell">
          <div className="section-heading">
            <h2 className="font-display">Trusted by modern operations teams</h2>
            <p>Teams use UEO RMS to streamline everything from payroll to procurement.</p>
          </div>
          <div className="testimonial-grid">
            {testimonials.map((item) => (
              <div key={item.name} className="testimonial-card">
                <p>"{item.quote}"</p>
                <div>
                  <strong>{item.name}</strong>
                  <span>{item.company}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="landing-section alt">
        <div className="landing-shell">
          <div className="section-heading">
            <h2 className="font-display">Flexible plans for every team</h2>
            <p>Start with core modules, then expand as your organization grows.</p>
          </div>
          <div className="pricing-grid">
            <div className="pricing-card">
              <h3>Core</h3>
              <p className="price">$49</p>
              <span>per user / month</span>
              <ul>
                <li>Finance + HR core modules</li>
                <li>Standard approvals</li>
                <li>Email support</li>
              </ul>
              <Link className="btn-outline" to="/register">
                Start core
              </Link>
            </div>
            <div className="pricing-card featured">
              <h3>Operations</h3>
              <p className="price">$89</p>
              <span>per user / month</span>
              <ul>
                <li>All core + inventory + CRM</li>
                <li>Advanced workflows</li>
                <li>Priority support</li>
              </ul>
              <Link className="btn-solid" to="/register">
                Start operations
              </Link>
            </div>
            <div className="pricing-card">
              <h3>Enterprise</h3>
              <p className="price">Custom</p>
              <span>tailored to your org</span>
              <ul>
                <li>Full suite access</li>
                <li>Dedicated success team</li>
                <li>Custom integrations</li>
              </ul>
              <Link className="btn-outline" to="/register">
                Talk to sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="landing-section">
        <div className="landing-shell">
          <div className="section-heading">
            <h2 className="font-display">Frequently asked questions</h2>
            <p>Everything you need to know before getting started.</p>
          </div>
          <div className="faq-grid">
            {faqs.map((item) => (
              <div key={item.question} className="faq-card">
                <h3>{item.question}</h3>
                <p>{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-cta">
        <div className="landing-shell cta-grid">
          <div>
            <h2 className="font-display">Ready to run every team in sync?</h2>
            <p>
              Launch your unified ERP workspace in weeks with dedicated onboarding
              and support.
            </p>
          </div>
          <div className="cta-actions">
            <Link className="btn-solid" to="/register">
              Get platform access
            </Link>
            <Link className="btn-outline" to="/login">
              Access workspace
            </Link>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="landing-shell footer-grid">
          <div>
            <p className="footer-brand font-display">UEO RMS</p>
            <p>Unified ERP platform for modern operations.</p>
          </div>
          <div>
            <p className="footer-title">Product</p>
            <a href="#features">Features</a>
            <a href="#modules">Modules</a>
            <a href="#pricing">Pricing</a>
          </div>
          <div>
            <p className="footer-title">Company</p>
            <a href="#security">Security</a>
            <a href="#faq">FAQ</a>
            <Link to="/login">Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Landing;
