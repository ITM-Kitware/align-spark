import { initThemeSwitcher } from "./theme-switcher.js";
import "https://cdn.jsdelivr.net/npm/@awesome.me/webawesome@3.2.1/dist-cdn/components/tag/tag.js";
import "https://cdn.jsdelivr.net/npm/@awesome.me/webawesome@3.2.1/dist-cdn/components/spinner/spinner.js";
import "https://cdn.jsdelivr.net/npm/@awesome.me/webawesome@3.2.1/dist-cdn/components/slider/slider.js";
import "https://cdn.jsdelivr.net/npm/@awesome.me/webawesome@3.2.1/dist-cdn/components/details/details.js";
import "https://cdn.jsdelivr.net/npm/@awesome.me/webawesome@3.2.1/dist-cdn/components/card/card.js";
import "https://cdn.jsdelivr.net/npm/@awesome.me/webawesome@3.2.1/dist-cdn/components/button/button.js";
import "https://cdn.jsdelivr.net/npm/@awesome.me/webawesome@3.2.1/dist-cdn/components/badge/badge.js";

import { decide, ready } from "./align-engine.js";

const { scenarios: SCENARIOS, presets: PRESETS, dimensions: DIMENSIONS } = await ready;

export { SCENARIOS, PRESETS, DIMENSIONS, decide, ready };

const LEVEL_LABELS = { 0: "Low", 50: "Medium", 100: "High" };
const LEVEL_TO_STRING = { 0: "low", 50: "medium", 100: "high" };

