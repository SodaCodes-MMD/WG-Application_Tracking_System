cat > ~/Desktop/CS490/seed-jobs.mjs << 'EOF'
/**
 * Seed sample jobs for testing.
 * Usage: node seed-jobs.mjs <email> <password>
 */
const API = "http://localhost:5000/api";
const [email, password] = process.argv.slice(2);

if (!email || !password) {
  console.error("Usage: node seed-jobs.mjs <email> <password>");
  process.exit(1);
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString();
}

const JOBS = [
  {
    company: "Google",
    title: "Software Engineer",
    status: "Interview",
    location: "New York, NY",
    url: "https://careers.google.com",
    salary: "160k-200k/yr",
    notes: "Referred by a friend on the team. Strong fit for the role.",
    appliedAt: daysAgo(14),
    deadline: daysFromNow(5),
    recruiterNotes: "Spoke with Sarah Chen, very positive conversation",
  },
  {
    company: "Meta",
    title: "Backend Developer",
    status: "Applied",
    location: "Remote",
    url: "https://metacareers.com",
    salary: "150k-190k/yr",
    notes: "Applied via referral portal.",
    appliedAt: daysAgo(7),
  },
  {
    company: "Amazon",
    title: "Full Stack Engineer",
    status: "Offer",
    location: "Seattle, WA",
    salary: "155k-195k/yr",
    notes: "Offer received, evaluating compensation package.",
    appliedAt: daysAgo(20),
  },
  {
    company: "Netflix",
    title: "Frontend Developer",
    status: "Applied",
    location: "Los Angeles, CA",
    salary: "170k-210k/yr",
    notes: "Dream company. Tailored resume specifically for this role.",
    appliedAt: daysAgo(5),
    deadline: daysFromNow(3),
  },
  {
    company: "Microsoft",
    title: "Software Engineer",
    status: "Wishlist",
    location: "Remote",
    notes: "Need to update portfolio before applying.",
  },
  {
    company: "Stripe",
    title: "Backend Engineer",
    status: "Rejected",
    location: "Remote",
    salary: "140k-180k/yr",
    notes: "Got to final round. Needed more distributed systems experience.",
    appliedAt: daysAgo(30),
  },
  {
    company: "Cloudflare",
    title: "DevOps Engineer",
    status: "Withdrawn",
    location: "Remote",
    salary: "130k-160k/yr",
    notes: "Withdrew after receiving Amazon offer.",
    appliedAt: daysAgo(25),
  },
  {
    company: "Apple",
    title: "Mobile Developer",
    status: "Interview",
    location: "Cupertino, CA",
    salary: "165k-205k/yr",
    notes: "Second round scheduled. Preparing for system design.",
    appliedAt: daysAgo(10),
    deadline: daysFromNow(3),
  },
];

async function main() {
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

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

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

main().catch(err => {
  console.error(err);
  process.exit(1);
});
EOF
