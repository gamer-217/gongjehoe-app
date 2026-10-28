// 컴포넌트 미리보기(P5, §9.4)
import { useState } from 'react';
import { Home, Landmark } from 'lucide-react';
import {
  AmountDisplay, Banner, BarChart, BottomSheet, Button, Card, ChipGroup, DataTable, EmptyState, HideAmountButton, KPI, LineChart,
  List, ListRow, ProgressRing, Skeleton, StatusBadge, Stepper, Timeline, Toast,
} from '../ui';

const tokens = ['--color-primary', '--color-primary-weak', '--color-text', '--color-text-sub', '--color-bg', '--color-surface', '--color-success', '--color-warning', '--color-danger', '--color-employer'];

export function Preview() {
  const [chip, setChip] = useState<string>('a');
  const [hidden, setHidden] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  return (
    <div className="ui-desktop">
      <h1 className="ui-title-lg">디자인 시스템 미리보기</h1>
      <p className="ui-sub">토큰은 src/ui/tokens.css(설계서 §9.2 임시값, KRDS 확인 후 교체)</p>
      <div className="ui-preview-grid">
        <Card>
          <h2 className="ui-strong">색 토큰</h2>
          <div className="ui-stack ui-stack--tight ui-mt">
            {tokens.map((t) => (
              <div key={t} className="ui-swatch">
                <span style={{ background: `var(${t})` }} />
                <code>{t}</code>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <h2 className="ui-strong">글자</h2>
          <p className="ui-title-lg">제목 24</p>
          <p className="ui-title">제목 20</p>
          <p>본문 17 — The quick brown fox · Tiếng Việt có dấu · Bahasa Indonesia</p>
          <p lang="ne" className="ui-sub">नेपाली देवनागरी पाठ — बचत खाता</p>
          <p className="ui-small">보조 14</p>
        </Card>
        <Card>
          <h2 className="ui-strong">AmountDisplay · HideAmount · ProgressRing</h2>
          <div className="ui-row ui-mt">
            <AmountDisplay value={5436835} size="xl" hidden={hidden} srLabel="5,436,835원" hiddenLabel="가려짐" />
            <HideAmountButton hidden={hidden} onToggle={() => setHidden(!hidden)} showLabel="보기" hideLabel="가리기" />
          </div>
          <div className="ui-row ui-mt">
            <ProgressRing ratio={36 / 58} big="36" small="/ 58개월" label="36/58" />
            <ProgressRing ratio={1} full big="만기" small="70개월" label="만기" />
          </div>
        </Card>
        <Card>
          <h2 className="ui-strong">Button · StatusBadge</h2>
          <div className="ui-stack ui-mt">
            <Button block>주요 버튼</Button>
            <div className="ui-grid-2">
              <Button variant="secondary">보조</Button>
              <Button variant="danger">위험</Button>
            </div>
            <Button disabled block>
              비활성
            </Button>
            <div className="ui-row ui-row--wrap">
              <StatusBadge tone="success">납입 확인</StatusBadge>
              <StatusBadge tone="neutral">확인 전</StatusBadge>
              <StatusBadge tone="danger">미납</StatusBadge>
              <StatusBadge tone="info">제안</StatusBadge>
              <StatusBadge tone="warning">예시</StatusBadge>
            </div>
          </div>
        </Card>
        <Card>
          <h2 className="ui-strong">ChipGroup · Stepper</h2>
          <div className="ui-stack ui-mt">
            <ChipGroup label="예" value={chip} onChange={setChip} options={[{ value: 'a', label: '지금' }, { value: 'b', label: '6개월 뒤' }, { value: 'c', label: '1년 뒤' }]} />
            <Stepper current={2} total={4} nowText="2/4 · 돈을 받을 계좌를 골라요" progressLabel="단계" />
          </div>
        </Card>
        <List>
          <ListRow icon={<Home size={22} aria-hidden />} title="ListRow 제목" desc="설명 한 줄" chevron to="/ui" />
          <ListRow icon={<Landmark size={22} aria-hidden />} title="끝 요소" end={<StatusBadge tone="success">사용 중</StatusBadge>} />
        </List>
        <Card>
          <h2 className="ui-strong">Timeline</h2>
          <div className="ui-mt">
            <Timeline
              label="진행"
              items={[
                { key: '1', title: '접수', desc: '2026.10.15', state: 'done', stateLabel: '완료' },
                { key: '2', title: '출국 확인', state: 'current', stateLabel: '진행 중' },
                { key: '3', title: '지급 승인', state: 'todo', stateLabel: '예정' },
                { key: '4', title: '반려됨', state: 'bad', stateLabel: '중단' },
              ]}
            />
          </div>
        </Card>
        <div className="ui-stack">
          <Banner tone="info" title="정보">안내 문구</Banner>
          <Banner tone="warning" title="주의">주의 문구</Banner>
          <Banner tone="danger" title="오류">오류 문구</Banner>
          <Banner tone="success" title="완료">완료 문구</Banner>
        </div>
        <Card>
          <h2 className="ui-strong">LineChart · BarChart</h2>
          <LineChart
            label="비교"
            showLegend
            yFormat={(v) => `${v.toFixed(1)}%`}
            xLabels={['26', '27', '28', '29', '30', '31', '32', '33']}
            series={[
              { name: '국민연금', color: '#8a949e', values: [4.75, 5, 5.25, 5.5, 5.75, 6, 6.25, 6.5] },
              { name: '공제회', color: 'var(--color-primary)', values: [2, 2, 3, 3, 4, 4, 4, 4] },
            ]}
          />
          <div className="ui-mt">
            <BarChart label="막대" rows={[{ key: 'a', label: '공제회', valueText: '₩5,436,835', value: 5436835, extra: 1200000 }, { key: 'b', label: '국민연금', valueText: '₩3,100,000', value: 3100000, tone: 'gray' }]} />
          </div>
        </Card>
        <Card>
          <h2 className="ui-strong">EmptyState · Skeleton</h2>
          <EmptyState title="아직 내역이 없어요" />
          <Skeleton height={48} />
        </Card>
        <div className="ui-kpis">
          <KPI label="이번 달 납부" value="₩412,000" note="추가 입력 0" />
          <KPI label="재직 인원" value="4명" />
        </div>
        <DataTable
          caption="표"
          rowKey={(r) => r.n}
          columns={[
            { key: 'n', header: '이름', render: (r: { n: string; v: number }) => r.n },
            { key: 'v', header: '금액', numeric: true, render: (r: { n: string; v: number }) => r.v.toLocaleString('en-US') },
          ]}
          rows={[{ n: 'Ramesh', v: 5436835 }, { n: 'Siti', v: 8543842 }]}
        />
        <Card>
          <h2 className="ui-strong">BottomSheet · Toast</h2>
          <div className="ui-grid-2 ui-mt">
            <Button variant="secondary" onClick={() => setSheet(true)}>
              시트 열기
            </Button>
            <Button variant="secondary" onClick={() => setToast('저장했어요.')}>
              토스트
            </Button>
          </div>
        </Card>
      </div>
      <BottomSheet open={sheet} onClose={() => setSheet(false)} title="본인이 맞나요?" closeLabel="닫기">
        <p>시간 제한 없음</p>
        <Button block onClick={() => setSheet(false)}>
          네, 본인이에요
        </Button>
      </BottomSheet>
      <Toast message={toast} onDone={() => setToast(null)} />
    </div>
  );
}
