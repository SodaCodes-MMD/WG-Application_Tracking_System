/**
 * Seed sample jobs for testing.
 * Usage: node seed-jobs.mjs <email> <password>
 * Example: node seed-jobs.mjs test@example.com mypassword
 */

const API = "http://localhost:5000/api";
const [email, password] = process.argv.slice(2);

if (!email || !password) {
  console.error("Usage: node seed-jobs.mjs <email> <password>");
  process.exit(1);
}

const JOBS = [
  {
    company: "Stripe",
    title: "Software Engineer, Payments",
    status: "Applied",
    location: "Remote",
    url: "https://stripe.com/jobs",
    salary: "140k–180k/yr",
    notes: "Found via LinkedIn. Strong culture, good comp range.",
    appliedAt: daysAgo(10),
  },
  {
    company: "Vercel",
    title: "Frontend Engineer",
    status: "Phone Screen",
    location: "Remote",
    salary: "130k–160k/yr",
    notes: "Recruiter reached out. 30-min intro call scheduled.",
    appliedAt: daysAgo(7),
  },
  {
    company: "Linear",
    title: "Full Stack Engineer",
    status: "Interview",
    location: "San Francisco, CA",
    salary: "150k–190k/yr",
    notes: "Two rounds done. Final loop with eng team next week.",
    appliedAt: daysAgo(14),
  },
  {
    company: "Notion",
    title: "Product Engineer",
    status: "Offer",
    location: "New York, NY",
    salary: "160k–200k/yr",
    notes: "Offer received! Deadline to respond is in 5 days.",
    appliedAt: daysAgo(20),
  },
  {
    company: "Figma",
    title: "Senior Frontend Engineer",
    status: "Rejected",
    location: "Remote",
    salary: "170k–210k/yr",
    notes: "Got to final round but no offer. Feedback: needed more systems design experience.",
    appliedAt: daysAgo(30),
    outcome: "Rejected",
    outcomeNotes: "Rejected after final round. Focus on systems design prep.",
  },
  {
    company: "Shopify",
    title: "Backend Developer",
    status: "Wishlist",
    location: "Remote",
    notes: "Interesting role, need to tailor resume before applying.",
  },
  {
    company: "PlanetScale",
    title: "Developer Advocate",
    status: "Withdrawn",
    location: "Remote",
    salary: "120k–140k/yr",
    notes: "Withdrew after receiving Notion offer.",
    appliedAt: daysAgo(18),
    outcome: "Withdrawn",
    outcomeNotes: "Accepted another offer.",
  },
];

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

async function main() {
  // Login
  console.log(`Logging in as ${email}...`);
  const loginRes = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const loginData = await loginRes.json();
  if (!loginRes.ok) {
    console.error("Login failed:", loginData.error?.message || "Unknown error");
    process.exit(1);
  }
  const token = loginData.data?.token;
  console.log("Logged in.\n");

  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  // Create jobs
  let created = 0;
  for (const job of JOBS) {
    const res = await fetch(`${API}/jobs`, {
      method: "POST",
      headers,
      body: JSON.stringify(job),
    });
    const data = await res.json();
    if (res.ok) {
      console.log(`✓  ${job.company} — ${job.title} [${job.status}]`);
      created++;
    } else {
      console.error(`✗  ${job.company}: ${data.error?.message || "Failed"}`);
    }
  }

  console.log(`\nDone — ${created}/${JOBS.length} jobs created.`);
}

main().catch(err => { console.error(err); process.exit(1); });
