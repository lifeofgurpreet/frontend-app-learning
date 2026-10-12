# Progress refresh slot

`org.openedx.frontend.learning.progress_refresh.v1` is an empty host in
ProgressTab. With no plugins it adds no content or data request and preserves
the native grade, certificate, completion, exam, and responsive behavior.

| Prop | Contract |
| --- | --- |
| `courseId` | Current native course context. |
| `refreshProgress` | Stable callback that dispatches the existing `fetchProgressTab` thunk with the current course and target learner. Changes when those identities or dispatch change. |

A plugin may request fresh authoritative progress after a confirmed completion.
It must clean up listeners when the callback or course changes. The native thunk
retains request authorization, loading state, and progress model ownership.
