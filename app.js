const {
  useState,
  useCallback,
  useEffect
} = React;
const POSS = {
  '위험': {
    color: '#B91C1C',
    bg: '#FEE2E2',
    bar: '#EF4444'
  },
  '소신': {
    color: '#B45309',
    bg: '#FEF3C7',
    bar: '#F59E0B'
  },
  '적정': {
    color: '#1D4ED8',
    bg: '#DBEAFE',
    bar: '#3B82F6'
  },
  '안정': {
    color: '#047857',
    bg: '#D1FAE5',
    bar: '#10B981'
  }
};
const TYPE_STYLE = {
  '학생부교과': {
    bg: '#EEF2F9',
    color: '#1A2E55'
  },
  '학생부종합': {
    bg: '#DBEAFE',
    color: '#1D4ED8'
  },
  '논술': {
    bg: '#EDE9FE',
    color: '#6D28D9'
  }
};
const STEPS = ['생기부 텍스트 분석 중', '내신 등급 자동 추출 중', '전공적합성·활동 분석 중', '입결 데이터 조회 중', '교과·종합·논술 후보 선별 중', '최종 배치 리포트 생성 중'];
const isFormValid = f => f.name.trim() && f.school.trim() && f.major.trim();
async function extractPdfText(file) {
  try {
    if (!window.pdfjsLib) return '';
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await window.pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer)
    }).promise;
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
function HomeScreen({
  onStart
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "home-wrap"
  }, /*#__PURE__*/React.createElement("div", {
    className: "home-top"
  }, /*#__PURE__*/React.createElement("div", {
    className: "home-wordmark"
  }, "Uni", /*#__PURE__*/React.createElement("span", null, "Choice")), /*#__PURE__*/React.createElement("div", {
    className: "home-sub"
  }, "생기부 · 내신 기반 대입 수시 배치 분석")), /*#__PURE__*/React.createElement("div", {
    className: "home-divider"
  }), /*#__PURE__*/React.createElement("div", {
    className: "mode-grid"
  }, /*#__PURE__*/React.createElement("div", {
    className: "mode-card mode-card--s",
    onClick: onStart
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "mc-label"
  }, "Susi Analysis"), /*#__PURE__*/React.createElement("div", {
    className: "mc-title"
  }, "수시", /*#__PURE__*/React.createElement("br", null), "배치"), /*#__PURE__*/React.createElement("div", {
    className: "mc-desc"
  }, "생기부 분석부터", /*#__PURE__*/React.createElement("br", null), "전형별 카드 생성까지"), /*#__PURE__*/React.createElement("div", {
    className: "mc-tags"
  }, ['학생부종합', '학생부교과', '논술', '카드 6~7장'].map(t => /*#__PURE__*/React.createElement("span", {
    key: t,
    className: "mc-tag"
  }, t)))), /*#__PURE__*/React.createElement("div", {
    className: "mc-btn mc-btn--start"
  }, /*#__PURE__*/React.createElement("span", null, "배치 시작하기"), /*#__PURE__*/React.createElement("span", null, "→")), /*#__PURE__*/React.createElement("div", {
    className: "mc-num"
  }, "01")), /*#__PURE__*/React.createElement("div", {
    className: "mode-card mode-card--j"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "mc-label"
  }, "Jeongsi Analysis"), /*#__PURE__*/React.createElement("div", {
    className: "mc-title"
  }, "정시", /*#__PURE__*/React.createElement("br", null), "배치"), /*#__PURE__*/React.createElement("div", {
    className: "mc-desc"
  }, "수능 성적 기반", /*#__PURE__*/React.createElement("br", null), "가·나·다군 배치 분석"), /*#__PURE__*/React.createElement("div", {
    className: "mc-tags"
  }, ['가군', '나군', '다군', '3장 카드'].map(t => /*#__PURE__*/React.createElement("span", {
    key: t,
    className: "mc-tag"
  }, t)))), /*#__PURE__*/React.createElement("div", {
    className: "mc-btn mc-btn--soon"
  }, "준비 중"), /*#__PURE__*/React.createElement("div", {
    className: "mc-num"
  }, "02"))), /*#__PURE__*/React.createElement("div", {
    className: "home-minis"
  }, /*#__PURE__*/React.createElement("div", {
    className: "home-mini"
  }, /*#__PURE__*/React.createElement("div", {
    className: "home-mini-ico",
    style: {
      background: '#1A2E55'
    }
  }, "DB"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "home-mini-t"
  }, "입결 데이터"), /*#__PURE__*/React.createElement("div", {
    className: "home-mini-s"
  }, "2021–2026 대교협"))), /*#__PURE__*/React.createElement("div", {
    className: "home-mini"
  }, /*#__PURE__*/React.createElement("div", {
    className: "home-mini-ico",
    style: {
      background: '#047857'
    }
  }, "AI"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "home-mini-t"
  }, "AI 자동 분석"), /*#__PURE__*/React.createElement("div", {
    className: "home-mini-s"
  }, "Claude 기반 배치")))));
}
function Header({
  onHome
}) {
  return /*#__PURE__*/React.createElement("header", {
    className: "hdr"
  }, /*#__PURE__*/React.createElement("div", {
    className: "hdr-logo",
    onClick: onHome
  }, /*#__PURE__*/React.createElement("span", {
    className: "hdr-badge"
  }, "PILTOP"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "hdr-title"
  }, "UniChoice"), /*#__PURE__*/React.createElement("div", {
    className: "hdr-sub"
  }, "AI 수시 배치 분석"))), /*#__PURE__*/React.createElement("span", {
    className: "hdr-year"
  }, "2027학년도"));
}
function StepProgress({
  step
}) {
  const labels = ['정보 입력', 'AI 분석', '배치 결과'];
  return /*#__PURE__*/React.createElement("div", {
    className: "steps-wrap"
  }, /*#__PURE__*/React.createElement("div", {
    className: "steps"
  }, labels.map((lbl, i) => {
    const n = i + 1;
    const cls = n < step ? 'done' : n === step ? 'active' : 'pending';
    return /*#__PURE__*/React.createElement(React.Fragment, {
      key: i
    }, /*#__PURE__*/React.createElement("div", {
      className: "step"
    }, /*#__PURE__*/React.createElement("div", {
      className: `step-num ${cls}`
    }, n < step ? '✓' : n), /*#__PURE__*/React.createElement("span", {
      className: `step-lbl ${n === step ? 'active' : ''}`
    }, lbl)), i < labels.length - 1 && /*#__PURE__*/React.createElement("div", {
      className: "step-line"
    }));
  })));
}
function StudentCard({
  form,
  update,
  submitted
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "sec-head"
  }, /*#__PURE__*/React.createElement("div", {
    className: "sec-icon"
  }, "01"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "sec-title"
  }, "학생 기본 정보"), /*#__PURE__*/React.createElement("div", {
    className: "sec-sub"
  }, "이름 · 학교 · 희망학과 입력"))), /*#__PURE__*/React.createElement("div", {
    className: "row2",
    style: {
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: `field ${submitted && !form.name.trim() ? 'field-err' : ''}`
  }, /*#__PURE__*/React.createElement("div", {
    className: "field-label"
  }, "이름 ", /*#__PURE__*/React.createElement("span", {
    className: "required"
  }, "*")), /*#__PURE__*/React.createElement("input", {
    type: "text",
    placeholder: "홍길동",
    value: form.name,
    onChange: e => update('name', e.target.value),
    maxLength: 20
  }), submitted && !form.name.trim() && /*#__PURE__*/React.createElement("div", {
    className: "err-msg"
  }, "이름을 입력하세요")), /*#__PURE__*/React.createElement("div", {
    className: `field ${submitted && !form.school.trim() ? 'field-err' : ''}`
  }, /*#__PURE__*/React.createElement("div", {
    className: "field-label"
  }, "학교명 ", /*#__PURE__*/React.createElement("span", {
    className: "required"
  }, "*")), /*#__PURE__*/React.createElement("input", {
    type: "text",
    placeholder: "○○고등학교",
    value: form.school,
    onChange: e => update('school', e.target.value),
    maxLength: 30
  }), submitted && !form.school.trim() && /*#__PURE__*/React.createElement("div", {
    className: "err-msg"
  }, "학교명을 입력하세요"))), /*#__PURE__*/React.createElement("div", {
    className: `field ${submitted && !form.major.trim() ? 'field-err' : ''}`
  }, /*#__PURE__*/React.createElement("div", {
    className: "field-label"
  }, "희망 학과 / 계열 ", /*#__PURE__*/React.createElement("span", {
    className: "required"
  }, "*"), /*#__PURE__*/React.createElement("span", {
    className: "f-hint"
  }, "복수 입력 가능")), /*#__PURE__*/React.createElement("input", {
    type: "text",
    placeholder: "예: 경영학과, 경제학과 / 컴퓨터공학과",
    value: form.major,
    onChange: e => update('major', e.target.value)
  }), submitted && !form.major.trim() && /*#__PURE__*/React.createElement("div", {
    className: "err-msg"
  }, "희망 학과를 입력하세요")));
}
function WishesCard({
  wishes,
  setWishes
}) {
  const addWish = () => {
    if (wishes.length >= 6) return;
    setWishes([...wishes, {
      university: '',
      department: '',
      program: ''
    }]);
  };
  const removeWish = i => setWishes(wishes.filter((_, idx) => idx !== i));
  const updateWish = (i, field, val) => {
    const next = [...wishes];
    next[i] = {
      ...next[i],
      [field]: val
    };
    setWishes(next);
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "sec-head"
  }, /*#__PURE__*/React.createElement("div", {
    className: "sec-icon"
  }, "03"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "sec-title"
  }, "희망 대학 입력 ", /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: 'var(--g400)',
      fontWeight: 400
    }
  }, "(선택, 최대 6개)")), /*#__PURE__*/React.createElement("div", {
    className: "sec-sub"
  }, "희망 대학 입력 시 합격 가능성 분석 추가 제공"))), wishes.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr auto',
      gap: 8,
      marginBottom: 6
    }
  }, ['대학명', '학과명', '전형명', ''].map((h, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      fontSize: 11,
      color: 'var(--g400)',
      fontWeight: 600,
      paddingLeft: 2
    }
  }, h))), wishes.map((w, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: "wish-row"
  }, /*#__PURE__*/React.createElement("input", {
    type: "text",
    placeholder: "예: 연세대학교",
    value: w.university,
    onChange: e => updateWish(i, 'university', e.target.value)
  }), /*#__PURE__*/React.createElement("input", {
    type: "text",
    placeholder: "예: 경영학과",
    value: w.department,
    onChange: e => updateWish(i, 'department', e.target.value)
  }), /*#__PURE__*/React.createElement("input", {
    type: "text",
    placeholder: "예: 활동우수형",
    value: w.program,
    onChange: e => updateWish(i, 'program', e.target.value)
  }), /*#__PURE__*/React.createElement("button", {
    className: "wish-del",
    onClick: () => removeWish(i),
    type: "button"
  }, "×")))), wishes.length < 6 && /*#__PURE__*/React.createElement("button", {
    className: "wish-add",
    onClick: addWish,
    type: "button"
  }, "+ 희망 대학 추가 ", wishes.length > 0 ? `(${wishes.length}/6)` : ''));
}
function RecordCard({
  form,
  update
}) {
  const [tab, setTab] = useState('text');
  const [pdfFile, setPdfFile] = useState(null);
  const [imgFiles, setImgFiles] = useState([]);
  const len = form.record.length;
  const isGood = len >= 500;
  const isWarn = len > 0 && len < 200;
  const REC_TABS = [{
    key: 'text',
    label: '텍스트 붙여넣기'
  }, {
    key: 'pdf',
    label: 'PDF 업로드'
  }, {
    key: 'image',
    label: '이미지 업로드'
  }];
  return /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "sec-head"
  }, /*#__PURE__*/React.createElement("div", {
    className: "sec-icon"
  }, "02"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "sec-title"
  }, "생활기록부"), /*#__PURE__*/React.createElement("div", {
    className: "sec-sub"
  }, "AI가 내신 · 비교과 자동 추출 및 분석"))), /*#__PURE__*/React.createElement("div", {
    className: "notice-box"
  }, /*#__PURE__*/React.createElement("div", {
    className: "notice-box-icon"
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 12 12"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M6 1a5 5 0 100 10A5 5 0 006 1zm0 2.5a.75.75 0 110 1.5.75.75 0 010-1.5zM5.25 6h1.5v3h-1.5V6z"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "notice-box-text"
  }, /*#__PURE__*/React.createElement("strong", null, "나이스 또는 학교 포털에서 생기부 전문 복사"), " 후 붙여넣으세요. 내신 등급·비교과 활동을 AI가 자동 분석합니다.")), /*#__PURE__*/React.createElement("div", {
    className: "rec-tabs"
  }, REC_TABS.map(t => /*#__PURE__*/React.createElement("button", {
    key: t.key,
    className: `rec-tab ${tab === t.key ? 'active' : ''}`,
    onClick: () => setTab(t.key),
    type: "button"
  }, t.label))), tab === 'text' && /*#__PURE__*/React.createElement("div", {
    className: "field"
  }, /*#__PURE__*/React.createElement("textarea", {
    placeholder: "[교과학습 발달상황]\n국어: ...\n수학: ...\n\n[세부능력 및 특기사항]\n...\n\n[창의적 체험활동]\n...",
    value: form.record,
    onChange: e => update('record', e.target.value)
  }), /*#__PURE__*/React.createElement("div", {
    className: "char-info"
  }, isWarn ? /*#__PURE__*/React.createElement("span", {
    className: "char-warn"
  }, "500자 이상 입력 권장") : isGood ? /*#__PURE__*/React.createElement("span", {
    className: "char-ok"
  }, "분석에 충분합니다") : /*#__PURE__*/React.createElement("span", null), /*#__PURE__*/React.createElement("span", {
    className: `char-cnt ${isGood ? 'char-ok' : ''}`
  }, len.toLocaleString(), "자"))), tab === 'pdf' && /*#__PURE__*/React.createElement("label", {
    className: `upload-zone ${pdfFile ? 'has-file' : ''}`
  }, /*#__PURE__*/React.createElement("input", {
    type: "file",
    accept: ".pdf",
    onChange: async e => {
      const f = e.target.files[0];
      if (!f) return;
      setPdfFile(f);
      const txt = await extractPdfText(f);
      if (txt && txt.trim().length > 50) update('record', txt);
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "upload-title"
  }, pdfFile ? pdfFile.name : 'PDF 파일을 클릭하거나 드래그'), /*#__PURE__*/React.createElement("div", {
    className: "upload-desc"
  }, pdfFile ? `${(pdfFile.size / 1024).toFixed(0)} KB · 텍스트 추출 완료` : '나이스에서 출력한 생기부 PDF'), /*#__PURE__*/React.createElement("span", {
    className: "upload-hint"
  }, ".pdf 파일만 지원")), tab === 'image' && /*#__PURE__*/React.createElement("label", {
    className: `upload-zone ${imgFiles.length ? 'has-file' : ''}`
  }, /*#__PURE__*/React.createElement("input", {
    type: "file",
    accept: "image/jpeg,image/png",
    multiple: true,
    onChange: e => {
      const fileList = Array.from(e.target.files);
      if (fileList.length) {
        setImgFiles(fileList);
        update('recordFiles', fileList);
      }
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "upload-title"
  }, imgFiles.length ? `${imgFiles.length}개 이미지 선택됨` : '이미지를 클릭하거나 드래그'), /*#__PURE__*/React.createElement("div", {
    className: "upload-desc"
  }, imgFiles.length ? imgFiles.map(f => f.name).join(', ') : '여러 장 선택 가능'), /*#__PURE__*/React.createElement("span", {
    className: "upload-hint"
  }, "JPG · PNG 지원")));
}
function OptionCard({
  form,
  update
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "sec-head"
  }, /*#__PURE__*/React.createElement("div", {
    className: "sec-icon"
  }, "04"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "sec-title"
  }, "전형 옵션"), /*#__PURE__*/React.createElement("div", {
    className: "sec-sub"
  }, "추가 전형 포함 여부 설정"))), /*#__PURE__*/React.createElement("div", {
    className: `chk-opt ${form.hasEssay ? 'on' : ''}`,
    onClick: () => update('hasEssay', !form.hasEssay)
  }, /*#__PURE__*/React.createElement("div", {
    className: `chk-box ${form.hasEssay ? 'on' : ''}`
  }, form.hasEssay && /*#__PURE__*/React.createElement("svg", {
    width: "12",
    height: "12",
    viewBox: "0 0 12 12",
    fill: "none"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M2 6L5 9L10 3",
    stroke: "white",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "chk-text"
  }, /*#__PURE__*/React.createElement("h4", null, "논술전형 포함"), /*#__PURE__*/React.createElement("p", null, "논술을 준비 중이라면 체크하세요. 결과에 논술전형 카드 1~2개가 포함됩니다."))));
}
function SubmitBar({
  onClick,
  valid
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "submit-bar"
  }, /*#__PURE__*/React.createElement("div", {
    className: "submit-inner"
  }, /*#__PURE__*/React.createElement("button", {
    className: "submit-btn",
    onClick: onClick,
    disabled: !valid,
    type: "button"
  }, valid ? 'AI 분석 시작하기' : '이름 · 학교 · 학과를 모두 입력해주세요'), valid && /*#__PURE__*/React.createElement("div", {
    className: "submit-hint"
  }, "분석까지 약 20~30초 소요됩니다")));
}
function AnalyzingScreen() {
  const [cur, setCur] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setCur(c => c < STEPS.length - 1 ? c + 1 : c), 4500);
    return () => clearInterval(t);
  }, []);
  return /*#__PURE__*/React.createElement("div", {
    className: "analyzing-wrap"
  }, /*#__PURE__*/React.createElement("div", {
    className: "analyzing-inner"
  }, /*#__PURE__*/React.createElement("div", {
    className: "analyzing-spinner"
  }), /*#__PURE__*/React.createElement("h2", null, "AI 분석 중"), /*#__PURE__*/React.createElement("p", null, "약 20~30초 소요됩니다"), /*#__PURE__*/React.createElement("div", {
    className: "a-steps"
  }, STEPS.map((s, i) => {
    const cls = i < cur ? 'done' : i === cur ? 'active' : 'pending';
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      className: "a-step"
    }, /*#__PURE__*/React.createElement("div", {
      className: `a-dot ${cls}`
    }, i < cur ? '✓' : i === cur ? '●' : '○'), /*#__PURE__*/React.createElement("span", {
      className: `a-label ${cls}`
    }, s));
  }))));
}
function AnalysisBox({
  analysis,
  strategy
}) {
  const {
    majorFit,
    activityFocus,
    academicGrowth,
    overallCompetitiveness
  } = analysis;
  const cc = {
    '상': '#047857',
    '중': '#1D4ED8',
    '하': '#B91C1C'
  };
  const cb = {
    '상': '#D1FAE5',
    '중': '#DBEAFE',
    '하': '#FEE2E2'
  };
  const c = overallCompetitiveness || '중';
  const sg = analysis.subjectGrades || {};
  const gy = analysis.gradesByYear || {};
  return /*#__PURE__*/React.createElement("div", {
    className: "analysis-box"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ab-header"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ab-title"
  }, "생기부 경쟁력 분석"), /*#__PURE__*/React.createElement("span", {
    className: "comp-badge",
    style: {
      color: cc[c],
      background: cb[c]
    }
  }, "종합 ", c)), /*#__PURE__*/React.createElement("div", {
    className: "ab-grades"
  }, [['전교과', sg['전교과']], ['국영수사과', sg['국영수사과']], ['국영수사', sg['국영수사']], ['국영수', sg['국영수']]].map(([k, v]) => /*#__PURE__*/React.createElement("div", {
    key: k,
    className: "ab-grade"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ab-grade-lbl"
  }, k), /*#__PURE__*/React.createElement("div", {
    className: "ab-grade-val"
  }, v != null ? v : '-')))), Object.values(gy).some(v => v != null) && /*#__PURE__*/React.createElement("div", {
    className: "ab-year"
  }, [['1학년', gy['1학년']], ['2학년', gy['2학년']], ['3학년', gy['3학년']]].map(([k, v]) => /*#__PURE__*/React.createElement("div", {
    key: k,
    className: "ab-year-item"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ab-year-lbl"
  }, k), /*#__PURE__*/React.createElement("div", {
    className: "ab-year-val"
  }, v != null ? v : '-')))), /*#__PURE__*/React.createElement("div", {
    className: "ab-metrics"
  }, [['전공적합성', majorFit], ['활동집중도', activityFocus], ['학업성장성', academicGrowth], ['비교과품질', analysis.extracurricularQuality]].map(([k, v]) => /*#__PURE__*/React.createElement("div", {
    key: k,
    className: "ab-metric"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ab-metric-lbl"
  }, k), /*#__PURE__*/React.createElement("div", {
    className: "ab-metric-val"
  }, v || '-')))), analysis.subjectAnalysis && /*#__PURE__*/React.createElement("div", {
    className: "ab-analysis"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ab-analysis-lbl"
  }, "교과 분석"), analysis.subjectAnalysis), analysis.extracurricularAnalysis && /*#__PURE__*/React.createElement("div", {
    className: "ab-analysis"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ab-analysis-lbl"
  }, "비교과 분석"), analysis.extracurricularAnalysis), strategy && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: '#6B7280',
      lineHeight: 1.5,
      paddingTop: 10,
      borderTop: '1px solid #F3F4F6'
    }
  }, strategy));
}
function ResultCard({
  card,
  idx,
  label
}) {
  const p = POSS[card.possibility] || POSS['적정'];
  const ts = TYPE_STYLE[card.admissionType] || {
    bg: '#F3F4F6',
    color: '#374151'
  };
  const fmtCut = v => v == null || v === '-' ? '-' : v;
  const fmtNum = v => v == null || v === '-' ? '-' : v;
  return /*#__PURE__*/React.createElement("div", {
    className: "result-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "rc-bar",
    style: {
      background: p.bar
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "rc-body"
  }, /*#__PURE__*/React.createElement("div", {
    className: "rc-badges"
  }, /*#__PURE__*/React.createElement("div", {
    className: "rc-rank"
  }, label || idx + 1), /*#__PURE__*/React.createElement("div", {
    className: "rc-poss",
    style: {
      color: p.color,
      background: p.bg
    }
  }, card.possibility), /*#__PURE__*/React.createElement("div", {
    className: "rc-type",
    style: {
      background: ts.bg,
      color: ts.color
    }
  }, card.admissionType), card.region && /*#__PURE__*/React.createElement("div", {
    className: "rc-region-badge"
  }, card.region), card.essayDate && /*#__PURE__*/React.createElement("div", {
    className: "rc-essay-badge"
  }, "논술 ", card.essayDate)), /*#__PURE__*/React.createElement("div", {
    className: "rc-univ"
  }, card.university), /*#__PURE__*/React.createElement("div", {
    className: "rc-dept-row"
  }, card.category && /*#__PURE__*/React.createElement("span", {
    className: "rc-category"
  }, card.category), card.category && /*#__PURE__*/React.createElement("span", {
    style: {
      color: '#E5E7EB'
    }
  }, "·"), /*#__PURE__*/React.createElement("span", {
    className: "rc-dept"
  }, card.department)), /*#__PURE__*/React.createElement("div", {
    className: "rc-program"
  }, card.programName), card.cutlines && card.cutlines.length > 0 && /*#__PURE__*/React.createElement("table", {
    className: "rc-table"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "학년도"), /*#__PURE__*/React.createElement("th", null, "컷 등급"), /*#__PURE__*/React.createElement("th", null, "경쟁률"), /*#__PURE__*/React.createElement("th", null, "충원"))), /*#__PURE__*/React.createElement("tbody", null, card.cutlines.map((c, i) => /*#__PURE__*/React.createElement("tr", {
    key: i
  }, /*#__PURE__*/React.createElement("td", {
    style: {
      fontWeight: 700,
      color: '#374151'
    }
  }, c.year), /*#__PURE__*/React.createElement("td", {
    className: c.cut != null ? 'cut' : ''
  }, fmtCut(c.cut)), /*#__PURE__*/React.createElement("td", null, fmtNum(c.rate) !== '-' ? `${c.rate}:1` : '-'), /*#__PURE__*/React.createElement("td", null, fmtNum(c.waitlist)))))), /*#__PURE__*/React.createElement("div", {
    className: "rc-meta-row"
  }, card.recruitCount != null && /*#__PURE__*/React.createElement("div", {
    className: "rc-meta-item"
  }, /*#__PURE__*/React.createElement("span", {
    className: "rc-meta-label"
  }, "모집인원"), /*#__PURE__*/React.createElement("span", {
    className: "rc-meta-val"
  }, card.recruitCount, "명")), card.recruitChange && card.recruitChange !== '-' && /*#__PURE__*/React.createElement("div", {
    className: "rc-meta-item"
  }, /*#__PURE__*/React.createElement("span", {
    className: "rc-meta-label"
  }, "전년대비"), /*#__PURE__*/React.createElement("span", {
    className: "rc-meta-val",
    style: {
      color: card.recruitChange.startsWith('▲') ? '#047857' : '#B91C1C'
    }
  }, card.recruitChange))), card.suneungMin && /*#__PURE__*/React.createElement("div", {
    className: `rc-suneung ${card.suneungMin === '없음' ? 'none' : 'has'}`
  }, "수능최저 ", card.suneungMin), card.admissionMethod && /*#__PURE__*/React.createElement("div", {
    className: "rc-method"
  }, "전형방법 · ", card.admissionMethod), card.aiReport && /*#__PURE__*/React.createElement("div", {
    className: "rc-report"
  }, card.aiReport)));
}
async function exportToWord(result, form) {
  try {
    const D = window.docx;
    if (!D) {
      alert('docx 라이브러리 로드 실패');
      return;
    }
    const {
      Document,
      Packer,
      Paragraph,
      TextRun,
      Table,
      TableRow,
      TableCell,
      HeadingLevel,
      AlignmentType,
      WidthType,
      BorderStyle
    } = D;
    const br = () => new Paragraph({
      text: ''
    });
    const tx = (text, opts = {}) => new Paragraph({
      children: [new TextRun({
        text: String(text || ''),
        ...opts
      })]
    });
    const h1 = text => new Paragraph({
      text,
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER
    });
    const h2 = text => new Paragraph({
      text,
      heading: HeadingLevel.HEADING_2
    });
    const noBorder = {
      top: {
        style: BorderStyle.SINGLE,
        size: 1,
        color: 'D1D5DB'
      },
      bottom: {
        style: BorderStyle.SINGLE,
        size: 1,
        color: 'D1D5DB'
      },
      left: {
        style: BorderStyle.SINGLE,
        size: 1,
        color: 'D1D5DB'
      },
      right: {
        style: BorderStyle.SINGLE,
        size: 1,
        color: 'D1D5DB'
      }
    };
    const cell = (text, bold = false, shade = false) => new TableCell({
      children: [new Paragraph({
        children: [new TextRun({
          text: String(text ?? '-'),
          bold,
          size: 18
        })]
      })],
      shading: shade ? {
        fill: 'F3F4F6'
      } : undefined,
      borders: noBorder
    });
    const children = [h1('필탑 UniChoice 수시 배치 분석 리포트'), tx(`분석일: ${new Date().toLocaleDateString('ko-KR')}  |  2027학년도`, {
      size: 18,
      color: '6B7280'
    }), br(), h2('학생 정보'), tx(`이름: ${form.name}  |  학교: ${form.school}  |  희망학과: ${form.major}`, {
      size: 20
    }), br()];
    if (result.student?.analysis) {
      const a = result.student.analysis;
      const sg = a.subjectGrades || {};
      children.push(h2('내신 분석'), tx(`전교과: ${sg['전교과'] ?? '-'}  |  국영수사과: ${sg['국영수사과'] ?? '-'}  |  국영수사: ${sg['국영수사'] ?? '-'}  |  국영수: ${sg['국영수'] ?? '-'}`, {
        size: 20
      }), tx(`전공적합성: ${a.majorFit || '-'}  |  활동집중도: ${a.activityFocus || '-'}  |  학업성장성: ${a.academicGrowth || '-'}  |  종합경쟁력: ${a.overallCompetitiveness || '-'}`, {
        size: 20
      }));
      if (a.subjectAnalysis) children.push(tx(`교과 분석: ${a.subjectAnalysis}`, {
        size: 18
      }));
      if (a.extracurricularAnalysis) children.push(tx(`비교과 분석: ${a.extracurricularAnalysis}`, {
        size: 18
      }));
      if (result.student.strategy) children.push(tx(`배치 전략: ${result.student.strategy}`, {
        size: 18,
        color: '374151'
      }));
      children.push(br());
    }
    const addCards = (cards, title) => {
      if (!cards || !cards.length) return;
      children.push(h2(title));
      cards.forEach((card, i) => {
        children.push(br());
        children.push(new Paragraph({
          children: [new TextRun({
            text: `${i + 1}. ${card.university} · ${card.department}`,
            bold: true,
            size: 24
          })]
        }));
        children.push(tx(`${card.admissionType}  |  ${card.programName || '-'}  |  합격가능성: ${card.possibility}  |  ${card.region || '-'}`, {
          size: 18,
          color: '374151'
        }));
        if (card.cutlines?.length) {
          const hdrRow = new TableRow({
            children: [cell('학년도', true, true), cell('컷 등급', true, true), cell('경쟁률', true, true), cell('충원', true, true)]
          });
          const dataRows = card.cutlines.map(c => new TableRow({
            children: [cell(c.year), cell(c.cut ?? '-'), cell(c.rate ? `${c.rate}:1` : '-'), cell(c.waitlist ?? '-')]
          }));
          children.push(new Table({
            width: {
              size: 100,
              type: WidthType.PERCENTAGE
            },
            rows: [hdrRow, ...dataRows]
          }));
        }
        children.push(tx(`모집인원: ${card.recruitCount ?? '-'}명  |  수능최저: ${card.suneungMin || '-'}`, {
          size: 18
        }));
        if (card.admissionMethod) children.push(tx(`전형방법: ${card.admissionMethod}`, {
          size: 18
        }));
        if (card.aiReport) children.push(tx(card.aiReport, {
          size: 18,
          color: '374151'
        }));
      });
    };
    addCards(result.wishCards, '희망대학 레포트');
    addCards(result.cards, 'AI 추천대학 레포트');
    const doc = new Document({
      sections: [{
        properties: {},
        children
      }]
    });
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
function ResultScreen({
  result,
  form,
  onHome
}) {
  const [exporting, setExporting] = useState(false);
  const handleExport = async () => {
    setExporting(true);
    try {
      await exportToWord(result, form);
    } catch (e) {
      alert('Word 출력 오류: ' + e.message);
    }
    setExporting(false);
  };
  const wishCards = result.wishCards || [];
  const recCards = result.cards || [];
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Header, {
    onHome: onHome
  }), /*#__PURE__*/React.createElement(StepProgress, {
    step: 3
  }), /*#__PURE__*/React.createElement("main", {
    className: "main",
    style: {
      paddingBottom: 40
    }
  }, result.student?.analysis && /*#__PURE__*/React.createElement(AnalysisBox, {
    analysis: result.student.analysis,
    strategy: result.student.strategy
  }), /*#__PURE__*/React.createElement("div", {
    className: "result-hd"
  }, /*#__PURE__*/React.createElement("h2", null, "배치 결과"), /*#__PURE__*/React.createElement("button", {
    className: "export-btn",
    onClick: handleExport,
    disabled: exporting
  }, exporting ? '출력 중...' : 'Word 출력')), /*#__PURE__*/React.createElement("div", {
    className: "result-strategy"
  }, result.student?.strategy || ''), wishCards.length > 0 && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "result-section-title"
  }, "희망대학 레포트 (", wishCards.length, "개)"), wishCards.map((card, i) => /*#__PURE__*/React.createElement(ResultCard, {
    key: i,
    card: card,
    idx: i,
    label: `희망${i + 1}`
  }))), recCards.length > 0 && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "result-section-title"
  }, "AI 추천대학 (", recCards.length, "개)"), recCards.map((card, i) => /*#__PURE__*/React.createElement(ResultCard, {
    key: i,
    card: card,
    idx: i
  })))));
}
function App() {
  const [screen, setScreen] = useState('home');
  const [form, setForm] = useState({
    name: '',
    school: '',
    major: '',
    record: '',
    recordFile: null,
    recordFiles: [],
    hasEssay: false
  });
  const [wishes, setWishes] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const update = useCallback((k, v) => setForm(p => ({
    ...p,
    [k]: v
  })), []);
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
        headers: {
          'Content-Type': 'application/json'
        },
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
  if (screen === 'home') return /*#__PURE__*/React.createElement(HomeScreen, {
    onStart: () => setScreen('form')
  });
  if (screen === 'analyzing') return /*#__PURE__*/React.createElement(AnalyzingScreen, null);
  if (screen === 'result') return /*#__PURE__*/React.createElement(ResultScreen, {
    result: result,
    form: form,
    onHome: () => setScreen('home')
  });
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Header, {
    onHome: () => setScreen('home')
  }), /*#__PURE__*/React.createElement(StepProgress, {
    step: 1
  }), /*#__PURE__*/React.createElement("main", {
    className: "main"
  }, error && /*#__PURE__*/React.createElement("div", {
    className: "error-box"
  }, error), /*#__PURE__*/React.createElement("div", {
    className: "intro"
  }, /*#__PURE__*/React.createElement("h2", null, "수시 배치 분석을 시작합니다"), /*#__PURE__*/React.createElement("p", null, "생기부를 입력하면 AI가 내신 등급과 비교과 활동을 자동 분석하여", /*#__PURE__*/React.createElement("br", null), "실제 입결 데이터 기반 최적 배치 카드를 생성합니다."), /*#__PURE__*/React.createElement("div", {
    className: "intro-steps"
  }, [['01', '정보 입력', '생기부 업로드'], ['02', 'AI 분석', '20~30초'], ['03', '배치 결과', '카드 6~7장']].map(([ic, t, s], i, arr) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: i
  }, /*#__PURE__*/React.createElement("div", {
    className: "intro-step"
  }, /*#__PURE__*/React.createElement("div", {
    className: "intro-step-icon"
  }, ic), /*#__PURE__*/React.createElement("div", {
    className: "intro-step-text"
  }, /*#__PURE__*/React.createElement("strong", null, t), s)), i < arr.length - 1 && /*#__PURE__*/React.createElement("span", {
    className: "intro-arrow"
  }, "›"))))), /*#__PURE__*/React.createElement(StudentCard, {
    form: form,
    update: update,
    submitted: submitted
  }), /*#__PURE__*/React.createElement(RecordCard, {
    form: form,
    update: update
  }), /*#__PURE__*/React.createElement(WishesCard, {
    wishes: wishes,
    setWishes: setWishes
  }), /*#__PURE__*/React.createElement(OptionCard, {
    form: form,
    update: update
  })), /*#__PURE__*/React.createElement(SubmitBar, {
    onClick: handleAnalyze,
    valid: isFormValid(form)
  }));
}
ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(App, null));
