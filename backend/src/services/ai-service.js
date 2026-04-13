import dotenv from "dotenv";
dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "AIzaSyA918Z60JcstVGSijDcbw9LHU-cKy7dl6s";

async function callGemini(prompt, model = "gemini-2.5-flash", retries = 3) {
  const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    console.log("=== CALLING GEMINI API (attempt " + attempt + ") ===");
    console.log("Model:", model);
    console.log("API Key present:", !!GEMINI_API_KEY);
    
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8192,
          },
        }),
      });

      const data = await response.json();
      console.log("Gemini response status:", response.status);
      
      if (!response.ok) {
        if (response.status === 503 && attempt < retries) {
          console.log("Gemini busy, retrying in 2 seconds...");
          await new Promise(r => setTimeout(r, 2000));
          continue;
        }
        throw new Error(`Gemini API error: ${response.status} - ${JSON.stringify(data)}`);
      }

      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error("Invalid Gemini response: no candidates");
      }

      return data.candidates[0].content.parts[0].text;
    } catch (err) {
      console.error("callGemini error:", err.message);
      if (attempt === retries) throw err;
    }
  }
}

export async function generateCoverLetterDraft(profile, job) {
  const prompt = buildCoverLetterPrompt(profile, job);
  return await callGemini(prompt);
}

function buildCoverLetterPrompt(profile, job) {
  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(" ") || "[Your Name]";
  const headline = profile.headline || "";
  const summary = profile.summary || "";
  
  const experienceList = profile.experience?.map(exp => {
    return `${exp.jobTitle} at ${exp.company}${exp.location ? ` (${exp.location})` : ""}${exp.description ? `\n${exp.description}` : ""}`;
  }).join("\n\n") || "No experience listed";

  const educationList = profile.education?.map(edu => {
    return `${edu.degree} in ${edu.fieldOfStudy} from ${edu.institution}`;
  }).join("\n\n") || "No education listed";

  const skillsList = profile.skills?.map(s => s.name).join(", ") || "No skills listed";

  return `Write a professional cover letter for a candidate applying for the position of ${job.title} at ${job.company}.

CANDIDATE PROFILE:
Name: ${fullName}
Headline: ${headline}
Summary: ${summary}

EXPERIENCE:
${experienceList}

EDUCATION:
${educationList}

SKILLS:
${skillsList}

Write a 3-paragraph cover letter that highlights relevant experience and skills. Use a professional tone.
CRITICAL: Ensure the cover letter is fully completed. Do not stop mid-sentence or mid-paragraph. Always conclude with a professional sign-off and the candidate's name.`;
}

export async function generateTailoredResumeBullet(bullet, jobDescription) {
  const prompt = `Rewrite this resume bullet to match the job description: "${bullet}"
Job: ${jobDescription}
Rewrite to be more impactful with action verbs and quantifiable achievements.`;
  return await callGemini(prompt);
}