export function simulateThinking(container, ms = 500) {
  container.innerHTML = `
    <div class="spinner-overlay">
      <wa-spinner></wa-spinner>
      <span>Model is thinking…</span>
    </div>
  `;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function sliderValueToLevel(value) {
  return LEVEL_TO_STRING[value] || "medium";
}

export function levelToSliderValue(level) {
  const map = { low: 0, medium: 50, high: 100 };
  return map[level] ?? 50;
}

export function buildPresetChips(container, currentPreset, onSelect) {
  container.innerHTML = "";
  container.classList.add("preset-chips");
  PRESETS.forEach((preset) => {
    const chip = document.createElement("button");
    chip.className = `preset-chip${preset.id === currentPreset ? " active" : ""}`;
    chip.textContent = preset.label;
    chip.title = preset.tagline;
    chip.addEventListener("click", () => onSelect(preset.id));
    container.appendChild(chip);
  });
}

export function buildValueControls(container, values, onChange) {
  container.innerHTML = "";
  container.classList.add("value-sliders");
  DIMENSIONS.forEach((dim) => {
    const level = values[dim.id] || "low";
    const sliderVal = levelToSliderValue(level);
    const row = document.createElement("div");
    row.className = "slider-row";
    row.innerHTML = `
      <div class="slider-label">${dim.label}</div>
      <wa-slider min="0" max="100" step="50" value="${sliderVal}" data-dim="${dim.id}" with-markers></wa-slider>
      <div class="slider-level" data-level-label="${dim.id}">${LEVEL_LABELS[sliderVal]}</div>
    `;
    container.appendChild(row);
  });

  container.addEventListener("input", (e) => {
    const range = e.target.closest("wa-slider");
    if (!range) return;
    const dim = range.dataset.dim;
    const val = Number(range.value);
    const label = container.querySelector(`[data-level-label="${dim}"]`);
    if (label) label.textContent = LEVEL_LABELS[val] || "Medium";
    const newValues = getCurrentValues(container);
    onChange(newValues);
  });
}

export function setSliderValues(container, values) {
  DIMENSIONS.forEach((dim) => {
    const level = values[dim.id] || "low";
    const sliderVal = levelToSliderValue(level);
    const range = container.querySelector(`wa-slider[data-dim="${dim.id}"]`);
    if (range) range.value = sliderVal;
    const label = container.querySelector(`[data-level-label="${dim.id}"]`);
    if (label) label.textContent = LEVEL_LABELS[sliderVal] || "Medium";
  });
}

export function getCurrentValues(sliderContainer) {
  const values = {};
  sliderContainer.querySelectorAll("wa-slider").forEach((range) => {
    values[range.dataset.dim] = sliderValueToLevel(Number(range.value));
  });
  return values;
}

export function buildScenarioSelector(container, currentId, onSelect) {
  container.innerHTML = "";
  SCENARIOS.forEach((scenario) => {
    const dim = DIMENSIONS.find((d) => d.id === scenario.kdmaType);
    const kdmaLabel = dim ? dim.label : "";
    const card = document.createElement("div");
    card.className = `scenario-card${scenario.id === currentId ? " active" : ""}`;
    card.innerHTML = `<div class="scenario-card-title">${scenario.title}${kdmaLabel ? `<span class="scenario-card-kdma">${kdmaLabel}</span>` : ""}</div>`;
    card.addEventListener("click", () => onSelect(scenario.id));
    container.appendChild(card);
  });
}

export function buildScenarioAccordion(container, scenarios, currentId, onSelect, { showKdmaTag = true, showChoicesInSummary = false } = {}) {
  container.innerHTML = "";

  scenarios.forEach((scenario) => {
    const details = document.createElement("wa-details");
    details.dataset.scenarioId = scenario.id;
    if (scenario.id === currentId) details.setAttribute("open", "");
    if (showChoicesInSummary) details.classList.add("baseline-scenario-panel");

    const dim = DIMENSIONS.find((d) => d.id === scenario.kdmaType);
    const kdmaLabel = dim ? dim.label : "";

    const descHtml = scenarioDescriptionHTML(scenario);
    const choicesHtml = scenarioChoiceCardsHTML(scenario);

    const tagHtml = showKdmaTag && kdmaLabel ? `<span class="accordion-kdma-tag">${kdmaLabel}</span>` : "";
    const summaryChoicesHtml = showChoicesInSummary
      ? `<span class="accordion-summary-choices">${scenario.choices.map((c, i) => `<span class="summary-choice-item">${choiceLetterHTML(i, { colored: true })}<span class="summary-choice-label">${c.label}</span></span>`).join("")}</span>`
      : "";
    details.innerHTML = `
      <span slot="summary" class="accordion-summary"><span class="accordion-summary-title">${scenario.title}</span>${tagHtml}${summaryChoicesHtml}</span>
      <div class="accordion-scenario-body">
        <div class="accordion-scenario-description">${descHtml}</div>
        ${choicesHtml ? `<div class="scenario-choices">${choicesHtml}</div>` : ""}
      </div>
    `;
    container.appendChild(details);
  });

  let activeId = currentId;

  container.addEventListener("wa-show", (e) => {
    const target = e.target.closest("wa-details");
    if (!target) return;
    activeId = target.dataset.scenarioId;
    container.querySelectorAll("wa-details").forEach((d) => {
      if (d !== target && d.open) d.open = false;
    });
    onSelect(activeId);
  });

  container.addEventListener("wa-hide", (e) => {
    const target = e.target.closest("wa-details");
    if (target && target.dataset.scenarioId === activeId) {
      e.preventDefault();
    }
  });
}

const ADM_DISPLAY_NAMES = {
  phase2_pipeline_zeroshot_comparative_regression: "Comparative Regression",
};

function formatLlm(result) {
  return result.llmBackbone?.split("/").pop() || "";
}

function formatAdm(result) {
  return ADM_DISPLAY_NAMES[result.admName] || result.admName || "";
}

export function choiceLetterHTML(index, { colored = false, decision = false } = {}) {
  if (index < 0) return "";
  const letter = String.fromCharCode(65 + index);
  const colorClass = colored ? ` choice-${String.fromCharCode(97 + index)}` : "";
  const decisionClass = decision ? " decision-choice-letter" : "";
  return `<span class="choice-letter${decisionClass}${colorClass}">${letter}</span>`;
}

export function scenarioDescriptionHTML(scenario) {
  return scenario.description
    .split("\n")
    .filter((p) => p.trim())
    .map((p) => `<p>${p}</p>`)
    .join("");
}

export function scenarioChoiceCardsHTML(scenario) {
  return scenario.choices
    .map((c, i) =>
      `<div class="scenario-choice-card">${choiceLetterHTML(i, { colored: true })}${c.label}</div>`,
    )
    .join("");
}

export function deciderNodeHTML({ icon, label, modelName, className = "decider-node" }) {
  return `
    <div class="${className}">
      <div class="decider-node-icon">${icon}</div>
      <div class="decider-node-text">
        <div class="decider-label">${label}</div>
        <div class="decider-model-name">${modelName}</div>
      </div>
    </div>
  `;
}

export function decisionPanelHTML({ letterHTML, decision, justification, isOpen = false }) {
  return `
    <wa-details class="decision-panel"${isOpen ? " open" : ""}>
      <span slot="summary" class="decision-panel-summary">
        <span class="decision-panel-choice">${letterHTML}${decision}</span>
        <span class="decision-panel-justification-preview">${justification}</span>
      </span>
      <div class="decision-rationale">${justification}</div>
    </wa-details>
  `;
}

export function renderDecisionComparison(container, baseline, aligned, scenario, openState) {
  const changed = baseline.choiceId !== aligned.choiceId;
  const baselineLlm = formatLlm(baseline);
  const alignedAdm = formatAdm(aligned);
  const alignedLlm = formatLlm(aligned);
  const baseOpen = openState?.[0] ? " open" : "";
  const alignedOpen = openState?.[1] ? " open" : "";
  const baselineIdx = scenario.choices.findIndex((c) => c.id === baseline.choiceId);
  const alignedIdx = scenario.choices.findIndex((c) => c.id === aligned.choiceId);
  container.innerHTML = `
    <div class="decision-comparison">
      <div class="decision-col">
        <div class="eyebrow">Baseline Language Model</div>
        <div class="decision-model-info">${baselineLlm}</div>
        <div class="decision-choice">${choiceLetterHTML(baselineIdx, { decision: true })}${baseline.decision}</div>
        <wa-details summary="Justification" appearance="plain" class="decision-rationale-details"${baseOpen}><div class="decision-rationale">${baseline.justification}</div></wa-details>
      </div>
      <div class="comparison-divider">
        <div class="divider-line"></div>
        <div class="comparison-badge ${changed ? "changed" : "same"}">${changed ? "Changed" : "Same"}</div>
        <div class="divider-line"></div>
      </div>
      <div class="decision-col">
        <div class="eyebrow">Value Aligned Decider</div>
        <div class="decision-model-info">${alignedAdm} · ${alignedLlm}</div>
        <div class="decision-choice">${choiceLetterHTML(alignedIdx, { decision: true })}${aligned.decision}</div>
        <wa-details summary="Justification" appearance="plain" class="decision-rationale-details"${alignedOpen}><div class="decision-rationale">${aligned.justification}</div></wa-details>
      </div>
    </div>
  `;
}

export function renderScenarioDescription(container, scenario) {
  const parts = scenario.description.split("\n\n");
  const intro = parts[0];
  const choiceParts = parts.slice(1);

  container.innerHTML = `
    <div class="scenario-intro">${intro}</div>
    ${choiceParts.length > 0 ? `
      <div class="scenario-choices-group">
        <div class="choices-label">The Choices</div>
        <div class="scenario-choices">
          ${choiceParts.map((p, i) => `<div class="scenario-choice-card"><span class="choice-letter">${String.fromCharCode(65 + i)}</span>${p}</div>`).join("")}
        </div>
      </div>` : ""}
  `;
}

export function getDetailsOpenState(container) {
  const details = container.querySelectorAll(".decision-panel, .decision-rationale-details");
  return [details[0]?.open ?? false, details[1]?.open ?? false];
}

export function getScenario(id) {
  return SCENARIOS.find((s) => s.id === id);
}

export function getPreset(id) {
  return PRESETS.find((p) => p.id === id);
}

initThemeSwitcher();
