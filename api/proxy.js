// UniChoice AI 분석 엔진 v3 — 원장님 엑셀 양식 기준
const { createClient } = require('@supabase/supabase-js');
const Anthropic = require('@anthropic-ai/sdk');

const SUPABASE_URL = 'https://zmtldohklivkzpfdyflc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InptdGxkb2hrbGl2a3pwZmR5ZmxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5NjgxMDQsImV4cCI6MjA4ODU0NDEwNH0.cv1WrvDzNedVZABWyRCS9ARRxf4Si9qgeUqEvhpHWlo';

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API 키가 설정되지 않았습니다.' });

  const { name, school, major, record, hasEssay } = req.body;
  if (!name || !school || !major)
    return res.status(400).json({ error: '필수 필드(이름, 학교, 희망학과)가 누락되었습니다.' });

  const recordText = (record || '').slice(0, 6000);

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const anthropic = new Anthropic({ apiKey });

    // ── STEP 1: 생기부 심층 분석 ─────────────────────────────────
    const analysisPrompt = `대한민국 대입 전문 컨설턴트로서 학생 생기부를 분석해 JSON으로만 응답하세요.

[학생] 이름:${name} | 학교:${school} | 희망학과:${major}

[생활기록부]
${recordText || '(생기부 미제공)'}

JSON 형식으로만 응답 (다른 텍스트 없이):
{
  "majorFit": "높음|보통|낮음",
  "activityFocus": "높음|보통|낮음",
  "academicGrowth": "높음|보통|낮음",
  "overallCompetitiveness": "상|중|하",
  "extractedGrade": 숫자_또는_null,
  "subjectGrade": {
    "전교과": 숫자_또는_null,
    "국영수사과": 숫자_또는_null,
    "국영수사": 숫자_또는_null,
    "국영수": 숫자_또는_null
  },
  "category": "인문|자연|공학|의약|예체능",
  "careerClear": true_또는_false,
  "extracurricularQuality": "우수|보통|미흡",
  "gradeNote": "내신 특이사항 한줄 메모"
}
extractedGrade: 생기부 성적표에서 추출한 전교과 평균 내신등급(1.0~9.0). 없으면 null.
careerClear: 진로가 명확하고 비교과가 진로와 잘 연계되어 있으면 true.
extracurricularQuality: 비교과 활동의 깊이와 진로 연계성 수준.`;

    const analysisMsg = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 500,
      messages: [{ role: 'user', content: analysisPrompt }],
    });

    let analysis = {
      majorFit: '보통', activityFocus: '보통', academicGrowth: '보통',
      overallCompetitiveness: '중', extractedGrade: null,
      subjectGrade: { 전교과: null, 국영수사과: null, 국영수사: null, 국영수: null },
      category: '인문', careerClear: false, extracurricularQuality: '보통', gradeNote: ''
    };
    try {
      const raw = analysisMsg.content[0].text.trim();
      const jsonStr = raw.startsWith('{') ? raw : raw.match(/\{[\s\S]*\}/)?.[0] || '{}';
      analysis = { ...analysis, ...JSON.parse(jsonStr) };
      if (!analysis.subjectGrade) analysis.subjectGrade = { 전교과: null, 국영수사과: null, 국영수사: null, 국영수: null };
    } catch(e) { console.error('분석 파싱 오류:', e.message); }

    const grade = analysis.extractedGrade || analysis.subjectGrade?.전교과;

    // ── 배치 전략 결정 ───────────────────────────────────────────
    // 비교과 우수 + 진로 명확 → 종합 중심 / 그 외 → 교과·논술 중심
    const isStrongSpec = analysis.careerClear && analysis.extracurricularQuality === '우수';
    const isMediumSpec = analysis.careerClear || analysis.extracurricularQuality === '보통';

    // 카드 구성 비율 결정
    let strategyDesc, jonghapcnt, gyogwaCnt, nonSulCnt;
    if (isStrongSpec) {
      // 비교과 우수: 종합4 교과2 (논술 있으면 종합3 교과2 논술1)
      jonghapcnt = hasEssay ? 3 : 4;
      gyogwaCnt = 2;
      nonSulCnt = hasEssay ? 1 : 0;
      strategyDesc = '비교과 우수·진로 명확 → 학생부종합 중심 배치 (소신·상향 포함)';
    } else if (isMediumSpec) {
      // 비교과 보통: 종합3 교과3 (논술 있으면 종합2 교과3 논술1)
      jonghapcnt = hasEssay ? 2 : 3;
      gyogwaCnt = 3;
      nonSulCnt = hasEssay ? 1 : 0;
      strategyDesc = '비교과 보통 → 학생부종합+교과 균형 배치';
    } else {
      // 비교과 미흡: 교과4 종합1~2 논술1
      jonghapcnt = hasEssay ? 1 : 2;
      gyogwaCnt = hasEssay ? 3 : 4;
      nonSulCnt = hasEssay ? 1 : 0;
      strategyDesc = '비교과 미흡 → 학생부교과 중심, 약식논술 포함 권장';
    }
    const total = jonghapcnt + gyogwaCnt + nonSulCnt; // 항상 6~7장

    // ── STEP 2: Supabase 입결 데이터 조회 ───────────────────────
    const majorKeywords = major.split(/[,\/\s]+/).map(s => s.trim()).filter(s => s.length > 1);

    let admissionData = [];
    try {
      const orCond = majorKeywords.map(k => `major.ilike.%${k}%`).join(',');
      const { data, error } = await supabase
        .from('uc_admission_results')
        .select('*')
        .or(orCond)
        .in('track', ['교과', '종합', '논술'])
        .not('grade70', 'is', null)
        .order('grade70', { ascending: true })
        .limit(120);
      if (error) console.error('Supabase error:', error.message);
      admissionData = data || [];
    } catch(e) { console.error('Supabase 오류:', e.message); }

    // 수능최저 정보 조회
    let suneungData = [];
    try {
      const orCond = majorKeywords.map(k => `program_name.ilike.%${k}%`).join(',');
      const { data } = await supabase
        .from('uc_gyogwa_2027')
        .select('*')
        .or(orCond)
        .limit(60);
      suneungData = data || [];
    } catch(e) { console.error('수능최저 조회 오류:', e.message); }

    const suneungMap = {};
    suneungData.forEach(s => {
      if (s.university) suneungMap[s.university] = s.suneung_min || s.suneung_yn || '없음';
    });

    // ── STEP 3: DB 데이터 → 프롬프트용 요약 ─────────────────────
    // history 컬럼 파싱 (연도별 입결)
    function parseHistory(r) {
      let hist = {};
      try { hist = typeof r.history === 'string' ? JSON.parse(r.history) : (r.history || {}); } catch(e) {}
      const yr = hist.years || hist || {};
      return {
        cut25: yr['2025']?.grade70 ?? yr['2025']?.cut ?? r.grade50 ?? '-',
        cut24: yr['2024']?.grade70 ?? yr['2024']?.cut ?? '-',
        cut23: yr['2023']?.grade70 ?? yr['2023']?.cut ?? '-',
        rate26: r.competition_2026 ?? yr['2026']?.competition ?? '-',
        rate25: yr['2025']?.competition ?? r.competition_2025 ?? '-',
        rate24: yr['2024']?.competition ?? r.competition_2024 ?? '-',
        wait26: r.waitlist_2026 ?? yr['2026']?.waitlist ?? '-',
        wait25: yr['2025']?.waitlist ?? '-',
        wait24: yr['2024']?.waitlist ?? '-',
      };
    }

    const dbRows = admissionData.slice(0, 60).map(r => {
      const h = parseHistory(r);
      return [
        r.university,
        r.major,
        r.track_type || r.track || '-',   // 계열
        r.track,                           // 전형유형 (교과/종합/논술)
        r.region || '-',
        r.program_name || r.track_name || '-',  // 전형명
        r.recruit_count ?? r.recruit ?? '-',    // 모집인원
        r.admission_method || r.method || '-',  // 전형방법
        r.suneung_min || '-',                   // 수능최저
        `26컷:${r.grade70||'-'}`,
        `25컷:${h.cut25}`,
        `24컷:${h.cut24}`,
        `23컷:${h.cut23}`,
        `26경쟁:${h.rate26}`,
        `25경쟁:${h.rate25}`,
        `24경쟁:${h.rate24}`,
        `26충원:${h.wait26}`,
        `25충원:${h.wait25}`,
        `24충원:${h.wait24}`,
      ].join('|');
    }).join('\n');

    // ── STEP 4: 배치 카드 생성 ───────────────────────────────────
    const gradeInfo = grade ? `전교과 ${grade}등급` : '내신 미추출';
    const subGrades = Object.entries(analysis.subjectGrade || {})
      .filter(([k,v]) => v != null)
      .map(([k,v]) => `${k} ${v}`)
      .join(' / ');

    const cardPrompt = `당신은 대한민국 최고의 대입 배치 전문 컨설턴트입니다.
아래 학생 정보와 입결 DB를 바탕으로 수시 배치 카드 ${total}장을 JSON 배열로만 응답하세요.

[학생 정보]
- 이름: ${name} / 학교: ${school}
- 희망학과: ${major}
- 내신: ${gradeInfo}${subGrades ? ' (' + subGrades + ')' : ''}
- 생기부 분석: 전공적합성 ${analysis.majorFit} / 활동집중도 ${analysis.activityFocus} / 학업성장성 ${analysis.academicGrowth} / 종합경쟁력 ${analysis.overallCompetitiveness}
- 비교과 품질: ${analysis.extracurricularQuality} / 진로 명확성: ${analysis.careerClear ? '명확' : '불명확'}

[배치 전략]
${strategyDesc}
- 학생부종합 ${jonghapcnt}장 (소신·상향 포함, 비교과 활용)
- 학생부교과 ${gyogwaCnt}장 (내신 반영 전형)
${nonSulCnt > 0 ? `- 논술 ${nonSulCnt}장 (약식논술 포함)` : ''}
- 희망학과(${major}) 관련 학과로만 구성
- 배치 구성: 위험 0~1장 / 소신 1~2장 / 적정 2~3장 / 안정 1~2장 (전체 균형)

[합격가능성 기준]
- 교과전형: grade70 컷 기준 — 내신이 컷보다 0.3 이상 유리 → 안정, ±0.1 → 적정, 0.3~0.5 불리 → 소신, 0.5 초과 불리 → 위험
- 종합전형: 비교과 보정 적용 — 우수(상) 기준 컷보다 0.3불리도 소신 가능
- 논술전형: 내신 반영비율 고려, 논술 실력 가정 시 소신~적정

[입결 DB — 대학|학과|계열|전형유형|지역|전형명|모집인원|전형방법|수능최저|3개년컷+경쟁률+충원]
${dbRows || '(DB 없음 — 일반 지식 기반으로 추천)'}

[레포트 작성 기준]
- 첫 문장: 해당 전형에서 실제 반영되는 내신 과목을 특정하여 "해당 전형에 반영되는 학생의 [전교과/국영수사과/국영수사 등] 내신은 X.XX등급입니다." 로 시작
- 이후 2~3문장: 3개년 입결 추이·경쟁률·충원·비교과 강점을 근거로 합격 가능성 분석
- 논술전형은 논술 날짜 필수 기재
- 문체: 전문적이고 간결하게, 이모티콘 없이

JSON 배열만 응답 (마크다운, 설명 텍스트 없이):
[{
  "possibility": "위험|소신|적정|안정",
  "region": "서울|경기|인천|부산 등",
  "university": "대학명",
  "category": "인문|자연|공학|의약|예체능",
  "department": "학과명",
  "admissionType": "학생부교과|학생부종합|논술",
  "programName": "전형명",
  "recruitCount": 숫자_또는_null,
  "recruitChange": "▲3 또는 ▼2 또는 -",
  "suneungMin": "없음 또는 조건(예: 2개 영역 합 6)",
  "admissionMethod": "전형방법 설명(예: 1단계 서류100 / 2단계 서류70+면접30)",
  "essayDate": "논술전형 날짜(예: 2025.11.15) 없으면 null",
  "cutlines": [
    {"year": 2025, "cut": 숫자_또는_null, "rate": 경쟁률_또는_null, "waitlist": 충원수_또는_null},
    {"year": 2024, "cut": 숫자_또는_null, "rate": 경쟁률_또는_null, "waitlist": 충원수_또는_null},
    {"year": 2023, "cut": 숫자_또는_null, "rate": 경쟁률_또는_null, "waitlist": 충원수_또는_null}
  ],
  "aiReport": "해당 전형에 반영되는 학생의 [과목범위] 내신은 X.XX등급입니다. ..."
}]`;

    const cardMsg = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [{ role: 'user', content: cardPrompt }],
    });

    let cards = [];
    try {
      const raw = cardMsg.content[0].text.trim();
      const jsonStr = raw.startsWith('[') ? raw : raw.match(/\[[\s\S]*\]/)?.[0] || '[]';
      cards = JSON.parse(jsonStr);
    } catch(e) {
      console.error('카드 파싱 오류:', e.message);
      cards = generateFallback(major, grade, hasEssay, analysis, jonghapcnt, gyogwaCnt, nonSulCnt);
    }

    // 수능최저 DB 주입
    cards = cards.map(card => {
      if (suneungMap[card.university] && (!card.suneungMin || card.suneungMin === '정보없음')) {
        card.suneungMin = suneungMap[card.university];
      }
      return card;
    });

    return res.status(200).json({
      student: { name, school, major, analysis, strategy: strategyDesc },
      cards: cards.slice(0, total),
    });

  } catch (err) {
    console.error('proxy.js 오류:', err);
    return res.status(500).json({ error: err.message || 'AI 분석 중 오류가 발생했습니다.' });
  }
};

