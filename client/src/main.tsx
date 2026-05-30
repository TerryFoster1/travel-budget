import React, { useMemo, useState } from "react";
import ReactDOM from "react-dom/client";
import "./styles.css";

type View = "onboarding" | "dashboard" | "profiles" | "goals" | "opportunities" | "alerts";
type ContributionMode = "goal" | "weekly";
type PartySize = "Solo" | "Couple" | "Family";

type OnboardingState = {
  travelerType: string;
  preferences: string[];
  partySize: PartySize;
  contributionMode: ContributionMode;
  goalAmount: number;
  targetDate: string;
  weeklyContribution: number;
};

type TravelProfile = {
  id: number;
  name: string;
  party: string;
  focus: string;
  airports: string;
  window: string;
};

type TravelGoal = {
  id: number;
  name: string;
  targetAmount: number;
  targetDate: string;
  currentAmount: number;
};

type Opportunity = {
  id: number;
  title: string;
  destination: string;
  price: number;
  dates: string;
  partySize: PartySize;
  styles: string[];
  rating: number;
  inventory: string;
  expiresIn: string;
  image: string;
};

const travelerTypes = ["Family Vacation", "Couples Getaway", "Adventure Travel", "Cruise Traveler", "Disney Fan", "Business Traveler"];
const preferenceOptions = ["Cruises", "Resorts", "Disney", "Universal", "Europe", "Beaches", "Adventure"];
const navItems: Array<{ id: View; label: string }> = [
  { id: "dashboard", label: "Dashboard" },
  { id: "profiles", label: "Profiles" },
  { id: "goals", label: "Goals" },
  { id: "opportunities", label: "Opportunities" },
  { id: "alerts", label: "Alerts" },
];

const initialOnboarding: OnboardingState = {
  travelerType: "Family Vacation",
  preferences: ["Resorts", "Disney", "Beaches"],
  partySize: "Family",
  contributionMode: "weekly",
  goalAmount: 5000,
  targetDate: "2028-07",
  weeklyContribution: 50,
};

const opportunities: Opportunity[] = [
  {
    id: 1,
    title: "Disney Vacation Preview",
    destination: "Orlando, Florida",
    price: 4200,
    dates: "March Break 2028",
    partySize: "Family",
    styles: ["Disney", "Family Vacation"],
    rating: 4.9,
    inventory: "6 rooms remaining",
    expiresIn: "72 hours",
    image: "disney",
  },
  {
    id: 2,
    title: "Japan Adventure Path",
    destination: "Tokyo and Kyoto",
    price: 6100,
    dates: "October 2028",
    partySize: "Couple",
    styles: ["Adventure", "Europe"],
    rating: 4.8,
    inventory: "Planning window open",
    expiresIn: "18 days",
    image: "japan",
  },
  {
    id: 3,
    title: "Mediterranean Cruise",
    destination: "Barcelona to Rome",
    price: 3800,
    dates: "Summer 2027",
    partySize: "Couple",
    styles: ["Cruises", "Europe"],
    rating: 4.7,
    inventory: "9 cabins remaining",
    expiresIn: "5 days",
    image: "med",
  },
  {
    id: 4,
    title: "Mexico Resort Week",
    destination: "Riviera Maya",
    price: 1899,
    dates: "January 2027",
    partySize: "Family",
    styles: ["Resorts", "Beaches"],
    rating: 4.6,
    inventory: "3 family suites remaining",
    expiresIn: "48 hours",
    image: "mexico",
  },
  {
    id: 5,
    title: "Universal Studios Escape",
    destination: "Orlando, Florida",
    price: 2450,
    dates: "August 2027",
    partySize: "Family",
    styles: ["Universal", "Family Vacation"],
    rating: 4.5,
    inventory: "12 packages remaining",
    expiresIn: "6 days",
    image: "universal",
  },
  {
    id: 6,
    title: "Caribbean Cruise Window",
    destination: "Eastern Caribbean",
    price: 1240,
    dates: "Departing within 30 days",
    partySize: "Couple",
    styles: ["Cruises", "Beaches"],
    rating: 4.7,
    inventory: "4 cabins remaining",
    expiresIn: "48 hours",
    image: "caribbean",
  },
];

