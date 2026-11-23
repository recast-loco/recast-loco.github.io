"use strict";

function setupSyncGroup(group) {
  const videos = [...group.querySelectorAll("video")];
  const playButton = group.querySelector(".sync-play");
  const resetButton = group.querySelector(".sync-reset");
  const status = group.querySelector(".scene-status");
  if (!playButton || videos.length < 2) return;

  function updateButton() {
    const playing = videos.some((video) => !video.paused && !video.ended);
    playButton.textContent = playing ? "Pause together" : "Play together";
    playButton.setAttribute("aria-pressed", String(playing));
  }

  playButton.addEventListener("click", async () => {
    const playing = videos.some((video) => !video.paused && !video.ended);
    if (playing) {
      videos.forEach((video) => video.pause());
      if (status) status.textContent = "Comparison paused.";
      updateButton();
      return;
    }

    document.querySelectorAll("video").forEach((video) => {
      if (!group.contains(video)) video.pause();
    });

    const startTime = Math.min(...videos.map((video) => video.ended ? 0 : video.currentTime));
    videos.forEach((video) => {
      video.currentTime = startTime;
      video.playbackRate = 1;
      video.muted = true;
    });

    const results = await Promise.allSettled(videos.map((video) => video.play()));
    const failed = results.some((result) => result.status === "rejected");
    if (status) status.textContent = failed ? "Use the individual controls if a clip did not start." : "Playing together at 1× speed.";
    updateButton();
  });

  resetButton?.addEventListener("click", () => {
    videos.forEach((video) => {
      video.pause();
      video.currentTime = 0;
      video.playbackRate = 1;
    });
    if (status) status.textContent = "Comparison reset.";
    updateButton();
  });

  videos.forEach((video) => {
    ["play", "pause", "ended"].forEach((eventName) => video.addEventListener(eventName, updateButton));
  });
}

document.querySelectorAll(".sync-group").forEach(setupSyncGroup);

if ("IntersectionObserver" in window) {
  const navLinks = [...document.querySelectorAll(".scene-nav a")];
  const navTargets = navLinks.map((link) => document.querySelector(link.hash)).filter(Boolean);
  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((link) => {
        if (link.hash === `#${entry.target.id}`) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
    });
  }, { rootMargin: "-20% 0px -65% 0px" });
  navTargets.forEach((target) => navObserver.observe(target));

  const playbackObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) entry.target.querySelectorAll("video").forEach((video) => video.pause());
    });
  }, { rootMargin: "45% 0px 45% 0px" });
  document.querySelectorAll(".scene").forEach((scene) => playbackObserver.observe(scene));
}
