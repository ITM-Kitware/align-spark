const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const loadStylesheet = (href) =>
  new Promise((resolve) => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.onload = resolve;
    document.head.appendChild(link);
  });

const showTitle = () => {
  const title = document.createElement("div");
  title.className = "demo-title";
  title.innerHTML = `
    <div class="demo-title-main">ALIGN System</div>
    <div class="demo-title-sub">Aligning AI with Values</div>
  `;
  document.body.appendChild(title);
  return title;
};

const run = async () => {
  await loadStylesheet("./demo.css");
  const title = showTitle();
  while (!window.__demo) await wait(50);
  const d = window.__demo;
  await d.ready;
  document.body.classList.add("demo-mode");

  // Title hold (~2.2s)
  await d.goToStep(2);
  await document.fonts.ready;
  document.documentElement.removeAttribute("data-demo");
  await wait(2200);
  title.classList.add("fading");
  await wait(600);
  title.remove();

  // Section 1: scenario + baseline decision
  await wait(400);
  await d.triggerComputation();
  await wait(3500);

  // Section 2: personal values
  await d.goToStep(3);
  await wait(800);
  await d.setValue("personal_safety", "high");
  await wait(1500);

  // Section 3: side-by-side compare (morphs from values)
  await d.goToStep(5);
  await wait(500);
  await d.triggerComputation();
  await wait(4500);

  document.body.dataset.demoDone = "1";
};

run();
