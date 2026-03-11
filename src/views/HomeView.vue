<script setup lang="ts">
import dashboardShot from '@/assets/images/landing-dashboard.svg'
import mobileShot from '@/assets/images/landing-mobile.svg'
import brandLogo from '@/assets/images/primelendos-logo.svg'
</script>

<template>
  <main class="marketing-page">
    <section class="hero page-card">
      <div>
        <img :src="brandLogo" alt="PrimeLendOS logo" class="hero-logo" />
        <span class="pill">PrimeLendOS</span>
        <h1>Run your lending operations with speed, control, and confidence.</h1>
        <p class="tagline">The operating system for modern lending teams.</p>
        <p>
          PrimeLendOS gives teams one place for customer management, loan lifecycle, collections,
          payables, funding, aging, and visual report insights.
        </p>
        <div class="hero-cta">
          <RouterLink class="btn" to="/register">Start Free Trial</RouterLink>
          <RouterLink class="btn btn-secondary" to="/login">Open Dashboard</RouterLink>
        </div>
        <p class="promo-note">
          🎉 Launch Promo: Free onboarding support + data setup assistance for early adopters.
        </p>
      </div>
      <img :src="dashboardShot" alt="PrimeLendOS dashboard preview" class="hero-image" />
    </section>

    <section class="stats-row">
      <article class="stat-card"><h3>Funding Controls</h3><p>Built-in</p></article>
      <article class="stat-card"><h3>Delinquency Workflow</h3><p>Action-driven</p></article>
      <article class="stat-card"><h3>Chart Insights</h3><p>Interactive</p></article>
      <article class="stat-card"><h3>Policy Governance</h3><p>Role-gated</p></article>
    </section>

    <section class="features page-card">
      <div class="page-header">
        <h2>Core Features</h2>
        <p class="page-subtitle">Everything needed for day-to-day lending operations.</p>
      </div>
      <div class="feature-grid">
        <article>
          <h3>Customer & Vendor Management</h3>
          <p>Organize borrower and supplier profiles in one clean workflow.</p>
        </article>
        <article>
          <h3>Loan Origination & Tracking</h3>
          <p>Support straight-line and diminishing loans with full visibility.</p>
        </article>
        <article>
          <h3>Collections & Payables</h3>
          <p>Capture payments accurately and monitor outstanding balances.</p>
        </article>
        <article>
          <h3>Funding & Cash Ledger</h3>
          <p>Track account balances, disbursements, and inflow/outflow movements in one ledger.</p>
        </article>
        <article>
          <h3>Aging, Delinquency & Follow-ups</h3>
          <p>Surface overdue risk with aging buckets, case priorities, and next-action workflows.</p>
        </article>
        <article>
          <h3>Reports + Visual Insights</h3>
          <p>Download CSV reports and review Chart.js trend views with series/window controls.</p>
        </article>
        <article>
          <h3>Configurable Risk Thresholds</h3>
          <p>Owner/manager roles can tune dashboard Healthy/Watch/Risk thresholds per workspace.</p>
        </article>
      </div>
    </section>

    <section class="screenshots page-card">
      <div class="page-header">
        <h2>Built for Desktop and Mobile</h2>
        <p class="page-subtitle">Use in the office, on branch floors, or on the go.</p>
      </div>
      <div class="shot-grid">
        <figure>
          <img :src="dashboardShot" alt="Desktop lending dashboard" />
          <figcaption>Desktop workspace with KPI views, visual insights, and role-based controls</figcaption>
        </figure>
        <figure>
          <img :src="mobileShot" alt="Mobile lending app preview" />
          <figcaption>Mobile-ready access for collections follow-up and daily monitoring</figcaption>
        </figure>
      </div>
    </section>

    <section class="cta page-card">
      <h2>Ready to scale your lending business?</h2>
      <p>Start today and modernize your processes with a professional lending platform.</p>
      <div class="hero-cta">
        <RouterLink class="btn" to="/register">Get Started</RouterLink>
        <RouterLink class="btn btn-secondary" to="/login">Sign In</RouterLink>
      </div>
    </section>
  </main>
</template>

<style scoped>
.marketing-page {
  max-width: 1200px;
  margin: 1.4rem auto 2rem;
  padding: 0 1rem;
  display: grid;
  gap: 1rem;
}

.hero {
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  gap: 1rem;
  align-items: center;
}

.pill {
  display: inline-block;
  border: 1px solid #f9a8d4;
  background: #fff1f6;
  color: #9f224e;
  padding: 0.2rem 0.65rem;
  border-radius: 999px;
  font-size: 0.84rem;
  font-weight: 700;
}

.hero-logo {
  width: 100%;
  max-width: 250px;
  margin-bottom: 0.35rem;
}

.tagline {
  margin: 0.15rem 0 0.55rem;
  color: var(--secondary-700);
  font-weight: 700;
}

h1 {
  margin: 0.55rem 0;
  font-size: 2rem;
  line-height: 1.2;
}

.hero p,
.cta p {
  margin: 0;
  color: var(--muted);
}

.hero-cta {
  margin-top: 0.9rem;
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.promo-note {
  margin-top: 0.75rem;
  color: #0f172a;
  font-weight: 600;
}

.hero-image {
  width: 100%;
  border-radius: 12px;
  border: 1px solid var(--border);
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.8rem;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.8rem;
}

.feature-grid article {
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 0.8rem;
  background: linear-gradient(120deg, rgba(159, 34, 78, 0.04), rgba(37, 99, 235, 0.05));
}

.feature-grid p {
  margin: 0.4rem 0 0;
  color: var(--muted);
}

.screenshots img {
  width: 100%;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: #fff;
}

.shot-grid {
  display: grid;
  grid-template-columns: 1.6fr 0.9fr;
  gap: 0.8rem;
}

figure {
  margin: 0;
}

figcaption {
  margin-top: 0.35rem;
  color: var(--muted);
  font-size: 0.9rem;
}

.cta {
  text-align: center;
}

.cta h2 {
  margin-bottom: 0.4rem;
}

.cta .hero-cta {
  justify-content: center;
}

@media (max-width: 980px) {
  .hero,
  .shot-grid {
    grid-template-columns: 1fr;
  }

  .stats-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .feature-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .stats-row,
  .feature-grid {
    grid-template-columns: 1fr;
  }

  h1 {
    font-size: 1.6rem;
  }
}
</style>
