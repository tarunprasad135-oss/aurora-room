// Aurora AI Service
// - extractDeadlineFromImage: mock vision scan (demo)
// - generateStudyQuiz: live study content from real task name/course
// Ready to swap generateStudyQuiz to OpenAI/Gemini later

let scanCount = 0;

export async function extractDeadlineFromImage(imageUri) {
  await new Promise((resolve) => setTimeout(resolve, 2500));

  scanCount += 1;

  let daysAway = 2;
  if (scanCount === 2) daysAway = 1;
  if (scanCount >= 3) daysAway = 0;

  const deadline = new Date();
  deadline.setDate(deadline.getDate() + daysAway);
  deadline.setHours(23, 59, 0, 0);

  const mockNames = [
    'Midterm Essay',
    'Problem Set 4',
    'Group Project Draft',
    'Lab Report',
    'Reading Response',
  ];
  const mockCourses = [
    'ENG 201',
    'CS 101',
    'PSYCH 210',
    'BIO 150',
    'HIST 120',
  ];

  const idx = (scanCount - 1) % mockNames.length;

  return {
    success: true,
    data: {
      name: mockNames[idx],
      course: mockCourses[idx],
      deadline: deadline.toISOString(),
      priority: 'high',
      confidence: 'high',
    },
  };
}

function detectSubject(name = '', course = '') {
  const text = `${name} ${course}`.toLowerCase();

  if (/(cs|computer|code|java|python|algorithm|data structure|programming)/.test(text)) return 'cs';
  if (/(math|calc|algebra|statistics|stat|geometry|linear)/.test(text)) return 'math';
  if (/(bio|biology|cell|genetics|anatomy|physiology)/.test(text)) return 'bio';
  if (/(chem|chemistry|organic|molecule|reaction)/.test(text)) return 'chem';
  if (/(phys|physics|mechanics|electric|force|motion)/.test(text)) return 'physics';
  if (/(psych|psychology|behavior|cognition|memory)/.test(text)) return 'psych';
  if (/(hist|history|war|empire|revolution)/.test(text)) return 'history';
  if (/(eng|english|essay|literature|writing|rhetoric)/.test(text)) return 'english';
  if (/(econ|economics|market|supply|demand|macro|micro)/.test(text)) return 'econ';
  if (/(business|marketing|management|finance|accounting)/.test(text)) return 'business';
  return 'general';
}

