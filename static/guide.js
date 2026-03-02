import {
  SCENARIOS,
  PRESETS,
  DIMENSIONS,
  decide,
  ready,
  buildPresetChips,
  buildValueControls,
  setSliderValues,
  buildScenarioAccordion,
  getDetailsOpenState,
  getScenario,
  getPreset,
  choiceLetterHTML,
  scenarioDescriptionHTML,
  scenarioChoiceCardsHTML,
  deciderNodeHTML,
  decisionPanelHTML,
} from "./shared.js";

const state = {
  step: -1,
  scenarioId: null,
  presetId: null,
  values: {},
};

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

const STEPS = [
  {
    id: "intro",
    heading: "AI Decisions You Can Trust",
    subtitle: "AI-powered decision makers carry bias baggage from their training.<br>Personalized values can steer them so you can trust they make the right trade-offs.",
    zones: {},
  },
  {
    id: "scenario",
    heading: "Hard Choices",
    subtitle: "Some decisions have no right answer — only trade-offs shaped by what you value most.",
    zones: { scenario: "accordion" },
  },
  {
    id: "baseline",
    heading: "Hidden Bias",
    subtitle: "When we ask the AI to make a decision, the choice reflects the biases baked into its training — not your priorities.",
    zones: { scenario: "summary", "decider-baseline": true, "decision-baseline": true },
  },
  {
    id: "values",
    heading: "Values are Priorities",
    subtitle: "Values resolve trade-offs in tough scenarios. Set yours and the decision maker will weigh them in its decision.",
    zones: { values: "with-decider" },
  },
  {
    id: "alignment",
    heading: "Value Aligned AI",
    subtitle: "Now the decision maker uses your values alongside the scenario — aligning its choice to your priorities.",
    zones: { scenario: "summary-labeled", values: "accordion", connectors: "crossarm", "decider-aligned": true, "decision-aligned": true },
  },
  {
    id: "comparison",
    heading: "The Shift",
    subtitle: "Compare what the AI chooses with and without your values.",
    zones: { scenario: "summary-labeled", values: "accordion", connectors: "crossarm", "decider-baseline": true, "decider-aligned": true, "decision-baseline": true, "decision-aligned": true },
  },
  {
    id: "sandbox",
    heading: "Experiment",
    subtitle: "Swap scenarios and adjust values to see when decisions shift.",
    zones: { scenario: "radio-selector", values: "accordion-open", connectors: "crossarm", "decider-baseline": true, "decider-aligned": true, "decision-baseline": true, "decision-aligned": true },
  },
  {
    id: "learn-more",
    heading: "Learn More",
    subtitle: "Explore the research and try the full interactive system.",
    zones: { "learn-more": true },
  },
];

const renderScenarioAccordion = (container) => {
  container.innerHTML = `<div class="scenario-accordion-container" data-scenario-accordion></div>`;
  buildScenarioAccordion(
    container.querySelector("[data-scenario-accordion]"),
    SCENARIOS,
    state.scenarioId,
    handleScenarioChange,
    { showKdmaTag: false, showChoicesInSummary: true },
  );
};

const renderScenarioSummary = (container, { showLabel = false, wasOpen = false } = {}) => {
  const scenario = getScenario(state.scenarioId);
  const descHtml = scenarioDescriptionHTML(scenario);
  const choicesHtml = scenarioChoiceCardsHTML(scenario);

  const choiceLetters = scenario.choices
    .map((c, i) => `<span class="summary-choice-item">${choiceLetterHTML(i, { colored: true })}<span class="summary-choice-label">${c.label}</span></span>`)
    .join("");

  const labelHtml = showLabel ? `<div class="flow-input-label">Scenario</div>` : "";
  container.innerHTML = `
    ${labelHtml}
    <wa-details class="baseline-scenario-panel"${wasOpen ? " open" : ""}>
      <span slot="summary" class="accordion-summary">
        <span class="accordion-summary-title">${scenario.title}</span>
        <span class="accordion-summary-choices">${choiceLetters}</span>
      </span>
      <div class="accordion-scenario-body">
        <div class="accordion-scenario-description">${descHtml}</div>
        ${choicesHtml ? `<div class="scenario-choices">${choicesHtml}</div>` : ""}
      </div>
    </wa-details>
  `;
};

