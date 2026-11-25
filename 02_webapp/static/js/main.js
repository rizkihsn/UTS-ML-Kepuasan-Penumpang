/* SKYSCORE — animasi scroll, formulir bertahap, dan pemanggilan API prediksi */
(function () {
  "use strict";

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const ease = (t) => 1 - Math.pow(1 - t, 3);
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Nav: warna menyesuaikan latar ---------- */
  const nav = $("#nav");
  const fly = $("#fly");
  const predict = $("#prediksi");

  function updateNav() {
    nav.classList.toggle("is-solid", window.scrollY > 40);
    const probe = 40; // posisi y kira-kira tinggi nav
    const light = [fly, predict].some((el) => {
      const r = el.getBoundingClientRect();
      return r.top <= probe && r.bottom >= probe;
    });
    nav.classList.toggle("is-light", light);
  }

  /* ---------- Hero: jendela membesar saat scroll ---------- */
  const hero = $("#hero");
  const win = $("#window");
  const heroCopy = $("#heroCopy");
  const heroScroll = $("#heroScroll");

  function updateHero() {
    const r = hero.getBoundingClientRect();
    const total = hero.offsetHeight - window.innerHeight;
    const p = clamp(-r.top / total);
    const e = p * p * (3 - 2 * p); // smoothstep: zoom mulus dari awal sampai akhir
    const isMobile = window.innerWidth <= 900;
    const scale = 1 + e * (isMobile ? 7 : 5.6);
    // jendela bergerak ke tengah layar sambil membesar
    const startX = isMobile ? 50 : 62;
    const startY = isMobile ? 66 : 50;
    const x = startX + (50 - startX) * e;
    const y = startY + (50 - startY) * e;
    win.style.left = x + "%";
    win.style.top = y + "%";
    win.style.transform = "translate(-50%, -50%) scale(" + scale.toFixed(3) + ")";
    heroCopy.style.opacity = clamp(1 - p * 4);
    heroCopy.style.transform = (isMobile ? "" : "translateY(-50%) ") + "translateX(" + (-p * 60).toFixed(1) + "px)";
    heroScroll.style.opacity = clamp(1 - p * 6);
  }

  /* ---------- Teks yang menyala saat scroll ---------- */
  const stText = $("#statementText");
  const words = [];
  if (stText) {
    const raw = stText.textContent.trim().split(/\s+/);
    stText.textContent = "";
    raw.forEach((w, i) => {
      const s = document.createElement("span");
      s.className = "w";
      s.textContent = w;
      stText.appendChild(s);
      if (i < raw.length - 1) stText.appendChild(document.createTextNode(" "));
      words.push(s);
    });
  }

  function updateHighlight() {
    if (!words.length) return;
    const r = stText.getBoundingClientRect();
    const vh = window.innerHeight;
    // progres 0 saat teks masuk dari bawah, 1 saat teks mencapai sepertiga atas layar
    const p = clamp((vh * 0.85 - r.top) / (vh * 0.55 + r.height * 0.6));
    const n = Math.floor(p * words.length * 1.05);
    words.forEach((w, i) => w.classList.toggle("on", i < n));
  }

  /* ---------- Transisi krim: kata melebar, jet muncul ---------- */
  const flyL = $("#flyL");
  const flyR = $("#flyR");
  const jet = $("#jet");

  function updateFly() {
    const r = fly.getBoundingClientRect();
    const total = fly.offsetHeight - window.innerHeight;
    const p = clamp(-r.top / total);
    const e = ease(clamp(p * 1.15));
    const spread = window.innerWidth * (window.innerWidth <= 900 ? 0.012 : 0.035) * e;
    flyL.style.transform = "translateY(-50%) translateX(" + (-spread).toFixed(1) + "px)";
    flyR.style.transform = "translateY(-50%) translateX(" + spread.toFixed(1) + "px)";
    const scale = 0.55 + 0.5 * e;
    const y = (1 - e) * 22 - p * 6;
    jet.style.transform = "translateY(" + y.toFixed(1) + "vh) scale(" + scale.toFixed(3) + ")";
    jet.style.opacity = clamp(p * 5).toFixed(2);
  }

  /* ---------- Loop scroll hemat tenaga ---------- */
  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      updateNav();
      if (!reduceMotion) { updateHero(); updateFly(); }
      updateHighlight();
      ticking = false;
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  if (reduceMotion) { jet.style.opacity = 1; words.forEach((w) => w.classList.add("on")); }
  onScroll();

  /* ---------- Reveal + counter ---------- */
  function formatNumber(v, dec, sep) {
    let s = v.toFixed(dec);
    if (dec) s = s.replace(".", ",");
    if (sep) s = s.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return s;
  }
  function runCounter(el) {
    const target = parseFloat(el.dataset.count);
    const dec = parseInt(el.dataset.dec || "0", 10);
    const sep = !!el.dataset.sep;
    const suffix = el.dataset.suffix || "";
    if (reduceMotion) { el.textContent = formatNumber(target, dec, sep) + suffix; return; }
    const t0 = performance.now(), dur = 1600;
    (function tick(now) {
      const t = clamp((now - t0) / dur);
      el.textContent = formatNumber(target * ease(t), dec, sep) + suffix;
      if (t < 1) requestAnimationFrame(tick);
    })(t0);
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add("is-in");
      $$("[data-count]", en.target).forEach(runCounter);
      if (en.target.matches("[data-count]")) runCounter(en.target);
      io.unobserve(en.target);
    });
  }, { threshold: 0.25 });
  $$(".reveal").forEach((el) => io.observe(el));

  /* ---------- Formulir bertahap ---------- */
  const form = $("#form");
  const panels = $$(".panel", form);
  const stepItems = $$("#stepList li");
  const btnBack = $("#btnBack");
  const btnNext = $("#btnNext");
  const btnSubmit = $("#btnSubmit");
  const errBox = $("#formError");
  let step = 0;

  function showStep(n, scroll) {
    step = n;
    panels.forEach((p, i) => p.classList.toggle("is-active", i === n));
    stepItems.forEach((li, i) => {
      li.classList.toggle("is-active", i === n);
      li.classList.toggle("is-done", i < n);
    });
    btnBack.hidden = n === 0;
    btnNext.hidden = n === panels.length - 1;
    btnSubmit.hidden = n !== panels.length - 1;
    errBox.hidden = true;
    if (scroll) form.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function validatePanel(n) {
    const rules = [
      ["Age", 1, 100, "Usia"],
      ["Flight Distance", 1, 10000, "Jarak penerbangan"],
      ["Departure Delay", 0, 2000, "Keterlambatan keberangkatan"],
      ["Arrival Delay", 0, 2000, "Keterlambatan kedatangan"],
    ];
    const here = { 0: ["Age"], 1: ["Flight Distance", "Departure Delay", "Arrival Delay"] }[n] || [];
    for (const [name, lo, hi, label] of rules) {
      if (!here.includes(name)) continue;
      const v = form.elements[name].value;
      const num = Number(v);
      if (v === "" || Number.isNaN(num) || num < lo || num > hi) {
        return label + " harus berupa angka antara " + lo + " dan " + hi + ".";
      }
    }
    return "";
  }

  btnNext.addEventListener("click", () => {
    const msg = validatePanel(step);
    if (msg) { errBox.textContent = msg; errBox.hidden = false; return; }
    showStep(step + 1, true);
  });
  btnBack.addEventListener("click", () => showStep(step - 1, true));

  /* ---------- Kirim & tampilkan hasil ---------- */
  function collect() {
    const data = {};
    new FormData(form).forEach((v, k) => { data[k] = v; });
    return data;
  }

  const resultSec = $("#hasil");
  const ticket = $("#ticket");

  const CLASS_ID = { "Economy": "Economy", "Economy Plus": "Economy Plus", "Business": "Business" };
  const TRAVEL_ID = { Personal: "Pribadi", Business: "Bisnis" };
  const CUST_ID = { "First-time": "Pertama kali", Returning: "Pelanggan lama" };

  function renderTicket(res, d) {
    const pct = Math.round(res.probability * 1000) / 10;
    ticket.classList.toggle("is-no", !res.satisfied);
    $("#verdict").textContent = res.satisfied ? "Puas." : "Belum puas.";
    $("#verdictSub").textContent = res.satisfied ? "Satisfied" : "Neutral or Dissatisfied";
    $("#probText").textContent = pct.toFixed(1).replace(".", ",") + "%";
    $("#probBar").style.width = "0";

    const grid = $("#ticketGrid");
    grid.textContent = "";
    [
      ["Kelas", CLASS_ID[d["Class"]]],
      ["Tujuan", TRAVEL_ID[d["Type of Travel"]]],
      ["Pelanggan", CUST_ID[d["Customer Type"]]],
      ["Usia", d["Age"] + " th"],
      ["Jarak", Number(d["Flight Distance"]).toLocaleString("id-ID")],
      ["Delay tiba", d["Arrival Delay"] + " mnt"],
    ].forEach(([k, v]) => {
      const wrap = document.createElement("div");
      const dt = document.createElement("dt"); dt.textContent = k;
      const dd = document.createElement("dd"); dd.textContent = v;
      wrap.append(dt, dd);
      grid.appendChild(wrap);
    });

    const box = $("#levers");
    const list = $("#leverList");
    list.textContent = "";
    if (res.levers && res.levers.length) {
      res.levers.forEach((l) => {
        const li = document.createElement("li");
        const name = document.createElement("span"); name.textContent = l.label;
        const gain = document.createElement("b");
        gain.textContent = "+" + (l.gain * 100).toFixed(1).replace(".", ",") + " poin";
        li.append(name, gain);
        list.appendChild(li);
      });
      box.hidden = false;
    } else {
      box.hidden = true;
    }

    resultSec.hidden = false;
    ticket.classList.remove("is-in");
    requestAnimationFrame(() => {
      resultSec.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      setTimeout(() => {
        ticket.classList.add("is-in");
        $("#probBar").style.width = pct + "%";
      }, reduceMotion ? 0 : 450);
    });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errBox.hidden = true;
    btnSubmit.disabled = true;
    const label = btnSubmit.innerHTML;
    btnSubmit.textContent = "Memproses…";
    const data = collect();
    try {
      const resp = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const res = await resp.json();
      if (!resp.ok) throw new Error(res.error || "Terjadi kesalahan pada server.");
      renderTicket(res, data);
    } catch (err) {
      errBox.textContent = err.message || "Tidak dapat menghubungi server.";
      errBox.hidden = false;
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = label;
    }
  });

  $("#btnAgain").addEventListener("click", () => {
    showStep(0, false);
    $("#prediksi").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  /* ---------- Barcode dekoratif ---------- */
  (function barcode() {
    const bc = $("#barcode");
    let seed = 42;
    const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    for (let i = 0; i < 46; i++) {
      const b = document.createElement("i");
      b.style.width = (1 + Math.floor(rnd() * 3)) + "px";
      b.style.marginRight = (1 + Math.floor(rnd() * 3)) + "px";
      bc.appendChild(b);
    }
  })();

  /* ---------- Info model: grafik fitur ---------- */
  fetch("/api/model-info")
    .then((r) => r.json())
    .then((info) => {
      const wrap = $("#bars");
      wrap.textContent = "";
      const max = Math.max(...info.importance.map((i) => i.importance));
      info.importance.forEach((it) => {
        const row = document.createElement("div");
        row.className = "bar";
        const name = document.createElement("span"); name.textContent = it.label;
        const track = document.createElement("span"); track.className = "bar__track";
        const fill = document.createElement("span"); fill.className = "bar__fill";
        track.appendChild(fill);
        const val = document.createElement("span"); val.className = "bar__val";
        val.textContent = (it.importance * 100).toFixed(1).replace(".", ",") + "%";
        row.append(name, track, val);
        wrap.appendChild(row);
        fill.dataset.w = (it.importance / max) * 100;
      });
      const barIo = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          $$(".bar__fill", wrap).forEach((f, i) => {
            setTimeout(() => { f.style.width = f.dataset.w + "%"; }, reduceMotion ? 0 : i * 90);
          });
          barIo.disconnect();
        });
      }, { threshold: 0.3 });
      barIo.observe(wrap);
    })
    .catch(() => {
      $("#bars").innerHTML = '<p class="muted">Data model tidak dapat dimuat.</p>';
    });
})();
