# Courseware container slot

`org.openedx.frontend.learning.courseware_container.v1` retains the connected
native container as default content. Plugin props include the existing caller
props and `nativeContainer`, the connected native component.

A plugin may supply an optional `resolveLeaf(courseId, blockId)` callback to
that component. It returns a promise resolving to `{ sequenceId, unitId }` or
null. Missing or rejected results preserve the native course-home fallback;
valid results preserve native preview and replace navigation behavior.

Without the callback, the native block resolver remains the default. A supplied
callback uses the native route generation and mounted-state checks; an optional
`getLeafScope()` identity lets a plugin invalidate work when its learner or LMS
changes. Plugins must retain native authorization and lifecycle behavior.