const renderScenarioRadioSelector = (container) => {
  container.innerHTML = `
    <div class="flow-input-label">Scenario</div>
    <div class="sandbox-scenario-accordion" data-sandbox-scenarios></div>
  `;
  buildSandboxScenarioAccordion(
    container.querySelector("[data-sandbox-scenarios]"),
    SCENARIOS,
    state.scenarioId,
    handleExploreScenarioChange,
  );
};

const renderDeciderBaseline = async (container) => {
  const result = await decide(state.scenarioId, "baseline");
  const llm = result.llmBackbone?.split("/").pop() || "Language Model";
  container.innerHTML = `
    <div class="decider-card">
      ${deciderNodeHTML({ icon: "&#x1F916;", label: "Baseline Language Model", modelName: llm })}
    </div>
  `;
};

const renderDecisionBaseline = async (container) => {
  const result = await decide(state.scenarioId, "baseline");
  const scenario = getScenario(state.scenarioId);
  const idx = scenario.choices.findIndex((c) => c.id === result.choiceId);
  const openState = getDetailsOpenState(container);
  container.innerHTML = decisionPanelHTML({
    letterHTML: choiceLetterHTML(idx, { colored: true, decision: true }),
    decision: result.decision,
    justification: result.justification,
    isOpen: openState?.[0],
  });
};

const renderValuesWithDecider = (container) => {
  container.innerHTML = `
    <div class="values-centered-flow">
      <wa-details class="values-accordion" open>
        <span slot="summary" class="values-presets" data-simple-presets></span>
        <div class="values-sliders" data-simple-sliders></div>
      </wa-details>
      <div class="values-adm-stem"></div>
      ${deciderNodeHTML({ icon: "&#x1F9ED;", label: "Value Aligned Decider", modelName: "Alignment Algorithm", className: "aligned-decider-node" })}
    </div>
  `;
  buildPresetChips(container.querySelector("[data-simple-presets]"), state.presetId, handleSimplePresetSelect);
  buildValueControls(container.querySelector("[data-simple-sliders]"), state.values, handleSimpleValuesChange);
};

const renderValuesAccordion = (container, { open = false } = {}) => {
  container.innerHTML = `
    <div class="flow-input-label">Value Profile</div>
    <wa-details class="values-accordion"${open ? " open" : ""}>
      <span slot="summary" class="values-presets" data-values-presets></span>
      <div class="values-sliders" data-values-sliders></div>
    </wa-details>
  `;
  buildPresetChips(container.querySelector("[data-values-presets]"), state.presetId, handlePresetSelect);
  buildValueControls(container.querySelector("[data-values-sliders]"), state.values, handleValuesChange);
};

const renderConnectors = (container) => {
  container.innerHTML = `
    <div class="values-flow-connector">
      <div class="connector-lines">
        <div class="connector-arm connector-arm-left"></div>
        <div class="connector-arm connector-arm-right"></div>
      </div>
      <div class="connector-stem"></div>
    </div>
  `;
};

const renderCrossarmConnector = (container) => {
  container.innerHTML = `<svg class="crossarm-overlay"></svg>`;
};

const formatAlignedModelName = (result) => {
  const adm = result.admName?.replace(/_/g, " ") || "Aligned Decider";
  const displayAdm = {
    phase2_pipeline_zeroshot_comparative_regression: "Comparative Regression",
  }[result.admName] || adm;
  const llm = result.llmBackbone?.split("/").pop() || "";
  return `${displayAdm}${llm ? ` · ${llm}` : ""}`;
};

const renderAlignedDecider = async (container) => {
  const result = await decide(state.scenarioId, "aligned", state.values);
  container.innerHTML = `
    <div class="aligned-decider-card">
      ${deciderNodeHTML({ icon: "&#x1F9ED;", label: "Value Aligned Decider", modelName: formatAlignedModelName(result), className: "aligned-decider-node" })}
    </div>
  `;
};

