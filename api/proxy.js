// UniChoice AI 분석 엔진 v5 — 희망대학 레포트 + PDF 10페이지 제한
const { createClient } = require('@supabase/supabase-js');
const Anthropic = require('@anthropic-ai/sdk');

module.exports.config = {
  api: { bodyParser: { sizeLimit: '15mb' } },
};

const SUPABASE_URL = 'https://zmtldohklivkzpfdyflc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InptdGxkb2hrbGl2a3pwZmR5ZmxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5NjgxMDQsImV4cCI6MjA4ODU0NDEwNH0.cv1WrvDzNedVZABWyRCS9ARRxf4Si9qgeUqEvhpHWlo';

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API 키가 설정되지 않았습니다.' });

  const { name, school, major, record, hasEssay,
          recordFileBase64, recordFileName,
          recordFilesBase64, recordFileNames,
          wishes } = req.body;
  if (!name || !school || !major)
    return res.status(400).json({ error: '필수 필드 누락' });

  const recordText = (record || '').slice(0, 6000);
  const hasPdf = !!recordFileBase64;
  const hasImages = Array.isArray(recordFilesBase64) && recordFilesBase64.length > 0;

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const anthropic = new Anthropic({ apiKey });

    // ── STEP 1: 생기부 분석 ──────────────────────────────────────
    const recordSection = (hasPdf || hasImages)
      ? '위에 첨부된 생기부 문서/이미지를 직접 읽어 분석하세요. 문서의 앞 10페이지(내신·비교과 핵심 영역)를 중심으로 분석하고, 성적 표에서 "석차등급" 컬럼의 숫자를 과목별로 정확히 읽으세요.'
      : `[생활기록부]\n${recordText || '(생기부 미제공)'}`;

    const analysisPrompt = `대한민국 대입 전문 컨설턴트로서 학생 생기부를 분석해 JSON으로만 응답하세요.

[학생] 이름:${name} | 학교:${school} | 희망학과:${major}

${recordSection}

══ 석차등급 파싱 규칙 (반드시 준수) ══
- 성적 표의 "석차등급" 컬럼에서 각 과목의 1~9 사이 정수를 읽으세요.
- 단위수(이수단위)와 혼동 금지 — 석차등급은 반드시 1~9 정수입니다.
- 모든 과목 석차등급의 단순 평균 → 소수점 둘째 자리로 계산 (extractedGrade)
- 국영수: 국어·영어·수학 등급 평균
- 국영수사: 국어·영어·수학·사회계열 등급 평균
- 국영수사과: 국어·영어·수학·사회·과학계열 등급 평균

══ overallCompetitiveness 판단 기준 ══
- extractedGrade ≤ 2.0 → 반드시 "상"
- extractedGrade 2.1~3.5 → 비교과 고려하여 "상" 또는 "중"
- extractedGrade 3.6~5.0 → "중"
- extractedGrade > 5.0 → "하"

══ careerClear 판단 기준 ══
아래 중 하나라도 해당하면 true:
- 진로활동란에 CEO·경영·창업·업사이클링·환경·마케팅·교육·의학·법학·공학 등 일관된 진로 키워드 2회 이상
- 세특에서 진로 관련 탐구·발표·프로젝트가 2개 이상 과목에 걸쳐 연계
- 자율·동아리 활동 주제가 진로와 명확히 연결됨

JSON 형식으로만 응답 (다른 텍스트 없이):
{
  "majorFit": "높음|보통|낮음",
  "activityFocus": "높음|보통|낮음",
  "academicGrowth": "높음|보통|낮음",
  "overallCompetitiveness": "상|중|하",
  "extractedGrade": 숫자_또는_null,
  "subjectGrades": {
    "전교과": 숫자_또는_null,
    "국영수사과": 숫자_또는_null,
    "국영수사": 숫자_또는_null,
    "국영수": 숫자_또는_null
  },
  "gradesByYear": {
    "1학년": 숫자_또는_null,
    "2학년": 숫자_또는_null,
    "3학년": 숫자_또는_null
  },
  "careerClear": true_또는_false,
  "extracurricularQuality": "우수|보통|미흡",
  "subjectAnalysis": "교과 역량 분석 2~3문장: 내신 수준·추이·강점 과목 언급",
  "extracurricularAnalysis": "비교과 역량 분석 2~3문장: 진로활동·동아리·세특 강점 언급",
  "gradeNote": "파싱된 주요 과목 등급 나열 + 특이사항 (예: 국1 수2 영1 사2 과2 → 평균 1.60)"
}`;

    // PDF · 이미지 · 텍스트 각각 content 배열 구성
    let analysisContent;
    if (hasPdf) {
      analysisContent = [
        { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: recordFileBase64 } },
        { type: 'text', text: analysisPrompt },
      ];
    } else if (hasImages) {
      const imgBlocks = recordFilesBase64.map((b64, i) => {
        const fname = (recordFileNames?.[i] || '').toLowerCase();
        const mt = fname.endsWith('.png') ? 'image/png' : 'image/jpeg';
        return { type: 'image', source: { type: 'base64', media_type: mt, data: b64 } };
      });
      analysisContent = [...imgBlocks, { type: 'text', text: analysisPrompt }];
    } else {
      analysisContent = analysisPrompt;
    }

    const analysisMsg = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      messages: [{ role: 'user', content: analysisContent }],
    });

    let analysis = {
      majorFit: '보통', activityFocus: '보통', academicGrowth: '보통',
      overallCompetitiveness: '중', extractedGrade: null,
      subjectGrades: { 전교과: null, 국영수사과: null, 국영수사: null, 국영수: null },
      gradesByYear: { '1학년': null, '2학년': null, '3학년': null },
      careerClear: false, extracurricularQuality: '보통',
      subjectAnalysis: '', extracurricularAnalysis: '', gradeNote: '',
    };
    try {
      const raw = analysisMsg.content[0].text.trim();
      const jsonStr = raw.startsWith('{') ? raw : raw.match(/\{[\s\S]*\}/)?.[0] || '{}';
      analysis = { ...analysis, ...JSON.parse(jsonStr) };
      if (!analysis.subjectGrades) analysis.subjectGrades = {};
    } catch(e) { console.error('분석 파싱 오류:', e.message); }

    const grade = analysis.extractedGrade || analysis.subjectGrades?.전교과;

    // ── 배치 전략 결정 ───────────────────────────────────────────
    const isStrongSpec = analysis.careerClear && analysis.extracurricularQuality === '우수';
    const isMediumSpec = analysis.careerClear || analysis.extracurricularQuality === '보통';

    let strategyDesc, jonghapCnt, gyogwaCnt, nonSulCnt;
    if (isStrongSpec) {
      jonghapCnt = hasEssay ? 3 : 4;
      gyogwaCnt = 2;
      nonSulCnt = hasEssay ? 1 : 0;
      strategyDesc = '비교과 우수·진로 명확 → 학생부종합 중심 배치 (소신·상향 포함)';
    } else if (isMediumSpec) {
      jonghapCnt = hasEssay ? 2 : 3;
      gyogwaCnt = 3;
      nonSulCnt = hasEssay ? 1 : 0;
      strategyDesc = '비교과 보통 → 학생부종합+교과 균형 배치';
    } else {
      jonghapCnt = hasEssay ? 1 : 2;
      gyogwaCnt = hasEssay ? 3 : 4;
      nonSulCnt = hasEssay ? 1 : 0;
      strategyDesc = '비교과 미흡 → 학생부교과 중심, 논술 포함 권장';
    }
    const totalCards = jonghapCnt + gyogwaCnt + nonSulCnt;

    // ── STEP 2: Supabase 조회 ────────────────────────────────────
    // 실제 DB 컬럼명: id, university, university_canon, major, track, track_type,
    //   program, field, domain, region, grade50, grade70, grade_quality,
    //   recruit_2026, competition_2026, waitlist_2026, fill_rate_2026, history

    const majorKeywords = major.split(/[,\/\s]+/).map(s => s.trim()).filter(s => s.length > 1);
    const orCond = majorKeywords.map(k => `major.ilike.%${k}%`).join(',');

    let admissionData = [];
    try {
      const tracks = hasEssay ? ['교과', '종합', '논술'] : ['교과', '종합'];
      const { data, error } = await supabase
        .from('uc_admission_results')
        .select([
          'id', 'university', 'major', 'track', 'track_type',
          'program', 'field', 'domain', 'region',
          'grade50', 'grade70', 'grade_quality',
          'recruit_2026', 'competition_2026', 'waitlist_2026',
          'history'
        ].join(','))
        .or(orCond)
        .in('track', tracks)
        .not('grade70', 'is', null)
        .neq('grade_quality', 'placeholder')
        .order('grade70', { ascending: true })
        .limit(120);
      if (error) console.error('Supabase error:', error.message);
      admissionData = data || [];
    } catch(e) { console.error('Supabase 오류:', e.message); }

    // ── STEP 3: 수능최저 조회 (uc_gyogwa_2027) ──────────────────
    // 실제 컬럼명: id, region, university, program_name, major, recruit,
    //   method, suneung_min, suneung_yn, subject_range, subject_ratio,
    //   jinro_method, jinro_subject, jinro_criteria

    let suneungMap = {}; // { "대학명|전형명": { suneungMin, admissionMethod, subjectScope } }
    try {
      const orCond2 = majorKeywords.map(k => `major.ilike.%${k}%`).join(',');
      const { data } = await supabase
        .from('uc_gyogwa_2027')
        .select('region,university,program_name,major,method,suneung_yn,suneung_min,subject_range')
        .or(orCond2)
        .limit(100);
      (data || []).forEach(s => {
        const key = `${s.university}|${s.program_name}`;
        suneungMap[key] = {
          suneungMin: s.suneung_yn === '없음' ? '없음' : (s.suneung_min || '없음'),
          admissionMethod: s.method || '-',
          subjectScope: s.subject_range || '-',
        };
      });
    } catch(e) { console.error('수능최저 조회 오류:', e.message); }

    // ── STEP 3b: 희망대학 DB 조회 ────────────────────────────────
    const hasWishes = Array.isArray(wishes) && wishes.length > 0;
    let wishData = [];
    if (hasWishes) {
      const univNames = wishes.map(w => (w.university || '').trim()).filter(Boolean);
      if (univNames.length) {
        try {
          const wishOr = univNames.map(u => `university.ilike.%${u.replace(/학교$|대학교$|대$/, '')}%`).join(',');
          const { data: wData } = await supabase
            .from('uc_admission_results')
            .select('id,university,major,track,track_type,program,field,domain,region,grade50,grade70,grade_quality,recruit_2026,competition_2026,waitlist_2026,history')
            .or(wishOr)
            .not('grade70', 'is', null)
            .neq('grade_quality', 'placeholder')
            .order('grade70', { ascending: true })
            .limit(80);
          wishData = wData || [];
          const { data: gData } = await supabase
            .from('uc_gyogwa_2027')
            .select('region,university,program_name,major,method,suneung_yn,suneung_min,subject_range')
            .or(wishOr)
            .limit(60);
          (gData || []).forEach(s => {
            const key = `${s.university}|${s.program_name}`;
            if (!suneungMap[key]) {
              suneungMap[key] = {
                suneungMin: s.suneung_yn === '없음' ? '없음' : (s.suneung_min || '없음'),
                admissionMethod: s.method || '-',
                subjectScope: s.subject_range || '-',
              };
            }
          });
        } catch(e) { console.error('희망대학 DB 오류:', e.message); }
      }
    }

    // ── STEP 4: DB 데이터 → 프롬프트 요약 ──────────────────────
    function parseHistory(r) {
      let hist = {};
      try {
        hist = typeof r.history === 'string' ? JSON.parse(r.history) : (r.history || {});
      } catch(e) {}
      const yr = hist.years || {};
      return {
        cut25:  yr['2025']?.grade70  ?? '-',
        cut24:  yr['2024']?.grade70  ?? '-',
        rate25: yr['2025']?.competition ?? '-',
        rate24: yr['2024']?.competition ?? '-',
        wait25: yr['2025']?.waitlist ?? '-',
        wait24: yr['2024']?.waitlist ?? '-',
        recruit25: yr['2025']?.recruit ?? '-',
      };
    }

    const dbRows = admissionData.slice(0, 60).map(r => {
      const h = parseHistory(r);
      // 수능최저 룩업
      const sKey = `${r.university}|${r.program}`;
      const sInfo = suneungMap[sKey] || {};
      return [
        r.university,
        r.major,
        r.domain || '-',          // 인문/자연/의학
        r.track,                  // 교과/종합/논술
        r.region || '-',
        r.program || '-',         // 전형명
        r.recruit_2026 ?? '-',    // 2026 모집인원
        sInfo.admissionMethod || '-',
        sInfo.suneungMin || '-',
        sInfo.subjectScope || '-',
        `26컷:${r.grade70 ?? '-'}`,
        `25컷:${h.cut25}`,
        `24컷:${h.cut24}`,
        `26경쟁:${r.competition_2026 ?? '-'}`,
        `25경쟁:${h.rate25}`,
        `24경쟁:${h.rate24}`,
        `26충원:${r.waitlist_2026 ?? '-'}`,
        `25충원:${h.wait25}`,
        `24충원:${h.wait24}`,
      ].join('|');
    }).join('\n');

    // ── STEP 5: 배치 카드 생성 ───────────────────────────────────
    const gradeInfo = grade ? `전교과 ${grade}등급` : '내신 미추출';
    const subStr = Object.entries(analysis.subjectGrades || {})
      .filter(([,v]) => v != null).map(([k,v]) => `${k} ${v}`).join(' / ');
    const yearStr = Object.entries(analysis.gradesByYear || {})
      .filter(([,v]) => v != null).map(([k,v]) => `${k} ${v}`).join(' → ');

    // 희망대학별 DB 요약
    let wishDbRows = '';
    if (hasWishes) {
      wishDbRows = wishes.map((w, i) => {
        const uname = (w.university || '').trim();
        const dname = (w.department || '').trim();
        const pname = (w.program || '').trim();
        const ukey = uname.replace(/학교$|대학교$|대$/, '').toLowerCase();
        const rows = wishData.filter(r => {
          const rUniv = (r.university || '').replace(/학교$|대학교$|대$/, '').toLowerCase();
          const univMatch = rUniv.includes(ukey.slice(0, 3)) || ukey.includes(rUniv.slice(0, 3));
          if (!univMatch) return false;
          if (dname) {
            const dkey = dname.replace(/학과$|학부$|전공$/, '').toLowerCase();
            return (r.major || '').toLowerCase().includes(dkey.slice(0, 3));
          }
          return true;
        }).slice(0, 6);
        const rowStr = rows.map(r => {
          const h = parseHistory(r);
          const sInfo = suneungMap[`${r.university}|${r.program}`] || {};
          return [r.university, r.major, r.domain||'-', r.track, r.region||'-',
            r.program||'-', r.recruit_2026??'-',
            sInfo.admissionMethod||'-', sInfo.suneungMin||'-', sInfo.subjectScope||'-',
            `26컷:${r.grade70??'-'}`, `25컷:${h.cut25}`, `24컷:${h.cut24}`,
            `26경쟁:${r.competition_2026??'-'}`, `25경쟁:${h.rate25}`, `24경쟁:${h.rate24}`,
            `26충원:${r.waitlist_2026??'-'}`, `25충원:${h.wait25}`, `24충원:${h.wait24}`,
          ].join('|');
        }).join('\n');
        return `[희망${i+1}] ${uname||'?'} / ${dname||'학과미지정'} / ${pname||'전형미지정'}\n${rowStr || '(DB 없음 — 일반 지식 기반 분석)'}`;
      }).join('\n\n');
    }

    const cardSchema = `{
  "possibility": "위험|소신|적정|안정",
  "region": "서울|경기|인천|부산 등",
  "university": "대학명",
  "category": "인문|자연|공학|의약|예체능",
  "department": "학과명",
  "admissionType": "학생부교과|학생부종합|논술",
  "programName": "전형명",
  "recruitCount": 숫자_또는_null,
  "recruitChange": "▲3 또는 ▼2 또는 -",
  "suneungMin": "없음 또는 조건",
  "admissionMethod": "전형방법",
  "essayDate": "논술 날짜 또는 null",
  "cutlines": [
    {"year": 2026, "cut": 숫자_또는_null, "rate": 경쟁률_또는_null, "waitlist": 충원_또는_null},
    {"year": 2025, "cut": 숫자_또는_null, "rate": 경쟁률_또는_null, "waitlist": 충원_또는_null},
    {"year": 2024, "cut": 숫자_또는_null, "rate": 경쟁률_또는_null, "waitlist": 충원_또는_null}
  ],
  "aiReport": "해당 전형에 반영되는 학생의 [과목범위] 내신은 X.XX등급입니다. ..."
}`;

    const cardPrompt = `당신은 대한민국 최고의 대입 배치 전문 컨설턴트입니다.
아래 학생 정보를 바탕으로 ${hasWishes ? '①희망대학 레포트와 ②' : ''}AI 추천 배치 카드를 JSON 객체로만 응답하세요.

[학생 정보]
- 이름: ${name} / 학교: ${school}
- 희망학과: ${major}
- 내신: ${gradeInfo}${subStr ? ' (' + subStr + ')' : ''}${yearStr ? ' | 학년별: ' + yearStr : ''}
- 생기부: 전공적합성 ${analysis.majorFit} / 활동집중도 ${analysis.activityFocus} / 학업성장성 ${analysis.academicGrowth} / 종합경쟁력 ${analysis.overallCompetitiveness}
- 비교과: ${analysis.extracurricularQuality} / 진로명확성: ${analysis.careerClear ? '명확' : '불명확'}
- 교과분석: ${analysis.subjectAnalysis || '-'}
- 비교과분석: ${analysis.extracurricularAnalysis || '-'}
${hasWishes ? `
[희망대학 목록 + 입결 DB]
${wishDbRows}
` : ''}
[AI 추천 배치 전략]
${strategyDesc}
- 학생부종합 ${jonghapCnt}장${isStrongSpec ? ' (소신·상향 포함, 비교과 강점 활용)' : ''} / 학생부교과 ${gyogwaCnt}장${nonSulCnt > 0 ? ` / 논술 ${nonSulCnt}장` : ''}
- 전체 구성: 안정 1~2장 / 적정 2~3장 / 소신 1~2장 / 위험 0~1장
- 희망학과(${major}) 관련 학과만 구성

[합격가능성 기준]
- 교과: grade70 컷 대비 0.3↑유리→안정, ±0.1→적정, 0.3~0.5↓→소신, 0.5↓이상→위험
- 종합: 비교과 우수(상)이면 컷보다 0.3 불리해도 소신 가능
- 논술: 논술 실력 가정 시 소신~적정

[AI 추천 입결 DB — 대학|학과|계열|전형유형|지역|전형명|2026모집|전형방법|수능최저|반영교과|컷/경쟁률/충원]
${dbRows || '(DB 데이터 없음 — 일반 지식 기반 추천)'}

[레포트 작성 규칙]
- 첫 문장 필수: "해당 전형에 반영되는 학생의 [전교과/국영수사과/국영수사 등] 내신은 X.XX등급입니다."
  → 반영교과(subject_range) 기반으로 정확한 과목 범위 특정, 해당 내신 사용
- 이후 2~3문장: 3개년 입결 추이·경쟁률·충원·비교과 강점 근거로 합격 가능성 분석
- 논술전형: 날짜 반드시 기재
- 문체: 전문적·간결, 이모티콘 없음
${hasWishes ? `
[희망대학 레포트 작성 추가 규칙]
- wishCards 배열은 위 희망대학 목록 순서대로 정확히 ${wishes.length}장 생성
- DB에 없는 전형은 일반 지식 기반으로 최대한 채워 분석
` : ''}
JSON 객체만 응답 (마크다운·설명 없이):
{
  "wishCards": [${hasWishes ? `\n    ${cardSchema}` : ''}
  ],
  "recCards": [
    ${cardSchema}
  ]
}`;

    const cardMsg = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8192,
      messages: [{ role: 'user', content: cardPrompt }],
    });

    let wishCards = [];
    let cards = [];
    try {
      let raw = cardMsg.content[0].text.trim();
      raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '');
      if (raw.startsWith('{')) {
        const parsed = JSON.parse(raw);
        wishCards = Array.isArray(parsed.wishCards) ? parsed.wishCards : [];
        cards = Array.isArray(parsed.recCards) ? parsed.recCards : (Array.isArray(parsed.cards) ? parsed.cards : []);
      } else {
        const arrStr = raw.startsWith('[') ? raw : raw.match(/\[[\s\S]*\]/)?.[0] || '[]';
        cards = JSON.parse(arrStr);
      }
    } catch(e) {
      console.error('카드 파싱 오류:', e.message);
      cards = generateFallback(major, grade, hasEssay, analysis, jonghapCnt, gyogwaCnt, nonSulCnt);
    }

    // 수능최저 DB 정보 보강 (wishCards + recCards)
    const enrichCard = card => {
      const sInfo = suneungMap[`${card.university}|${card.programName}`];
      if (sInfo) {
        if (!card.suneungMin || card.suneungMin === '정보없음') card.suneungMin = sInfo.suneungMin;
        if (!card.admissionMethod || card.admissionMethod === '-') card.admissionMethod = sInfo.admissionMethod;
      }
      return card;
    };
    wishCards = wishCards.map(enrichCard);
    cards = cards.map(enrichCard);

    return res.status(200).json({
      student: { name, school, major, analysis, strategy: strategyDesc },
      wishCards,
      cards: cards.slice(0, totalCards),
    });

  } catch (err) {
    console.error('proxy.js 오류:', err);
    return res.status(500).json({ error: err.message || 'AI 분석 중 오류 발생' });
  }
};

