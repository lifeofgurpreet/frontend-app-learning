import React, { useMemo } from 'react';
import { PluginSlot } from '@openedx/frontend-plugin-framework';
import { useDispatch, useSelector } from 'react-redux';
import { useWindowSize } from '@openedx/paragon';
import { fetchProgressTab } from '../data/thunks';
import { useContextId } from '../../data/hooks';
import { useModel } from '../../generic/model-store';
import ProgressTabCertificateStatusSidePanelSlot from '../../plugin-slots/ProgressTabCertificateStatusSidePanelSlot';

import CourseCompletion from './course-completion/CourseCompletion';
import ProgressHeader from './ProgressHeader';

import ProgressTabCertificateStatusMainBodySlot from '../../plugin-slots/ProgressTabCertificateStatusMainBodySlot';
import ProgressTabCourseGradeSlot from '../../plugin-slots/ProgressTabCourseGradeSlot';
import ProgressTabGradeBreakdownSlot from '../../plugin-slots/ProgressTabGradeBreakdownSlot';
import ProgressTabRelatedLinksSlot from '../../plugin-slots/ProgressTabRelatedLinksSlot';
import { useGetExamsData } from './hooks';

const ProgressTab = () => {
  const courseId = useContextId();
  const dispatch = useDispatch();
  const targetUserId = useSelector(state => state.courseHome.targetUserId);
  const refreshProgress = React.useCallback(
    () => dispatch(fetchProgressTab(courseId, targetUserId)),
    [courseId, targetUserId, dispatch],
  );
  const { disableProgressGraph, sectionScores } = useModel('progress', courseId);

  const sequenceIds = useMemo(() => (
    sectionScores.flatMap((section) => (section.subsections)).map((subsection) => subsection.blockKey)
  ), [sectionScores]);

  useGetExamsData(courseId, sequenceIds);

  const windowWidth = useWindowSize().width;
  if (windowWidth === undefined) {
    // Bail because we don't want to load <CertificateStatus/> twice, emitting 'visited' events both times.
    // This is a hacky solution, since the user can resize the screen and still get two visited events.
    // But I'm leaving a larger refactor as an exercise to a future reader.
    return null;
  }

  return (
    <>
      <PluginSlot id="org.openedx.frontend.learning.progress_refresh.v1" pluginProps={{ courseId, refreshProgress }} />
      <ProgressHeader />
      <div className="row w-100 m-0">
        {/* Main body */}
        <div className="col-12 col-md-8 p-0">
          {!disableProgressGraph && <CourseCompletion />}
          <ProgressTabCertificateStatusMainBodySlot />
          <PluginSlot
            id="org.openedx.frontend.learning.progress_card.v1"
            pluginProps={{ courseId, cardKind: 'certificate-guidance' }}
          >
            <></>
          </PluginSlot>
          <ProgressTabCourseGradeSlot />
          <PluginSlot
            id="org.openedx.frontend.learning.progress_card.v1"
            pluginProps={{ courseId, cardKind: 'grade-breakdown' }}
          >
            <ProgressTabGradeBreakdownSlot />
          </PluginSlot>
        </div>

        {/* Side panel */}
        <div className="col-12 col-md-4 p-0 px-md-4">
          <ProgressTabCertificateStatusSidePanelSlot />
          <PluginSlot
            id="org.openedx.frontend.learning.progress_card.v1"
            pluginProps={{ courseId, cardKind: 'completion-hints' }}
          >
            <></>
          </PluginSlot>
          <ProgressTabRelatedLinksSlot />
        </div>
      </div>
    </>
  );
};

export default ProgressTab;