const renderAlignedDecision = async (container) => {
  const result = await decide(state.scenarioId, "aligned", state.values);
  const scenario = getScenario(state.scenarioId);
  const idx = scenario.choices.findIndex((c) => c.id === result.choiceId);
  const wasOpen = container.querySelector(".decision-panel")?.open;
  container.innerHTML = `
    <div class="aligned-decision-card">
      <div class="aligned-decision-stem"></div>
      ${decisionPanelHTML({
        letterHTML: choiceLetterHTML(idx, { colored: true, decision: true }),
        decision: result.decision,
        justification: result.justification,
        isOpen: wasOpen,
      })}
    </div>
  `;
};

const renderComparisonDecisions = (container, aligned, baseline, scenario) => {
  const openState = getDetailsOpenState(container);
  const alignedIdx = scenario.choices.findIndex((c) => c.id === aligned.choiceId);
  const baselineIdx = scenario.choices.findIndex((c) => c.id === baseline.choiceId);

  return `
    <div class="decision-comparison">
      <div class="decision-col">
        ${decisionPanelHTML({
          letterHTML: choiceLetterHTML(baselineIdx, { colored: true, decision: true }),
          decision: baseline.decision,
          justification: baseline.justification,
          isOpen: openState?.[0],
        })}
      </div>
      <div class="decision-col">
        ${decisionPanelHTML({
          letterHTML: choiceLetterHTML(alignedIdx, { colored: true, decision: true }),
          decision: aligned.decision,
          justification: aligned.justification,
          isOpen: openState?.[1],
        })}
      </div>
    </div>
  `;
};

const drawCrossarm = (svg, flow, sourceEl, targetEl) => {
  if (!sourceEl || !targetEl) return;
  const fr = flow.getBoundingClientRect();
  const sr = sourceEl.getBoundingClientRect();
  const ar = targetEl.getBoundingClientRect();

  const x1 = sr.right - fr.left;
  const y1 = (sr.top + sr.bottom) / 2 - fr.top;
  const y2 = (ar.top + ar.bottom) / 2 - fr.top;
  const x2 = ar.left - fr.left;
  const xDrop = x1 + 16;
  const r = 8;

  const d = [
    `M ${x1 + 6} ${y1}`,
    `H ${xDrop - r}`,
    `Q ${xDrop} ${y1} ${xDrop} ${y1 + r}`,
    `V ${y2 - r}`,
    `Q ${xDrop} ${y2} ${xDrop + r} ${y2}`,
    `H ${x2 - 6}`,
  ].join(" ");

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", d);
  path.setAttribute("fill", "none");
  path.setAttribute("stroke", "var(--border)");
  path.setAttribute("stroke-width", "2");

  svg.innerHTML = "";
  svg.appendChild(path);
};

const scheduleDrawCrossarm = (zone) => {
  requestAnimationFrame(() => requestAnimationFrame(() => {
    const svg = zone.querySelector(".comparison-crossarm");
    const flow = zone.querySelector(".comparison-flow");
    if (!svg || !flow) return;

    const variant = zone.dataset.variant;
    if (variant === "sandbox") {
      const selectedRow = flow.querySelector(".scenario-radio-row.selected");
      const radio = selectedRow?.querySelector(".scenario-radio");
      const alignedDecider = flow.querySelector("[data-comp-aligned-decider] .aligned-decider-node");
      if (radio) drawCrossarm(svg, flow, selectedRow, alignedDecider);
    } else {
      const scenarioPanel = flow.querySelector("[data-comp-scenario] wa-details");
      const alignedDecider = flow.querySelector("[data-comp-aligned-decider] .aligned-decider-node");
      drawCrossarm(svg, flow, scenarioPanel, alignedDecider);
    }
  }));
};

const drawZoneCrossarm = () => {
  const svg = $(".zone-connectors .crossarm-overlay");
  if (!svg) return;
  const content = $(".step-content");
  const step = STEPS[state.step];
  if (!step?.zones?.connectors) return;

  let sourceEl;
  if (step.zones.scenario === "radio-selector") {
    sourceEl = $('[data-zone="scenario"] .scenario-radio-row.selected');
  } else {
    sourceEl = $('[data-zone="scenario"] wa-details');
  }
  const targetEl = $('[data-zone="decider-aligned"] .aligned-decider-node');
  if (sourceEl && targetEl && content) {
    drawCrossarm(svg, content, sourceEl, targetEl);
  }
};

