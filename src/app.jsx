const { useState, useCallback, useEffect } = React;

const POSS = {
  '위험': { color: '#B91C1C', bg: '#FEE2E2', bar: '#EF4444' },
  '소신': { color: '#B45309', bg: '#FEF3C7', bar: '#F59E0B' },
  '적정': { color: '#1D4ED8', bg: '#DBEAFE', bar: '#3B82F6' },
  '안정': { color: '#047857', bg: '#D1FAE5', bar: '#10B981' }
};

const TYPE_STYLE = {
  '학생부교과': { bg: '#EEF2F9', color: '#1A2E55' },
  '학생부종합': { bg: '#DBEAFE', color: '#1D4ED8' },
  '논술': { bg: '#EDE9FE', color: '#6D28D9' }
};

const STEPS = ['생기부 텍스트 분석 중', '내신 등급 자동 추출 중', '전공적합성·활동 분석 중', '입결 데이터 조회 중', '교과·종합·논술 후보 선별 중', '최종 배치 리포트 생성 중'];

const isFormValid = f => f.name.trim() && f.school.trim() && f.major.trim();

async function extractPdfText(file) {
  try {
    if (!window.pdfjsLib) return '';
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await window.pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
    let text = '';
    for (let i = 1; i <= Math.min(pdf.numPages, 15); i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map(item => item.str).join(' ') + '\n';
    }
    return text.trim().slice(0, 5000);
  } catch (e) {
    console.error('PDF 추출 오류:', e);
    return '';
  }
}

