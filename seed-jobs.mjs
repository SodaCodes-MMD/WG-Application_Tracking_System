/**
 * Seed sample jobs for testing.
 * Usage: node seed-jobs.mjs <email> <password>
 * Example: node seed-jobs.mjs test@example.com mypassword
 */

const API = "http://localhost:5000/api";
const [email, password] = process.argv.slice(2);

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

if (!email || !password) {
  console.error("Usage: node seed-jobs.mjs <email> <password>");
  process.exit(1);
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
    outcome: "Accepted",
    outcomeNotes: "Strong offer, good team match.",
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
    notes: "Got to final round. Feedback: needed more distributed systems experience.",
    appliedAt: daysAgo(30),
    outcome: "Rejected",
    outcomeNotes: "Focus on distributed systems prep for next time.",
  },
  {
    company: "Cloudflare",
    title: "DevOps Engineer",
    status: "Withdrawn",
    location: "Remote",
    salary: "130k-160k/yr",
    notes: "Withdrew after receiving Amazon offer.",
    appliedAt: daysAgo(25),
    outcome: "Withdrawn",
    outcomeNotes: "Accepted another offer.",
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
