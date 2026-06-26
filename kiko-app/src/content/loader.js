const modules = import.meta.glob('./lessons/*.json', { eager: true });

function getStage(lesson) {
  if (lesson.stage != null) return lesson.stage;
  const id = String(lesson.id);
  if (id.toLowerCase().startsWith('ms')) return parseInt(id.slice(2)) || 1;
  return parseInt(id.split('.')[0]) || 1;
}

function getLessonNum(lesson) {
  if (lesson.lesson != null) return lesson.lesson;
  if (lesson.order  != null) return lesson.order;
  const id = String(lesson.id);
  return parseInt(id.split('.')[1]) || 0;
}

const allLessons = Object.values(modules)
  .map(m => m.default)
  .sort((a, b) => {
    const stageA = getStage(a), stageB = getStage(b);
    if (stageA !== stageB) return stageA - stageB;
    const isMastA = a.type === 'mastery' ? 1 : 0;
    const isMastB = b.type === 'mastery' ? 1 : 0;
    if (isMastA !== isMastB) return isMastA - isMastB;
    return getLessonNum(a) - getLessonNum(b);
  });

const bySubject = {};
for (const lesson of allLessons) {
  const s = lesson.subject;
  if (!bySubject[s]) bySubject[s] = [];
  bySubject[s].push(lesson);
}

const X_ZIG = [218, 110, 260, 130, 256, 168, 218, 110, 260, 130, 256, 168];

// Fixed 82px step — never compresses regardless of lesson count
const NODE_STEP    = 82;
const NODE_PADDING = 54;

function generateNodes(lessons) {
  const n     = lessons.length;
  const svgH  = n > 1 ? NODE_PADDING + (n - 1) * NODE_STEP + NODE_PADDING : NODE_PADDING * 2;

  return lessons.map((l, i) => ({
    id:   `n${i + 1}`,
    key:  l.id,
    type: l.type === 'mastery' ? 'milestone' : 'lesson',
    cx:   X_ZIG[i % X_ZIG.length],
    cy:   svgH - NODE_PADDING - i * NODE_STEP,  // bottom = first lesson, top = last
  }));
}

function buildSubject(subject) {
  const lessons = bySubject[subject] || [];
  const n       = lessons.length;
  const svgH    = n > 1 ? NODE_PADDING + (n - 1) * NODE_STEP + NODE_PADDING : NODE_PADDING * 2;
  const map = {}, seq = [];
  let mastery = null;

  for (const l of lessons) {
    map[l.id] = l;
    seq.push(l.id);
    if (l.type === 'mastery') mastery = l;
  }

  return { lessons: map, seq, nodes: generateNodes(lessons), mastery, svgH };
}

export const MATH    = buildSubject('math');
export const ENGLISH = buildSubject('english');
export const SCIENCE = buildSubject('science');
export const getSubject = (name) => buildSubject(name);
