import React, { useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom/client";
import "./styles.css";

type View = "home" | "onboarding" | "dashboard" | "profiles" | "balance" | "opportunities" | "alerts" | "goals" | "sharing" | "admin";
type Mode = "goal" | "contribution";
type Frequency = "weekly" | "monthly";
type MatchStatus = "afford" | "almost" | "building";

type Profile = {
  id: string;
  name: string;
  travelerType: string;
  adults: number;
  children: number;
  airport: string;
  window: string;
  tripLength: string;
  interests: string[];
  excludedProviders: string[];
  minimumRating: number;
  spendingPreference: string;
  lastMinuteAlerts: boolean;
};

type Opportunity = {
  id: string;
  title: string;
  destination: string;
  description: string;
  provider: string;
  category: string;
  price: number;
  estimatedTotalCost: number;
  included: string[];
  travelDates: string;
  departureAirport: string;
  partyCapacity: number;
  minimumRating: number;
  remainingInventory: number;
  expiryDate: string;
  regularPrice: number;
  travelBudgetPrice: number;
  isLastMinute: boolean;
  imageTone: string;
};

type Goal = {
  id: string;
  name: string;
  targetAmount: number;
  targetDate: string;
  currentAmount: number;
  shareSlug: string;
  contributions: Array<{ id: string; name: string; amount: number; date: string }>;
};

type LedgerItem = {
  id: string;
  date: string;
  label: string;
  amount: number;
  type: "contribution" | "reward" | "booking" | "gift";
};

type Booking = {
  id: string;
  opportunityTitle: string;
  balanceUsed: number;
  remainingBalance: number;
  date: string;
};

type AppState = {
  mode: Mode;
  balance: number;
  recurringAmount: number;
  frequency: Frequency;
  targetBudget: number;
  desiredTravelDate: string;
  activeProfileId: string;
  profiles: Profile[];
  opportunities: Opportunity[];
  savedTripIds: string[];
  sharedTripIds: string[];
  goals: Goal[];
  ledger: LedgerItem[];
  bookings: Booking[];
};

type RankedOpportunity = {
  opportunity: Opportunity;
  score: number;
  status: MatchStatus;
  reasons: string[];
};

const storageKey = "travel-budget-local-mvp-v1";
const today = new Date("2026-05-30T12:00:00");

const travelerTypes = ["Family Vacation", "Couples Getaway", "Adventure Travel", "Cruise Traveler", "Disney Fan", "Business Traveler"];
const interests = ["Cruises", "Resorts", "Disney", "Universal", "Europe", "Beaches", "Adventure", "Last Minute", "Family Travel", "Luxury"];
const providers = ["Disney Travel", "Royal Caribbean", "Air Canada Vacations", "WestJet Vacations", "Universal Parks", "Sunwing", "Trafalgar"];
const windows = ["Flexible", "Spring Break", "Summer", "Winter", "This Month", "Fall"];
const tripLengths = ["Weekend", "3-5 days", "1 week", "2 weeks", "Flexible"];
const airports = ["YYZ", "YTZ", "YUL", "YVR", "BUF", "Flexible"];

const travelImages = {
  tropicalResort: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80",
  cruise: "https://images.unsplash.com/photo-1548574505-5e239809ee19?auto=format&fit=crop&w=1400&q=80",
  themePark: "https://images.unsplash.com/photo-1563911302283-d2bc129e7570?auto=format&fit=crop&w=1400&q=80",
  japan: "https://images.unsplash.com/photo-1528164344705-47542687000d?auto=format&fit=crop&w=1400&q=80",
  mediterranean: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=1400&q=80",
  family: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80",
  couples: "https://images.unsplash.com/photo-1526772662000-3f88f10405ff?auto=format&fit=crop&w=1400&q=80",
  weekend: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1400&q=80",
  adventure: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1400&q=80",
} as const;

const imageForTone: Record<string, string> = {
  mexico: travelImages.tropicalResort,
  caribbean: travelImages.cruise,
  disney: travelImages.themePark,
  universal: travelImages.themePark,
  med: travelImages.mediterranean,
  japan: travelImages.japan,
};

const navItems: Array<{ id: View; label: string }> = [
  { id: "home", label: "Home" },
  { id: "dashboard", label: "Dashboard" },
  { id: "profiles", label: "Profiles" },
  { id: "balance", label: "Travel Balance" },
  { id: "opportunities", label: "Explore Trips" },
  { id: "alerts", label: "Alerts" },
  { id: "goals", label: "Travel Goals" },
  { id: "sharing", label: "Rewards & Sharing" },
  { id: "admin", label: "Admin" },
];

const makeId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const defaultProfile: Profile = {
  id: "profile-family",
  name: "Family Vacation",
  travelerType: "Family Vacation",
  adults: 2,
  children: 2,
  airport: "YYZ",
  window: "Summer",
  tripLength: "1 week",
  interests: ["Resorts", "Disney", "Beaches", "Family Travel"],
  excludedProviders: [],
  minimumRating: 4,
  spendingPreference: "Balanced meals and excursions",
  lastMinuteAlerts: true,
};

const defaultOpportunities: Opportunity[] = [
  {
    id: "trip-mexico-family",
    title: "Riviera Maya Family Resort Week",
    destination: "Riviera Maya, Mexico",
    description: "A warm all-inclusive week for families who want the vacation to feel easy from the airport onward.",
    provider: "Air Canada Vacations",
    category: "All-inclusive resort",
    price: 1899,
    estimatedTotalCost: 2140,
    included: ["Round-trip flights", "7 nights hotel", "Transfers", "Taxes", "Family pool access"],
    travelDates: "Winter",
    departureAirport: "YYZ",
    partyCapacity: 4,
    minimumRating: 4.3,
    remainingInventory: 3,
    expiryDate: "2026-06-02",
    regularPrice: 2650,
    travelBudgetPrice: 1899,
    isLastMinute: true,
    imageTone: "mexico",
  },
  {
    id: "trip-caribbean-cruise",
    title: "7-Day Caribbean Cruise",
    destination: "Eastern Caribbean",
    description: "A sun-soaked sailing with dining, entertainment, and island stops bundled into one simple escape.",
    provider: "Royal Caribbean",
    category: "Cruise",
    price: 1240,
    estimatedTotalCost: 1660,
    included: ["Oceanview cabin", "Main dining", "Port taxes", "Ship activities"],
    travelDates: "This Month",
    departureAirport: "Flexible",
    partyCapacity: 2,
    minimumRating: 4.6,
    remainingInventory: 4,
    expiryDate: "2026-06-01",
    regularPrice: 1980,
    travelBudgetPrice: 1240,
    isLastMinute: true,
    imageTone: "caribbean",
  },
  {
    id: "trip-disney-2028",
    title: "Disney Vacation Preview",
    destination: "Orlando, Florida",
    description: "A family theme-park adventure built around the moment the kids find out the trip is real.",
    provider: "Disney Travel",
    category: "Disney",
    price: 4200,
    estimatedTotalCost: 4925,
    included: ["Flights", "Resort stay", "Park ticket estimate", "Airport transfer"],
    travelDates: "Spring Break",
    departureAirport: "YYZ",
    partyCapacity: 4,
    minimumRating: 4.8,
    remainingInventory: 6,
    expiryDate: "2026-07-15",
    regularPrice: 5550,
    travelBudgetPrice: 4200,
    isLastMinute: false,
    imageTone: "disney",
  },
  {
    id: "trip-universal",
    title: "Universal Studios Escape",
    destination: "Orlando, Florida",
    description: "A high-energy theme-park getaway for families ready for rides, pools, and a big reveal.",
    provider: "Universal Parks",
    category: "Theme parks",
    price: 2450,
    estimatedTotalCost: 2980,
    included: ["Flights", "4 nights hotel", "Park ticket estimate", "Taxes"],
    travelDates: "Summer",
    departureAirport: "BUF",
    partyCapacity: 4,
    minimumRating: 4.4,
    remainingInventory: 12,
    expiryDate: "2026-06-22",
    regularPrice: 3450,
    travelBudgetPrice: 2450,
    isLastMinute: false,
    imageTone: "universal",
  },
  {
    id: "trip-mediterranean",
    title: "Mediterranean Cruise Window",
    destination: "Barcelona to Rome",
    description: "A polished Europe-by-sea itinerary with coastal views, onboard dining, and city-to-city discovery.",
    provider: "Celebrity Cruises",
    category: "Cruise",
    price: 3800,
    estimatedTotalCost: 4450,
    included: ["Balcony cabin", "Main dining", "Port fees", "Onboard entertainment"],
    travelDates: "Summer",
    departureAirport: "Flexible",
    partyCapacity: 2,
    minimumRating: 4.7,
    remainingInventory: 9,
    expiryDate: "2026-08-05",
    regularPrice: 5200,
    travelBudgetPrice: 3800,
    isLastMinute: false,
    imageTone: "med",
  },
  {
    id: "trip-japan",
    title: "Japan Adventure Path",
    destination: "Tokyo and Kyoto",
    description: "A dream-trip path through neon nights, temples, rail days, and once-in-a-lifetime family memories.",
    provider: "Trafalgar",
    category: "Adventure",
    price: 6100,
    estimatedTotalCost: 7200,
    included: ["Flights estimate", "Guided stays", "Rail pass estimate", "Daily breakfast"],
    travelDates: "Fall",
    departureAirport: "YYZ",
    partyCapacity: 2,
    minimumRating: 4.8,
    remainingInventory: 10,
    expiryDate: "2026-09-10",
    regularPrice: 7900,
    travelBudgetPrice: 6100,
    isLastMinute: false,
    imageTone: "japan",
  },
];

const initialState: AppState = {
  mode: "contribution",
  balance: 1247,
  recurringAmount: 50,
  frequency: "weekly",
  targetBudget: 5000,
  desiredTravelDate: "2028-07",
  activeProfileId: defaultProfile.id,
  profiles: [defaultProfile],
  opportunities: defaultOpportunities,
  savedTripIds: [],
  sharedTripIds: [],
  goals: [
    {
      id: "goal-japan",
      name: "Japan 2028",
      targetAmount: 6000,
      targetDate: "October 2028",
      currentAmount: 1247,
      shareSlug: "japan-2028",
      contributions: [
        { id: "gift-1", name: "Aunt Lisa", amount: 75, date: "May 12" },
        { id: "gift-2", name: "Grandma", amount: 50, date: "May 21" },
      ],
    },
  ],
  ledger: [
    { id: "ledger-open", date: "May 01", label: "Travel Balance started", amount: 500, type: "contribution" },
    { id: "ledger-weekly", date: "May 24", label: "Weekly contribution added", amount: 50, type: "contribution" },
    { id: "ledger-reward", date: "May 27", label: "Family gift contribution", amount: 75, type: "gift" },
  ],
  bookings: [],
};

function loadState() {
  try {
    const saved = localStorage.getItem(storageKey);
    if (!saved) return initialState;
    const parsed = { ...initialState, ...JSON.parse(saved) } as AppState;
    return {
      ...parsed,
      opportunities: parsed.opportunities.map((opportunity) => ({
        ...defaultOpportunities.find((item) => item.id === opportunity.id),
        ...opportunity,
      })),
    };
  } catch {
    return initialState;
  }
}

function money(value: number) {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(value);
}

function percent(current: number, target: number) {
  return Math.min(100, Math.round((current / Math.max(target, 1)) * 100));
}

function daysUntil(date: string) {
  return Math.max(0, Math.ceil((new Date(`${date}T12:00:00`).getTime() - today.getTime()) / 86400000));
}

function readableDate() {
  return today.toLocaleDateString("en-CA", { month: "short", day: "numeric" });
}

function profileParty(profile: Profile) {
  return profile.adults + profile.children;
}

function statusFor(balance: number, cost: number): MatchStatus {
  if (balance >= cost) return "afford";
  if (cost - balance <= 500) return "almost";
  return "building";
}

function rankOpportunity(opportunity: Opportunity, profile: Profile, balance: number): RankedOpportunity | null {
  if (opportunity.isLastMinute && !profile.lastMinuteAlerts) return null;
  if (profile.excludedProviders.some((provider) => provider.toLowerCase() === opportunity.provider.toLowerCase())) return null;
  if (opportunity.minimumRating < profile.minimumRating) return null;

  const requiredParty = profileParty(profile);
  const reasons: string[] = [];
  let score = 0;

  if (opportunity.partyCapacity >= requiredParty) {
    score += 2;
    reasons.push(`fits ${requiredParty} travelers`);
  }

  if (opportunity.departureAirport === profile.airport || opportunity.departureAirport === "Flexible" || profile.airport === "Flexible") {
    score += 2;
    reasons.push(`works from ${profile.airport}`);
  }

  if (opportunity.travelDates === profile.window || profile.window === "Flexible" || opportunity.travelDates === "This Month") {
    score += 2;
    reasons.push(`matches ${profile.window.toLowerCase()} timing`);
  }

  const categoryMatch = profile.interests.some((interest) => {
    const text = `${opportunity.category} ${opportunity.title} ${opportunity.destination}`.toLowerCase();
    return text.includes(interest.toLowerCase());
  });
  if (categoryMatch) {
    score += 4;
    reasons.push("matches travel interests");
  }

  if (opportunity.isLastMinute) {
    score += 1;
    reasons.push("last-minute alert enabled");
  }

  const status = statusFor(balance, opportunity.estimatedTotalCost);
  if (status === "afford") score += 5;
  if (status === "almost") score += 3;

  return {
    opportunity,
    score,
    status,
    reasons: reasons.length ? reasons : ["available as a discovery option"],
  };
}

function App() {
  const [view, setView] = useState<View>("home");
  const [state, setState] = useState<AppState>(loadState);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(state));
  }, [state]);

  const activeProfile = state.profiles.find((profile) => profile.id === state.activeProfileId) ?? state.profiles[0];
  const rankedTrips = useMemo(() => {
    return state.opportunities
      .map((opportunity) => rankOpportunity(opportunity, activeProfile, state.balance))
      .filter((value): value is RankedOpportunity => Boolean(value))
      .sort((a, b) => b.score - a.score);
  }, [activeProfile, state.balance, state.opportunities]);

  const affordableTrips = rankedTrips.filter((trip) => trip.status === "afford");
  const almostTrips = rankedTrips.filter((trip) => trip.status === "almost");
  const selectedGoal = state.goals[0];

  function patch(patchValue: Partial<AppState>) {
    setState((current) => ({ ...current, ...patchValue }));
  }

  function resetDemo() {
    localStorage.removeItem(storageKey);
    setState(initialState);
    setView("dashboard");
  }

  function addLedger(label: string, amount: number, type: LedgerItem["type"]) {
    setState((current) => ({
      ...current,
      balance: current.balance + amount,
      ledger: [{ id: makeId(), date: readableDate(), label, amount, type }, ...current.ledger],
    }));
  }

  function saveTrip(id: string) {
    setState((current) => ({ ...current, savedTripIds: current.savedTripIds.includes(id) ? current.savedTripIds : [id, ...current.savedTripIds] }));
  }

  function shareTrip(id: string) {
    setState((current) => ({ ...current, sharedTripIds: current.sharedTripIds.includes(id) ? current.sharedTripIds : [id, ...current.sharedTripIds] }));
  }

  function simulateBooking(opportunity: Opportunity) {
    if (state.balance < opportunity.estimatedTotalCost) return;
    const remainingBalance = state.balance - opportunity.estimatedTotalCost;
    setState((current) => ({
      ...current,
      balance: remainingBalance,
      ledger: [
        { id: makeId(), date: readableDate(), label: `Used Travel Balance for ${opportunity.title}`, amount: -opportunity.estimatedTotalCost, type: "booking" },
        ...current.ledger,
      ],
      bookings: [
        { id: makeId(), opportunityTitle: opportunity.title, balanceUsed: opportunity.estimatedTotalCost, remainingBalance, date: readableDate() },
        ...current.bookings,
      ],
    }));
    setView("dashboard");
  }

  function simulateReferral(opportunity: Opportunity) {
    shareTrip(opportunity.id);
    addLedger(`Friend booked from ${opportunity.title} referral`, 10, "reward");
  }

  function addProfile(profile: Profile) {
    setState((current) => ({ ...current, profiles: [profile, ...current.profiles], activeProfileId: profile.id }));
  }

  function addGoal(goal: Goal) {
    setState((current) => ({ ...current, goals: [goal, ...current.goals] }));
  }

  function addGift(goalId: string, name: string, amount: number) {
    setState((current) => ({
      ...current,
      balance: current.balance + amount,
      goals: current.goals.map((goal) =>
        goal.id === goalId
          ? { ...goal, currentAmount: goal.currentAmount + amount, contributions: [{ id: makeId(), name, amount, date: readableDate() }, ...goal.contributions] }
          : goal,
      ),
      ledger: [{ id: makeId(), date: readableDate(), label: `${name} added to Travel Balance`, amount, type: "gift" }, ...current.ledger],
    }));
  }

  function upsertOpportunity(opportunity: Opportunity) {
    setState((current) => ({
      ...current,
      opportunities: current.opportunities.some((item) => item.id === opportunity.id)
        ? current.opportunities.map((item) => (item.id === opportunity.id ? opportunity : item))
        : [opportunity, ...current.opportunities],
    }));
  }

  function deleteOpportunity(id: string) {
    setState((current) => ({ ...current, opportunities: current.opportunities.filter((item) => item.id !== id) }));
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button className="brand" onClick={() => setView("home")}>
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
        <button className="secondary compact-button" onClick={() => setView("onboarding")}>Update onboarding</button>
        <button className="ghost-button" onClick={resetDemo}>Reset demo data</button>
        <div className="sidebar-card">
          <span className="eyebrow">Travel Balance</span>
          <strong>{money(state.balance)}</strong>
          <small>Spendable travel purchasing power inside Travel Budget.</small>
        </div>
      </aside>

      <main>
        {view === "home" && <Home setView={setView} balance={state.balance} affordableCount={affordableTrips.length} />}
        {view === "onboarding" && <Onboarding state={state} patch={patch} profile={activeProfile} patchProfile={(profile) => addProfile({ ...profile, id: makeId() })} onDone={() => setView("dashboard")} />}
        {view === "dashboard" && <Dashboard state={state} profile={activeProfile} rankedTrips={rankedTrips} affordableTrips={affordableTrips} almostTrips={almostTrips} goal={selectedGoal} setView={setView} />}
        {view === "profiles" && <Profiles profiles={state.profiles} activeId={state.activeProfileId} setActive={(id) => patch({ activeProfileId: id })} addProfile={addProfile} />}
        {view === "balance" && <BalanceSimulator state={state} patch={patch} addContribution={(amount) => addLedger("One-time contribution added to Travel Balance", amount, "contribution")} />}
        {view === "opportunities" && (
          <Opportunities
            rankedTrips={rankedTrips}
            savedTripIds={state.savedTripIds}
            sharedTripIds={state.sharedTripIds}
            onSave={saveTrip}
            onShare={shareTrip}
            onBook={simulateBooking}
            onReferral={simulateReferral}
          />
        )}
        {view === "alerts" && <Alerts rankedTrips={rankedTrips} setView={setView} />}
        {view === "goals" && <Goals goals={state.goals} balance={state.balance} addGoal={addGoal} addGift={addGift} />}
        {view === "sharing" && <Sharing opportunities={state.opportunities} sharedTripIds={state.sharedTripIds} onReferral={simulateReferral} />}
        {view === "admin" && <Admin opportunities={state.opportunities} upsert={upsertOpportunity} remove={deleteOpportunity} />}
      </main>
    </div>
  );
}

