(() => {
  "use strict";

  const root = document.getElementById("interactive-demo");
  if (!root) return;

  const data = window.A2WORLD_INTERACTIVE_DEMO;
  const sceneTabs = document.getElementById("scene-tabs");
  const sceneDataset = document.getElementById("scene-dataset");
  const sceneTitle = document.getElementById("scene-title");
  const sceneDescription = document.getElementById("scene-description");
  const stageList = document.getElementById("action-stage-list");
  const video = document.getElementById("interactive-video");
  const videoFrame = video.closest(".focus-video");
  const focusTitle = document.getElementById("focus-title");
  const focusMeta = document.getElementById("focus-meta");
  const focusPath = document.getElementById("focus-path");
  const generateButton = document.getElementById("generate-rollout");
  const resetButton = document.getElementById("reset-rollout");
  const assetRoot = "docs/resources/interactive-demo/";
  const assetVersion = "?v=16";

  if (!data || !Array.isArray(data.scenes) || data.scenes.length < 1) {
    root.innerHTML = '<p class="demo-error">Interactive demo assets are unavailable.</p>';
    return;
  }

  let sceneIndex = 0;
  let scene = data.scenes[0];
  let selected = [];

  const asset = (path) => `${assetRoot}${path}${assetVersion}`;
  const optionById = (stage, id) => stage.options.find((option) => option.id === id);

  function resetSelections() {
    selected = scene.stages.map((stage, index) =>
      optionById(stage, scene.preferred?.[index]) ? scene.preferred[index] : stage.options[0].id,
    );
  }

  function selectedLabels() {
    return selected.map((choice, index) => optionById(scene.stages[index], choice).label);
  }

  function renderPath(labels = []) {
    focusPath.textContent = labels.length ? labels.join("  →  ") : "Initial";
  }

  function resetViewer() {
    video.pause();
    video.removeAttribute("src");
    video.poster = asset(scene.initial);
    video.load();
    focusTitle.textContent = "Initial observation";
    focusMeta.textContent = `${scene.views} views`;
    renderPath();
  }

  function renderTabs() {
    sceneTabs.replaceChildren();
    data.scenes.forEach((item, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "scene-tab";
      button.textContent = item.dataset;
      button.setAttribute("aria-pressed", String(index === sceneIndex));
      button.addEventListener("click", () => loadScene(index));
      sceneTabs.append(button);
    });
  }

  function select(stageIndex, optionId) {
    selected[stageIndex] = optionId;
    renderControls();
    const labels = selectedLabels();
    video.pause();
    video.removeAttribute("src");
    video.poster = asset(scene.initial);
    video.load();
    focusTitle.textContent = "Ready";
    focusMeta.textContent = `${labels.length} selected action${labels.length === 1 ? "" : "s"}`;
    renderPath(labels);
  }

  function renderControls() {
    stageList.replaceChildren();
    stageList.dataset.stageCount = String(scene.stages.length);
    scene.stages.forEach((stage, stageIndex) => {
      const section = document.createElement("section");
      section.className = "action-stage";

      const heading = document.createElement("div");
      heading.className = "action-stage-label";
      heading.textContent = stage.title;

      const options = document.createElement("div");
      options.className = "action-option-list";
      stage.options.forEach((option) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "action-option";
        button.textContent = option.label;
        button.setAttribute("aria-pressed", String(selected[stageIndex] === option.id));
        button.addEventListener("click", () => select(stageIndex, option.id));
        options.append(button);
      });

      section.append(heading, options);
      stageList.append(section);
    });
  }

  function playSelected() {
    const sequenceId = selected.join("__");
    const sequence = scene.sequences[sequenceId];
    if (!sequence) {
      focusMeta.textContent = "This rollout is unavailable in the static manifest.";
      return;
    }
    const labels = selectedLabels();
    video.removeAttribute("poster");
    video.src = asset(sequence.video);
    video.load();
    focusTitle.textContent = labels.join(" → ");
    const duration = Number(sequence.duration_seconds || 0).toFixed(1);
    focusMeta.textContent = `${duration} s`;
    renderPath(labels);
    video.play().catch(() => {
      focusMeta.textContent = `${duration} s · press play`;
    });
  }

  function loadScene(index) {
    sceneIndex = index;
    scene = data.scenes[index];
    resetSelections();
    sceneDataset.textContent = scene.dataset;
    sceneTitle.textContent = scene.task;
    sceneDescription.textContent = scene.description;
    sceneDescription.hidden = !scene.description;
    videoFrame.style.aspectRatio = scene.video_aspect_ratio;
    renderTabs();
    renderControls();
    resetViewer();
  }

  generateButton.addEventListener("click", playSelected);
  resetButton.addEventListener("click", () => {
    resetSelections();
    renderControls();
    resetViewer();
  });

  loadScene(0);
})();
