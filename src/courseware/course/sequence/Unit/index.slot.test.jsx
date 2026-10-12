import React from 'react';
import { render, screen } from '@testing-library/react';
import { PluginSlot } from '@openedx/frontend-plugin-framework';
import { getCourseDiscussionConfig, getCourseTopics } from '@src/courseware/data/api';
import { useExamAccess, useShouldDisplayHonorCode } from './hooks';
import ContentIFrame from './ContentIFrame';
import Unit from '.';

const mockCourseHome = { tabs: [{ slug: 'discussion' }] };
const mockUnit = { title: 'Native unit' };

jest.mock('@openedx/frontend-plugin-framework', () => ({
  PluginSlot: jest.fn(({ children }) => <>{children}</>),
}));
jest.mock('react-router-dom', () => ({
  useSearchParams: () => [new URLSearchParams()],
  useLocation: () => ({ pathname: '/course/course-v1:known' }),
}));
jest.mock('@edx/frontend-platform/react', () => ({
  AppContext: jest.requireActual('react').createContext({ authenticatedUser: { userId: 1 } }),
}));
jest.mock('@edx/frontend-platform/i18n', () => ({
  defineMessages: messages => messages,
  useIntl: () => ({ formatMessage: () => 'Native loading' }),
}));
jest.mock('@src/generic/model-store', () => ({
  useModel: name => (name === 'courseHomeMeta' ? mockCourseHome : mockUnit),
}));
jest.mock('@src/generic/plugin-store', () => ({ usePluginsCallback: (name, fallback) => fallback }));
jest.mock('@src/courseware/data/api', () => ({
  getCourseDiscussionConfig: jest.fn(), getCourseTopics: jest.fn(),
}));
jest.mock('./hooks', () => ({
  useExamAccess: jest.fn(), useShouldDisplayHonorCode: jest.fn(),
}));
jest.mock('./urls', () => ({ getIFrameUrl: () => 'https://lms.invalid/xblock/known' }));
jest.mock('../../../../plugin-slots/UnitTitleSlot', () => function () {
  return <h3>Native title</h3>;
});
jest.mock('./UnitSuspense', () => function () {
  return <div>Native loading state</div>;
});
jest.mock('./ContentIFrame', () => jest.fn(props => (
  <iframe id={props.elementId} src={props.iframeUrl} title={props.title} />
)));

const props = {
  courseId: 'course-v1:known',
  id: 'block-v1:known',
  isOriginalUserStaff: false,
  renderUnitNavigation: jest.fn(),
  onLoaded: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
  useExamAccess.mockReturnValue({ blockAccess: false });
  useShouldDisplayHonorCode.mockReturnValue(false);
});

test('unit content slot supplies native identity and lazy discussion readers', () => {
  render(<Unit {...props} />);
  expect(PluginSlot).toHaveBeenCalledWith(expect.objectContaining({
    id: 'org.openedx.frontend.learning.unit_content.v1',
    pluginProps: {
      courseId: props.courseId,
      unitId: props.id,
      courseHome: mockCourseHome,
      loadDiscussionConfig: getCourseDiscussionConfig,
      loadTopics: getCourseTopics,
    },
  }), expect.anything());
  expect(getCourseDiscussionConfig).not.toHaveBeenCalled();
  expect(getCourseTopics).not.toHaveBeenCalled();
});

test('unit content defaults retain loading, one player and its native callback', () => {
  render(<Unit {...props} />);
  expect(screen.getByText('Native loading state')).toBeTruthy();
  expect(screen.getAllByTitle('Native unit')).toHaveLength(1);
  expect(ContentIFrame).toHaveBeenCalledWith(expect.objectContaining({
    id: props.id,
    courseId: props.courseId,
    onLoaded: props.onLoaded,
    elementId: 'unit-iframe',
    iframeUrl: 'https://lms.invalid/xblock/known',
    shouldShowContent: true,
  }), expect.anything());
});

test.each([[true, false], [false, true], [true, true]])('unit content retains exam=%s and honor=%s access guards', (exam, honor) => {
  useExamAccess.mockReturnValue({ blockAccess: exam });
  useShouldDisplayHonorCode.mockReturnValue(honor);
  render(<Unit {...props} />);
  expect(ContentIFrame).toHaveBeenCalledWith(expect.objectContaining({ shouldShowContent: false }), expect.anything());
});