function Onboarding({ state, patch, profile, patchProfile, onDone }: { state: AppState; patch: (patch: Partial<AppState>) => void; profile: Profile; patchProfile: (profile: Profile) => void; onDone: () => void }) {
  const [draft, setDraft] = useState(profile);
  const months = state.frequency === "monthly" ? 12 : 52;
  const projected = state.balance + state.recurringAmount * months;

  return (
    <section className="page-grid">
      <Hero eyebrow="Travel membership setup" title="Build travel purchasing power around the trips you actually want." text="Choose a goal date or let your Travel Balance grow until the opportunity engine finds the right trip." />
      <div className="content-grid two-one">
        <div className="panel">
          <h2>Choose how your Travel Balance grows</h2>
          <div className="toggle-row">
            <button className={state.mode === "goal" ? "selected" : ""} onClick={() => patch({ mode: "goal" })}>Goal mode</button>
            <button className={state.mode === "contribution" ? "selected" : ""} onClick={() => patch({ mode: "contribution" })}>Contribution mode</button>
          </div>
          <div className="form-grid">
            {state.mode === "goal" && (
              <>
                <label>Target budget<input type="number" value={state.targetBudget} onChange={(event) => patch({ targetBudget: Number(event.target.value) })} /></label>
                <label>Desired travel date<input type="month" value={state.desiredTravelDate} onChange={(event) => patch({ desiredTravelDate: event.target.value })} /></label>
              </>
            )}
            <label>Planned contribution amount<input type="number" value={state.recurringAmount} onChange={(event) => patch({ recurringAmount: Number(event.target.value) })} /></label>
            <label>Frequency<select value={state.frequency} onChange={(event) => patch({ frequency: event.target.value as Frequency })}><option>weekly</option><option>monthly</option></select></label>
          </div>
        </div>
        <div className="panel accent-panel">
          <span className="eyebrow">Projection</span>
          <strong>{money(projected)}</strong>
          <p>Projected Travel Balance after one year at {money(state.recurringAmount)} {state.frequency}.</p>
        </div>
      </div>
      <ProfileForm title="Create your first travel profile" draft={draft} setDraft={setDraft} submitLabel="Save profile and continue" onSubmit={() => { patchProfile(draft); onDone(); }} />
    </section>
  );
}