function HomeScreen({ onStart }) {
  return (
    <div className="home-wrap">
      <div className="home-top">
        <div className="home-wordmark">Uni<span>Choice</span></div>
        <div className="home-sub">생기부 · 내신 기반 대입 수시 배치 분석</div>
      </div>
      <div className="home-divider" />
      <div className="mode-grid">
        <div className="mode-card mode-card--s" onClick={onStart}>
          <div>
            <div className="mc-label">Susi Analysis</div>
            <div className="mc-title">수시<br />배치</div>
            <div className="mc-desc">생기부 분석부터<br />전형별 카드 생성까지</div>
            <div className="mc-tags">
              {['학생부종합', '학생부교과', '논술', '카드 6~7장'].map(t => (
                <span key={t} className="mc-tag">{t}</span>
              ))}
            </div>
          </div>
          <div className="mc-btn mc-btn--start">
            <span>배치 시작하기</span>
            <span>→</span>
          </div>
          <div className="mc-num">01</div>
        </div>
        <div className="mode-card mode-card--j">
          <div>
            <div className="mc-label">Jeongsi Analysis</div>
            <div className="mc-title">정시<br />배치</div>
            <div className="mc-desc">수능 성적 기반<br />가·나·다군 배치 분석</div>
            <div className="mc-tags">
              {['가군', '나군', '다군', '3장 카드'].map(t => (
                <span key={t} className="mc-tag">{t}</span>
              ))}
            </div>
          </div>
          <div className="mc-btn mc-btn--soon">준비 중</div>
          <div className="mc-num">02</div>
        </div>
      </div>
      <div className="home-minis">
        <div className="home-mini">
          <div className="home-mini-ico" style={{ background: '#1A2E55' }}>DB</div>
          <div>
            <div className="home-mini-t">입결 데이터</div>
            <div className="home-mini-s">2021–2026 대교협</div>
          </div>
        </div>
        <div className="home-mini">
          <div className="home-mini-ico" style={{ background: '#047857' }}>AI</div>
          <div>
            <div className="home-mini-t">AI 자동 분석</div>
            <div className="home-mini-s">Claude 기반 배치</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Header({ onHome }) {
  return (
    <header className="hdr">
      <div className="hdr-logo" onClick={onHome}>
        <span className="hdr-badge">PILTOP</span>
        <div>
          <div className="hdr-title">UniChoice</div>
          <div className="hdr-sub">AI 수시 배치 분석</div>
        </div>
      </div>
      <span className="hdr-year">2027학년도</span>
    </header>
  );
}

function StepProgress({ step }) {
  const labels = ['정보 입력', 'AI 분석', '배치 결과'];
  return (
    <div className="steps-wrap">
      <div className="steps">
        {labels.map((lbl, i) => {
          const n = i + 1;
          const cls = n < step ? 'done' : n === step ? 'active' : 'pending';
          return (
            <React.Fragment key={i}>
              <div className="step">
                <div className={`step-num ${cls}`}>{n < step ? '✓' : n}</div>
                <span className={`step-lbl ${n === step ? 'active' : ''}`}>{lbl}</span>
              </div>
              {i < labels.length - 1 && <div className="step-line" />}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

function StudentCard({ form, update, submitted }) {
  return (
    <div className="card">
      <div className="sec-head">
        <div className="sec-icon">01</div>
        <div>
          <div className="sec-title">학생 기본 정보</div>
          <div className="sec-sub">이름 · 학교 · 희망학과 입력</div>
        </div>
      </div>
      <div className="row2" style={{ marginBottom: 14 }}>
        <div className={`field ${submitted && !form.name.trim() ? 'field-err' : ''}`}>
          <div className="field-label">이름 <span className="required">*</span></div>
          <input type="text" placeholder="홍길동" value={form.name} onChange={e => update('name', e.target.value)} maxLength={20} />
          {submitted && !form.name.trim() && <div className="err-msg">이름을 입력하세요</div>}
        </div>
        <div className={`field ${submitted && !form.school.trim() ? 'field-err' : ''}`}>
          <div className="field-label">학교명 <span className="required">*</span></div>
          <input type="text" placeholder="○○고등학교" value={form.school} onChange={e => update('school', e.target.value)} maxLength={30} />
          {submitted && !form.school.trim() && <div className="err-msg">학교명을 입력하세요</div>}
        </div>
      </div>
      <div className={`field ${submitted && !form.major.trim() ? 'field-err' : ''}`}>
        <div className="field-label">희망 학과 / 계열 <span className="required">*</span><span className="f-hint">복수 입력 가능</span></div>
        <input type="text" placeholder="예: 경영학과, 경제학과 / 컴퓨터공학과" value={form.major} onChange={e => update('major', e.target.value)} />
        {submitted && !form.major.trim() && <div className="err-msg">희망 학과를 입력하세요</div>}
      </div>
    </div>
  );
}

function WishesCard({ wishes, setWishes }) {
  const addWish = () => {
    if (wishes.length >= 6) return;
    setWishes([...wishes, { university: '', department: '', program: '' }]);
  };
  const removeWish = i => setWishes(wishes.filter((_, idx) => idx !== i));
  const updateWish = (i, field, val) => {
    const next = [...wishes];
    next[i] = { ...next[i], [field]: val };
    setWishes(next);
  };
  return (
    <div className="card">
      <div className="sec-head">
        <div className="sec-icon">03</div>
        <div>
          <div className="sec-title">희망 대학 입력 <span style={{ fontSize: 11, color: 'var(--g400)', fontWeight: 400 }}>(선택, 최대 6개)</span></div>
          <div className="sec-sub">희망 대학 입력 시 합격 가능성 분석 추가 제공</div>
        </div>
      </div>
      {wishes.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 8, marginBottom: 6 }}>
            {['대학명', '학과명', '전형명', ''].map((h, i) => (
              <div key={i} style={{ fontSize: 11, color: 'var(--g400)', fontWeight: 600, paddingLeft: 2 }}>{h}</div>
            ))}
          </div>
          {wishes.map((w, i) => (
            <div key={i} className="wish-row">
              <input type="text" placeholder="예: 연세대학교" value={w.university} onChange={e => updateWish(i, 'university', e.target.value)} />
              <input type="text" placeholder="예: 경영학과" value={w.department} onChange={e => updateWish(i, 'department', e.target.value)} />
              <input type="text" placeholder="예: 활동우수형" value={w.program} onChange={e => updateWish(i, 'program', e.target.value)} />
              <button className="wish-del" onClick={() => removeWish(i)} type="button">×</button>
            </div>
          ))}
        </div>
      )}
      {wishes.length < 6 && (
        <button className="wish-add" onClick={addWish} type="button">
          + 희망 대학 추가 {wishes.length > 0 ? `(${wishes.length}/6)` : ''}
        </button>
      )}
    </div>
  );
}

function RecordCard({ form, update }) {
  const [tab, setTab] = useState('text');
  const [pdfFile, setPdfFile] = useState(null);
  const [imgFiles, setImgFiles] = useState([]);
  const len = form.record.length;
  const isGood = len >= 500;
  const isWarn = len > 0 && len < 200;
  const REC_TABS = [
    { key: 'text', label: '텍스트 붙여넣기' },
    { key: 'pdf', label: 'PDF 업로드' },
    { key: 'image', label: '이미지 업로드' }
  ];
  return (
    <div className="card">
      <div className="sec-head">
        <div className="sec-icon">02</div>
        <div>
          <div className="sec-title">생활기록부</div>
          <div className="sec-sub">AI가 내신 · 비교과 자동 추출 및 분석</div>
        </div>
      </div>
      <div className="notice-box">
        <div className="notice-box-icon">
          <svg viewBox="0 0 12 12">
            <path d="M6 1a5 5 0 100 10A5 5 0 006 1zm0 2.5a.75.75 0 110 1.5.75.75 0 010-1.5zM5.25 6h1.5v3h-1.5V6z" />
          </svg>
        </div>
        <div className="notice-box-text">
          <strong>나이스 또는 학교 포털에서 생기부 전문 복사</strong> 후 붙여넣으세요. 내신 등급·비교과 활동을 AI가 자동 분석합니다.
        </div>
      </div>
      <div className="rec-tabs">
        {REC_TABS.map(t => (
          <button key={t.key} className={`rec-tab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)} type="button">
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'text' && (
        <div className="field">
          <textarea
            placeholder={"[교과학습 발달상황]\n국어: ...\n수학: ...\n\n[세부능력 및 특기사항]\n...\n\n[창의적 체험활동]\n..."}
            value={form.record}
            onChange={e => update('record', e.target.value)}
          />
          <div className="char-info">
            {isWarn ? <span className="char-warn">500자 이상 입력 권장</span> : isGood ? <span className="char-ok">분석에 충분합니다</span> : <span />}
            <span className={`char-cnt ${isGood ? 'char-ok' : ''}`}>{len.toLocaleString()}자</span>
          </div>
        </div>
      )}
      {tab === 'pdf' && (
        <label className={`upload-zone ${pdfFile ? 'has-file' : ''}`}>
          <input type="file" accept=".pdf" onChange={async e => {
            const f = e.target.files[0];
            if (!f) return;
            setPdfFile(f);
            const txt = await extractPdfText(f);
            if (txt && txt.trim().length > 50) update('record', txt);
          }} />
          <div className="upload-title">{pdfFile ? pdfFile.name : 'PDF 파일을 클릭하거나 드래그'}</div>
          <div className="upload-desc">{pdfFile ? `${(pdfFile.size / 1024).toFixed(0)} KB · 텍스트 추출 완료` : '나이스에서 출력한 생기부 PDF'}</div>
          <span className="upload-hint">.pdf 파일만 지원</span>
        </label>
      )}
      {tab === 'image' && (
        <label className={`upload-zone ${imgFiles.length ? 'has-file' : ''}`}>
          <input type="file" accept="image/jpeg,image/png" multiple onChange={e => {
            const fileList = Array.from(e.target.files);
            if (fileList.length) {
              setImgFiles(fileList);
              update('recordFiles', fileList);
            }
          }} />
          <div className="upload-title">{imgFiles.length ? `${imgFiles.length}개 이미지 선택됨` : '이미지를 클릭하거나 드래그'}</div>
          <div className="upload-desc">{imgFiles.length ? imgFiles.map(f => f.name).join(', ') : '여러 장 선택 가능'}</div>
          <span className="upload-hint">JPG · PNG 지원</span>
        </label>
      )}
    </div>
  );
}

function OptionCard({ form, update }) {
  return (
    <div className="card">
      <div className="sec-head">
        <div className="sec-icon">04</div>
        <div>
          <div className="sec-title">전형 옵션</div>
          <div className="sec-sub">추가 전형 포함 여부 설정</div>
        </div>
      </div>
      <div className={`chk-opt ${form.hasEssay ? 'on' : ''}`} onClick={() => update('hasEssay', !form.hasEssay)}>
        <div className={`chk-box ${form.hasEssay ? 'on' : ''}`}>
          {form.hasEssay && (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
        <div className="chk-text">
          <h4>논술전형 포함</h4>
          <p>논술을 준비 중이라면 체크하세요. 결과에 논술전형 카드 1~2개가 포함됩니다.</p>
        </div>
      </div>
    </div>
  );
}

function SubmitBar({ onClick, valid }) {
  return (
    <div className="submit-bar">
      <div className="submit-inner">
        <button className="submit-btn" onClick={onClick} disabled={!valid} type="button">
          {valid ? 'AI 분석 시작하기' : '이름 · 학교 · 학과를 모두 입력해주세요'}
        </button>
        {valid && <div className="submit-hint">분석까지 약 20~30초 소요됩니다</div>}
      </div>
    </div>
  );
}

function AnalyzingScreen() {
  const [cur, setCur] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setCur(c => c < STEPS.length - 1 ? c + 1 : c), 4500);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="analyzing-wrap">
      <div className="analyzing-inner">
        <div className="analyzing-spinner" />
        <h2>AI 분석 중</h2>
        <p>약 20~30초 소요됩니다</p>
        <div className="a-steps">
          {STEPS.map((s, i) => {
            const cls = i < cur ? 'done' : i === cur ? 'active' : 'pending';
            return (
              <div key={i} className="a-step">
                <div className={`a-dot ${cls}`}>{i < cur ? '✓' : i === cur ? '●' : '○'}</div>
                <span className={`a-label ${cls}`}>{s}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function AnalysisBox({ analysis, strategy }) {
  const { majorFit, activityFocus, academicGrowth, overallCompetitiveness } = analysis;
  const cc = { '상': '#047857', '중': '#1D4ED8', '하': '#B91C1C' };
  const cb = { '상': '#D1FAE5', '중': '#DBEAFE', '하': '#FEE2E2' };
  const c = overallCompetitiveness || '중';
  const sg = analysis.subjectGrades || {};
  const gy = analysis.gradesByYear || {};
  return (
    <div className="analysis-box">
      <div className="ab-header">
        <span className="ab-title">생기부 경쟁력 분석</span>
        <span className="comp-badge" style={{ color: cc[c], background: cb[c] }}>종합 {c}</span>
      </div>
      <div className="ab-grades">
        {[['전교과', sg['전교과']], ['국영수사과', sg['국영수사과']], ['국영수사', sg['국영수사']], ['국영수', sg['국영수']]].map(([k, v]) => (
          <div key={k} className="ab-grade">
            <div className="ab-grade-lbl">{k}</div>
            <div className="ab-grade-val">{v != null ? v : '-'}</div>
          </div>
        ))}
      </div>
      {Object.values(gy).some(v => v != null) && (
        <div className="ab-year">
          {[['1학년', gy['1학년']], ['2학년', gy['2학년']], ['3학년', gy['3학년']]].map(([k, v]) => (
            <div key={k} className="ab-year-item">
              <div className="ab-year-lbl">{k}</div>
              <div className="ab-year-val">{v != null ? v : '-'}</div>
            </div>
          ))}
        </div>
      )}
      <div className="ab-metrics">
        {[['전공적합성', majorFit], ['활동집중도', activityFocus], ['학업성장성', academicGrowth], ['비교과품질', analysis.extracurricularQuality]].map(([k, v]) => (
          <div key={k} className="ab-metric">
            <div className="ab-metric-lbl">{k}</div>
            <div className="ab-metric-val">{v || '-'}</div>
          </div>
        ))}
      </div>
      {analysis.subjectAnalysis && (
        <div className="ab-analysis">
          <div className="ab-analysis-lbl">교과 분석</div>
          {analysis.subjectAnalysis}
        </div>
      )}
      {analysis.extracurricularAnalysis && (
        <div className="ab-analysis">
          <div className="ab-analysis-lbl">비교과 분석</div>
          {analysis.extracurricularAnalysis}
        </div>
      )}
      {strategy && (
        <div style={{ fontSize: 11, color: '#6B7280', lineHeight: 1.5, paddingTop: 10, borderTop: '1px solid #F3F4F6' }}>
          {strategy}
        </div>
      )}
    </div>
  );
}

function ResultCard({ card, idx, label }) {
  const p = POSS[card.possibility] || POSS['적정'];
  const ts = TYPE_STYLE[card.admissionType] || { bg: '#F3F4F6', color: '#374151' };
  const fmtCut = v => v == null || v === '-' ? '-' : v;
  const fmtNum = v => v == null || v === '-' ? '-' : v;
  return (
    <div className="result-card">
      <div className="rc-bar" style={{ background: p.bar }} />
      <div className="rc-body">
        <div className="rc-badges">
          <div className="rc-rank">{label || idx + 1}</div>
          <div className="rc-poss" style={{ color: p.color, background: p.bg }}>{card.possibility}</div>
          <div className="rc-type" style={{ background: ts.bg, color: ts.color }}>{card.admissionType}</div>
          {card.region && <div className="rc-region-badge">{card.region}</div>}
          {card.essayDate && <div className="rc-essay-badge">논술 {card.essayDate}</div>}
        </div>
        <div className="rc-univ">{card.university}</div>
        <div className="rc-dept-row">
          {card.category && <span className="rc-category">{card.category}</span>}
          {card.category && <span style={{ color: '#E5E7EB' }}>·</span>}
          <span className="rc-dept">{card.department}</span>
        </div>
        <div className="rc-program">{card.programName}</div>
        {card.cutlines && card.cutlines.length > 0 && (
          <table className="rc-table">
            <thead>
              <tr>
                <th>학년도</th>
                <th>컷 등급</th>
                <th>경쟁률</th>
                <th>충원</th>
              </tr>
            </thead>
            <tbody>
              {card.cutlines.map((c, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 700, color: '#374151' }}>{c.year}</td>
                  <td className={c.cut != null ? 'cut' : ''}>{fmtCut(c.cut)}</td>
                  <td>{fmtNum(c.rate) !== '-' ? `${c.rate}:1` : '-'}</td>
                  <td>{fmtNum(c.waitlist)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="rc-meta-row">
          {card.recruitCount != null && (
            <div className="rc-meta-item">
              <span className="rc-meta-label">모집인원</span>
              <span className="rc-meta-val">{card.recruitCount}명</span>
            </div>
          )}
          {card.recruitChange && card.recruitChange !== '-' && (
            <div className="rc-meta-item">
              <span className="rc-meta-label">전년대비</span>
              <span className="rc-meta-val" style={{ color: card.recruitChange.startsWith('▲') ? '#047857' : '#B91C1C' }}>{card.recruitChange}</span>
            </div>
          )}
        </div>
        {card.suneungMin && (
          <div className={`rc-suneung ${card.suneungMin === '없음' ? 'none' : 'has'}`}>
            수능최저 {card.suneungMin}
          </div>
        )}
        {card.admissionMethod && <div className="rc-method">전형방법 · {card.admissionMethod}</div>}
        {card.aiReport && <div className="rc-report">{card.aiReport}</div>}
      </div>
    </div>
  );
}

async function exportToWord(result, form) {
  try {
    const D = window.docx;
    if (!D) { alert('docx 라이브러리 로드 실패'); return; }
    const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, HeadingLevel, AlignmentType, WidthType, BorderStyle } = D;
    const br = () => new Paragraph({ text: '' });
    const tx = (text, opts = {}) => new Paragraph({ children: [new TextRun({ text: String(text || ''), ...opts })] });
    const h1 = text => new Paragraph({ text, heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER });
    const h2 = text => new Paragraph({ text, heading: HeadingLevel.HEADING_2 });
    const noBorder = {
      top: { style: BorderStyle.SINGLE, size: 1, color: 'D1D5DB' },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: 'D1D5DB' },
      left: { style: BorderStyle.SINGLE, size: 1, color: 'D1D5DB' },
      right: { style: BorderStyle.SINGLE, size: 1, color: 'D1D5DB' }
    };
    const cell = (text, bold = false, shade = false) => new TableCell({
      children: [new Paragraph({ children: [new TextRun({ text: String(text ?? '-'), bold, size: 18 })] })],
      shading: shade ? { fill: 'F3F4F6' } : undefined,
      borders: noBorder
    });
    const children = [
      h1('필탑 UniChoice 수시 배치 분석 리포트'),
      tx(`분석일: ${new Date().toLocaleDateString('ko-KR')}  |  2027학년도`, { size: 18, color: '6B7280' }),
      br(),
      h2('학생 정보'),
      tx(`이름: ${form.name}  |  학교: ${form.school}  |  희망학과: ${form.major}`, { size: 20 }),
      br()
    ];
    if (result.student?.analysis) {
      const a = result.student.analysis;
      const sg = a.subjectGrades || {};
      children.push(
        h2('내신 분석'),
        tx(`전교과: ${sg['전교과'] ?? '-'}  |  국영수사과: ${sg['국영수사과'] ?? '-'}  |  국영수사: ${sg['국영수사'] ?? '-'}  |  국영수: ${sg['국영수'] ?? '-'}`, { size: 20 }),
        tx(`전공적합성: ${a.majorFit || '-'}  |  활동집중도: ${a.activityFocus || '-'}  |  학업성장성: ${a.academicGrowth || '-'}  |  종합경쟁력: ${a.overallCompetitiveness || '-'}`, { size: 20 })
      );
      if (a.subjectAnalysis) children.push(tx(`교과 분석: ${a.subjectAnalysis}`, { size: 18 }));
      if (a.extracurricularAnalysis) children.push(tx(`비교과 분석: ${a.extracurricularAnalysis}`, { size: 18 }));
      if (result.student.strategy) children.push(tx(`배치 전략: ${result.student.strategy}`, { size: 18, color: '374151' }));
      children.push(br());
    }
    const addCards = (cards, title) => {
      if (!cards || !cards.length) return;
      children.push(h2(title));
      cards.forEach((card, i) => {
        children.push(br());
        children.push(new Paragraph({ children: [new TextRun({ text: `${i + 1}. ${card.university} · ${card.department}`, bold: true, size: 24 })] }));
        children.push(tx(`${card.admissionType}  |  ${card.programName || '-'}  |  합격가능성: ${card.possibility}  |  ${card.region || '-'}`, { size: 18, color: '374151' }));
        if (card.cutlines?.length) {
          const hdrRow = new TableRow({ children: [cell('학년도', true, true), cell('컷 등급', true, true), cell('경쟁률', true, true), cell('충원', true, true)] });
          const dataRows = card.cutlines.map(c => new TableRow({ children: [cell(c.year), cell(c.cut ?? '-'), cell(c.rate ? `${c.rate}:1` : '-'), cell(c.waitlist ?? '-')] }));
          children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [hdrRow, ...dataRows] }));
        }
        children.push(tx(`모집인원: ${card.recruitCount ?? '-'}명  |  수능최저: ${card.suneungMin || '-'}`, { size: 18 }));
        if (card.admissionMethod) children.push(tx(`전형방법: ${card.admissionMethod}`, { size: 18 }));
        if (card.aiReport) children.push(tx(card.aiReport, { size: 18, color: '374151' }));
      });
    };
    addCards(result.wishCards, '희망대학 레포트');
    addCards(result.cards, 'AI 추천대학 레포트');
    const doc = new Document({ sections: [{ properties: {}, children }] });
    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `UniChoice_${form.name}_${new Date().toISOString().slice(0, 10)}.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    alert('Word 출력 오류: ' + err.message);
  }
}

function ResultScreen({ result, form, onHome }) {
  const [exporting, setExporting] = useState(false);
  const handleExport = async () => {
    setExporting(true);
    try { await exportToWord(result, form); } catch (e) { alert('Word 출력 오류: ' + e.message); }
    setExporting(false);
  };
  const wishCards = result.wishCards || [];
  const recCards = result.cards || [];
  return (
    <>
      <Header onHome={onHome} />
      <StepProgress step={3} />
      <main className="main" style={{ paddingBottom: 40 }}>
        {result.student?.analysis && <AnalysisBox analysis={result.student.analysis} strategy={result.student.strategy} />}
        <div className="result-hd">
          <h2>배치 결과</h2>
          <button className="export-btn" onClick={handleExport} disabled={exporting}>
            {exporting ? '출력 중...' : 'Word 출력'}
          </button>
        </div>
        <div className="result-strategy">{result.student?.strategy || ''}</div>
        {wishCards.length > 0 && (
          <>
            <div className="result-section-title">희망대학 레포트 ({wishCards.length}개)</div>
            {wishCards.map((card, i) => <ResultCard key={i} card={card} idx={i} label={`희망${i + 1}`} />)}
          </>
        )}
        {recCards.length > 0 && (
          <>
            <div className="result-section-title">AI 추천대학 ({recCards.length}개)</div>
            {recCards.map((card, i) => <ResultCard key={i} card={card} idx={i} />)}
          </>
        )}
      </main>
    </>
  );
}

function App() {
  const [screen, setScreen] = useState('home');
  const [form, setForm] = useState({
    name: '', school: '', major: '', record: '', recordFile: null, recordFiles: [], hasEssay: false
  });
  const [wishes, setWishes] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const update = useCallback((k, v) => setForm(p => ({ ...p, [k]: v })), []);
  const handleAnalyze = async () => {
    setSubmitted(true);
    if (!isFormValid(form)) return;
    setScreen('analyzing');
    setError(null);
    try {
      const validWishes = wishes.filter(w => w.university.trim());
      const payload = {
        name: form.name,
        school: form.school,
        major: form.major,
        record: (form.record || '').slice(0, 5000),
        hasEssay: form.hasEssay,
        wishes: validWishes.length > 0 ? validWishes : undefined
      };
      const res = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const t = await res.text().catch(() => '');
        throw new Error(t || `서버 오류 ${res.status}`);
      }
      const data = await res.json();
      setResult(data);
      setScreen('result');
    } catch (err) {
      setError(err.message);
      setScreen('form');
    }
  };
  if (screen === 'home') return <HomeScreen onStart={() => setScreen('form')} />;
  if (screen === 'analyzing') return <AnalyzingScreen />;
  if (screen === 'result') return <ResultScreen result={result} form={form} onHome={() => setScreen('home')} />;
  return (
    <>
      <Header onHome={() => setScreen('home')} />
      <StepProgress step={1} />
      <main className="main">
        {error && <div className="error-box">{error}</div>}
        <div className="intro">
          <h2>수시 배치 분석을 시작합니다</h2>
          <p>생기부를 입력하면 AI가 내신 등급과 비교과 활동을 자동 분석하여<br />실제 입결 데이터 기반 최적 배치 카드를 생성합니다.</p>
          <div className="intro-steps">
            {[['01', '정보 입력', '생기부 업로드'], ['02', 'AI 분석', '20~30초'], ['03', '배치 결과', '카드 6~7장']].map(([ic, t, s], i, arr) => (
              <React.Fragment key={i}>
                <div className="intro-step">
                  <div className="intro-step-icon">{ic}</div>
                  <div className="intro-step-text"><strong>{t}</strong>{s}</div>
                </div>
                {i < arr.length - 1 && <span className="intro-arrow">›</span>}
              </React.Fragment>
            ))}
          </div>
        </div>
        <StudentCard form={form} update={update} submitted={submitted} />
        <RecordCard form={form} update={update} />
        <WishesCard wishes={wishes} setWishes={setWishes} />
        <OptionCard form={form} update={update} />
      </main>
      <SubmitBar onClick={handleAnalyze} valid={isFormValid(form)} />
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
