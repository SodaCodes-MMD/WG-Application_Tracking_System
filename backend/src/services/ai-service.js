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
  const phone = profile.phone || "";
  const location = profile.location || "";
  const summary = profile.summary || "";

  const experienceList = profile.experience?.map(exp =>
    `${exp.jobTitle} at ${exp.company}${exp.location ? ` (${exp.location})` : ""}${exp.description ? `: ${exp.description}` : ""}`
  ).join("\n") || "No experience listed";

  const skillsList = profile.skills?.map(s => s.name).join(", ") || "No skills listed";

  return `You are a professional cover letter writer and HTML/CSS expert. Generate a complete, self-contained HTML cover letter document.

TARGET ROLE: ${job.title} at ${job.company}

CANDIDATE DATA:
Name: ${fullName}
Phone: ${phone}
Location: ${location}
Summary: ${summary}
Experience: ${experienceList}
Skills: ${skillsList}

OUTPUT RULES:
- Output ONLY a complete HTML document starting with <!DOCTYPE html> and ending with </html>.
- No markdown, no code fences, no explanation — raw HTML only.
- All styles must be inline or in a <style> tag in <head> (self-contained, no external CSS).
- Use this exact visual design to match the resume style:
  * White background (#fff), max-width 800px, margin: auto, padding: 40px, font-family: Georgia, serif
  * Header: candidate name in large bold dark text (#1a1a2e), contact line below (phone | location) in small grey (#555), centered
  * A thin horizontal rule (#2c3e7a) after the header
  * Date, recipient block, and salutation in 13px #222, line-height 1.6
  * Body paragraphs: 13px, line-height 1.8, color #222, margin between paragraphs
  * Closing and signature in the same style
  * Overall clean, professional, letter-style layout
- Write 3 strong body paragraphs tailored to ${job.title} at ${job.company}.
- Use the candidate's real name in the salutation close — not a placeholder.
- CRITICAL: Complete the letter fully with a proper sign-off and the candidate's full name. Do not stop mid-sentence.

Generate the complete HTML cover letter now.`;
}

export async function generateResumeDraft(profile, job) {
  const prompt = buildResumeDraftPrompt(profile, job);
  return await callGemini(prompt);
}

function fmtMonth(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return isNaN(d) ? "" : d.toLocaleString("en-US", { month: "short", year: "numeric" });
}

function buildResumeDraftPrompt(profile, job) {
  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(" ") || "Candidate";
  const headline = profile.headline || job.title || "";
  const summary = profile.summary || "";
  const phone = profile.phone || "";
  const location = profile.location || "";

  const experienceData = (profile.experience || []).map(exp => ({
    title: exp.jobTitle || "",
    company: exp.company || "",
    location: exp.location || "",
    start: fmtMonth(exp.startDate),
    end: exp.isCurrent ? "Present" : fmtMonth(exp.endDate),
    description: exp.description || "",
    bullets: exp.accomplishments || [],
  }));

  const educationData = (profile.education || []).map(edu => ({
    degree: `${edu.degree} in ${edu.fieldOfStudy}`,
    institution: edu.institution || "",
    year: edu.endDate ? new Date(edu.endDate).getFullYear() : "Present",
    gpa: edu.gpa || null,
  }));

  const skillsByCategory = {};
  (profile.skills || []).forEach(s => {
    const cat = s.category || "General";
    if (!skillsByCategory[cat]) skillsByCategory[cat] = [];
    skillsByCategory[cat].push(s.name);
  });

  return `You are a professional resume writer and HTML/CSS expert. Generate a complete, self-contained HTML resume document.

TARGET ROLE: ${job.title} at ${job.company}

CANDIDATE DATA:
Name: ${fullName}
Headline: ${headline}
Phone: ${phone}
Location: ${location}
Summary: ${summary}

EXPERIENCE:
${JSON.stringify(experienceData, null, 2)}

EDUCATION:
${JSON.stringify(educationData, null, 2)}

SKILLS BY CATEGORY:
${JSON.stringify(skillsByCategory, null, 2)}

OUTPUT RULES:
- Output ONLY a complete HTML document starting with <!DOCTYPE html> and ending with </html>.
- No markdown, no code fences, no explanation — raw HTML only.
- All styles must be inline or in a <style> tag in <head> (self-contained, no external CSS).
- Use this visual design:
  * White background (#fff), max-width 800px, margin: auto, padding: 40px, font-family: Georgia, serif
  * Header: candidate name in large bold dark text (#1a1a2e), headline in muted grey below
  * Contact line: phone | location — small, centered, grey (#555)
  * A thin horizontal rule (#2c3e7a) after the header
  * Section headings: uppercase, letter-spacing: 2px, color #2c3e7a, font-size 11px, border-bottom: 1px solid #2c3e7a, margin-top 24px
  * Experience entries: job title bold, company in italic, date range right-aligned in grey
  * Bullet points: tight, clean, using • character (not <ul>), left-padded, font-size 13px
  * Education: degree bold, institution italic, year right-aligned
  * Skills: category label bold, skills listed inline separated by commas
  * Overall font-size: 13px, line-height: 1.5, color: #222
- Tailor the summary and bullet points to highlight relevance for ${job.title} at ${job.company}.
- Use strong action verbs and quantify achievements where possible.
- Keep it clean — one page equivalent of content.

Generate the complete HTML document now.`;
}