const initialProfiles: TravelProfile[] = [
  { id: 1, name: "Family Vacation", party: "2 adults, 2 children", focus: "Resorts, Disney, beaches", airports: "YYZ, BUF", window: "Summer or March Break" },
  { id: 2, name: "Couples Escape", party: "2 adults", focus: "Cruises, beaches, Europe", airports: "YYZ", window: "Flexible" },
  { id: 3, name: "Weekend Getaway", party: "2 adults", focus: "Short trips and last-minute deals", airports: "YTZ, YYZ", window: "Long weekends" },
  { id: 4, name: "Business Travel", party: "1 adult", focus: "Conference-friendly stays", airports: "YYZ", window: "Custom dates" },
];

const initialGoals: TravelGoal[] = [
  { id: 1, name: "Japan 2028", targetAmount: 6000, targetDate: "October 2028", currentAmount: 1247 },
  { id: 2, name: "March Break Resort", targetAmount: 3200, targetDate: "March 2027", currentAmount: 1247 },
];

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(value);
}

function clampPercent(current: number, target: number) {
  return Math.min(100, Math.round((current / target) * 100));
}

function matchOpportunity(opportunity: Opportunity, state: OnboardingState, balance: number) {
  const preferenceScore = opportunity.styles.filter((style) => state.preferences.includes(style) || style === state.travelerType).length;
  const partyScore = opportunity.partySize === state.partySize ? 1 : 0;
  const budgetEligible = balance >= opportunity.price;
  return {
    preferenceScore,
    partyScore,
    budgetEligible,
    score: preferenceScore * 2 + partyScore + (budgetEligible ? 3 : 0),
  };
}

