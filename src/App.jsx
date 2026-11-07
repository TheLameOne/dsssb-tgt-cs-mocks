import { useEffect } from 'react';
import { LoadError, Loading } from './components/Status.jsx';
import { fetchManifest } from './lib/data.js';
import { useRoute } from './lib/router.js';
import { useLoad } from './lib/useLoad.js';
import { Exam } from './pages/Exam.jsx';
import { Home } from './pages/Home.jsx';
import { Instructions } from './pages/Instructions.jsx';
import { PastPapers } from './pages/PastPapers.jsx';
import { Practice } from './pages/Practice.jsx';
import { PracticeRun } from './pages/PracticeRun.jsx';
import { Progress } from './pages/Progress.jsx';
import { Result } from './pages/Result.jsx';
import { Review } from './pages/Review.jsx';
import { Syllabus } from './pages/Syllabus.jsx';

const NAV = [
  { href: '#/', label: 'Mocks', match: ['', 'mock', 'result', 'review'] },
  { href: '#/practice', label: 'Practice', match: ['practice'] },
  { href: '#/progress', label: 'Progress', match: ['progress'] },
  { href: '#/syllabus', label: 'Syllabus', match: ['syllabus'] },
  { href: '#/papers', label: 'Past papers', match: ['papers'] },
];

function Shell({ section, children }) {
  return (
    <div className="sheet">
      <header className="masthead">
        <a className="brand" href="#/">
          <span className="brand-bubble" aria-hidden="true" />
          DSSSB TGT CS Mocks
        </a>
        <nav aria-label="Main">
          <ul className="nav">
            {NAV.map((item) => (
              <li key={item.href}>
                <a href={item.href} aria-current={item.match.includes(section) ? 'page' : undefined}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main className="page">{children}</main>
    </div>
  );
}

function NotFound() {
  return (
    <div className="notice">
      <p>This page does not exist.</p>
      <a className="btn" href="#/">
        Go to the mocks
      </a>
    </div>
  );
}

export function App() {
  const { parts, query } = useRoute();
  const manifest = useLoad(fetchManifest, 'manifest');
  const [section = '', id] = parts;

  useEffect(() => {
    if (!query.q) window.scrollTo(0, 0);
    // Scroll to the top whenever the page changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parts.join('/')]);

  // The exam console takes over the whole screen, like the real one.
  if (section === 'exam' && id) return <Exam key={id} mockId={id} />;

  let content;
  if (manifest.error) content = <LoadError what="The question data" onRetry={manifest.retry} />;
  else if (!manifest.data) content = <Loading what="Loading the mocks" />;
  else {
    const m = manifest.data;
    if (section === '') content = <Home manifest={m} />;
    else if (section === 'mock' && id) content = <Instructions key={id} manifest={m} mockId={id} />;
    else if (section === 'result' && id) content = <Result key={id} attemptId={id} />;
    else if (section === 'review' && id) content = <Review key={id} attemptId={id} focus={query.q} show={query.show} />;
    else if (section === 'practice' && id === 'run') content = <PracticeRun manifest={m} />;
    else if (section === 'practice') content = <Practice manifest={m} preset={query} />;
    else if (section === 'progress') content = <Progress manifest={m} />;
    else if (section === 'syllabus') content = <Syllabus manifest={m} />;
    else if (section === 'papers') content = <PastPapers />;
    else content = <NotFound />;
  }
  return <Shell section={section}>{content}</Shell>;
}