function buildQuizPayload({ name, course, subject }) {
  const title = name || 'Assignment';
  const subjectLabel = course || title;

  const bank = {
    cs: {
      concepts: [
        `Break "${title}" into inputs → process → outputs before coding.`,
        `Know time/space complexity for the core approach used in ${subjectLabel}.`,
        `Memorize edge cases (empty input, duplicates, overflow) — exams love these.`,
      ],
      cards: [
        {
          q: `For "${title}", what is the first thing you should clarify before solving?`,
          a: `Constraints + expected input/output format. Then write a 3-step plan before code.`,
        },
        {
          q: `What complexity should you aim to explain for ${subjectLabel}?`,
          a: `State Big-O for time and memory, and justify why that approach beats a naive solution.`,
        },
        {
          q: `Give one exam-style edge case for this topic.`,
          a: `Empty list / single element / already sorted / maximum constraint size.`,
        },
      ],
    },
    math: {
      concepts: [
        `Write the formula first, then substitute values for "${title}".`,
        `Show every algebra step — partial credit is common in ${subjectLabel}.`,
        `Check units/domain (undefined values, divide-by-zero, extraneous roots).`,
      ],
      cards: [
        {
          q: `What is the first line you should write on an exam for "${title}"?`,
          a: `The governing formula/identity, then known variables, then unknown target.`,
        },
        {
          q: `How do you verify your final answer quickly?`,
          a: `Plug result back into the original equation or estimate magnitude for sanity check.`,
        },
        {
          q: `Name one common trap in ${subjectLabel}.`,
          a: `Sign errors, forgetting domain restrictions, or skipping unit conversion.`,
        },
      ],
    },
    bio: {
      concepts: [
        `Define the core process in "${title}" in one sentence.`,
        `Link structure → function for each key term in ${subjectLabel}.`,
        `Know cause/effect pathways professors test with “what happens if…”.`,
      ],
      cards: [
        {
          q: `Explain "${title}" in one plain sentence.`,
          a: `State the biological process, where it occurs, and why it matters for the organism.`,
        },
        {
          q: `What comparison should you memorize for ${subjectLabel}?`,
          a: `Similar processes side-by-side (e.g., mitosis vs meiosis, photosynthesis vs respiration).`,
        },
        {
          q: `Give one high-yield “if X fails, then Y” question.`,
          a: `If a key enzyme/pathway step is blocked, identify the immediate downstream effect.`,
        },
      ],
    },
    chem: {
      concepts: [
        `Balance the reaction and identify limiting reagent for "${title}".`,
        `Track units carefully (mol, M, g, L) in ${subjectLabel}.`,
        `Know whether the step is stoichiometric, equilibrium, or kinetics focused.`,
      ],
      cards: [
        {
          q: `What should you convert to first in "${title}" problems?`,
          a: `Convert everything to moles, then apply mole ratios from the balanced equation.`,
        },
        {
          q: `How do you spot the limiting reagent?`,
          a: `Compare available moles to required stoichiometric ratio; smallest ratio is limiting.`,
        },
        {
          q: `Name one exam trap in ${subjectLabel}.`,
          a: `Using grams directly in ratios instead of moles, or forgetting significant figures/units.`,
        },
      ],
    },
    physics: {
      concepts: [
        `Draw a free-body / system diagram before equations for "${title}".`,
        `List knowns, unknowns, and the governing law (Newton, energy, Kirchhoff, etc.).`,
        `Keep vectors and signs consistent in ${subjectLabel}.`,
      ],
      cards: [
        {
          q: `First step on an exam problem like "${title}"?`,
          a: `Sketch the system, mark forces/fields/directions, then choose the right principle.`,
        },
        {
          q: `What check confirms your physics answer?`,
          a: `Dimensional analysis + extreme-case check (if mass→0 or force→0, does result make sense?).`,
        },
        {
          q: `Common mistake in ${subjectLabel}?`,
          a: `Mixing scalar/vector quantities or using the wrong sign convention.`,
        },
      ],
    },
    psych: {
      concepts: [
        `Define the theory/term in "${title}" and give one real-life example.`,
        `Compare similar theories (what’s same vs different) for ${subjectLabel}.`,
        `Know classic experiments and what they concluded.`,
      ],
      cards: [
        {
          q: `Define the core idea of "${title}" in one sentence.`,
          a: `Give a crisp definition + one everyday example a grader can mark quickly.`,
        },
        {
          q: `What comparison question is likely in ${subjectLabel}?`,
          a: `Contrast two related concepts and state one unique prediction of each.`,
        },
        {
          q: `How should you answer application questions?`,
          a: `Identify the concept, map it onto the scenario, then justify with one mechanism.`,
        },
      ],
    },
    history: {
      concepts: [
        `For "${title}", memorize cause → event → consequence chain.`,
        `Know 2 key figures and 1 primary turning point in ${subjectLabel}.`,
        `Prepare a thesis + 3 supporting evidence points for essay prompts.`,
      ],
      cards: [
        {
          q: `What caused the main event in "${title}"?`,
          a: `State short-term trigger + long-term structural cause in one clear chain.`,
        },
        {
          q: `Name one consequence examiners expect for ${subjectLabel}.`,
          a: `Political, social, or economic impact with a specific example/date.`,
        },
        {
          q: `How do you structure a short history essay answer?`,
          a: `Thesis → 3 evidence points chronologically → one-sentence significance close.`,
        },
      ],
    },
    english: {
      concepts: [
        `Claim + evidence + analysis is the core loop for "${title}".`,
        `Identify literary devices / rhetorical strategies used in ${subjectLabel}.`,
        `End body paragraphs with “so what?” significance.`,
      ],
      cards: [
        {
          q: `What is a strong thesis formula for "${title}"?`,
          a: `Specific claim + how the text supports it + why it matters (not just plot summary).`,
        },
        {
          q: `How should each body paragraph start?`,
          a: `Topic sentence with one arguable point, then quote/evidence, then analysis.`,
        },
        {
          q: `What do graders penalize most in ${subjectLabel}?`,
          a: `Summary without analysis, vague claims, and quotes dropped without explanation.`,
        },
      ],
    },
    econ: {
      concepts: [
        `Define the model and assumptions behind "${title}".`,
        `Shift vs movement along curves is a classic trap in ${subjectLabel}.`,
        `Link graph intuition to real policy outcomes.`,
      ],
      cards: [
        {
          q: `In "${title}", what changes quantity demanded vs demand itself?`,
          a: `Price changes quantity demanded; non-price factors shift the whole demand curve.`,
        },
        {
          q: `What should you label on every graph?`,
          a: `Axes, curves, equilibrium points, and direction of any shift.`,
        },
        {
          q: `Give one policy application for ${subjectLabel}.`,
          a: `Explain who gains/loses after tax, subsidy, price ceiling, or interest-rate change.`,
        },
      ],
    },
    business: {
      concepts: [
        `Frame "${title}" as problem → options → recommendation.`,
        `Use one framework (SWOT, 4Ps, unit economics) for ${subjectLabel}.`,
        `Always state risks + metrics for success.`,
      ],
      cards: [
        {
          q: `What is the decision question in "${title}"?`,
          a: `State the business goal, constraint, and the choice that must be made.`,
        },
        {
          q: `Which metrics prove your recommendation works?`,
          a: `Pick 2–3 KPIs (revenue, margin, CAC, retention, conversion) and target direction.`,
        },
        {
          q: `What risk must you mention in ${subjectLabel}?`,
          a: `One execution risk + one market risk, with a mitigation for each.`,
        },
      ],
    },
    general: {
      concepts: [
        `Clarify the goal of "${title}" in one sentence before deep study.`,
        `Split the assignment into research → draft/practice → review phases.`,
        `Make a 3-point cheat sheet of must-know facts for ${subjectLabel}.`,
      ],
      cards: [
        {
          q: `What is the single outcome "${title}" expects?`,
          a: `Define the deliverable (essay, problem set, lab, presentation) and success criteria.`,
        },
        {
          q: `What should you practice under timed conditions?`,
          a: `One past-style question or mini-section at exam pace, then mark mistakes.`,
        },
        {
          q: `What goes on your final 1-page summary for ${subjectLabel}?`,
          a: `Top formulas/definitions, 3 likely questions, and 3 common mistakes to avoid.`,
        },
      ],
    },
  };

  const chosen = bank[subject] || bank.general;

  return {
    success: true,
    data: {
      title: `Study Guide: ${title}`,
      subject,
      course: course || null,
      concepts: chosen.concepts,
      cards: chosen.cards,
      source: 'live-task-engine',
    },
  };
}

/**
 * LIVE quiz generator from real task fields.
 * Uses assignment name + course to personalize content.
 */
export async function generateStudyQuiz({ name, course } = {}) {
  // small delay so UI feels like generation
  await new Promise((resolve) => setTimeout(resolve, 1100));

  try {
    const cleanName = (name || '').trim() || 'Untitled Assignment';
    const cleanCourse = (course || '').trim();
    const subject = detectSubject(cleanName, cleanCourse);

    return buildQuizPayload({
      name: cleanName,
      course: cleanCourse,
      subject,
    });
  } catch (e) {
    return {
      success: false,
      error: 'Could not generate quiz. Please try again.',
    };
  }
}

/**
 * Optional future hook:
 * Replace generateStudyQuiz body with OpenAI/Gemini call
 * and keep this same return shape:
 * { success, data: { title, concepts: string[], cards: [{q,a}] } }
 */