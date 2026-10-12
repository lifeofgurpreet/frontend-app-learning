# Unit Content Slot

## Slot ID

`org.openedx.frontend.learning.unit_content.v1`

## Default contents

The native `UnitSuspense` and `ContentIFrame` follow the unit title. With no
plugins configured, the complete native loading and player contents remain.
The player continues to own its URL, callbacks, honor-code and exam access
checks.

## Plugin props

| Prop | Native value |
| --- | --- |
| `courseId` | Current course identity. |
| `unitId` | Current unit identity. |
| `courseHome` | Current course-home metadata, including its available tabs. |
| `loadDiscussionConfig` | Native `getCourseDiscussionConfig(courseId)` reader. |
| `loadTopics` | Native `getCourseTopics(courseId)` reader. |

The readers are passed as functions; the slot does not invoke them. Plugins may
compose lesson and discussion views around `default_contents`, keeping both
native children and their lifecycle intact. Discussion access and provider
availability remain governed by the native APIs. Changing the iframe DOM or
reimplementing its access checks is unnecessary.