function Home({ setView, balance, affordableCount }: { setView: (view: View) => void; balance: number; affordableCount: number }) {
  const previewCards = [
    { title: "Caribbean escape", image: travelImages.tropicalResort, meta: "Resorts and cruises" },
    { title: "Disney-style family adventure", image: travelImages.themePark, meta: "Theme-park memories" },
    { title: "Japan dream trip", image: travelImages.japan, meta: "Tokyo and Kyoto" },
    { title: "Mediterranean cruise", image: travelImages.mediterranean, meta: "Europe by sea" },
  ];

  return (
    <section className="page-grid">
      <header className="page-header image-hero home-hero" style={{ backgroundImage: `linear-gradient(105deg, rgba(20, 78, 91, 0.84), rgba(247, 134, 58, 0.46)), url(${travelImages.family})` }}>
        <div className="hero-copy">
          <span className="eyebrow">Travel membership platform</span>
          <h1>Your next vacation starts with your next paycheck.</h1>
          <p>
            Build a Travel Balance over time, then use it when the right cruise, resort, theme park, or dream trip appears.
            Travel Budget turns someday into a visible path toward somewhere.
          </p>
          <div className="hero-actions">
            <button className="primary light" onClick={() => setView("onboarding")}>Start travel setup</button>
            <button className="secondary translucent" onClick={() => setView("opportunities")}>Preview trip matches</button>
          </div>
        </div>
        <div className="boarding-pass">
          <span>Your Travel Balance</span>
          <strong>{money(balance)}</strong>
          <small>{affordableCount} trips currently say You Can Afford This.</small>
        </div>
      </header>

      <div className="destination-strip">
        {previewCards.map((card) => (
          <button className="destination-card" key={card.title} onClick={() => setView("opportunities")}>
            <img src={card.image} alt="" />
            <span>{card.meta}</span>
            <strong>{card.title}</strong>
          </button>
        ))}
      </div>

      <div className="value-grid">
        <div className="panel">
          <span className="eyebrow">1. Choose your travel style</span>
          <h2>Family resort, cruise, Disney, Europe, or flexible adventures.</h2>
          <p>Profiles tell the opportunity engine who is traveling, when, from where, and what to avoid.</p>
        </div>
        <div className="panel">
          <span className="eyebrow">2. Build Travel Balance</span>
          <h2>Regular contributions become travel purchasing power.</h2>
          <p>The dollar amount is shown clearly, but the experience stays focused on future trips, not financial management.</p>
        </div>
        <div className="panel">
          <span className="eyebrow">3. Unlock opportunity matches</span>
          <h2>You Can Afford This becomes the moment of excitement.</h2>
          <p>Trips are ranked by preferences, airport, timing, party size, rating, exclusions, and Travel Balance.</p>
        </div>
      </div>
    </section>
  );
}

