# Progress composition slots

These hosts preserve native children and add no wrapper DOM by default.
Native models, grade calculations, certificate decisions, analytics, Popover
behavior, and Studio access checks remain owned by the learning app.

| Slot | Boundary and props |
| --- | --- |
| `org.openedx.frontend.learning.progress_card.v1` | Native completion section, course-grade section, certificate Card, and grade-breakdown element. Course/part hosts pass `courseId` and `cardKind` when available. Empty `certificate-guidance` and `completion-hints` parts add no default content. |
| `org.openedx.frontend.learning.progress_header_action.v1` | Native Studio button, inside its existing administrator and URL checks. |
| `org.openedx.frontend.learning.progress_grade_tooltip.v1` | Native Popover.Content with the computed `isPassing` flag. |

Modify operations may adapt presentation through the default content node.
Removing those operations restores the native classes, button size, and tooltip
text. Plugins must retain native callbacks and authorization boundaries.
