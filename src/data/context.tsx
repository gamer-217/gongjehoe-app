import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { MockRepository } from './mock';
import type { Repository } from './repository';

const RepoContext = createContext<Repository | null>(null);

export function RepoProvider(props: { children: ReactNode; repo?: Repository }) {
  const [repo] = useState<Repository>(() => props.repo ?? new MockRepository());
  return <RepoContext.Provider value={repo}>{props.children}</RepoContext.Provider>;
}

export function useRepo(): Repository {
  const r = useContext(RepoContext);
  if (!r) throw new Error('RepoProvider missing');
  return r;
}

export type Query<T> = { status: 'loading'; data?: undefined; error?: undefined } | { status: 'ok'; data: T; error?: undefined } | { status: 'error'; error: Error; data?: undefined };

/** 저장소 조회 — 데이터가 바뀌면 다시 읽는다 */
export function useQuery<T>(fn: (repo: Repository) => Promise<T>, deps: unknown[]): Query<T> {
  const repo = useRepo();
  const [version, setVersion] = useState(0);
  const [state, setState] = useState<Query<T>>({ status: 'loading' });
  useEffect(() => repo.subscribe(() => setVersion((v) => v + 1)), [repo]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(fn, deps);
  useEffect(() => {
    let alive = true;
    run(repo).then(
      (data) => alive && setState({ status: 'ok', data }),
      (error: Error) => alive && setState({ status: 'error', error }),
    );
    return () => {
      alive = false;
    };
  }, [repo, run, version]);
  return state;
}
