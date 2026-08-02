# Rendering

WebGL2 is primary; Canvas 2D is an honestly maintained playable fallback.
Both consume immutable WorldModel/snapshot data and share camera/picking IDs.

## Balanced draw hierarchy

Seven steady-state draws:

1. mineral-twilight background;
2. shallow-relief dual-cell terrain with explicit biome material and forest
   density pattern;
3. quiet cell boundaries, coast accents, and World Knot emphasis;
4. connected static river ribbons from each river cell to its downstream cell,
   with flow-strength width hierarchy;
5. atmosphere;
6. warm boundary-aligned organism routes using conductance/real flux/stress;
7. organism frontier tips or state-scaled Memory nodes.

Rivers are cool, static, center-to-downstream drainage. Cell boundaries are
thin etched plates. Organism routes are warm, raised, and flow animated only
when motion is enabled. Meaning therefore survives grayscale/hue ambiguity.

Static terrain, coast, river, forest, and Memory placement buffers are built
once per world. Dynamic uploads contain life/stress and active route/tip
instances only. Snapshot cadence is about 10 Hz; render cadence falls to about
15 fps at 16×/32× and about 6 fps behind full-screen panels.

## Camera and picking

The camera stores an orthonormal direction/right/up frame, allowing repeated
pole crossings without yaw/pitch clamps. Drag follows the grabbed point;
pinch/wheel zoom is bounded. Analytic offset-aware ray/sphere picking returns
the nearest stable cell. Relief is deliberately shallow, so picking remains on
the documented unit sphere. Selection is a pale cell material, never a growth
or resource effect.

Idle rotation is optional, defaults off, completes a revolution in roughly
130 or 180 seconds, stops immediately on manipulation/selection/panel/hidden
document, resumes after three seconds of true idle, and is effectively disabled
by reduced motion.

## Memory and fallback

Memory reuses the graphite world with 108 state-scaled node cells, owned
prerequisite paths, a selected-cell focus, and separate projected Imprints.
Canvas 2D renders explicit biome colors, connected rivers, events, selected
cells, and living routes with camera offsets matching WebGL picking.

Current measured Chrome evidence uses WebGL2 at 390×844 and 1440×900. The
code-level steady-state count is seven draws. p95 browser frame time and
physical mobile thermal behavior remain unmeasured; no low-heat claim is made
from Node simulation speed.