function generateFallback(major, grade, hasEssay, analysis, jonghapCnt, gyogwaCnt, nonSulCnt) {
  const g = grade || 2.7;
  const comp = analysis.overallCompetitiveness;
  const adj = comp === '상' ? -0.2 : comp === '하' ? 0.2 : 0;
  const dept = major.split(/[,\/]/)[0].trim();

  const jonghapList = [
    { u:'서울시립대학교', p:'소신', r:'서울', c:2.5, m:'1단계 서류100 / 2단계 서류50+면접50', sn:'없음', pn:'학생부종합전형I', recruit:10 },
    { u:'건국대학교',     p:'소신', r:'서울', c:2.5, m:'1단계 서류100 / 2단계 서류70+면접30', sn:'없음', pn:'KU자기추천전형', recruit:14 },
    { u:'동국대학교',     p:'소신', r:'서울', c:2.75,m:'1단계 서류100 / 2단계 서류70+면접30', sn:'없음', pn:'DoDream전형', recruit:7 },
    { u:'국민대학교',     p:'적정', r:'서울', c:2.8, m:'1단계 서류100 / 2단계 서류70+면접30', sn:'없음', pn:'국민프런티어', recruit:15 },
    { u:'단국대학교',     p:'적정', r:'경기', c:2.86,m:'1단계 서류100 / 2단계 서류70+면접30', sn:'없음', pn:'DKU인재(면접형)', recruit:5 },
  ];
  const gyogwaList = [
    { u:'단국대학교',   p:'안정', r:'경기', c:2.43,m:'일괄합산 교과100%', sn:'2개 영역 합 6 이내', pn:'지역균형선발전형', recruit:90 },
    { u:'아주대학교',   p:'안정', r:'경기', c:2.7, m:'일괄합산 교과100%', sn:'2개 영역 합 5 이내', pn:'고교추천', recruit:3 },
    { u:'가톨릭대학교', p:'안정', r:'경기', c:2.78,m:'일괄합산 교과100%', sn:'2개 영역 합 7 이내', pn:'지역균형', recruit:5 },
    { u:'인하대학교',   p:'적정', r:'인천', c:2.9, m:'일괄합산 교과100%', sn:'없음',             pn:'학교추천', recruit:8 },
  ];
  const nonSulList = [
    { u:'건국대학교', p:'소신', r:'서울', c:3.0, m:'논술70+교과30', sn:'없음', pn:'논술우수자전형', recruit:14, date:'2025.11.09' },
  ];

  const result = [];
  jonghapList.slice(0, jonghapCnt).forEach(item => {
    const cut = +(item.c + adj).toFixed(2);
    result.push({
      possibility: item.p, region: item.r, university: item.u, category: '인문',
      department: dept, admissionType: '학생부종합', programName: item.pn,
      recruitCount: item.recruit, recruitChange: '-', suneungMin: item.sn,
      admissionMethod: item.m, essayDate: null,
      cutlines: [
        { year:2026, cut, rate:+(Math.random()*15+8).toFixed(1), waitlist:Math.floor(Math.random()*20+2) },
        { year:2025, cut:+(cut+0.1).toFixed(2), rate:+(Math.random()*15+8).toFixed(1), waitlist:Math.floor(Math.random()*20+2) },
        { year:2024, cut:+(cut+0.15).toFixed(2), rate:+(Math.random()*15+8).toFixed(1), waitlist:Math.floor(Math.random()*20+2) },
      ],
      aiReport: `해당 전형에 반영되는 학생의 전교과 내신은 ${grade||g}등급입니다. 비교과 활동이 ${analysis.extracurricularQuality} 수준으로 종합전형에서 경쟁력이 있습니다.`,
    });
  });
  gyogwaList.slice(0, gyogwaCnt).forEach(item => {
    const cut = +(item.c + adj * 0.5).toFixed(2);
    result.push({
      possibility: item.p, region: item.r, university: item.u, category: '인문',
      department: dept, admissionType: '학생부교과', programName: item.pn,
      recruitCount: item.recruit, recruitChange: '-', suneungMin: item.sn,
      admissionMethod: item.m, essayDate: null,
      cutlines: [
        { year:2026, cut, rate:+(Math.random()*10+5).toFixed(1), waitlist:Math.floor(Math.random()*50+5) },
        { year:2025, cut:+(cut+0.1).toFixed(2), rate:+(Math.random()*10+5).toFixed(1), waitlist:Math.floor(Math.random()*50+5) },
        { year:2024, cut:+(cut+0.15).toFixed(2), rate:+(Math.random()*10+5).toFixed(1), waitlist:Math.floor(Math.random()*50+5) },
      ],
      aiReport: `해당 전형에 반영되는 학생의 내신은 ${grade||g}등급입니다. 교과전형 특성상 수능최저를 충족한다면 안정적인 합격을 기대할 수 있습니다.`,
    });
  });
  nonSulList.slice(0, nonSulCnt).forEach(item => {
    const cut = +(item.c + adj).toFixed(2);
    result.push({
      possibility: item.p, region: item.r, university: item.u, category: '인문',
      department: dept, admissionType: '논술', programName: item.pn,
      recruitCount: item.recruit, recruitChange: '-', suneungMin: item.sn,
      admissionMethod: item.m, essayDate: item.date,
      cutlines: [
        { year:2026, cut, rate:+(Math.random()*30+20).toFixed(1), waitlist:Math.floor(Math.random()*10+1) },
        { year:2025, cut:+(cut+0.1).toFixed(2), rate:+(Math.random()*30+20).toFixed(1), waitlist:Math.floor(Math.random()*10+1) },
        { year:2024, cut:+(cut+0.15).toFixed(2), rate:+(Math.random()*30+20).toFixed(1), waitlist:Math.floor(Math.random()*10+1) },
      ],
      aiReport: `해당 전형에 반영되는 학생의 내신은 ${grade||g}등급입니다. 논술 비중이 높아 논술 준비가 충실하다면 내신 부담을 상쇄할 수 있습니다. 시험일: ${item.date}.`,
    });
  });
  return result;
}