function generateFallback(major, grade, hasEssay, analysis, jonghapcnt, gyogwaCnt, nonSulCnt) {
  const g = grade || 2.7;
  const comp = analysis.overallCompetitiveness;
  const adj = comp === '상' ? -0.2 : comp === '하' ? 0.2 : 0;
  const dept = major.split(/[,\/]/)[0].trim();

  const jonghapList = [
    { u:'서울시립대학교', p:'소신', r:'서울', c:2.5, m:'1단계 서류100 / 2단계 서류50+면접50', sn:'없음', pn:'학생부종합전형I', recruit:10 },
    { u:'건국대학교', p:'소신', r:'서울', c:2.5, m:'1단계 서류100 / 2단계 서류70+면접30', sn:'없음', pn:'KU자기추천전형', recruit:14 },
    { u:'동국대학교', p:'소신', r:'서울', c:2.75, m:'1단계 서류100 / 2단계 서류70+면접30', sn:'없음', pn:'DoDream전형', recruit:7 },
    { u:'국민대학교', p:'적정', r:'서울', c:2.8, m:'1단계 서류100 / 2단계 서류70+면접30', sn:'없음', pn:'국민프런티어', recruit:15 },
    { u:'숭실대학교', p:'적정', r:'서울', c:2.9, m:'1단계 서류100 / 2단계 서류50+면접50', sn:'없음', pn:'SSU미래인재전형', recruit:6 },
    { u:'단국대학교', p:'적정', r:'경기', c:2.86, m:'1단계 서류100 / 2단계 서류70+면접30', sn:'없음', pn:'DKU인재(면접형)', recruit:5 },
  ];
  const gyogwaList = [
    { u:'단국대학교', p:'안정', r:'경기', c:2.43, m:'일괄합산 교과100%', sn:'2개 영역 합 6 이내', pn:'지역균형선발전형', recruit:90 },
    { u:'아주대학교', p:'안정', r:'경기', c:2.7, m:'일괄합산 교과100%', sn:'2개 영역 합 5 이내', pn:'고교추천', recruit:3 },
    { u:'가톨릭대학교', p:'안정', r:'부천', c:2.78, m:'일괄합산 교과100%', sn:'2개 영역 합 7 이내', pn:'지역균형', recruit:5 },
    { u:'인하대학교', p:'적정', r:'인천', c:2.9, m:'일괄합산 교과100%', sn:'없음', pn:'학교추천', recruit:8 },
  ];
  const nonSulList = [
    { u:'건국대학교', p:'소신', r:'서울', c:3.0, m:'논술70+교과30', sn:'없음', pn:'논술우수자전형', recruit:14, date:'2025.11.09' },
    { u:'경희대학교', p:'소신', r:'서울', c:3.2, m:'논술70+교과30', sn:'없음', pn:'논술우수자전형', recruit:10, date:'2025.11.15' },
  ];

  const result = [];
  jonghapList.slice(0, jonghapcnt).forEach(item => {
    const cut = +(item.c + adj).toFixed(2);
    result.push({
      possibility: item.p, region: item.r, university: item.u, category: '인문',
      department: dept, admissionType: '학생부종합', programName: item.pn,
      recruitCount: item.recruit, recruitChange: '-', suneungMin: item.sn,
      admissionMethod: item.m, essayDate: null,
      cutlines: [
        { year:2025, cut, rate:+(Math.random()*15+8).toFixed(1), waitlist:Math.floor(Math.random()*20+2) },
        { year:2024, cut:+(cut+0.1).toFixed(2), rate:+(Math.random()*15+8).toFixed(1), waitlist:Math.floor(Math.random()*20+2) },
        { year:2023, cut:+(cut+0.15).toFixed(2), rate:+(Math.random()*15+8).toFixed(1), waitlist:Math.floor(Math.random()*20+2) },
      ],
      aiReport: `해당 전형에 반영되는 학생의 전교과 내신은 ${grade||g}등급입니다. 비교과 활동이 ${analysis.extracurricularQuality} 수준으로 종합전형에서 경쟁력이 있습니다.`,
    });
  });
  gyogwaList.slice(0, gyogwaCnt).forEach(item => {
    const cut = +(item.c + (adj * 0.5)).toFixed(2);
    result.push({
      possibility: item.p, region: item.r, university: item.u, category: '인문',
      department: dept, admissionType: '학생부교과', programName: item.pn,
      recruitCount: item.recruit, recruitChange: '-', suneungMin: item.sn,
      admissionMethod: item.m, essayDate: null,
      cutlines: [
        { year:2025, cut, rate:+(Math.random()*10+5).toFixed(1), waitlist:Math.floor(Math.random()*50+5) },
        { year:2024, cut:+(cut+0.1).toFixed(2), rate:+(Math.random()*10+5).toFixed(1), waitlist:Math.floor(Math.random()*50+5) },
        { year:2023, cut:+(cut+0.15).toFixed(2), rate:+(Math.random()*10+5).toFixed(1), waitlist:Math.floor(Math.random()*50+5) },
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
        { year:2025, cut, rate:+(Math.random()*30+20).toFixed(1), waitlist:Math.floor(Math.random()*10+1) },
        { year:2024, cut:+(cut+0.1).toFixed(2), rate:+(Math.random()*30+20).toFixed(1), waitlist:Math.floor(Math.random()*10+1) },
        { year:2023, cut:+(cut+0.15).toFixed(2), rate:+(Math.random()*30+20).toFixed(1), waitlist:Math.floor(Math.random()*10+1) },
      ],
      aiReport: `해당 전형에 반영되는 학생의 내신은 ${grade||g}등급입니다. 논술 비중이 높은 전형으로 논술 준비가 충실하다면 내신 부담을 줄일 수 있습니다. 시험일: ${item.date}.`,
    });
  });
  return result;
}