const scheduleDrawZoneCrossarm = () => {
  requestAnimationFrame(() => requestAnimationFrame(drawZoneCrossarm));
};

const renderComparisonFlow = async (container, variant) => {
  const prevValuesOpen = container.querySelector("[data-comp-values]")?.open
    ?? container.querySelector("[data-comp-sandbox-values]")?.open
    ?? false;
  const prevScenarioOpen = container.querySelector("[data-comp-scenario] wa-details")?.open ?? false;

  container.dataset.variant = variant;
  const isSandbox = variant === "sandbox";

  const scenario = getScenario(state.scenarioId);
  const baseline = await decide(state.scenarioId, "baseline");
  const aligned = await decide(state.scenarioId, "aligned", state.values);

  const baselineLlm = baseline.llmBackbone?.split("/").pop() || "Language Model";

  const scenarioColHtml = isSandbox
    ? `<div class="sandbox-scenario-accordion" data-comp-sandbox-scenarios></div>`
    : `<div class="flow-input-label">Scenario</div><div data-comp-scenario></div>`;

  const valuesColHtml = isSandbox
    ? `<wa-details class="values-accordion" open data-comp-sandbox-values>
        <span slot="summary" class="values-presets" data-comp-sandbox-presets></span>
        <div class="values-sliders" data-comp-sandbox-sliders></div>
      </wa-details>
      <div class="sandbox-values-stem"></div>`
    : `<div class="flow-input-label">Value Profile</div>
      <wa-details class="values-accordion"${prevValuesOpen ? " open" : ""} data-comp-values>
        <span slot="summary" class="values-presets" data-comp-presets></span>
        <div class="values-sliders" data-comp-sliders></div>
      </wa-details>`;

  const decisionsHtml = renderComparisonDecisions(container, aligned, baseline, scenario);

  container.innerHTML = `
    <div class="comparison-flow">
      <div class="comparison-flow-inputs">
        <div class="comparison-input-col">${scenarioColHtml}</div>
        <div class="comparison-input-col">${valuesColHtml}</div>
      </div>
      <div class="comparison-connectors">
        <div class="comparison-stem-cell"><div class="comparison-stem"></div></div>
        <div class="comparison-stem-cell"${isSandbox ? ' style="display:none"' : ""}><div class="comparison-stem"></div></div>
      </div>
      <svg class="comparison-crossarm" data-comp-crossarm></svg>
      <div class="comparison-flow-deciders">
        <div class="comparison-decider-cell" data-comp-baseline-decider>
          ${deciderNodeHTML({ icon: "&#x1F916;", label: "Baseline Language Model", modelName: baselineLlm })}
        </div>
        <div class="comparison-decider-cell" data-comp-aligned-decider>
          ${deciderNodeHTML({ icon: "&#x1F9ED;", label: "Value Aligned Decider", modelName: formatAlignedModelName(aligned), className: "aligned-decider-node" })}
        </div>
      </div>
      <div class="comparison-flow-stems">
        <div class="comparison-stem-cell"><div class="comparison-stem"></div></div>
        <div class="comparison-stem-cell"><div class="comparison-stem"></div></div>
      </div>
      <div class="comparison-flow-decisions" data-comp-decisions>${decisionsHtml}</div>
    </div>
  `;

  if (isSandbox) {
    buildSandboxScenarioAccordion(
      container.querySelector("[data-comp-sandbox-scenarios]"),
      SCENARIOS,
      state.scenarioId,
      handleSandboxScenarioChange,
    );
    buildPresetChips(container.querySelector("[data-comp-sandbox-presets]"), state.presetId, handleSandboxPresetSelect);
    buildValueControls(container.querySelector("[data-comp-sandbox-sliders]"), state.values, handleSandboxValuesChange);
    const sandboxValues = container.querySelector("[data-comp-sandbox-values]");
    sandboxValues.addEventListener("wa-after-show", () => scheduleDrawCrossarm(container));
    sandboxValues.addEventListener("wa-after-hide", () => scheduleDrawCrossarm(container));
    container.querySelector("[data-comp-sandbox-scenarios]").addEventListener("wa-after-show", () => scheduleDrawCrossarm(container));
    container.querySelector("[data-comp-sandbox-scenarios]").addEventListener("wa-after-hide", () => scheduleDrawCrossarm(container));
  } else {
    const compScenario = container.querySelector("[data-comp-scenario]");
    renderScenarioSummary(compScenario, { wasOpen: prevScenarioOpen });
    buildPresetChips(container.querySelector("[data-comp-presets]"), state.presetId, handleComparisonPresetSelect);
    buildValueControls(container.querySelector("[data-comp-sliders]"), state.values, handleComparisonValuesChange);
    const compValues = container.querySelector("[data-comp-values]");
    compValues.addEventListener("wa-after-show", () => scheduleDrawCrossarm(container));
    compValues.addEventListener("wa-after-hide", () => scheduleDrawCrossarm(container));
    compScenario.addEventListener("wa-after-show", () => scheduleDrawCrossarm(container));
    compScenario.addEventListener("wa-after-hide", () => scheduleDrawCrossarm(container));
  }

  scheduleDrawCrossarm(container);
};

