// 데모 런처(§7.3) — 앱 밖 화면. 연구 소개와 시연 데이터 안내
import { Link } from 'react-router-dom';
import { Building2, ChartPie, FlaskConical, Palette, RotateCcw } from 'lucide-react';
import { useQuery, useRepo } from '../data/context';
import { displayName, summarize } from '../data/selectors';
import { Banner, Button, Card, StatusBadge, formatKrw } from '../ui';
import { setLang } from '../i18n';
import { session } from '../apps/worker/Start';

export function Launcher() {
  const repo = useRepo();
  const q = useQuery((r) => r.listMembers(), []);
  return (
    <div className="ui-launcher">
      <header className="ui-stack ui-stack--tight">
        <StatusBadge tone="warning">시연 데이터</StatusBadge>
        <h1 className="ui-title-lg">일하는 외국인 공제회 — 프로토타입 v2</h1>
        <p className="ui-sub">
          단기순환 외국인력(E-9·H-2)을 위한 개인계좌형 공제회 시연. 근거: 이성옥·김태희(2025), 다문화콘텐츠연구 54집. 모든 인물·금액은 시연용이며, 제안 제도는 "(제안)"으로 표시합니다.
        </p>
      </header>

      <section className="ui-stack">
        <h2 className="ui-title">근로자 앱으로 입장</h2>
        <div className="ui-launcher__grid">
          {q.status === 'ok' &&
            q.data.map((v) => {
              const s = summarize(v);
              return (
                <Link key={v.member.member_id} to={`/w/${v.member.member_id}/start`} className="ui-card" onClick={() => {
                    void setLang(v.member.lang);
                    session.set(v.member.member_id);
                  }}>
                  <p className="ui-strong">{displayName(v)}</p>
                  <p className="ui-small">
                    {v.person.nationality_iso2} · {v.visa.visa_type} · {v.member.lang} · 가입 {s.seq}개월
                  </p>
                  <p className="ui-amount ui-amount--lg ui-mt">{s.track === 'FUND' ? `₩${formatKrw(s.total)}` : '국민연금 대상'}</p>
                  <p className="ui-small">{scenario[v.member.member_id]}</p>
                </Link>
              );
            })}
        </div>
      </section>

      <section className="ui-stack">
        <h2 className="ui-title">기관 화면</h2>
        <div className="ui-launcher__grid">
          <Link to="/e" className="ui-card">
            <Building2 aria-hidden />
            <p className="ui-strong ui-mt">사업주 포털</p>
            <p className="ui-small">한빛정밀(주) · 근로자별 기여·국민연금 대비 비용</p>
          </Link>
          <Link to="/a" className="ui-card">
            <ChartPie aria-hidden />
            <p className="ui-strong ui-mt">운영자</p>
            <p className="ui-small">기금 현황 · 환급 처리함</p>
          </Link>
          <Link to="/ui" className="ui-card">
            <Palette aria-hidden />
            <p className="ui-strong ui-mt">컴포넌트 미리보기</p>
            <p className="ui-small">디자인 토큰·컴포넌트(§9)</p>
          </Link>
          <Link to="/study" className="ui-card">
            <FlaskConical aria-hidden />
            <p className="ui-strong ui-mt">사용성 테스트 기록</p>
            <p className="ui-small">?study=1 기록 내보내기(§11.2)</p>
          </Link>
        </div>
      </section>

      <Card>
        <div className="ui-row ui-row--between ui-row--wrap">
          <div>
            <p className="ui-strong">시연 초기화</p>
            <p className="ui-small">신청·수급권자·계좌 변경분을 지우고 처음 데이터로 돌아갑니다.</p>
          </div>
          <Button variant="secondary" onClick={() => repo.reset()}>
            <RotateCcw size={18} aria-hidden />
            초기화
          </Button>
        </div>
      </Card>
      <Banner tone="info">
        <p>
          사용성 테스트는 주소 끝에 <code>?study=1</code>을 붙여 여세요(예: <code>/gongjehoe-app/?study=1</code>, 일반 앱처럼 스플래시부터 시작). 데모 칩이 숨겨지고 화면 전환·클릭이 이 브라우저에만 기록됩니다.
        </p>
      </Banner>
    </div>
  );
}

const scenario: Record<string, string> = {
  W001: '기본 시나리오 · 사업장 1곳 · 국민연금 비적용국',
  W002: '미얀마 · 13개월째 사업장 변경(1개월 공백) — 요율 연속성 · 9월분 미납',
  W003: '방글라데시 · 건보 미납 알림 · 만기 임박',
  W004: '카자흐스탄 고려인(H-2) · 만기 초과 · 장기 체류 전환',
  W005: '베트남(국민연금 적용국) · 공제회 대상 아님 → 국민연금 반환일시금 안내(B안)',
};
