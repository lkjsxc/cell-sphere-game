/** Developer-only browser evidence for continuous WebGL and Canvas globe coverage. */
export async function runContinuityFixture({ evaluate, setViewport, wait }) {
  const viewport = await evaluate('({ width: innerWidth, height: innerHeight })');
  await setViewport(1440, 900); await wait(120);
  let report;
  try { report = await evaluate(`(async () => {
    const app = window.__CELL_SPHERE_APP__;
    if (!app?.developerMode) throw new Error('continuity fixture requires developer mode');
    const [{ CONTINUITY_FIXTURE }, { focusCamera }] = await Promise.all([
      import('./src/rendering/continuity-fixture.js'), import('./src/rendering/camera.js'),
    ]);
    const snapshot = app.snapshot ?? app.showcase?.snapshot;
    if (!snapshot) throw new Error('continuity fixture has no production snapshot');
    const directions = [[.18, .34, .92], [-.71, .26, .65]];
    const reports = [];
    for (const direction of directions) {
      const camera = { ...app.camera, direction: [...app.camera.direction], right: [...app.camera.right], up: [...app.camera.up],
        dist: 4.1, offsetX: 0, offsetY: 0 };
      focusCamera(camera, direction);
      const accepted = app.renderer.render({ snapshot, worldIdentity: app.worldIdentity ?? null, camera,
        selectedNode: null, highlightedCells: [], time: 0, pulse: false, fixture: CONTINUITY_FIXTURE });
      const width = app.canvas.width; const height = app.canvas.height;
      let data; let error = 0;
      if (app.renderer.backend === 'webgl2') {
        const gl = app.renderer.gl; data = new Uint8Array(width * height * 4);
        gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, data); error = gl.getError();
      } else data = app.renderer.ctx.getImageData(0, 0, width, height).data;
      reports.push({ accepted, error, ...measureCoverage(data, width, height) });
    }
    app.renderer.render({ snapshot, worldIdentity: app.worldIdentity ?? null, camera: app.camera,
      selectedNode: null, highlightedCells: [], time: performance.now() / 1000, pulse: false });
    return { backend: app.renderer.backend, reports };

    function measureCoverage(data, width, height) {
      let minX = width; let minY = height; let maxX = -1; let maxY = -1; let surfacePixels = 0;
      for (let y = 0, index = 0; y < height; y++) for (let x = 0; x < width; x++, index += 4) {
        if (isSurface(data[index], data[index + 1], data[index + 2])) {
          surfacePixels++; minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
        }
      }
      if (surfacePixels < 1000) throw new Error('continuity fixture did not produce a visible uniform shell');
      const cx = (minX + maxX) / 2; const cy = (minY + maxY) / 2;
      const rx = Math.max(1, (maxX - minX + 1) / 2); const ry = Math.max(1, (maxY - minY + 1) / 2);
      let center = 0; let centerBackground = 0; let limb = 0; let limbBackground = 0; let interiorBackground = 0;
      const gaps = new Uint8Array(width * height);
      for (let y = 0, index = 0; y < height; y++) for (let x = 0; x < width; x++, index += 4) {
        const distance = Math.hypot((x - cx) / rx, (y - cy) / ry); const background = isBackground(data[index], data[index + 1], data[index + 2]);
        if (distance <= .60) { center++; if (background) centerBackground++; }
        if (distance >= .78 && distance <= .94) { limb++; if (background) limbBackground++; }
        if (distance <= .96 && background) { gaps[y * width + x] = 1; interiorBackground++; }
      }
      return { bounds: { minX, minY, maxX, maxY }, surfacePixels, center: { pixels: center, background: centerBackground },
        limb: { pixels: limb, background: limbBackground }, interiorBackground, maxBackgroundComponent: largestComponent(gaps, width, height) };
    }
    function isSurface(red, green, blue) { return red < 120 && green > 110 && blue < 170; }
    function isBackground(red, green, blue) {
      const distance = (red - 240) ** 2 + (green - 5) ** 2 + (blue - 184) ** 2;
      return distance < 250 ** 2;
    }
    function largestComponent(gaps, width, height) {
      let largest = 0; const stack = [];
      for (let start = 0; start < gaps.length; start++) {
        if (gaps[start] !== 1) continue;
        gaps[start] = 2; stack.push(start); let size = 0;
        while (stack.length) {
          const current = stack.pop(); size++; const x = current % width;
          for (const next of [current - width, current + width, x ? current - 1 : -1, x + 1 < width ? current + 1 : -1]) {
            if (next >= 0 && next < gaps.length && gaps[next] === 1) { gaps[next] = 2; stack.push(next); }
          }
        }
        largest = Math.max(largest, size);
      }
      return largest;
    }
  })()`);
    for (const sample of report.reports) {
      if (!sample.accepted || sample.error !== 0 || sample.center.pixels < 1000 || sample.limb.pixels < 1000
        || sample.center.background || sample.limb.background || sample.interiorBackground || sample.maxBackgroundComponent) {
        throw new Error(`continuous-shell fixture failed: ${JSON.stringify(report)}`);
      }
    }
    return report;
  } finally {
    await setViewport(viewport.width, viewport.height); await wait(80);
  }
}