function Dashboard({ state, profile, rankedTrips, affordableTrips, almostTrips, goal, setView }: { state: AppState; profile: Profile; rankedTrips: RankedOpportunity[]; affordableTrips: RankedOpportunity[]; almostTrips: RankedOpportunity[]; goal?: Goal; setView: (view: View) => void }) {
  const latestBooking = state.bookings[0];
  const featuredTrip = rankedTrips[0];
  const keepBuildingTrips = rankedTrips.filter((trip) => trip.status === "building").slice(0, 3);
  const nearestTrip = rankedTrips[0]?.opportunity;
  const nearestProgress = nearestTrip ? percent(state.balance, nearestTrip.estimatedTotalCost) : 0;
  const savedTrips = rankedTrips.filter((trip) => state.savedTripIds.includes(trip.opportunity.id));
  return (
    <section className="page-grid">
      <header className="page-header image-hero" style={{ backgroundImage: `linear-gradient(105deg, rgba(17, 74, 88, 0.86), rgba(247, 134, 58, 0.42)), url(${travelImages.weekend})` }}>
        <div>
          <span className="eyebrow">Vacation command center</span>
          <h1>Your next adventure has already started.</h1>
          <p>{profile.name} is matched against cruises, resorts, theme-park trips, and dream escapes that fit your Travel Balance.</p>
        </div>
        <button className="primary light" onClick={() => setView("opportunities")}>Explore trips</button>
      </header>

      {latestBooking && (
        <div className="celebration">
          <strong>Booking simulated: {latestBooking.opportunityTitle}</strong>
          <span>Your next adventure has already started. Remaining Travel Balance: {money(latestBooking.remainingBalance)}</span>
        </div>
      )}

      <div className="stats-grid">
        <div className="balance-card">
          <span className="eyebrow">Travel Balance</span>
          <strong>{money(state.balance)}</strong>
          <small>{nearestTrip ? `${nearestProgress}% toward ${nearestTrip.title}` : "Available to use toward eligible travel opportunities."}</small>
          {nearestTrip && <Progress value={nearestProgress} />}
        </div>
        <Metric label="You can afford" value={String(affordableTrips.length)} detail="Balance-eligible trips" />
        <Metric label="Almost there" value={String(almostTrips.length)} detail="Within $500" />
        <Metric label="Saved trips" value={String(state.savedTripIds.length)} detail="Local demo list" />
      </div>

      {featuredTrip && (
        <div className="featured-trip">
          <img src={imageForTone[featuredTrip.opportunity.imageTone] ?? travelImages.tropicalResort} alt="" />
          <div>
            <span className={`status-pill ${featuredTrip.status}`}>{featuredTrip.status === "afford" ? "You Can Afford This" : featuredTrip.status === "almost" ? `Only ${money(featuredTrip.opportunity.estimatedTotalCost - state.balance)} away` : "Keep Building Toward"}</span>
            <h2>{featuredTrip.opportunity.title}</h2>
            <p>{featuredTrip.opportunity.description}</p>
            <button className="primary" onClick={() => setView("opportunities")}>View opportunity match</button>
          </div>
        </div>
      )}

      <div className="content-grid two-one">
        <div className="panel">
          <PanelHead eyebrow="You Can Afford This" title="Ready when you are" action="Explore all" onClick={() => setView("opportunities")} />
          <div className="opportunity-row">
            {(affordableTrips.length ? affordableTrips : rankedTrips).slice(0, 3).map((trip) => <TripCard key={trip.opportunity.id} trip={trip} compact />)}
          </div>
        </div>
        <div className="panel">
          <PanelHead eyebrow="Travel profile" title={profile.name} action="Edit profiles" onClick={() => setView("profiles")} />
          <InfoList items={[["Travelers", `${profile.adults} adults, ${profile.children} children`], ["Airport", profile.airport], ["Window", profile.window], ["Interests", profile.interests.join(", ")]]} />
        </div>
      </div>

      <div className="content-grid two-one">
        <div className="panel">
          <PanelHead eyebrow="Almost There" title="Trips within reach" action="Add to Travel Balance" onClick={() => setView("balance")} />
          <div className="opportunity-row">
            {(almostTrips.length ? almostTrips : rankedTrips.slice(1, 4)).slice(0, 3).map((trip) => <TripCard key={trip.opportunity.id} trip={trip} compact />)}
          </div>
        </div>
        <div className="panel">
          <PanelHead eyebrow="Keep Building Toward" title="Dream trips on deck" action="Vacation Alerts" onClick={() => setView("alerts")} />
          {keepBuildingTrips.length ? keepBuildingTrips.map((trip) => <MiniTrip key={trip.opportunity.id} trip={trip} balance={state.balance} />) : <p className="muted">Your Travel Balance is opening up the best matches already.</p>}
        </div>
      </div>

      <div className="content-grid two-one">
        <div className="panel">
          <PanelHead eyebrow="Travel Balance activity" title="Recent progress" action="Open simulator" onClick={() => setView("balance")} />
          <Ledger items={state.ledger.slice(0, 5)} />
        </div>
        <div className="panel">
          <PanelHead eyebrow="Travel goal" title={goal?.name ?? "Create a goal"} action="Goals" onClick={() => setView("goals")} />
          {goal ? <><img className="goal-image" src={travelImages.japan} alt="" /><Progress value={percent(goal.currentAmount, goal.targetAmount)} /><p>{money(goal.currentAmount)} of {money(goal.targetAmount)} ready.</p></> : <p>Create a shareable Travel Goal so friends and family can cheer the trip forward.</p>}
        </div>
      </div>

      <div className="panel">
        <PanelHead eyebrow="Saved trips" title="Come back to these escapes" action="Explore trips" onClick={() => setView("opportunities")} />
        {savedTrips.length ? <div className="opportunity-row">{savedTrips.slice(0, 3).map((trip) => <TripCard key={trip.opportunity.id} trip={trip} compact />)}</div> : <EmptyState title="No saved trips yet" text="Save a resort, cruise, or dream trip so the dashboard feels like your personal travel shelf." />}
      </div>
    </section>
  );
}

