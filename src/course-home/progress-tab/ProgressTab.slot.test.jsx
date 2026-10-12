import React from 'react';
import { render, screen } from '@testing-library/react';
import { PluginSlot } from '@openedx/frontend-plugin-framework';
import { fetchProgressTab } from '../data/thunks';
import { useGetExamsData } from './hooks';
import ProgressTab from './ProgressTab';

const mockDispatch = jest.fn();
let mockCourseId = 'course-v1:known';
let mockTargetUserId = 27;
let mockWidth = 1200;
let mockDisableProgressGraph = false;
const mockScores = [{ subsections: [{ blockKey: 'block-v1:exam' }] }];

jest.mock('@openedx/frontend-plugin-framework', () => ({ PluginSlot: jest.fn(() => null) }));
jest.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
  useSelector: select => select({ courseHome: { targetUserId: mockTargetUserId } }),
}));
jest.mock('@openedx/paragon', () => ({ useWindowSize: () => ({ width: mockWidth }) }));
jest.mock('../../data/hooks', () => ({ useContextId: () => mockCourseId }));
jest.mock('../../generic/model-store', () => ({
  useModel: () => ({ disableProgressGraph: mockDisableProgressGraph, sectionScores: mockScores }),
}));
jest.mock('../data/thunks', () => ({ fetchProgressTab: jest.fn((courseId, targetUserId) => ({ courseId, targetUserId })) }));
jest.mock('./hooks', () => ({ useGetExamsData: jest.fn() }));
jest.mock('./ProgressHeader', () => function () {
  return <h1>Native progress</h1>;
});
jest.mock('./course-completion/CourseCompletion', () => function () {
  return <div>Native completion</div>;
});
jest.mock('../../plugin-slots/ProgressTabCertificateStatusMainBodySlot', () => function () {
  return <div>Native certificate</div>;
});
jest.mock('../../plugin-slots/ProgressTabCertificateStatusSidePanelSlot', () => () => null);
jest.mock('../../plugin-slots/ProgressTabCourseGradeSlot', () => function () {
  return <div>Native grade</div>;
});
jest.mock('../../plugin-slots/ProgressTabGradeBreakdownSlot', () => function () {
  return <div>Native breakdown</div>;
});
jest.mock('../../plugin-slots/ProgressTabRelatedLinksSlot', () => () => null);

beforeEach(() => {
  jest.clearAllMocks();
  mockCourseId = 'course-v1:known';
  mockTargetUserId = 27;
  mockWidth = 1200;
  mockDisableProgressGraph = false;
});

const slotProps = () => PluginSlot.mock.calls.at(-1)[0];

test('empty progress refresh slot preserves native render and does not fetch on mount', () => {
  render(<ProgressTab />);
  expect(slotProps().id).toBe('org.openedx.frontend.learning.progress_refresh.v1');
  expect(slotProps().children).toBeUndefined();
  ['Native progress', 'Native completion', 'Native certificate', 'Native grade', 'Native breakdown']
    .forEach(text => expect(screen.getByText(text)).toBeTruthy());
  expect(useGetExamsData).toHaveBeenCalledWith(mockCourseId, ['block-v1:exam']);
  expect(fetchProgressTab).not.toHaveBeenCalled();
});

test('refresh callback is stable and dispatches the current native course and target learner', () => {
  const view = render(<ProgressTab />);
  const original = slotProps().pluginProps.refreshProgress;
  view.rerender(<ProgressTab />);
  expect(slotProps().pluginProps.refreshProgress).toBe(original);
  original();
  expect(mockDispatch).toHaveBeenLastCalledWith({ courseId: mockCourseId, targetUserId: 27 });
  mockCourseId = 'course-v1:next';
  mockTargetUserId = 31;
  view.rerender(<ProgressTab />);
  const current = slotProps().pluginProps.refreshProgress;
  expect(current).not.toBe(original);
  expect(slotProps().pluginProps.courseId).toBe(mockCourseId);
  current();
  expect(mockDispatch).toHaveBeenLastCalledWith({ courseId: mockCourseId, targetUserId: 31 });
});

test('native unknown width guard prevents slot and certificate rendering', () => {
  mockWidth = undefined;
  const view = render(<ProgressTab />);
  expect(view.container.innerHTML).toBe('');
  expect(PluginSlot).not.toHaveBeenCalled();
});

test('native graph disable flag still preserves grade and certificate rendering', () => {
  mockDisableProgressGraph = true;
  render(<ProgressTab />);
  expect(screen.queryByText('Native completion')).toBeNull();
  expect(screen.getByText('Native grade')).toBeTruthy();
  expect(screen.getByText('Native certificate')).toBeTruthy();
});
