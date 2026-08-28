/** Trusted keyboard/forced-color entry and textual evidence for selected cells. */
export async function verifyKeyboardInspector({ evaluate, key, poll, wait, setMedia }) {
  await setMedia([{ name: 'forced-colors', value: 'active' }]);
  await evaluate(`(()=>{document.body.tabIndex=-1;document.body.focus();return document.activeElement===document.body})()`);
  await key('Tab');
  const canvas = await evaluate(`(()=>{const value=document.getElementById('gl-canvas'),style=getComputedStyle(value);return{tabIndex:value.tabIndex,
    label:value.getAttribute('aria-label'),focused:document.activeElement===value,forced:matchMedia('(forced-colors: active)').matches,
    active:document.activeElement?.id,outlineStyle:style.outlineStyle,outlineWidth:style.outlineWidth}})()`);
  ok(canvas.tabIndex === 0 && canvas.focused && canvas.forced && canvas.outlineStyle !== 'none'
    && parseFloat(canvas.outlineWidth) >= 2 && canvas.label.includes('press Enter or Space'),
    `keyboard globe entry missing: ${JSON.stringify(canvas)}`);
  await key('Enter');
  ok(await poll(() => evaluate(`(()=>({overlay:window.__CELL_SPHERE_APP__.overlay,focus:document.activeElement?.id,
    text:document.getElementById('inspector-life').textContent}))()`),
  (value) => value.overlay === 'inspector' && value.focus === 'inspector-heading' && value.text.includes('Living state'), 2200, 60),
  'keyboard globe activation did not open populated Inspector');
  const evidence = await evaluate(`(()=>{const root=document.getElementById('inspector-life'),terms=[...root.querySelectorAll('dt')].map(node=>node.textContent),
    values=[...root.querySelectorAll('dd')].map(node=>node.textContent);return{terms,values,state:values[terms.indexOf('State')],
      role:values[terms.indexOf('Role')],resource:values[terms.indexOf('Current resource state')],stress:values[terms.indexOf('Stress')],
      charge:values[terms.indexOf('Luminous charge')]}})()`);
  ok(['State','Role','Current resource state','Stress','Luminous charge'].every((term)=>evidence.terms.includes(term))
    && [evidence.state,evidence.role,evidence.resource,evidence.stress,evidence.charge].every(Boolean),
  `Inspector textual oracle incomplete: ${JSON.stringify(evidence)}`);
  await key('Escape'); await wait(60);
  ok(await poll(() => evaluate(`(()=>({overlay:window.__CELL_SPHERE_APP__.overlay,focus:document.activeElement?.id,
    hidden:document.getElementById('cell-inspector').hidden}))()`),
  (value) => value.overlay === null && value.hidden && value.focus === 'gl-canvas', 1200, 40),
  'Inspector Escape did not restore canvas focus');
  await evaluate(`document.body.removeAttribute('tabindex');true`); await setMedia([]);
  return { ...evidence, forcedColors: canvas };
}

function ok(value, message) { if (!value) throw new Error(message); }
