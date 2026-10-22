/**
 * DR. RAJIV KARNIK — CONSULTANT CARDIOLOGIST & INTERVENTIONAL CARDIOLOGY
 * Interactive Portfolio Scripts, Demo Data Engine & Performance Optimizations
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initECGAnimation();
  initCounters();
  initProcedureModal();
  initEducationHub();
  initRiskTool();
  initAppointmentForm();
  initFAQ();
  initQuickActions();
  initGlobalKeyboard();
});

/* -------------------------------------------------------------
   0. Body Scroll Lock & Toast Notifications
   ------------------------------------------------------------- */
function lockBodyScroll() {
  document.body.classList.add('scroll-locked');
}

function unlockBodyScroll() {
  document.body.classList.remove('scroll-locked');
  document.body.style.overflow = '';
}

let toastTimer = null;
function showDemoToast(message, duration = 3200) {
  const toast = document.getElementById('demoToast');
  if (!toast) return;

  toast.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
    <span>${message}</span>
  `;

  toast.classList.add('show');
  if (toastTimer) clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, duration);
}

/* -------------------------------------------------------------
   1. Navbar & Mobile Drawer
   ------------------------------------------------------------- */
function initNavbar() {
  const header = document.querySelector('.site-header');
  const menuBtn = document.querySelector('.mobile-menu-toggle');
  const drawer = document.querySelector('.mobile-drawer');
  const closeBtn = document.querySelector('.mobile-drawer-close');
  const drawerLinks = document.querySelectorAll('.mobile-drawer-nav a, .mobile-drawer-cta a');

  // Throttled sticky header with requestAnimationFrame for 120Hz ProMotion screens
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        if (window.scrollY > 20) {
          header?.classList.add('scrolled');
        } else {
          header?.classList.remove('scrolled');
        }
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  // Mobile drawer controls
  const openDrawer = () => {
    drawer?.classList.add('open');
    lockBodyScroll();
  };

  const closeDrawer = () => {
    drawer?.classList.remove('open');
    unlockBodyScroll();
  };

  if (menuBtn) menuBtn.addEventListener('click', openDrawer);
  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);

  if (drawer) {
    drawer.addEventListener('click', (e) => {
      if (e.target === drawer) closeDrawer();
    });
  }

  drawerLinks.forEach(link => {
    link.addEventListener('click', () => {
      closeDrawer();
    });
  });
}

/* -------------------------------------------------------------
   2. High-DPI Retina ECG Live Canvas (Battery & Performance Optimized)
   ------------------------------------------------------------- */
function initECGAnimation() {
  const canvas = document.getElementById('ecgCanvas');
  if (!canvas || !canvas.parentElement) return;

  const ctx = canvas.getContext('2d');
  let animationFrameId = null;
  let isVisible = false;

  // Support high-DPI displays (Mac Retina, iPhone Super Retina OLED, Android AMOLED)
  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let cssWidth = canvas.parentElement.offsetWidth;
  let cssHeight = canvas.parentElement.offsetHeight;

  function resizeCanvas() {
    if (!canvas.parentElement) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    cssWidth = canvas.parentElement.offsetWidth;
    cssHeight = canvas.parentElement.offsetHeight;

    canvas.width = Math.floor(cssWidth * dpr);
    canvas.height = Math.floor(cssHeight * dpr);
    canvas.style.width = cssWidth + 'px';
    canvas.style.height = cssHeight + 'px';

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
  }

  resizeCanvas();

  // Resize listener with debouncing
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(resizeCanvas, 150);
  }, { passive: true });

  // Respect user preference for reduced motion
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    ctx.strokeStyle = '#2dd4bf';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, cssHeight / 2);
    ctx.lineTo(cssWidth, cssHeight / 2);
    ctx.stroke();
    return;
  }

  let x = 0;
  let step = 0;
  const points = [];

  function getEcgY(t, midY) {
    const cycle = t % 120;
    if (cycle > 20 && cycle < 28) {
      // P wave
      return midY - 6 * Math.sin(((cycle - 20) / 8) * Math.PI);
    } else if (cycle >= 35 && cycle < 38) {
      // Q dip
      return midY + 8;
    } else if (cycle >= 38 && cycle < 44) {
      // R peak
      return midY - 38;
    } else if (cycle >= 44 && cycle < 48) {
      // S dip
      return midY + 16;
    } else if (cycle >= 58 && cycle < 72) {
      // T wave
      return midY - 10 * Math.sin(((cycle - 58) / 14) * Math.PI);
    }
    return midY;
  }

  function renderFrame() {
    if (!isVisible) return;

    const midY = cssHeight / 2;

    ctx.fillStyle = 'rgba(7, 19, 36, 0.08)';
    ctx.fillRect(0, 0, cssWidth, cssHeight);

    ctx.strokeStyle = '#2dd4bf';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#2dd4bf';

    ctx.beginPath();
    const currentY = getEcgY(step, midY);

    points.push({ x: x, y: currentY });
    if (points.length > cssWidth / 2) {
      points.shift();
    }

    if (points.length > 1) {
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.stroke();
    }

    x += 2;
    step += 1;
    if (x > cssWidth) {
      x = 0;
      points.length = 0;
    }

    animationFrameId = requestAnimationFrame(renderFrame);
  }

  // IntersectionObserver: PAUSES animation when scrolled away to conserve battery & eliminate CPU jank
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      isVisible = entry.isIntersecting;
      if (isVisible) {
        if (!animationFrameId) {
          animationFrameId = requestAnimationFrame(renderFrame);
        }
      } else {
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
          animationFrameId = null;
        }
      }
    });
  }, { threshold: 0.05 });

  const statsSection = document.querySelector('.ecg-live-strip');
  if (statsSection) observer.observe(statsSection);
}

/* -------------------------------------------------------------
   3. Animated Numerical Counters (Smooth Ease-Out)
   ------------------------------------------------------------- */
function initCounters() {
  const statNumbers = document.querySelectorAll('.counter-val');
  if (!statNumbers.length) return;

  let started = false;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !started) {
        started = true;
        statNumbers.forEach(counter => {
          const target = +counter.getAttribute('data-target');
          const duration = 1800;
          const startTime = performance.now();

          function updateCounter(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease-out cubic
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(easeOut * target);

            counter.innerText = current.toLocaleString();

            if (progress < 1) {
              requestAnimationFrame(updateCounter);
            } else {
              counter.innerText = target.toLocaleString();
            }
          }

          requestAnimationFrame(updateCounter);
        });
      }
    });
  }, { threshold: 0.2 });

  const statsSection = document.querySelector('.ecg-live-strip');
  if (statsSection) observer.observe(statsSection);
}

/* -------------------------------------------------------------
   4. Procedure Details Modal & Rich Demo Dataset
   ------------------------------------------------------------- */
const procedureData = {
  angioplasty: {
    title: 'Coronary Angioplasty & Stenting (PCI)',
    subtitle: 'Minimally Invasive Revascularization for Blocked Arteries',
    duration: '60 – 90 Minutes',
    stay: '24 – 48 Hours',
    recovery: '3 – 5 Days for normal light routines',
    summary: 'Coronary angioplasty (Percutaneous Coronary Intervention) restores critical blood flow to the heart muscle by dilating narrowed or obstructed coronary arteries using high-precision micro-balloons and deploying state-of-the-art drug-eluting stents (DES).',
    indications: [
      'Acute Myocardial Infarction (Emergency Primary PCI for heart attacks)',
      'Severe or worsening angina pectoris unresponsive to optimal medication',
      'High-grade blockages identified on diagnostic coronary angiograms',
      'Complex bifurcations and calcified lesions requiring rotablation'
    ],
    procedureSteps: [
      'Radial Access: Usually performed through the radial artery in the wrist for minimal bleeding, quicker recovery, and same-day ambulation.',
      'Imaging Guidance: Real-time fluoroscopic cine-angiography pinpoints precise blockage anatomy.',
      'Balloon Dilatation: A micro-catheter navigates across the stenosis to dilate the lesion.',
      'Stent Deployment: A drug-eluting stent is placed and post-dilated to maintain long-term vessel patency.'
    ],
    postCare: 'Patients are advised to adhere strictly to dual antiplatelet therapy (aspirin and P2Y12 inhibitors), avoid heavy exertion for 1 week, and undergo periodic cardiology follow-ups.'
  },
  catheterisation: {
    title: 'Cardiac Catheterisation & Coronary Angiography',
    subtitle: 'The Gold-Standard Diagnostic Evaluation for Coronary Artery Disease',
    duration: '20 – 30 Minutes',
    stay: 'Day Care / 4 to 6 Hours Observation',
    recovery: 'Same-day discharge (Trans-radial approach)',
    summary: 'Coronary angiography uses advanced radiographic imaging and contrast dye to accurately map the coronary circulation, detecting the exact location, extent, and severity of arterial plaques or blockages.',
    indications: [
      'Unexplained chest discomfort, tightness, or shortness of breath',
      'Abnormal findings on Treadmill Stress Test (TMT) or Stress Echo',
      'Pre-operative cardiac clearance for major vascular or non-cardiac surgery',
      'Evaluation of valve disorders, congenital defects, or cardiomyopathy'
    ],
    procedureSteps: [
      'Local anaesthetic applied at the right wrist (trans-radial) or groin (femoral).',
      'Ultra-thin diagnostic catheters are guided into the coronary ostia under fluoroscopy.',
      'Radiopaque dye injection captures multiple angles of the left and right coronary systems.',
      'Immediate diagnostic debrief with the patient and family regarding further therapy (Medical, Angioplasty, or CABG).'
    ],
    postCare: 'Drink plenty of fluids to flush the contrast dye, keep wrist band clean and dry for 24 hours, and avoid heavy lifting with the punctured arm for 48 hours.'
  },
  pacemaker: {
    title: 'Permanent Pacemaker Implantation',
    subtitle: 'Restoring Natural Heart Rhythms for Bradycardia & Conduction Blocks',
    duration: '60 – 90 Minutes',
    stay: '24 Hours Hospital Observation',
    recovery: 'Normal activity within 7 – 10 days',
    summary: 'A permanent pacemaker is an intelligent, life-saving electronic device implanted beneath the skin near the collarbone that monitors and stimulates the heart to prevent dangerously slow heartbeats.',
    indications: [
      'Symptomatic Bradycardia (resting heart rate below 40–50 bpm with dizziness)',
      'Sick Sinus Syndrome (SA node dysfunction)',
      'Complete (3rd Degree) or High-grade Atrioventricular (AV) Heart Block',
      'Recurrent syncope (fainting episodes) due to conduction disorders'
    ],
    procedureSteps: [
      'Conducted under local anesthesia and light sedation in the cardiac cath lab.',
      'A small 4-5 cm incision is made below the left collarbone to create a subcutaneous pocket.',
      'One or two high-fidelity pacing leads are routed through the subclavian vein into the heart chambers.',
      'Lead parameters tested and connected to the pulse generator, followed by neat cosmetic subcuticular closure.'
    ],
    postCare: 'Avoid raising the arm on the implant side above shoulder level for 4 weeks. Carry the pacemaker identification card and schedule annual programmer checks.'
  },
  icd: {
    title: 'Implantable Cardioverter-Defibrillator (ICD) Implantation',
    subtitle: 'Pioneered in Mumbai by Dr. Rajiv Karnik — 24/7 Shield Against Sudden Cardiac Death',
    duration: '90 – 120 Minutes',
    stay: '24 – 48 Hours',
    recovery: '1 – 2 Weeks',
    summary: 'Dr. Rajiv Karnik was the reported first cardiologist in Mumbai to implant an ICD-pacemaker at Bombay Hospital. An ICD is a sophisticated cardiac device that continuously tracks heart rhythm and instantly delivers life-saving electrical therapy if life-threatening ventricular fibrillation or tachycardia occurs.',
    indications: [
      'Survivors of previous cardiac arrest or sustained ventricular tachycardia (Secondary Prevention)',
      'Severely reduced left ventricular ejection fraction (LVEF ≤ 35%) following myocardial infarction',
      'Hypertrophic Cardiomyopathy (HCM) or Arrhythmogenic Right Ventricular Dysplasia (ARVD)',
      'Channelopathies such as Brugada Syndrome or Long QT Syndrome'
    ],
    procedureSteps: [
      'Pre-procedure echocardiography, cardiac MRI, or electrophysiology evaluation.',
      'Implantation performed in the modern Fortis Cardiac Catheterisation Laboratory under strict sterile protocols.',
      'Defibrillation lead positioned into the right ventricular apex or septum, with pulse generator anchored in the pre-pectoral pocket.',
      'Device interrogation, calibration, and threshold verification.'
    ],
    postCare: 'Regular remote device monitoring, avoiding strong electromagnetic fields or direct MRI without checking device compatibility, and prompt reporting of any delivered shocks.'
  },
  heartfailure: {
    title: 'Heart Failure & Cardiac Resynchronization Therapy (CRT)',
    subtitle: 'Comprehensive Hemodynamic Management for Weakened Hearts',
    duration: 'Variable Consultation & Therapy',
    stay: 'Outpatient Clinic & In-hospital CRT procedures',
    recovery: 'Continuous monitored care',
    summary: 'Heart failure management focuses on optimizing cardiac pumping efficiency, relieving fluid retention, reducing hospital readmissions, and restoring quality of life through advanced guideline-directed medical therapy and biventricular pacing (CRT).',
    indications: [
      'Shortness of breath on mild exertion or while lying flat (orthopnea)',
      'Swelling in feet, ankles, and abdomen (edema)',
      'Dilated Cardiomyopathy with left bundle branch block (LBBB)',
      'Reduced ejection fraction refractory to initial pharmacotherapy'
    ],
    procedureSteps: [
      'Detailed clinical phenotyping including BNP/NT-proBNP biomarkers and 2D/3D Echocardiography.',
      'Introduction of foundational Four-Pillar Medical Therapy (ARNI/ACEi, Beta-Blockers, MRA, SGLT2i).',
      'Evaluation for CRT-P or CRT-D (Biventricular device) to synchronize dyssynchronous ventricular contraction.',
      'Personalized dietary sodium and fluid management coaching.'
    ],
    postCare: 'Daily weight logs, routine kidney and electrolyte panels, graduated cardiac rehabilitation exercises, and regular tele-consultation reviews.'
  },
  preventive: {
    title: 'Preventive & Executive Cardiology Risk Screening',
    subtitle: 'Proactive Detection to Prevent Premature Heart Attacks',
    duration: 'Comprehensive Clinical Evaluation',
    stay: 'Outpatient Clinic Consultation',
    recovery: 'Immediate',
    summary: 'Over 80% of premature coronary events are preventable with early risk stratification, coronary calcium scoring, advanced lipid profiling, and tailored lifestyle and medical intervention.',
    indications: [
      'Individuals aged 30+ with strong family history of early heart disease',
      'Patients with hypertension, diabetes mellitus, or dyslipidemia',
      'Sedentary lifestyle, high occupational stress, or smoking history',
      'Individuals seeking evidence-based guidance before starting intensive workout regimens'
    ],
    procedureSteps: [
      'Thorough clinical history taking and cardiovascular risk factor evaluation.',
      'Resting 12-lead ECG and comprehensive blood panels (Lipid fractionation, ApoB, HbA1c, hs-CRP).',
      'Non-invasive screening (TMT, Carotid Intima-Media Thickness, or CT Coronary Calcium Score when indicated).',
      'Customized risk mitigation blueprint encompassing pharmacotherapy, nutrition, and exercise prescription.'
    ],
    postCare: 'Annual risk re-evaluation and personalized preventative tracking.'
  }
};

function initProcedureModal() {
  const modal = document.getElementById('procedureModal');
  const closeBtn = document.getElementById('closeProcedureModal');
  const buttons = document.querySelectorAll('.view-procedure-btn');

  if (!modal || !closeBtn) return;

  const titleEl = document.getElementById('procModalTitle');
  const subEl = document.getElementById('procModalSubtitle');
  const durationEl = document.getElementById('procModalDuration');
  const stayEl = document.getElementById('procModalStay');
  const recoveryEl = document.getElementById('procModalRecovery');
  const summaryEl = document.getElementById('procModalSummary');
  const indicationsEl = document.getElementById('procModalIndications');
  const stepsEl = document.getElementById('procModalSteps');
  const postCareEl = document.getElementById('procModalPostCare');

  buttons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const key = btn.getAttribute('data-procedure');
      const data = procedureData[key];
      if (!data) return;

      if (titleEl) titleEl.innerText = data.title;
      if (subEl) subEl.innerText = data.subtitle;
      if (durationEl) durationEl.innerText = data.duration;
      if (stayEl) stayEl.innerText = data.stay;
      if (recoveryEl) recoveryEl.innerText = data.recovery;
      if (summaryEl) summaryEl.innerText = data.summary;
      if (postCareEl) postCareEl.innerText = data.postCare;

      if (indicationsEl) {
        indicationsEl.innerHTML = '';
        data.indications.forEach(item => {
          const li = document.createElement('li');
          li.innerText = item;
          indicationsEl.appendChild(li);
        });
      }

      if (stepsEl) {
        stepsEl.innerHTML = '';
        data.procedureSteps.forEach(item => {
          const li = document.createElement('li');
          li.innerText = item;
          stepsEl.appendChild(li);
        });
      }

      modal.classList.add('open');
      lockBodyScroll();
    });
  });

  const closeModal = () => {
    modal.classList.remove('open');
    unlockBodyScroll();
  };

  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
}

/* -------------------------------------------------------------
   5. Patient Education Hub & Articles Modal
   ------------------------------------------------------------- */
const articleContents = {
  angioplasty_guide: {
    category: 'Interventional Cardiology',
    title: 'What to Expect During an Angiography & Angioplasty',
    readTime: '5 Min Read',
    content: `
      <h4>Introduction</h4>
      <p>Undergoing a heart procedure can feel daunting, but modern interventional cardiology has made coronary angiography and angioplasty safer and more patient-friendly than ever before. With trans-radial access (performed through the wrist artery), most patients are walking within hours of the procedure.</p>
      
      <h4>How to Prepare</h4>
      <p>Before your procedure at Fortis Hospital Mulund, you will typically be advised to fast for 4 to 6 hours. Inform Dr. Rajiv Karnik’s team about all regular medications, especially blood thinners, metformin (for diabetes), or kidney conditions.</p>
      
      <h4>During the Procedure</h4>
      <p>You remain awake throughout. Local anaesthesia is injected into your wrist. A tiny catheter is gently navigated to the heart under X-ray visualization. If a significant narrowing is confirmed on the angiogram, an angioplasty balloon is carefully inflated, and a drug-eluting stent is placed to keep the artery permanently open.</p>
      
      <h4>Recovery at Home</h4>
      <p>Most patients are discharged the next day. You can resume desk work in 3 to 5 days. Remember: a stent opens an artery, but consistent medications, healthy nutrition, and smoking cessation prevent new blockages from forming.</p>
    `
  },
  pacemaker_guide: {
    category: 'Cardiac Devices',
    title: 'Living Confidently with a Pacemaker or ICD Device',
    readTime: '6 Min Read',
    content: `
      <h4>Restoring Peace of Mind</h4>
      <p>Modern cardiac pacemakers and implantable cardioverter-defibrillators (ICDs) are miniature engineering marvels. They continuously monitor your heartbeat, providing an intelligent safety net against dangerous slow rhythms (bradycardia) or fatal electrical storms (ventricular fibrillation).</p>
      
      <h4>Everyday Activities & Electronics</h4>
      <p>Modern devices have robust shielding. You can safely use smartphones, microwave ovens, Wi-Fi routers, and televisions. Keep your smartphone in the opposite pocket or ear from your device (maintain at least 6 inches distance as a good rule of thumb).</p>
      
      <h4>Airport Security & Medical Procedures</h4>
      <p>Always carry your official device ID card. Inform security personnel at airports; hand-held detector wands should not be held directly over the device pocket for prolonged periods. For medical scans, always notify the doctor that you have an implanted device before MRI or diathermy.</p>
      
      <h4>Follow-up Checkups</h4>
      <p>Dr. Rajiv Karnik conducts device interrogations using non-invasive wireless programmers. These periodic checks evaluate battery life (typically 8 to 12 years), lead impedance, and any recorded rhythm episodes.</p>
    `
  },
  golden_hour: {
    category: 'Emergency Awareness',
    title: 'Recognizing Early Heart Attack Signs & The "Golden Hour"',
    readTime: '4 Min Read',
    content: `
      <h4>Why Every Minute Matters</h4>
      <p>When a coronary artery suddenly occludes, the heart muscle begins to suffer irreversible injury within minutes. The first 60 minutes after symptom onset is medically termed the <strong>"Golden Hour"</strong>. Timely intervention with emergency Primary Angioplasty (PCI) can salvage heart muscle and save lives.</p>
      
      <h4>Classic vs. Atypical Symptoms</h4>
      <ul>
        <li><strong>Classic symptoms:</strong> Heavy, crushing retrosternal chest pain or tightness, radiating to the left arm, neck, jaw, or back.</li>
        <li><strong>Atypical symptoms (common in women & diabetics):</strong> Sudden unexplained breathlessness, extreme fatigue, cold sweating, nausea, or intense burning epigastric discomfort mimicking acid reflux.</li>
      </ul>
      
      <h4>Emergency Action Steps</h4>
      <p>Do NOT wait to see if symptoms pass. Do NOT drive yourself. Immediately call an emergency ambulance (108) or head straight to Fortis Hospital Mulund Emergency, which features a 24x7 functional Cardiac Catheterisation Laboratory.</p>
    `
  },
  hypertension_prevention: {
    category: 'Preventive Cardiology',
    title: 'Preventive Cardiology: Mastering Blood Pressure & Lipids',
    readTime: '5 Min Read',
    content: `
      <h4>The Silent Risk Factors</h4>
      <p>High blood pressure (hypertension) and dyslipidemia (elevated LDL and Apolipoprotein B) are rightfully called the silent killers because they silently damage arterial walls for years before triggering a heart attack or stroke.</p>
      
      <h4>Optimal Targets</h4>
      <ul>
        <li>Blood Pressure: Aim for consistently under 120/80 mmHg.</li>
        <li>LDL Cholesterol: In high-risk cardiovascular patients, modern guidelines recommend keeping LDL-C below 55–70 mg/dL.</li>
        <li>HbA1c: For diabetic individuals, maintaining HbA1c below 6.5–7.0% dramatically reduces microvascular and macrovascular injury.</li>
      </ul>
      
      <h4>Evidence-Based Lifestyle Pillars</h4>
      <p>Adopting the Mediterranean or DASH dietary pattern, engaging in 150 minutes of moderate aerobic exercise weekly, prioritizing 7–8 hours of restorative sleep, and quitting tobacco can reduce cardiovascular morbidity by more than 50%.</p>
    `
  }
};

function initEducationHub() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const articleCards = document.querySelectorAll('.article-card');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.getAttribute('data-filter');

      articleCards.forEach(card => {
        if (filter === 'all' || card.getAttribute('data-category') === filter) {
          card.style.display = 'flex';
          card.style.opacity = '1';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  // Modal logic
  const modal = document.getElementById('articleModal');
  const closeBtn = document.getElementById('closeArticleModal');
  const readBtns = document.querySelectorAll('.read-article-btn');

  if (!modal || !closeBtn) return;

  const catEl = document.getElementById('artModalCategory');
  const titleEl = document.getElementById('artModalTitle');
  const timeEl = document.getElementById('artModalTime');
  const bodyEl = document.getElementById('artModalContent');

  readBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const key = btn.getAttribute('data-article');
      const data = articleContents[key];
      if (!data) return;

      if (catEl) catEl.innerText = data.category;
      if (titleEl) titleEl.innerText = data.title;
      if (timeEl) timeEl.innerText = data.readTime;
      if (bodyEl) bodyEl.innerHTML = data.content;

      modal.classList.add('open');
      lockBodyScroll();
    });
  });

  const closeModal = () => {
    modal.classList.remove('open');
    unlockBodyScroll();
  };

  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
}

/* -------------------------------------------------------------
   6. Interactive Cardiovascular Risk Screener (Educational)
   ------------------------------------------------------------- */
function initRiskTool() {
  const ageSelect = document.getElementById('riskAge');
  const bpSelect = document.getElementById('riskBP');
  const cholSelect = document.getElementById('riskChol');
  const smokeSelect = document.getElementById('riskSmoke');
  const diabSelect = document.getElementById('riskDiabetes');
  const famSelect = document.getElementById('riskFamily');

  const scoreEl = document.getElementById('riskScore');
  const statusEl = document.getElementById('riskStatus');
  const adviceEl = document.getElementById('riskAdvice');
  const dialEl = document.getElementById('riskDial');
  const discussBtn = document.getElementById('discussRiskBtn');

  if (!ageSelect || !scoreEl) return;

  function calculateRisk() {
    let score = 0;
    score += parseInt(ageSelect?.value || 0, 10);
    score += parseInt(bpSelect?.value || 0, 10);
    score += parseInt(cholSelect?.value || 0, 10);
    score += parseInt(smokeSelect?.value || 0, 10);
    score += parseInt(diabSelect?.value || 0, 10);
    score += parseInt(famSelect?.value || 0, 10);

    scoreEl.innerText = score;

    if (score <= 5) {
      statusEl.innerText = 'Low Estimated Risk';
      statusEl.style.color = '#10b981';
      adviceEl.innerText = 'Your current profile suggests low conventional cardiovascular risk. Maintain regular physical activity, balanced nutrition, and annual health screenings.';
      dialEl.style.background = 'conic-gradient(from 180deg, #10b981 0deg 120deg, rgba(255,255,255,0.12) 120deg 360deg)';
    } else if (score <= 10) {
      statusEl.innerText = 'Moderate Cardiovascular Risk';
      statusEl.style.color = '#f59e0b';
      adviceEl.innerText = 'You possess several modifiable risk factors. A clinical evaluation, including resting ECG, Lipid fractionation, and Lifestyle intervention with Dr. Rajiv Karnik, is recommended.';
      dialEl.style.background = 'conic-gradient(from 180deg, #10b981 0deg 90deg, #f59e0b 90deg 240deg, rgba(255,255,255,0.12) 240deg 360deg)';
    } else {
      statusEl.innerText = 'Elevated Risk Profile';
      statusEl.style.color = '#ef4444';
      adviceEl.innerText = 'Multiple prominent cardiovascular risk markers identified. We strongly advise scheduling a comprehensive cardiac workup, Stress Test (TMT), and consultation at Fortis Mulund.';
      dialEl.style.background = 'conic-gradient(from 180deg, #10b981 0deg 60deg, #f59e0b 60deg 180deg, #ef4444 180deg 360deg)';
    }

    return score;
  }

  // Real-time calculation on change and input
  [ageSelect, bpSelect, cholSelect, smokeSelect, diabSelect, famSelect].forEach(select => {
    if (select) {
      select.addEventListener('change', calculateRisk);
      select.addEventListener('input', calculateRisk);
    }
  });

  // Connect "Discuss Results with Dr. Karnik" directly to the booking form
  if (discussBtn) {
    discussBtn.addEventListener('click', (e) => {
      const currentScore = calculateRisk();
      const statusText = statusEl?.innerText || 'Risk Assessment';
      
      // Auto-populate booking form with assessment context
      const reasonSelect = document.getElementById('apptReason');
      const notesArea = document.getElementById('apptNotes');
      
      if (reasonSelect) {
        reasonSelect.value = 'Preventive Cardiac Executive Checkup';
      }
      if (notesArea) {
        notesArea.value = `Interactive Heart Risk Screener Result: ${currentScore} points (${statusText}). Requesting expert review with Dr. Rajiv Karnik.`;
      }

      showDemoToast(`Risk score (${currentScore} pts) transferred to Appointment Desk!`);
    });
  }
}

/* -------------------------------------------------------------
   7. Appointment Booking Form, Sample Demo Auto-fill & WhatsApp
   ------------------------------------------------------------- */
function initAppointmentForm() {
  const form = document.getElementById('appointmentForm');
  const fillDemoBtn = document.getElementById('fillDemoDataBtn');
  const whatsappBtn = document.getElementById('whatsappBookBtn');
  const confirmModal = document.getElementById('confirmModal');
  const closeConfirmModal = document.getElementById('closeConfirmModal');
  const dateInput = document.getElementById('apptDate');

  // Pre-set preferred date to tomorrow's date
  if (dateInput && !dateInput.value) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    dateInput.value = tomorrow.toISOString().split('T')[0];
  }

  // 1-Click Sample Demo Auto-Fill
  if (fillDemoBtn) {
    fillDemoBtn.addEventListener('click', () => {
      const sampleNames = ['Ramesh Sharma', 'Priya Kulkarni', 'Sunil Deshmukh', 'Anita Varma', 'Vikram Seth'];
      const samplePhones = ['+91 98200 44123', '+91 98199 55678', '+91 98211 67890', '+91 98334 11223'];
      const randomName = sampleNames[Math.floor(Math.random() * sampleNames.length)];
      const randomPhone = samplePhones[Math.floor(Math.random() * samplePhones.length)];

      const nameInput = document.getElementById('apptName');
      const phoneInput = document.getElementById('apptPhone');
      const locationSelect = document.getElementById('apptLocation');
      const reasonSelect = document.getElementById('apptReason');
      const notesArea = document.getElementById('apptNotes');

      if (nameInput) nameInput.value = randomName;
      if (phoneInput) phoneInput.value = randomPhone;
      if (locationSelect) locationSelect.value = 'Fortis Hospital, Mulund';
      if (reasonSelect) reasonSelect.value = 'General Cardiology Consultation';
      if (notesArea) notesArea.value = 'Demo test: Requesting general outpatient consultation & ECG review at Fortis Mulund.';

      showDemoToast(`Sample patient "${randomName}" loaded! Click "Confirm Request".`);
    });
  }

  // WhatsApp generator
  if (whatsappBtn) {
    whatsappBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const patientName = document.getElementById('apptName')?.value || 'Ramesh Sharma (Demo)';
      const location = document.getElementById('apptLocation')?.value || 'Fortis Hospital, Mulund';
      const reason = document.getElementById('apptReason')?.value || 'Cardiology Consultation';
      const date = document.getElementById('apptDate')?.value || 'Tomorrow';
      const phone = document.getElementById('apptPhone')?.value || '+91 98200 44123';

      const message = `Hello Dr. Rajiv Karnik's Clinical Team,%0A%0AI would like to request a consultation:%0A• Patient Name: ${encodeURIComponent(patientName)}%0A• Contact: ${encodeURIComponent(phone)}%0A• Facility: ${encodeURIComponent(location)}%0A• Purpose: ${encodeURIComponent(reason)}%0A• Preferred Date: ${encodeURIComponent(date)}%0A%0APlease confirm availability and appointment slot. Thank you.`;

      showDemoToast('Opening WhatsApp with pre-filled appointment request...');
      window.open(`https://wa.me/919820044444?text=${message}`, '_blank');
    });
  }

  // Form submission handler with demo confirmation
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = document.getElementById('apptName')?.value || 'Patient';
      const phone = document.getElementById('apptPhone')?.value || 'Not provided';
      const location = document.getElementById('apptLocation')?.value || 'Fortis Hospital, Mulund';
      const reason = document.getElementById('apptReason')?.value || 'Cardiology Consultation';
      const date = document.getElementById('apptDate')?.value || 'Earliest slot';
      const time = document.getElementById('apptTime')?.value || 'Morning Slot';

      // Populate confirmation modal fields
      const pName = document.getElementById('confPatientName');
      const pPhone = document.getElementById('confPhone');
      const pLoc = document.getElementById('confLocation');
      const pReason = document.getElementById('confReason');
      const pDateTime = document.getElementById('confDateTime');
      const pCode = document.getElementById('confRefCode');

      if (pName) pName.innerText = name;
      if (pPhone) pPhone.innerText = phone;
      if (pLoc) pLoc.innerText = location;
      if (pReason) pReason.innerText = reason;
      if (pDateTime) pDateTime.innerText = `${date} (${time})`;
      if (pCode) pCode.innerText = 'RKC-' + Math.floor(100000 + Math.random() * 900000);

      if (confirmModal) {
        confirmModal.classList.add('open');
        lockBodyScroll();
      }

      showDemoToast(`Consultation request logged for ${name}!`);
    });
  }

  if (closeConfirmModal && confirmModal) {
    const closeConfirm = () => {
      confirmModal.classList.remove('open');
      unlockBodyScroll();
    };

    closeConfirmModal.addEventListener('click', closeConfirm);
    confirmModal.addEventListener('click', (e) => {
      if (e.target === confirmModal) closeConfirm();
    });
  }
}

