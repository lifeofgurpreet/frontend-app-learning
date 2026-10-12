import PropTypes from 'prop-types';
import React from 'react';
import { PluginSlot } from '@openedx/frontend-plugin-framework';
import { useSearchParams, useLocation } from 'react-router-dom';

import { AppContext } from '@edx/frontend-platform/react';
import { useIntl } from '@edx/frontend-platform/i18n';

import { useModel } from '@src/generic/model-store';
import { usePluginsCallback } from '@src/generic/plugin-store';
import { getCourseDiscussionConfig, getCourseTopics } from '@src/courseware/data/api';

import messages from '../messages';
import ContentIFrame from './ContentIFrame';
import UnitSuspense from './UnitSuspense';
import { modelKeys, views } from './constants';
import { useExamAccess, useShouldDisplayHonorCode } from './hooks';
import { getIFrameUrl } from './urls';
import UnitTitleSlot from '../../../../plugin-slots/UnitTitleSlot';

const Unit = ({
  courseId,
  format,
  onLoaded,
  id,
  isOriginalUserStaff,
  renderUnitNavigation,
}) => {
  const { formatMessage } = useIntl();
  const [searchParams] = useSearchParams();
  const { pathname } = useLocation();
  const { authenticatedUser } = React.useContext(AppContext);
  const examAccess = useExamAccess({ id });
  const shouldDisplayHonorCode = useShouldDisplayHonorCode({ courseId, id });
  const unit = useModel(modelKeys.units, id);
  const courseHome = useModel('courseHomeMeta', courseId);
  const view = authenticatedUser ? views.student : views.public;
  const shouldDisplayUnitPreview = pathname.startsWith('/preview') && isOriginalUserStaff;

  const getUrl = usePluginsCallback('getIFrameUrl', () => getIFrameUrl({
    id,
    view,
    format,
    examAccess,
    jumpToId: searchParams.get('jumpToId'),
    preview: shouldDisplayUnitPreview ? '1' : '0',
  }));

  const iframeUrl = getUrl();

  return (
    <div className="unit">
      <UnitTitleSlot unitId={id} {...{ unit, renderUnitNavigation }} />
      <PluginSlot
        id="org.openedx.frontend.learning.unit_content.v1"
        pluginProps={{
          courseId,
          unitId: id,
          courseHome,
          loadDiscussionConfig: getCourseDiscussionConfig,
          loadTopics: getCourseTopics,
        }}
      >
        <UnitSuspense {...{ courseId, id }} />
        <ContentIFrame
          elementId="unit-iframe"
          id={id}
          iframeUrl={iframeUrl}
          loadingMessage={formatMessage(messages.loadingSequence)}
          onLoaded={onLoaded}
          shouldShowContent={!shouldDisplayHonorCode && !examAccess.blockAccess}
          title={unit.title}
          courseId={courseId}
        />
      </PluginSlot>
    </div>
  );
};

Unit.propTypes = {
  courseId: PropTypes.string.isRequired,
  format: PropTypes.string,
  id: PropTypes.string.isRequired,
  onLoaded: PropTypes.func,
  isOriginalUserStaff: PropTypes.bool.isRequired,
  renderUnitNavigation: PropTypes.func.isRequired,
};

Unit.defaultProps = {
  format: null,
  onLoaded: undefined,
};

export default Unit;