const buildSandboxScenarioAccordion = (container, scenarios, currentId, onSelect) => {
  container.innerHTML = "";

  scenarios.forEach((scenario) => {
    const row = document.createElement("div");
    row.className = `scenario-radio-row${scenario.id === currentId ? " selected" : ""}`;
    row.dataset.scenarioId = scenario.id;

    const radio = document.createElement("button");
    radio.className = "scenario-radio";
    radio.addEventListener("click", () => {
      container.querySelectorAll(".scenario-radio-row").forEach((r) => r.classList.remove("selected"));
      row.classList.add("selected");
      onSelect(scenario.id);
    });

    const details = document.createElement("wa-details");
    const dim = DIMENSIONS.find((d) => d.id === scenario.kdmaType);
    const kdmaLabel = dim ? dim.label : "";

    const descHtml = scenarioDescriptionHTML(scenario);
    const choicesHtml = scenarioChoiceCardsHTML(scenario);

    details.innerHTML = `
      <span slot="summary" class="accordion-summary">${scenario.title}${kdmaLabel ? `<span class="accordion-kdma-tag">${kdmaLabel}</span>` : ""}</span>
      <div class="accordion-scenario-body">
        <div class="accordion-scenario-description">${descHtml}</div>
        ${choicesHtml ? `<div class="scenario-choices">${choicesHtml}</div>` : ""}
      </div>
    `;

    details.addEventListener("wa-show", () => {
      container.querySelectorAll("wa-details").forEach((d) => {
        if (d !== details) d.hide();
      });
    });

    row.appendChild(radio);
    row.appendChild(details);
    container.appendChild(row);
  });
};

const refreshComparisonZone = async () => {
  const zone = $('[data-zone="comparison"]');
  if (!zone.classList.contains("visible")) return;
  await renderComparisonFlow(zone, zone.dataset.variant);
};

const syncAllValueControls = () => {
  const simplePresets = $("[data-simple-presets]");
  const simpleSliders = $("[data-simple-sliders]");
  if (simplePresets) buildPresetChips(simplePresets, state.presetId, handleSimplePresetSelect);
  if (simpleSliders) setSliderValues(simpleSliders, state.values);

  const valuesPresets = $("[data-values-presets]");
  const valuesSliders = $("[data-values-sliders]");
  if (valuesPresets) buildPresetChips(valuesPresets, state.presetId, handlePresetSelect);
  if (valuesSliders) setSliderValues(valuesSliders, state.values);

  const compPresets = $("[data-comp-presets]");
  const compSliders = $("[data-comp-sliders]");
  if (compPresets) buildPresetChips(compPresets, state.presetId, handleComparisonPresetSelect);
  if (compSliders) setSliderValues(compSliders, state.values);

  const sandboxPresets = $("[data-comp-sandbox-presets]");
  const sandboxSliders = $("[data-comp-sandbox-sliders]");
  if (sandboxPresets) buildPresetChips(sandboxPresets, state.presetId, handleSandboxPresetSelect);
  if (sandboxSliders) setSliderValues(sandboxSliders, state.values);
};

const handleScenarioChange = async (id) => {
  state.scenarioId = id;
};