/* -------------------------------------------------------------
   8. FAQ Accordion Logic
   ------------------------------------------------------------- */
function initFAQ() {
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    if (!question) return;

    question.addEventListener('click', () => {
      const isOpen = item.classList.contains('active');

      // Close other accordions
      faqItems.forEach(i => i.classList.remove('active'));

      if (!isOpen) {
        item.classList.add('active');
      }
    });
  });
}

/* -------------------------------------------------------------
   9. Quick Call & Direction Interactive Handlers
   ------------------------------------------------------------- */
function initQuickActions() {
  // Graceful handling for telephone links on desktop Mac/PC
  const telLinks = document.querySelectorAll('a[href^="tel:"]');
  telLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      // Check if touch device or mobile
      const isMobile = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const phoneNumber = link.getAttribute('href').replace('tel:', '');

      if (!isMobile) {
        // On desktop Mac/PC, copy to clipboard for convenience
        navigator.clipboard?.writeText(phoneNumber).then(() => {
          showDemoToast(`Phone number ${phoneNumber} copied to clipboard!`);
        }).catch(() => {
          showDemoToast(`Fortis Direct Line: ${phoneNumber}`);
        });
      }
    });
  });
}

/* -------------------------------------------------------------
   10. Global Keyboard Shortcuts (Esc closes any open modal/drawer)
   ------------------------------------------------------------- */
function initGlobalKeyboard() {
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const openModals = document.querySelectorAll('.modal-overlay.open, .mobile-drawer.open');
      openModals.forEach(el => el.classList.remove('open'));
      unlockBodyScroll();
    }
  });
}
