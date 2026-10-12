import React from 'react';
import { render, screen } from '@testing-library/react';
import { PluginSlot } from '@openedx/frontend-plugin-framework';
import { getSequenceForBlockDeprecated } from './data';
import CoursewareContainerSlot, { NativeCoursewareContainer, checkUnitToSequenceUnitRedirect } from './CoursewareContainer';

const mockNative = jest.fn(() => <div>Native connected courseware</div>);
jest.mock('@openedx/frontend-plugin-framework', () => ({
  PluginSlot: jest.fn(({ children }) => <>{children}</>),
}));
jest.mock('react-redux', () => ({ connect: () => () => props => mockNative(props) }));
jest.mock('./utils', () => Component => Component);
jest.mock('./data', () => ({
  checkBlockCompletion: jest.fn(),
  fetchCourse: jest.fn(),
  fetchSequence: jest.fn(),
  getResumeBlock: jest.fn(),
  saveSequencePosition: jest.fn(),
  getSequenceForBlockDeprecated: jest.fn(),
}));
jest.mock('../tab-page', () => ({ TabPage: () => null }));
jest.mock('./course', () => () => null);
jest.mock('./course/celebration', () => ({ handleNextSectionCelebration: jest.fn() }));

beforeEach(() => {
  jest.clearAllMocks();
  getSequenceForBlockDeprecated.mockResolvedValue({ sequenceId: 'native-sequence', unitId: 'native-unit' });
});

const redirect = (navigate, preview, resolver, current) => checkUnitToSequenceUnitRedirect('loaded', 'course-v1:known', 'failed', true, 'leaf', null, null, navigate, preview, resolver, current);

test('container slot preserves connected native default and caller props', () => {
  const props = { routeCourseId: 'course-v1:known', routeUnitId: 'unit', isPreview: true };
  render(<CoursewareContainerSlot {...props} />);
  expect(PluginSlot).toHaveBeenCalledWith(expect.objectContaining({
    id: 'org.openedx.frontend.learning.courseware_container.v1',
    pluginProps: { ...props, nativeContainer: NativeCoursewareContainer },
  }), expect.anything());
  expect(screen.getByText('Native connected courseware')).toBeTruthy();
  expect(mockNative).toHaveBeenCalledWith(props);
  expect(getSequenceForBlockDeprecated).not.toHaveBeenCalled();
});

test('optional resolver removed retains the native block resolver and destination', async () => {
  const navigate = jest.fn();
  await redirect(navigate, false);
  expect(getSequenceForBlockDeprecated).toHaveBeenCalledWith('course-v1:known', 'leaf');
  expect(navigate).toHaveBeenCalledWith('/course/course-v1:known/native-sequence/native-unit', { replace: true });
});

test.each([false, true])('optional leaf resolver retains preview=%s unit destination', async preview => {
  const navigate = jest.fn();
  const resolver = jest.fn().mockResolvedValue({ sequenceId: 'policy-sequence', unitId: 'policy-unit' });
  await redirect(navigate, preview, resolver);
  expect(resolver).toHaveBeenCalledWith('course-v1:known', 'leaf');
  expect(getSequenceForBlockDeprecated).not.toHaveBeenCalled();
  expect(navigate).toHaveBeenCalledWith(`${preview ? '/preview' : ''}/course/course-v1:known/policy-sequence/policy-unit`, { replace: true });
});

test.each(['missing', 'error'])('optional resolver %s retains native course-home fallback', async outcome => {
  const navigate = jest.fn();
  const resolver = outcome === 'missing' ? jest.fn().mockResolvedValue(null) : jest.fn().mockRejectedValue(new Error('Missing leaf'));
  await redirect(navigate, false, resolver);
  expect(navigate).toHaveBeenCalledWith('/course/course-v1:known/home', { replace: true });
});

test('optional resolver cannot navigate after its native caller becomes stale', async () => {
  let finish;
  let current = true;
  const navigate = jest.fn();
  const pending = redirect(navigate, false, () => new Promise(resolve => { finish = resolve; }), () => current);
  current = false;
  finish({ sequenceId: 'old-sequence', unitId: 'old-unit' });
  await pending;
  expect(navigate).not.toHaveBeenCalled();
});