function App() {
  const [view, setView] = useState<View>("onboarding");
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [onboarding, setOnboarding] = useState(initialOnboarding);
  const [travelBalance, setTravelBalance] = useState(1247);
  const [profiles, setProfiles] = useState(initialProfiles);
  const [goals, setGoals] = useState(initialGoals);
  const [newProfileName, setNewProfileName] = useState("Weekend Escape");
  const [newGoalName, setNewGoalName] = useState("Disney 2028");
  const [newGoalAmount, setNewGoalAmount] = useState(5000);

  const matchedOpportunities = useMemo(() => {
    return opportunities
      .map((opportunity) => ({ opportunity, match: matchOpportunity(opportunity, onboarding, travelBalance) }))
      .sort((a, b) => b.match.score - a.match.score);
  }, [onboarding, travelBalance]);

  const affordableMatches = matchedOpportunities.filter(({ match }) => match.budgetEligible);
  const primaryGoal = goals[0];
  const projectionWeeks = Math.max(1, Math.ceil((onboarding.goalAmount - travelBalance) / onboarding.weeklyContribution));

  function togglePreference(preference: string) {
    setOnboarding((current) => ({
      ...current,
      preferences: current.preferences.includes(preference)
        ? current.preferences.filter((item) => item !== preference)
        : [...current.preferences, preference],
    }));
  }

  function completeOnboarding() {
    setView("dashboard");
    setOnboardingStep(0);
  }

  function addProfile() {
    const nextProfile: TravelProfile = {
      id: Date.now(),
      name: newProfileName || "New Travel Profile",
      party: onboarding.partySize === "Family" ? "Family travelers" : onboarding.partySize,
      focus: onboarding.preferences.join(", ") || "Flexible travel",
      airports: "Add preferred airports",
      window: "Flexible",
    };
    setProfiles((current) => [nextProfile, ...current]);
    setNewProfileName("");
  }

  function addGoal() {
    const nextGoal: TravelGoal = {
      id: Date.now(),
      name: newGoalName || "Future Vacation",
      targetAmount: Number(newGoalAmount) || 2500,
      targetDate: "Future travel window",
      currentAmount: travelBalance,
    };
    setGoals((current) => [nextGoal, ...current]);
    setNewGoalName("");
    setNewGoalAmount(5000);
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button className="brand" onClick={() => setView("dashboard")}>
          <span className="brand-mark">TB</span>
          <span>
            <strong>Travel Budget</strong>
            <small>TravelBudget.ca</small>
          </span>
        </button>
        <nav className="nav-list" aria-label="Primary navigation">
          {navItems.map((item) => (
            <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => setView(item.id)}>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-card">
          <span className="eyebrow">Travel Balance</span>
          <strong>{formatMoney(travelBalance)}</strong>
          <small>Purchasing power for future travel, not a bank account.</small>
        </div>
      </aside>

      <main>
        {view === "onboarding" && (
          <OnboardingFlow
            step={onboardingStep}
            state={onboarding}
            projectionWeeks={projectionWeeks}
            onNext={() => setOnboardingStep((step) => Math.min(step + 1, 4))}
            onBack={() => setOnboardingStep((step) => Math.max(step - 1, 0))}
            onComplete={completeOnboarding}
            onSelectTravelerType={(travelerType) => setOnboarding((current) => ({ ...current, travelerType }))}
            onTogglePreference={togglePreference}
            onSelectPartySize={(partySize) => setOnboarding((current) => ({ ...current, partySize }))}
            onUpdate={(patch) => setOnboarding((current) => ({ ...current, ...patch }))}
          />
        )}

        {view === "dashboard" && (
          <Dashboard
            balance={travelBalance}
            setBalance={setTravelBalance}
            goal={primaryGoal}
            weeklyContribution={onboarding.weeklyContribution}
            profiles={profiles}
            matches={matchedOpportunities.slice(0, 3)}
            alerts={affordableMatches.slice(0, 2)}
            onGo={(target) => setView(target)}
          />
        )}

        {view === "profiles" && (
          <Profiles profiles={profiles} newProfileName={newProfileName} setNewProfileName={setNewProfileName} onAdd={addProfile} />
        )}

        {view === "goals" && (
          <Goals
            goals={goals}
            newGoalName={newGoalName}
            setNewGoalName={setNewGoalName}
            newGoalAmount={newGoalAmount}
            setNewGoalAmount={setNewGoalAmount}
            onAdd={addGoal}
          />
        )}

        {view === "opportunities" && <Opportunities matches={matchedOpportunities} />}

        {view === "alerts" && <Alerts matches={matchedOpportunities} />}
      </main>
    </div>
  );
}

function OnboardingFlow(props: {
  step: number;
  state: OnboardingState;
  projectionWeeks: number;
  onNext: () => void;
  onBack: () => void;
  onComplete: () => void;
  onSelectTravelerType: (value: string) => void;
  onTogglePreference: (value: string) => void;
  onSelectPartySize: (value: PartySize) => void;
  onUpdate: (patch: Partial<OnboardingState>) => void;
}) {
  const steps = ["Traveler Type", "Preferences", "Party Size", "Contribution", "Summary"];

  return (
    <section className="onboarding surface-wide">
      <div className="hero-panel scenic-sky">
        <div>
          <span className="eyebrow">Travel membership setup</span>
          <h1>Pay for your next vacation one paycheck at a time.</h1>
          <p>Tell Travel Budget what kind of adventure you want, then watch your Travel Balance unlock opportunities as it grows.</p>
        </div>
        <div className="boarding-pass">
          <span>Current setup</span>
          <strong>{props.state.travelerType}</strong>
          <small>{props.state.preferences.join(" / ")}</small>
        </div>
      </div>

      <div className="stepper" aria-label="Onboarding steps">
        {steps.map((label, index) => (
          <span key={label} className={props.step === index ? "current" : props.step > index ? "done" : ""}>
            {label}
          </span>
        ))}
      </div>

      <div className="onboarding-card">
        {props.step === 0 && (
          <ChoiceGrid title="What kind of traveler are you?" subtitle="Start with the dream, not the spreadsheet.">
            {travelerTypes.map((type) => (
              <button key={type} className={props.state.travelerType === type ? "choice selected" : "choice"} onClick={() => props.onSelectTravelerType(type)}>
                <strong>{type}</strong>
                <span>Build purchasing power for this travel style.</span>
              </button>
            ))}
          </ChoiceGrid>
        )}

        {props.step === 1 && (
          <ChoiceGrid title="Choose travel interests" subtitle="Matches become more useful as your preferences become clearer.">
            {preferenceOptions.map((preference) => (
              <button key={preference} className={props.state.preferences.includes(preference) ? "choice selected" : "choice"} onClick={() => props.onTogglePreference(preference)}>
                <strong>{preference}</strong>
                <span>Include this in opportunity matching.</span>
              </button>
            ))}
          </ChoiceGrid>
        )}

        {props.step === 2 && (
          <ChoiceGrid title="Who is traveling?" subtitle="Party size helps the opportunity engine estimate real trip fit.">
            {(["Solo", "Couple", "Family"] as PartySize[]).map((party) => (
              <button key={party} className={props.state.partySize === party ? "choice selected" : "choice"} onClick={() => props.onSelectPartySize(party)}>
                <strong>{party}</strong>
                <span>{party === "Family" ? "Multiple travelers with family-friendly matching." : "A dedicated travel identity for this party."}</span>
              </button>
            ))}
          </ChoiceGrid>
        )}

        {props.step === 3 && (
          <div className="form-grid">
            <div>
              <h2>Choose a contribution method</h2>
              <p>Travel Budget can work backward from a target trip or reveal opportunities as a weekly habit grows your Travel Balance.</p>
            </div>
            <div className="toggle-row">
              <button className={props.state.contributionMode === "goal" ? "selected" : ""} onClick={() => props.onUpdate({ contributionMode: "goal" })}>Target date + goal</button>
              <button className={props.state.contributionMode === "weekly" ? "selected" : ""} onClick={() => props.onUpdate({ contributionMode: "weekly" })}>Weekly amount</button>
            </div>
            <label>
              Goal amount
              <input type="number" value={props.state.goalAmount} onChange={(event) => props.onUpdate({ goalAmount: Number(event.target.value) })} />
            </label>
            <label>
              Target month
              <input type="month" value={props.state.targetDate} onChange={(event) => props.onUpdate({ targetDate: event.target.value })} />
            </label>
            <label>
              Weekly contribution
              <input type="number" value={props.state.weeklyContribution} onChange={(event) => props.onUpdate({ weeklyContribution: Number(event.target.value) })} />
            </label>
          </div>
        )}

        {props.step === 4 && (
          <div className="summary-grid">
            <div>
              <span className="eyebrow">Projected travel plan</span>
              <h2>{props.state.travelerType}</h2>
              <p>Your Travel Balance will focus on {props.state.preferences.join(", ")} opportunities for a {props.state.partySize.toLowerCase()} travel profile.</p>
            </div>
            <Metric label="Weekly contribution" value={`${formatMoney(props.state.weeklyContribution)}/week`} />
            <Metric label="Goal amount" value={formatMoney(props.state.goalAmount)} />
            <Metric label="Estimated unlock" value={`${props.projectionWeeks} weeks`} />
          </div>
        )}

        <div className="button-row">
          <button className="secondary" onClick={props.onBack} disabled={props.step === 0}>Back</button>
          {props.step < 4 ? <button className="primary" onClick={props.onNext}>Continue</button> : <button className="primary" onClick={props.onComplete}>Enter Dashboard</button>}
        </div>
      </div>
    </section>
  );
}

function ChoiceGrid({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div>
      <h2>{title}</h2>
      <p>{subtitle}</p>
      <div className="choice-grid">{children}</div>
    </div>
  );
}

function Dashboard(props: {
  balance: number;
  setBalance: (value: number) => void;
  goal: TravelGoal;
  weeklyContribution: number;
  profiles: TravelProfile[];
  matches: Array<{ opportunity: Opportunity; match: ReturnType<typeof matchOpportunity> }>;
  alerts: Array<{ opportunity: Opportunity; match: ReturnType<typeof matchOpportunity> }>;
  onGo: (view: View) => void;
}) {
  return (
    <section className="page-grid">
      <header className="page-header scenic-coast">
        <div>
          <span className="eyebrow">Dashboard</span>
          <h1>Your next adventure is taking shape.</h1>
          <p>Travel Balance turns a weekly habit into visible vacation purchasing power.</p>
        </div>
        <button className="primary light" onClick={() => props.onGo("opportunities")}>Explore matches</button>
      </header>

      <div className="stats-grid">
        <div className="balance-card">
          <span className="eyebrow">Travel Balance</span>
          <strong>{formatMoney(props.balance)}</strong>
          <small>Displayed in dollars as travel purchasing power.</small>
          <input aria-label="Prototype balance" type="range" min="500" max="7000" step="50" value={props.balance} onChange={(event) => props.setBalance(Number(event.target.value))} />
        </div>
        <Metric label="Travel goal" value={props.goal.name} detail={props.goal.targetDate} />
        <Metric label="Contribution" value={`${formatMoney(props.weeklyContribution)}/week`} detail="Local prototype projection" />
        <Metric label="Affordable now" value={String(props.alerts.length)} detail="Balance eligible matches" />
      </div>

      <div className="content-grid two-one">
        <div className="panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Progress</span>
              <h2>{props.goal.name}</h2>
            </div>
            <strong>{clampPercent(props.balance, props.goal.targetAmount)}%</strong>
          </div>
          <Progress value={clampPercent(props.balance, props.goal.targetAmount)} />
          <div className="activity-list">
            <Activity title="Weekly contribution added" meta="Prototype activity" amount={`+${formatMoney(props.weeklyContribution)}`} />
            <Activity title="Mexico Resort Week unlocked" meta="Balance eligible" amount="Match" />
            <Activity title="Travel profile updated" meta="Family Vacation" amount="Ready" />
          </div>
        </div>

        <div className="panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Upcoming alerts</span>
              <h2>You can afford this</h2>
            </div>
          </div>
          {props.alerts.map(({ opportunity }) => <AlertMini key={opportunity.id} opportunity={opportunity} />)}
          {props.alerts.length === 0 && <p className="muted">Increase the prototype Travel Balance to unlock more alerts.</p>}
        </div>
      </div>

      <div className="content-grid two-one">
        <div className="panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Opportunity matches</span>
              <h2>Best fits right now</h2>
            </div>
            <button className="text-button" onClick={() => props.onGo("opportunities")}>View all</button>
          </div>
          <div className="opportunity-row">
            {props.matches.map(({ opportunity, match }) => <OpportunityCard key={opportunity.id} opportunity={opportunity} match={match} compact />)}
          </div>
        </div>

        <div className="panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Travel profiles</span>
              <h2>{props.profiles.length} active</h2>
            </div>
            <button className="text-button" onClick={() => props.onGo("profiles")}>Manage</button>
          </div>
          {props.profiles.slice(0, 3).map((profile) => (
            <div className="profile-line" key={profile.id}>
              <strong>{profile.name}</strong>
              <span>{profile.focus}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Profiles(props: { profiles: TravelProfile[]; newProfileName: string; setNewProfileName: (value: string) => void; onAdd: () => void }) {
  return (
    <section className="page-grid">
      <PageTitle eyebrow="Travel profiles" title="Multiple travel identities, one Travel Balance." text="Each profile keeps its own preferences while sharing the same travel purchasing power." />
      <div className="inline-form panel">
        <label>
          Profile name
          <input value={props.newProfileName} onChange={(event) => props.setNewProfileName(event.target.value)} />
        </label>
        <button className="primary" onClick={props.onAdd}>Create profile</button>
      </div>
      <div className="card-grid">
        {props.profiles.map((profile) => (
          <article className="travel-card" key={profile.id}>
            <span className="eyebrow">Profile</span>
            <h2>{profile.name}</h2>
            <p>{profile.party}</p>
            <dl>
              <div><dt>Focus</dt><dd>{profile.focus}</dd></div>
              <div><dt>Airports</dt><dd>{profile.airports}</dd></div>
              <div><dt>Window</dt><dd>{profile.window}</dd></div>
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
}

function Goals(props: {
  goals: TravelGoal[];
  newGoalName: string;
  setNewGoalName: (value: string) => void;
  newGoalAmount: number;
  setNewGoalAmount: (value: number) => void;
  onAdd: () => void;
}) {
  return (
    <section className="page-grid">
      <PageTitle eyebrow="Travel goals" title="Turn someday into booked." text="Goals show progress toward a future trip without becoming a bank or budgeting ledger." />
      <div className="inline-form panel">
        <label>
          Goal name
          <input value={props.newGoalName} onChange={(event) => props.setNewGoalName(event.target.value)} />
        </label>
        <label>
          Target amount
          <input type="number" value={props.newGoalAmount} onChange={(event) => props.setNewGoalAmount(Number(event.target.value))} />
        </label>
        <button className="primary" onClick={props.onAdd}>Create goal</button>
      </div>
      <div className="card-grid goals-grid">
        {props.goals.map((goal) => (
          <article className="goal-card" key={goal.id}>
            <div className="panel-heading">
              <div>
                <span className="eyebrow">Travel goal</span>
                <h2>{goal.name}</h2>
              </div>
              <strong>{clampPercent(goal.currentAmount, goal.targetAmount)}%</strong>
            </div>
            <Progress value={clampPercent(goal.currentAmount, goal.targetAmount)} />
            <div className="goal-meta">
              <span>{formatMoney(goal.currentAmount)} built</span>
              <span>{formatMoney(goal.targetAmount)} target</span>
              <span>{goal.targetDate}</span>
            </div>
            <div className="contribution-box">
              <div className="qr-placeholder">QR</div>
              <div>
                <strong>Share goal</strong>
                <p>Contribution link placeholder</p>
                <code>travelbudget.ca/g/{goal.id}</code>
              </div>
            </div>
            <div className="contributors">
              <strong>Contributors</strong>
              <span>Family gift contribution - {formatMoney(75)}</span>
              <span>Birthday travel reward - {formatMoney(50)}</span>
            </div>
            <button className="secondary full-width">Gift Contribution</button>
          </article>
        ))}
      </div>
    </section>
  );
}

function Opportunities(props: { matches: Array<{ opportunity: Opportunity; match: ReturnType<typeof matchOpportunity> }> }) {
  return (
    <section className="page-grid">
      <PageTitle eyebrow="Opportunity engine" title="Trips appear as your Travel Balance grows." text="Local mock opportunities are matched against preferences, party size, and balance eligibility." />
      <div className="opportunity-grid">
        {props.matches.map(({ opportunity, match }) => <OpportunityCard key={opportunity.id} opportunity={opportunity} match={match} />)}
      </div>
    </section>
  );
}

function Alerts(props: { matches: Array<{ opportunity: Opportunity; match: ReturnType<typeof matchOpportunity> }> }) {
  const eligible = props.matches.filter(({ match }) => match.budgetEligible);
  return (
    <section className="page-grid">
      <PageTitle eyebrow="Vacation alerts" title="You can afford this." text="Alerts are mocked for the prototype and show how balance-eligible opportunities would feel." />
      <div className="alert-stack">
        {eligible.map(({ opportunity }) => (
          <article className="alert-card" key={opportunity.id}>
            <div>
              <span className="status-pill success">Balance Eligible</span>
              <h2>You can now afford: {opportunity.title}</h2>
              <p>{opportunity.destination} with {opportunity.inventory}. Expires in {opportunity.expiresIn}.</p>
            </div>
            <strong>{formatMoney(opportunity.price)}</strong>
          </article>
        ))}
        {eligible.length === 0 && <div className="panel"><p>Increase the prototype Travel Balance on the dashboard to reveal balance-eligible alerts.</p></div>}
      </div>
    </section>
  );
}

function OpportunityCard({ opportunity, match, compact = false }: { opportunity: Opportunity; match: ReturnType<typeof matchOpportunity>; compact?: boolean }) {
  return (
    <article className={compact ? "opportunity-card compact" : "opportunity-card"}>
      <div className={`opportunity-image ${opportunity.image}`}>
        {match.budgetEligible && <span className="afford-badge">You Can Afford This</span>}
      </div>
      <div className="opportunity-body">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">{opportunity.destination}</span>
            <h2>{opportunity.title}</h2>
          </div>
          <strong>{formatMoney(opportunity.price)}</strong>
        </div>
        <div className="tag-row">
          {opportunity.styles.map((style) => <span key={style}>{style}</span>)}
        </div>
        <dl className="details-grid">
          <div><dt>Dates</dt><dd>{opportunity.dates}</dd></div>
          <div><dt>Party</dt><dd>{opportunity.partySize}</dd></div>
          <div><dt>Rating</dt><dd>{opportunity.rating}/5</dd></div>
          <div><dt>Inventory</dt><dd>{opportunity.inventory}</dd></div>
          <div><dt>Expires</dt><dd>{opportunity.expiresIn}</dd></div>
          <div><dt>Match score</dt><dd>{match.score}</dd></div>
        </dl>
        {!match.budgetEligible && <p className="unlock-note">Keep building your Travel Balance to unlock this opportunity.</p>}
      </div>
    </article>
  );
}

function PageTitle({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <header className="section-title">
      <span className="eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      <p>{text}</p>
    </header>
  );
}

function Metric({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="metric-card">
      <span className="eyebrow">{label}</span>
      <strong>{value}</strong>
      {detail && <small>{detail}</small>}
    </div>
  );
}

function Progress({ value }: { value: number }) {
  return <div className="progress-track" aria-label={`Progress ${value}%`}><span style={{ width: `${value}%` }} /></div>;
}

function Activity({ title, meta, amount }: { title: string; meta: string; amount: string }) {
  return (
    <div className="activity-item">
      <div><strong>{title}</strong><span>{meta}</span></div>
      <em>{amount}</em>
    </div>
  );
}

function AlertMini({ opportunity }: { opportunity: Opportunity }) {
  return (
    <div className="alert-mini">
      <strong>{opportunity.title}</strong>
      <span>{opportunity.inventory}</span>
      <small>Expires in {opportunity.expiresIn}</small>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