function Profiles({ profiles, activeId, setActive, addProfile }: { profiles: Profile[]; activeId: string; setActive: (id: string) => void; addProfile: (profile: Profile) => void }) {
  const [draft, setDraft] = useState<Profile>({ ...defaultProfile, id: makeId(), name: "Weekend Escape", adults: 2, children: 0, interests: ["Beaches", "Last Minute"], lastMinuteAlerts: true });
  return (
    <section className="page-grid">
      <SectionTitle eyebrow="Travel profiles" title="Multiple travel identities, one Travel Balance." text="Profiles let the opportunity engine understand family vacations, couples escapes, business trips, and spontaneous getaways differently." />
      <ProfileForm title="Create travel profile" draft={draft} setDraft={setDraft} submitLabel="Create profile" onSubmit={() => { addProfile({ ...draft, id: makeId() }); setDraft({ ...draft, id: makeId(), name: "" }); }} />
      <div className="card-grid">
        {profiles.map((profile) => (
          <article className={profile.id === activeId ? "travel-card selected-card" : "travel-card"} key={profile.id}>
            <span className="eyebrow">{profile.travelerType}</span>
            <h2>{profile.name}</h2>
            <InfoList items={[["Travelers", `${profile.adults} adults, ${profile.children} children`], ["Airport", profile.airport], ["Window", profile.window], ["Trip length", profile.tripLength], ["Minimum rating", `${profile.minimumRating}+`]]} />
            <button className="secondary full-width" onClick={() => setActive(profile.id)}>Use for matching</button>
          </article>
        ))}
      </div>
    </section>
  );
}