export async function rewriteDocumentContent(content, docType, instruction) {
  const prompt = buildRewritePrompt(content, docType, instruction);
  return await callGemini(prompt);
}

function buildRewritePrompt(content, docType, instruction) {
  const isHtml = content.trimStart().startsWith("<");
  const focus = instruction?.trim() || "Improve the overall quality, clarity, and impact";

  return `You are an expert ${docType} writer. Rewrite and improve the following ${docType} content.

INSTRUCTION: ${focus}

ORIGINAL CONTENT:
${content}

OUTPUT RULES:
- Return ONLY the rewritten content — no commentary, no explanation, no preamble.
- Preserve the exact same format as the input (${isHtml ? "HTML with the same structure and inline styles" : "plain text"}).
- ${isHtml ? "Keep all HTML tags and CSS styles intact. Only change the text content inside the tags." : "Keep the same sections and structure."}
- Make it more impactful, professional, and compelling.
- Do not add or remove major sections.`;
}

export async function generateTailoredResumeBullet(bullet, jobDescription) {
  const prompt = `Rewrite this resume bullet to match the job description: "${bullet}"
Job: ${jobDescription}
Rewrite to be more impactful with action verbs and quantifiable achievements.`;
  return await callGemini(prompt);
}

export async function generateCompanyResearch(job, userContext) {
  const contextSection = userContext?.trim()
    ? `\nADDITIONAL CONTEXT FROM APPLICANT:\n${userContext.trim()}`
    : "";

  const prompt = `You are a career coach helping a job applicant research a company before an interview or application.

COMPANY: ${job.company}
ROLE: ${job.title}${job.location ? `\nLOCATION: ${job.location}` : ""}${contextSection}

Provide a structured company research summary with the following sections. Use markdown formatting with ## headings:

## Company Overview
Brief summary of what the company does, its mission, and industry position.

## Culture & Values
Key cultural traits, stated values, and what it's like to work there based on general knowledge.

## The Role
What this type of role typically involves at this kind of company, key skills valued, and growth opportunities.

## Interview Tips
2-3 specific tips for interviewing for ${job.title} at ${job.company}, including likely question themes and how to stand out.

## Questions to Ask
3 thoughtful questions the applicant could ask the interviewer.

Keep each section concise and actionable. If you don't have specific knowledge about this company, provide relevant general insights for this type of company and role.`;

  return await callGemini(prompt);
}
