import React from 'react';
import { render, screen } from '@testing-library/react';
import { PluginSlot } from '@openedx/frontend-plugin-framework';
import { getAuthenticatedUser } from '@edx/frontend-platform/auth';
import { isRtl } from '@edx/frontend-platform/i18n';
import CourseCompletion from './course-completion/CourseCompletion';
import ProgressHeader from './ProgressHeader';
import CourseGrade from './grades/course-grade/CourseGrade';
import CurrentGradeTooltip from './grades/course-grade/CurrentGradeTooltip';
import CertificateStatus from './certificate-status/CertificateStatus';

const mockProgress = {
  studioUrl: 'https://studio.invalid/course/known',
  username: 'known',
  gradingPolicy: { gradeRange: { Pass: 0.65 } },
  courseGrade: { isPassing: false, percent: 0.42 },
  assignmentTypeGradeSummary: [{ hasHiddenContribution: 'none' }],
  certificateData: { certStatus: 'downloadable', certWebViewUrl: '/certificates/known' },
};
const mockFooter = jest.fn(() => <div>Native footer</div>);

jest.mock('@openedx/frontend-plugin-framework', () => ({
  PluginSlot: jest.fn(({ children }) => <>{children}</>),
}));
jest.mock('@edx/frontend-platform/auth', () => ({ getAuthenticatedUser: jest.fn() }));
jest.mock('@edx/frontend-platform/analytics', () => ({ sendTrackEvent: jest.fn() }));
jest.mock('@edx/frontend-platform', () => ({ getConfig: () => ({ LMS_BASE_URL: 'https://lms.invalid' }) }));
jest.mock('@edx/frontend-platform/i18n', () => ({
  defineMessages: messages => messages,
  useIntl: () => ({ formatMessage: message => message?.defaultMessage || 'Native message' }),
  getLocale: () => 'en',
  isRtl: jest.fn(),
  FormattedMessage: () => <span>Native certificate body</span>,
  FormattedDate: () => null,
}));
jest.mock('react-redux', () => ({
  useSelector: select => select({ courseHome: { courseId: 'course-v1:known', targetUserId: null } }),
  useDispatch: () => jest.fn(),
}));
jest.mock('@src/data/hooks', () => ({ useContextId: () => 'course-v1:known' }));
jest.mock('@src/generic/model-store', () => ({
  useModel: name => (name === 'progress' ? mockProgress : { isEnrolled: true, canViewCertificate: true }),
}));
jest.mock('@openedx/paragon', () => {
  const types = jest.requireActual('prop-types');
  const Card = ({ children, className }) => <div className={className}>{children}</div>;
  Card.Header = function ({ title }) {
    return <h2>{title}</h2>;
  };
  Card.Section = function ({ children }) {
    return <div>{children}</div>;
  };
  Card.Footer = function ({ children }) {
    return <footer>{children}</footer>;
  };
  const Popover = ({ children }) => <aside>{children}</aside>;
  Popover.Content = function ({ children, className }) {
    return <span data-testid="tooltip-content" className={className}>{children}</span>;
  };
  Card.propTypes = { children: types.node, className: types.string };
  Card.Header.propTypes = { title: types.node };
  Card.Section.propTypes = { children: types.node };
  Card.Footer.propTypes = { children: types.node };
  Popover.propTypes = { children: types.node };
  Popover.Content.propTypes = { children: types.node, className: types.string };
  const Button = ({ children, href, size }) => <a href={href} data-size={size}>{children}</a>;
  Button.propTypes = { children: types.node, href: types.string, size: types.string };
  const OverlayTrigger = ({ overlay, children }) => <>{overlay}<svg>{children}</svg></>;
  OverlayTrigger.propTypes = { overlay: types.node, children: types.node };
  return {
    Card, Popover, Button, OverlayTrigger,
  };
});
jest.mock('./course-completion/CompletionDonutChart', () => function () {
  return <div>Native chart</div>;
});
jest.mock('./grades/course-grade/CourseGradeFooter', () => props => mockFooter(props));
jest.mock('./grades/course-grade/CourseGradeHeader', () => function () {
  return <div>Native locked header</div>;
});
jest.mock('./grades/course-grade/GradeBar', () => function () {
  return <div>Native grade bar</div>;
});
jest.mock('./credit-information/CreditInformation', () => () => null);
jest.mock('@src/courseware/course/course-exit/utils', () => ({
  COURSE_EXIT_MODES: { disabled: 'disabled', nonPassing: 'nonPassing', celebration: 'celebration' },
  getCourseExitMode: () => 'celebration',
}));
jest.mock('@src/shared/links', () => ({ DashboardLink: () => null, IdVerificationSupportLink: () => null, ProfileLink: () => null }));
jest.mock('../data/thunks', () => ({ requestCert: jest.fn() }));
jest.mock('@src/plugin-slots/ProgressCertificateStatusSlot', () => {
  const NativeCertificateSlot = ({ children }) => <>{children}</>;
  const types = jest.requireActual('prop-types');
  NativeCertificateSlot.propTypes = { children: types.node };
  return NativeCertificateSlot;
});