function BalanceSimulator({ state, patch, addContribution }: { state: AppState; patch: (patch: Partial<AppState>) => void; addContribution: (amount: number) => void }) {
  const [manualAmount, setManualAmount] = useState(state.recurringAmount);
  const monthlyEquivalent = state.frequency === "weekly" ? state.recurringAmount * 4 : state.recurringAmount;
  const projection = [3, 6, 12, 18].map((month) => ({ month, value: state.balance + monthlyEquivalent * month }));
  return (
    <section className="page-grid">
      <SectionTitle eyebrow="Travel Balance simulator" title="Make progress feel visible." text="This is local demo activity only: no payments, no banking, no external integrations." />
      <div className="stats-grid">
        <div className="balance-card"><span className="eyebrow">Current Travel Balance</span><strong>{money(state.balance)}</strong><small>Available for eligible trips.</small></div>
        <Metric label="Recurring amount" value={`${money(state.recurringAmount)} ${state.frequency}`} detail="Demo projection" />
        <Metric label="12 month projection" value={money(projection[2].value)} detail="If rhythm continues" />
        <Metric label="Progress moments" value={String(state.ledger.length)} detail="Travel Balance activity" />
      </div>
      <div className="content-grid two-one">
        <div className="panel">
          <h2>Adjust contribution rhythm</h2>
          <div className="form-grid">
            <label>Recurring amount<input type="number" value={state.recurringAmount} onChange={(event) => patch({ recurringAmount: Number(event.target.value) })} /></label>
            <label>Frequency<select value={state.frequency} onChange={(event) => patch({ frequency: event.target.value as Frequency })}><option>weekly</option><option>monthly</option></select></label>
            <label>One-time contribution<input type="number" value={manualAmount} onChange={(event) => setManualAmount(Number(event.target.value))} /></label>
            <button className="primary form-button" onClick={() => addContribution(manualAmount)}>Add to Travel Balance</button>
          </div>
          <div className="projection-grid">
            {projection.map((item) => <Metric key={item.month} label={`${item.month} months`} value={money(item.value)} />)}
          </div>
        </div>
        <div className="panel">
          <PanelHead eyebrow="Recent activity" title="Travel Balance progress" />
          <Ledger items={state.ledger} />
        </div>
      </div>
    </section>
  );
}

function Opportunities({ rankedTrips, savedTripIds, sharedTripIds, onSave, onShare, onBook, onReferral }: { rankedTrips: RankedOpportunity[]; savedTripIds: string[]; sharedTripIds: string[]; onSave: (id: string) => void; onShare: (id: string) => void; onBook: (opportunity: Opportunity) => void; onReferral: (opportunity: Opportunity) => void }) {
  return (
    <section className="page-grid">
      <SectionTitle eyebrow="Opportunity matches" title="Trips unlock as your Travel Balance grows." text="Opportunities are ranked by interests, dates, party size, airport, provider exclusions, rating, last-minute preference, and Travel Balance." />
      {rankedTrips.length === 0 && (
        <EmptyState
          title="No opportunity matches yet"
          text="Try lowering the minimum rating, enabling last-minute Vacation Alerts, or widening the travel window on your active profile."
        />
      )}
      <div className="opportunity-grid">
        {rankedTrips.map((trip) => (
          <TripCard
            key={trip.opportunity.id}
            trip={trip}
            saved={savedTripIds.includes(trip.opportunity.id)}
            shared={sharedTripIds.includes(trip.opportunity.id)}
            onSave={() => onSave(trip.opportunity.id)}
            onShare={() => onShare(trip.opportunity.id)}
            onBook={() => onBook(trip.opportunity)}
            onReferral={() => onReferral(trip.opportunity)}
          />
        ))}
      </div>
    </section>
  );
}