const renderAlignedZones = async () => {
  await renderAlignedDecider($('[data-zone="decider-aligned"]'));
  await renderAlignedDecision($('[data-zone="decision-aligned"]'));
};

const makePresetHandler = (afterUpdate) => async (presetId) => {
  state.presetId = presetId;
  state.values = { ...getPreset(presetId).values };
  syncAllValueControls();
  if (afterUpdate) await afterUpdate();
};

const makeValuesHandler = (afterUpdate) => async (newValues) => {
  state.values = newValues;
  state.presetId = null;
  syncAllValueControls();
  if (afterUpdate) await afterUpdate();
};

const handleSimplePresetSelect = makePresetHandler();
const handleSimpleValuesChange = makeValuesHandler();
const handlePresetSelect = makePresetHandler(renderAlignedZones);
const handleValuesChange = makeValuesHandler(renderAlignedZones);
const handleComparisonPresetSelect = makePresetHandler(refreshComparisonZone);
const handleComparisonValuesChange = makeValuesHandler(refreshComparisonZone);
const handleSandboxPresetSelect = makePresetHandler(refreshComparisonZone);
const handleSandboxValuesChange = makeValuesHandler(refreshComparisonZone);

const handleExploreScenarioChange = async (id) => {
  state.scenarioId = id;
  await Promise.all([
    renderDeciderBaseline($('[data-zone="decider-baseline"]')),
    renderDecisionBaseline($('[data-zone="decision-baseline"]')),
    renderAlignedDecider($('[data-zone="decider-aligned"]')),
    renderAlignedDecision($('[data-zone="decision-aligned"]')),
  ]);
  scheduleDrawZoneCrossarm();
};

const handleSandboxScenarioChange = async (id) => {
  state.scenarioId = id;
  await refreshComparisonZone();
};

const renderZone = async (zoneId, variant) => {
  const zone = $(`[data-zone="${zoneId}"]`);
  switch (zoneId) {
    case "scenario":
      if (variant === "accordion") renderScenarioAccordion(zone);
      else if (variant === "radio-selector") renderScenarioRadioSelector(zone);
      else renderScenarioSummary(zone, { showLabel: variant === "summary-labeled" });
      break;
    case "decider-baseline":
      await renderDeciderBaseline(zone);
      break;
    case "decision-baseline":
      await renderDecisionBaseline(zone);
      break;
    case "values":
      if (variant === "with-decider") renderValuesWithDecider(zone);
      else renderValuesAccordion(zone, { open: variant === "accordion-open" });
      break;
    case "connectors":
      if (variant === "crossarm") renderCrossarmConnector(zone);
      else renderConnectors(zone);
      break;
    case "decider-aligned":
      await renderAlignedDecider(zone);
      break;
    case "decision-aligned":
      await renderAlignedDecision(zone);
      break;
    case "comparison":
      await renderComparisonFlow(zone, variant);
      break;
    case "learn-more":
      break;
  }
};