beforeEach(() => {
  jest.clearAllMocks();
  getAuthenticatedUser.mockReturnValue({ administrator: true, userId: 27 });
  isRtl.mockReturnValue(false);
  mockProgress.courseGrade = { isPassing: false, percent: 0.42 };
  mockProgress.gradesFeatureIsFullyLocked = false;
  mockProgress.gradesFeatureIsPartiallyLocked = false;
});

const slot = id => PluginSlot.mock.calls.find(([props]) => props.id.endsWith(id))[0];

test('completion card exposes the original section and chart as default content', () => {
  const view = render(<CourseCompletion />);
  expect(slot('progress_card.v1').children.props.className).toBe('text-dark-700 mb-4 rounded raised-card p-4');
  expect(view.container.querySelectorAll('section')).toHaveLength(1);
  expect(screen.getByText('Native chart')).toBeTruthy();
});

test('Studio action host preserves native admin guard and button target and size', () => {
  const view = render(<ProgressHeader />);
  const button = slot('progress_header_action.v1').children;
  expect(button.props.href).toBe(mockProgress.studioUrl);
  expect(button.props.size).toBe('sm');
  expect(button.props.variant).toBe('outline-primary');
  jest.clearAllMocks();
  getAuthenticatedUser.mockReturnValue({ administrator: false, userId: 27 });
  view.rerender(<ProgressHeader />);
  expect(PluginSlot).not.toHaveBeenCalled();
  expect(view.container.querySelector('a')).toBeNull();
});

test('grade host preserves native passing-grade calculation and locked overlay', () => {
  mockProgress.gradesFeatureIsFullyLocked = true;
  const view = render(<CourseGrade />);
  expect(slot('progress_card.v1').pluginProps).toEqual({ courseId: 'course-v1:known', cardKind: 'course-grade' });
  expect(mockFooter).toHaveBeenCalledWith({ passingGrade: 65 });
  expect(view.container.querySelector('.locked-overlay').getAttribute('aria-hidden')).toBe('true');
  expect(screen.getByText('Native locked header')).toBeTruthy();
});

test.each([[false, false], [true, false], [false, true]])('tooltip host preserves native passing=%s RTL=%s grade and classes', (passing, rtl) => {
  mockProgress.courseGrade.isPassing = passing;
  isRtl.mockReturnValue(rtl);
  const view = render(<svg><CurrentGradeTooltip /></svg>);
  expect(slot('progress_grade_tooltip.v1').pluginProps).toEqual({ isPassing: passing });
  expect(screen.getByTestId('tooltip-content').getAttribute('class')).toBe(passing ? 'text-white' : 'text-dark-700');
  expect(screen.getByTestId('tooltip-content').textContent).toBe(rtl ? '42\u200f%' : '42%');
  expect(view.container.querySelector('circle').getAttribute('cx')).toBe(rtl ? '58%' : '42%');
});

test('certificate host preserves native downloadable state and authoritative LMS link', () => {
  render(<CertificateStatus />);
  expect(slot('progress_card.v1').pluginProps).toEqual({ courseId: 'course-v1:known', cardKind: 'certificate-status' });
  expect(slot('progress_card.v1').children.props.className).toBe('bg-light-200 raised-card');
  expect(screen.getByRole('link').getAttribute('href')).toBe('https://lms.invalid/certificates/known');
  expect(screen.getByText('Native certificate body')).toBeTruthy();
});
