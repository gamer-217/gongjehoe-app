// 연구 기록 종료·내보내기(§11.2) — 연구자용 화면
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card } from '../ui';
import { clearStudyLog, isStudy, readStudyLog } from '../apps/shared/study';

export function StudyEnd() {
  const [log, setLog] = useState(readStudyLog());
  const download = () => {
    const blob = new Blob([JSON.stringify({ app: 'gongjehoe-v2', events: log }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'study-log.json';
    a.click();
    URL.revokeObjectURL(a.href);
  };
  return (
    <div className="ui-launcher">
      <h1 className="ui-title-lg">사용성 테스트 기록</h1>
      <p className="ui-sub">기록 모드: {isStudy() ? '켜짐' : '꺼짐'} · 이벤트 {log.length}건 · 서버 전송 없음, 이름·번호 저장 없음</p>
      <Card>
        <div className="ui-row ui-row--wrap">
          <Button onClick={download} disabled={!log.length}>
            JSON 내보내기
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              clearStudyLog();
              setLog([]);
            }}
          >
            기록 지우기
          </Button>
          <Link to="/">런처로</Link>
        </div>
      </Card>
    </div>
  );
}