const goToStep = async (index) => {
  if (index < 0 || index >= STEPS.length || index === state.step) return;

  const forward = index > state.step;
  const isInitial = state.step < 0;
  const prevStep = state.step >= 0 ? STEPS[state.step] : { zones: {} };
  const nextStep = STEPS[index];

  const prevZones = new Set(Object.keys(prevStep.zones));
  const nextZones = new Set(Object.keys(nextStep.zones));

  const leaving = [...prevZones].filter((z) => !nextZones.has(z));
  const entering = [...nextZones].filter((z) => !prevZones.has(z));
  const staying = [...nextZones].filter((z) => prevZones.has(z));

  const prevIndex = state.step;
  state.step = index;
  const isMorph =
    (prevIndex === 3 && index === 4) || (prevIndex === 4 && index === 3) ||
    (prevIndex === 4 && index === 5) || (prevIndex === 5 && index === 4);

  const applyChanges = async () => {
    const svg = $(".zone-connectors .crossarm-overlay");
    if (svg) svg.innerHTML = "";
    $(".guide-viewport").dataset.step = index;
    $("[data-step-heading]").textContent = nextStep.heading;
    $("[data-step-subtitle]").innerHTML = nextStep.subtitle;
    $("[data-prev]").hidden = index === 0;
    $("[data-next]").hidden = index === STEPS.length - 1;
    $("[data-scroll-hint]").hidden = index === STEPS.length - 1;

    $$(".toc-pill").forEach((pill) => {
      pill.classList.toggle("active", pill.dataset.toc === nextStep.id);
    });

    leaving.forEach((zoneId) => {
      $(`[data-zone="${zoneId}"]`).classList.remove("visible");
    });

    entering.forEach((zoneId) => {
      $(`[data-zone="${zoneId}"]`).classList.add("visible");
    });

    const renderPromises = [];
    entering.forEach((zoneId) => {
      renderPromises.push(renderZone(zoneId, nextStep.zones[zoneId]));
    });
    staying.forEach((zoneId) => {
      if (prevStep.zones[zoneId] !== nextStep.zones[zoneId]) {
        renderPromises.push(renderZone(zoneId, nextStep.zones[zoneId]));
      }
    });
    await Promise.all(renderPromises);
  };

  if (!isInitial && document.startViewTransition) {
    staying.forEach((zoneId) => {
      $(`[data-zone="${zoneId}"]`).style.viewTransitionName = `zone-${zoneId}`;
    });

    if (isMorph) {
      document.documentElement.classList.add("morph-transition");
    } else {
      document.documentElement.classList.toggle("backward", !forward);
    }
    const transition = document.startViewTransition(() => applyChanges());
    await transition.finished;

    staying.forEach((zoneId) => {
      $(`[data-zone="${zoneId}"]`).style.viewTransitionName = "";
    });
    document.documentElement.classList.remove("backward", "morph-transition");
  } else {
    await applyChanges();
  }

  const compZone = $('[data-zone="comparison"]');
  if (compZone.classList.contains("visible")) scheduleDrawCrossarm(compZone);
  scheduleDrawZoneCrossarm();
};

const setupNav = () => {
  $("[data-prev]").addEventListener("click", () => goToStep(state.step - 1));
  $("[data-next]").addEventListener("click", () => goToStep(state.step + 1));

  $$(".toc-pill").forEach((pill, i) => {
    pill.addEventListener("click", () => goToStep(i));
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      goToStep(state.step + 1);
    }
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      goToStep(state.step - 1);
    }
  });

  let wheelCooldown = false;
  let edgeCount = 0;
  let lastEdgeDir = 0;
  const content = $(".step-content");
  $(".guide-viewport").addEventListener("wheel", (e) => {
    if (wheelCooldown) return;
    const threshold = 30;
    if (Math.abs(e.deltaY) < threshold) return;
    const dir = e.deltaY > 0 ? 1 : -1;
    const atTop = content.scrollTop <= 0;
    const atBottom = content.scrollTop + content.clientHeight >= content.scrollHeight - 1;
    const atEdge = (dir > 0 && atBottom) || (dir < 0 && atTop);
    const isScrollable = content.scrollHeight > content.clientHeight + 2;
    if (!atEdge) { edgeCount = 0; lastEdgeDir = 0; return; }
    if (isScrollable && (dir !== lastEdgeDir || edgeCount < 1)) {
      edgeCount = dir === lastEdgeDir ? edgeCount + 1 : 1;
      lastEdgeDir = dir;
      return;
    }
    edgeCount = 0;
    lastEdgeDir = 0;
    wheelCooldown = true;
    setTimeout(() => { wheelCooldown = false; }, 600);
    goToStep(state.step + dir);
  }, { passive: true });
};

const init = async () => {
  setupNav();
  window.addEventListener("resize", () => {
    const zone = $('[data-zone="comparison"]');
    if (zone.classList.contains("visible")) scheduleDrawCrossarm(zone);
    scheduleDrawZoneCrossarm();
  });
  $(".step-content").addEventListener("wa-after-show", scheduleDrawZoneCrossarm);
  $(".step-content").addEventListener("wa-after-hide", scheduleDrawZoneCrossarm);
  goToStep(0);
};

ready.then(() => {
  state.scenarioId = SCENARIOS[0].id;
  state.presetId = PRESETS[0].id;
  state.values = { ...PRESETS[0].values };
  init();
});