function Alerts({ rankedTrips, setView }: { rankedTrips: RankedOpportunity[]; setView: (view: View) => void }) {
  const alerts = rankedTrips.filter((trip) => trip.status === "afford" || trip.status === "almost").slice(0, 5);
  return (
    <section className="page-grid">
      <SectionTitle eyebrow="Vacation Alerts" title="See what your Travel Balance is close to unlocking." text="Alerts focus attention on trips that are ready now or close enough to feel motivating." />
      {alerts.length === 0 ? (
        <EmptyState title="No Vacation Alerts yet" text="Add to Travel Balance or broaden your travel profile to surface near-ready trips." action="Open Travel Balance" onClick={() => setView("balance")} />
      ) : (
        <div className="alert-stack">
          {alerts.map((trip) => (
            <article className="alert-card" key={trip.opportunity.id}>
              <div>
                <span className={`status-pill ${trip.status}`}>{trip.status === "afford" ? "You Can Afford This" : "Almost There"}</span>
                <h2>{trip.opportunity.title}</h2>
                <p>{trip.opportunity.destination} from {trip.opportunity.departureAirport}. {trip.opportunity.remainingInventory} spots remain. Expires in {daysUntil(trip.opportunity.expiryDate)} days.</p>
                <p className="match-reason">Why this appears: {trip.reasons.join(", ")}.</p>
              </div>
              <strong>{money(trip.opportunity.estimatedTotalCost)}</strong>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function Goals({ goals, balance, addGoal, addGift }: { goals: Goal[]; balance: number; addGoal: (goal: Goal) => void; addGift: (goalId: string, name: string, amount: number) => void }) {
  const [name, setName] = useState("Disney Celebration Trip");
  const [targetAmount, setTargetAmount] = useState(5000);
  const [giftName, setGiftName] = useState("Friend");
  const [giftAmount, setGiftAmount] = useState(50);
  return (
    <section className="page-grid">
      <SectionTitle eyebrow="Travel goals" title="Create a shareable trip goal friends can rally around." text="Gift contributions are demo-only here, but the product idea is simple: family and friends can help add to Travel Balance for a specific future vacation." />
      <div className="inline-form panel">
        <label>Goal name<input value={name} onChange={(event) => setName(event.target.value)} /></label>
        <label>Target amount<input type="number" value={targetAmount} onChange={(event) => setTargetAmount(Number(event.target.value))} /></label>
        <button className="primary" onClick={() => addGoal({ id: makeId(), name, targetAmount, targetDate: "Future travel window", currentAmount: balance, shareSlug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"), contributions: [] })}>Create travel goal</button>
      </div>
      <div className="goals-grid">
        {goals.map((goal) => (
          <article className="goal-card" key={goal.id}>
            <PanelHead eyebrow="Shareable Travel Goal" title={goal.name} />
            <Progress value={percent(goal.currentAmount, goal.targetAmount)} />
            <div className="goal-meta"><span>{money(goal.currentAmount)} ready</span><span>{money(goal.targetAmount)} target</span><span>{goal.targetDate}</span></div>
            <div className="contribution-box">
              <div className="qr-placeholder">QR</div>
              <div>
                <strong>Share link preview</strong>
                <p>travelbudget.ca/goals/{goal.shareSlug}</p>
              </div>
            </div>
            <div className="inline-mini">
              <input aria-label="Contributor name" value={giftName} onChange={(event) => setGiftName(event.target.value)} />
              <input aria-label="Gift contribution amount" type="number" value={giftAmount} onChange={(event) => setGiftAmount(Number(event.target.value))} />
              <button className="secondary" onClick={() => addGift(goal.id, giftName, giftAmount)}>Simulate gift</button>
            </div>
            <Ledger items={goal.contributions.map((item) => ({ ...item, label: `${item.name} gift contribution`, type: "gift" }))} />
          </article>
        ))}
      </div>
    </section>
  );
}

function Sharing({ opportunities, sharedTripIds, onReferral }: { opportunities: Opportunity[]; sharedTripIds: string[]; onReferral: (opportunity: Opportunity) => void }) {
  const shared = opportunities.filter((item) => sharedTripIds.includes(item.id));
  return (
    <section className="page-grid">
      <SectionTitle eyebrow="Referral rewards" title="Every opportunity can become a shareable travel moment." text="Referral links are previews. When a friend books in this demo, a $10 Travel Reward is added to Travel Balance." />
      {shared.length === 0 && <EmptyState title="No shared trips yet" text="Share an opportunity from the Trips page to see it here. For now, a few sample referral previews are shown below." />}
      <div className="card-grid">
        {(shared.length ? shared : opportunities.slice(0, 4)).map((opportunity) => (
          <article className="travel-card" key={opportunity.id}>
            <span className="eyebrow">{opportunity.category}</span>
            <h2>{opportunity.title}</h2>
            <p>travelbudget.ca/r/{opportunity.id}</p>
            <button className="primary full-width" onClick={() => onReferral(opportunity)}>Friend booked this trip</button>
          </article>
        ))}
      </div>
    </section>
  );
}

function Admin({ opportunities, upsert, remove }: { opportunities: Opportunity[]; upsert: (opportunity: Opportunity) => void; remove: (id: string) => void }) {
  const [draft, setDraft] = useState<Opportunity>({ ...defaultOpportunities[0], id: makeId(), title: "New Travel Budget Deal", provider: "Demo Provider" });
  return (
    <section className="page-grid">
      <SectionTitle eyebrow="Admin demo panel" title="Manage demo travel opportunities." text="This panel edits local state only. There is no database, travel API, booking system, or provider integration." />
      <div className="panel">
        <div className="form-grid admin-form">
          <label>Title<input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></label>
          <label>Destination<input value={draft.destination} onChange={(event) => setDraft({ ...draft, destination: event.target.value })} /></label>
          <label>Provider<input value={draft.provider} onChange={(event) => setDraft({ ...draft, provider: event.target.value })} /></label>
          <label>Category<input value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })} /></label>
          <label>Price<input type="number" value={draft.travelBudgetPrice} onChange={(event) => setDraft({ ...draft, travelBudgetPrice: Number(event.target.value), price: Number(event.target.value) })} /></label>
          <label>Regular price<input type="number" value={draft.regularPrice} onChange={(event) => setDraft({ ...draft, regularPrice: Number(event.target.value) })} /></label>
          <label>Estimated total cost<input type="number" value={draft.estimatedTotalCost} onChange={(event) => setDraft({ ...draft, estimatedTotalCost: Number(event.target.value) })} /></label>
          <label>Inventory<input type="number" value={draft.remainingInventory} onChange={(event) => setDraft({ ...draft, remainingInventory: Number(event.target.value) })} /></label>
          <label>Expiry date<input type="date" value={draft.expiryDate} onChange={(event) => setDraft({ ...draft, expiryDate: event.target.value })} /></label>
          <label>Departure airport<select value={draft.departureAirport} onChange={(event) => setDraft({ ...draft, departureAirport: event.target.value })}>{airports.map((airport) => <option key={airport}>{airport}</option>)}</select></label>
          <label>Rating<input type="number" step="0.1" value={draft.minimumRating} onChange={(event) => setDraft({ ...draft, minimumRating: Number(event.target.value) })} /></label>
          <label>Party capacity<input type="number" value={draft.partyCapacity} onChange={(event) => setDraft({ ...draft, partyCapacity: Number(event.target.value) })} /></label>
          <label className="check-row"><input type="checkbox" checked={draft.isLastMinute} onChange={(event) => setDraft({ ...draft, isLastMinute: event.target.checked })} /> Last-minute deal</label>
        </div>
        <button className="primary" onClick={() => { upsert(draft); setDraft({ ...draft, id: makeId(), title: "New Travel Budget Deal" }); }}>Save demo opportunity</button>
      </div>
      <div className="card-grid">
        {opportunities.map((opportunity) => (
          <article className="travel-card" key={opportunity.id}>
            <span className="eyebrow">{opportunity.category}</span>
            <h2>{opportunity.title}</h2>
            <InfoList items={[["Provider", opportunity.provider], ["Inventory", String(opportunity.remainingInventory)], ["Expiry", `${daysUntil(opportunity.expiryDate)} days`], ["Travel Budget price", money(opportunity.travelBudgetPrice)]]} />
            <div className="button-row">
              <button className="secondary" onClick={() => setDraft(opportunity)}>Edit</button>
              <button className="danger" onClick={() => remove(opportunity.id)}>Delete</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ProfileForm({ title, draft, setDraft, submitLabel, onSubmit }: { title: string; draft: Profile; setDraft: (profile: Profile) => void; submitLabel: string; onSubmit: () => void }) {
  function toggleInterest(interest: string) {
    setDraft({ ...draft, interests: draft.interests.includes(interest) ? draft.interests.filter((item) => item !== interest) : [...draft.interests, interest] });
  }

  function toggleExcluded(provider: string) {
    setDraft({ ...draft, excludedProviders: draft.excludedProviders.includes(provider) ? draft.excludedProviders.filter((item) => item !== provider) : [...draft.excludedProviders, provider] });
  }

  return (
    <div className="panel">
      <h2>{title}</h2>
      <div className="form-grid">
        <label>Profile name<input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></label>
        <label>Traveler type<select value={draft.travelerType} onChange={(event) => setDraft({ ...draft, travelerType: event.target.value })}>{travelerTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
        <label>Adults<input type="number" value={draft.adults} onChange={(event) => setDraft({ ...draft, adults: Number(event.target.value) })} /></label>
        <label>Children<input type="number" value={draft.children} onChange={(event) => setDraft({ ...draft, children: Number(event.target.value) })} /></label>
        <label>Preferred departure airport<select value={draft.airport} onChange={(event) => setDraft({ ...draft, airport: event.target.value })}>{airports.map((airport) => <option key={airport}>{airport}</option>)}</select></label>
        <label>Travel window<select value={draft.window} onChange={(event) => setDraft({ ...draft, window: event.target.value })}>{windows.map((window) => <option key={window}>{window}</option>)}</select></label>
        <label>Trip length<select value={draft.tripLength} onChange={(event) => setDraft({ ...draft, tripLength: event.target.value })}>{tripLengths.map((length) => <option key={length}>{length}</option>)}</select></label>
        <label>Minimum rating<input type="number" step="0.1" min="3" max="5" value={draft.minimumRating} onChange={(event) => setDraft({ ...draft, minimumRating: Number(event.target.value) })} /></label>
        <label className="wide-field">Food/spending budget preference<input value={draft.spendingPreference} onChange={(event) => setDraft({ ...draft, spendingPreference: event.target.value })} /></label>
        <label className="check-row"><input type="checkbox" checked={draft.lastMinuteAlerts} onChange={(event) => setDraft({ ...draft, lastMinuteAlerts: event.target.checked })} /> Opt into last-minute Vacation Alerts</label>
      </div>
      <span className="field-label">Interests</span>
      <div className="chip-grid">{interests.map((interest) => <button key={interest} className={draft.interests.includes(interest) ? "chip selected" : "chip"} onClick={() => toggleInterest(interest)}>{interest}</button>)}</div>
      <span className="field-label">Excluded providers</span>
      <div className="chip-grid">{providers.map((provider) => <button key={provider} className={draft.excludedProviders.includes(provider) ? "chip excluded" : "chip"} onClick={() => toggleExcluded(provider)}>{provider}</button>)}</div>
      <button className="primary" onClick={onSubmit}>{submitLabel}</button>
    </div>
  );
}

function TripCard({ trip, compact = false, saved, shared, onSave, onShare, onBook, onReferral }: { trip: RankedOpportunity; compact?: boolean; saved?: boolean; shared?: boolean; onSave?: () => void; onShare?: () => void; onBook?: () => void; onReferral?: () => void }) {
  const { opportunity } = trip;
  const label = trip.status === "afford" ? "You Can Afford This" : trip.status === "almost" ? "Almost There" : "Keep Building";
  const savings = opportunity.regularPrice - opportunity.travelBudgetPrice;
  return (
    <article className={compact ? "opportunity-card compact" : "opportunity-card"}>
      <div className="opportunity-image photo-card" style={{ backgroundImage: `linear-gradient(180deg, rgba(8, 43, 55, 0.12), rgba(8, 43, 55, 0.72)), url(${imageForTone[opportunity.imageTone] ?? travelImages.tropicalResort})` }}>
        <span className="category-badge">{opportunity.category}</span>
        <span className={`afford-badge ${trip.status}`}>{label}</span>
      </div>
      <div className="opportunity-body">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">{opportunity.destination}</span>
            <h2>{opportunity.title}</h2>
            <p>{opportunity.description}</p>
          </div>
          <strong>{money(opportunity.travelBudgetPrice)}</strong>
        </div>
        {!compact && (
          <>
            <InfoList items={[["Provider", opportunity.provider], ["Travel dates", opportunity.travelDates], ["Airport", opportunity.departureAirport], ["Capacity", `${opportunity.partyCapacity} travelers`], ["Rating", `${opportunity.minimumRating}+`], ["Inventory", `${opportunity.remainingInventory} remaining`], ["Expires", `${daysUntil(opportunity.expiryDate)} days`], ["Regular price", money(opportunity.regularPrice)], ["Travel Budget price", money(opportunity.travelBudgetPrice)]]} />
            <div className="deal-strip">
              <span>Save {money(savings)}</span>
              <span>{trip.status === "almost" ? "Within $500 of this trip" : `${money(opportunity.estimatedTotalCost)} estimated total`}</span>
            </div>
            <div className="included-list">{opportunity.included.map((item) => <span key={item}>{item}</span>)}</div>
            <p className="match-reason">Why this matches you: {trip.reasons.join(", ")}.</p>
            <div className="button-row">
              <button className="secondary" onClick={onSave}>{saved ? "Saved" : "Save trip"}</button>
              <button className="secondary" onClick={onShare}>{shared ? "Shared" : "Share trip"}</button>
              <button className="secondary" onClick={onReferral}>Friend booked this trip</button>
              <button className="primary" disabled={trip.status !== "afford"} onClick={onBook}>Use Travel Balance</button>
            </div>
          </>
        )}
      </div>
    </article>
  );
}

function MiniTrip({ trip, balance }: { trip: RankedOpportunity; balance: number }) {
  const away = Math.max(0, trip.opportunity.estimatedTotalCost - balance);
  return (
    <div className="mini-trip">
      <img src={imageForTone[trip.opportunity.imageTone] ?? travelImages.tropicalResort} alt="" />
      <div>
        <strong>{trip.opportunity.title}</strong>
        <span>{money(away)} away from this trip</span>
      </div>
    </div>
  );
}

function Hero({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <header className="page-header scenic-sky">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{text}</p>
      </div>
    </header>
  );
}

function SectionTitle({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <header className="section-title">
      <span className="eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      <p>{text}</p>
    </header>
  );
}

function PanelHead({ eyebrow, title, action, onClick }: { eyebrow: string; title: string; action?: string; onClick?: () => void }) {
  return (
    <div className="panel-heading">
      <div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2></div>
      {action && <button className="text-button" onClick={onClick}>{action}</button>}
    </div>
  );
}

function Metric({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return <div className="metric-card"><span className="eyebrow">{label}</span><strong>{value}</strong>{detail && <small>{detail}</small>}</div>;
}

function Progress({ value }: { value: number }) {
  return <div className="progress-track" aria-label={`Progress ${value}%`}><span style={{ width: `${value}%` }} /></div>;
}

function InfoList({ items }: { items: Array<[string, string]> }) {
  return <dl className="details-grid">{items.map(([term, detail]) => <div key={term}><dt>{term}</dt><dd>{detail}</dd></div>)}</dl>;
}

function EmptyState({ title, text, action, onClick }: { title: string; text: string; action?: string; onClick?: () => void }) {
  return (
    <div className="empty-state">
      <strong>{title}</strong>
      <p>{text}</p>
      {action && <button className="secondary" onClick={onClick}>{action}</button>}
    </div>
  );
}

function Ledger({ items }: { items: Array<{ id: string; date: string; label: string; amount: number; type?: string }> }) {
  return (
    <div className="activity-list">
      {items.map((item) => (
        <div className="activity-item" key={item.id}>
          <div><strong>{item.label}</strong><span>{item.date}</span></div>
          <em className={item.amount < 0 ? "negative" : ""}>{item.amount < 0 ? "-" : "+"}{money(Math.abs(item.amount))}</em>
        </div>
      ))}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
