import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from "axios";

const OnboardingPage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3; 
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Core Data Structure - In perfect synchronization with backend parameter columns
  const [formData, setFormData] = useState({
    conditions: ["Hashimoto's thyroiditis"], 
    conditionOther: '', diagnosedWhen: '2026-01', diagnosedBy: ["Primary care physician (PCP)"],
    symptomsEnergy: ["Fatigue / low energy", "Always feeling cold", "Joint pain"], 
    symptomsDigestion: ["Constipation"], 
    symptomsMental: ["Depression"], 
    symptomsSleep: [], 
    symptomsOther: [], 
    symptomsOtherText: '', 
    worstSymptoms: 'Fatigue, constipation and feeling cold all the time',
    takingMedication: 'Yes', 
    medicationDetails: 'Levothyroxine 25mcg — taken 6am daily', 
    medicationDuration: '1-3 months', 
    supplements: 'Multivitamin, B12 with K2, Magnesium, Omega-3 fish oil',
    lastLabs: '1-3 months ago', labFile: null, additionalLabs: [],
    providerSatisfaction: '3 - Neutral', upcomingAppt: 'No', apptDate: '',
    dietaryChanges: ["Gluten-free", "Dairy-free", "Soy-free", "Sugar-free / reduced sugar"], 
    dietOther: '', stressLevel: '3 - Moderate stress', sleepQuality: '3 - Okay', 
    exercise: 'Yes, regularly (3+ times per week)', 
    exerciseType: 'Yoga 3x/week, Pickleball 2x/week, Swimming 1x/week',
    topGoals: 'Improve my GI symptoms and maintain digestive health. Stop or slow the autoimmune attack on my thyroid. Improve temperature regulation and feel warmer.', 
    topHelp: 'Slowing or stopping the autoimmune attack on my thyroid', 
    topHelpOther: '', anythingElse: '',
    commPlatform: ["SMS"], commPlatformOther: '', commTime: 'Midday (11am–1pm)',
    fullName: 'Rashmi', phone: '', dob: '', gender: 'Female', genderOther: '', location: ''
  });

  // Local condition branch tracker matching script flow architecture
  const [activeBranch, setActiveBranch] = useState('thyroid');

  // Dynamic label configurations matrix mapping 
  const branchConfig = {
    thyroid: {
      title: "Thyroid branch active",
      body: "The next sections will ask about your thyroid-specific symptoms, GI function, labs, and lifestyle — tailored to Hashimoto's.",
      label: "Specific diagnosis",
      medLabel: "Current thyroid medication",
      medPlaceholder: "e.g. Levothyroxine 25mcg — taken 6am daily",
      pills: ["Hashimoto's Thyroiditis", "Hypothyroidism", "Hyperthyroidism", "Graves' Disease", "Unconfirmed / seeking diagnosis"]
    },
    pcos: {
      title: "PCOS branch active",
      body: "The next sections will ask about your cycle, insulin resistance symptoms, androgen symptoms, and lifestyle — tailored to PCOS.",
      label: "How was your PCOS diagnosed?",
      medLabel: "Current PCOS medications",
      medPlaceholder: "e.g. Metformin 500mg, Spironolactone 50mg, OCP",
      pills: ["Ultrasound confirmed", "Lab results (androgens, LH/FSH)", "Clinical diagnosis", "Not yet formally diagnosed"]
    },
    endo: {
      title: "Endometriosis branch active",
      body: "The next sections will ask about your pain profile, cycle, GI and bladder symptoms, and lifestyle — tailored to endometriosis.",
      label: "How was your endometriosis diagnosed?",
      medLabel: "Current endometriosis medications",
      medPlaceholder: "e.g. Visanne 2mg, hormonal IUD, pain management",
      pills: ["Surgical / laparoscopy confirmed", "Clinical diagnosis (symptoms only)", "MRI confirmed", "Not yet formally diagnosed"]
    },
    peri: {
      title: "Perimenopause branch active",
      body: "The next sections will ask about vasomotor symptoms (hot flushes, night sweats), sleep, mood, and HRT — tailored to perimenopause.",
      label: "How would you describe your current cycle?",
      medLabel: "Current HRT or other medications",
      medPlaceholder: "e.g. Estradiol 50mcg patch + Utrogestan 100mg, or None",
      pills: ["Cycles are irregular or skipping", "Cycles shorter than before", "Flow heavier than before", "Flow lighter than before", "Cycles mostly regular — symptoms are my main indicator"]
    },
    meno: {
      title: "Menopause branch active",
      body: "The next sections will ask about vasomotor symptoms, genitourinary health, bone health, cardiovascular risk, and HRT — tailored to menopause.",
      label: "When was your last menstrual period?",
      medLabel: "Current HRT or other medications",
      medPlaceholder: "e.g. Estradiol gel 1mg + Utrogestan 100mg, or None",
      pills: ["1–2 years ago", "2–5 years ago", "5–10 years ago", "More than 10 years ago", "Surgical menopause (hysterectomy / oophorectomy)"]
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDirectValue = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleArrayToggle = (category, value) => {
    setFormData((prev) => {
      const currentList = prev[category];
      if (currentList.includes(value)) {
        return { ...prev, [category]: currentList.filter((item) => item !== value) };
      } else {
        return { ...prev, [category]: [...currentList, value] };
      }
    });
  };

  const handleSymptomToggle = (symptomName) => {
    if (["Fatigue", "Feeling cold", "Joint or muscle pain", "Weight changes", "Hair loss or thinning"].includes(symptomName)) {
      const mappedValue = symptomName === "Fatigue" ? "Fatigue / low energy" : 
                          symptomName === "Feeling cold" ? "Always feeling cold" : 
                          symptomName === "Joint or muscle pain" ? "Muscle aches or weakness" : symptomName;
      handleArrayToggle("symptomsEnergy", mappedValue);
    } else if (["Constipation"].includes(symptomName)) {
      handleArrayToggle("symptomsDigestion", symptomName);
    } else if (["Brain fog", "Anxiety", "Mood swings"].includes(symptomName)) {
      const mappedValue = symptomName === "Brain fog" ? "Brain fog / difficulty concentrating" : symptomName;
      handleArrayToggle("symptomsMental", mappedValue);
    } else {
      handleArrayToggle("symptomsOther", symptomName);
    }
  };

  const isSymptomActive = (symptomName) => {
    const mappedEnergy = symptomName === "Fatigue" ? "Fatigue / low energy" : 
                         symptomName === "Feeling cold" ? "Always feeling cold" : 
                         symptomName === "Joint or muscle pain" ? "Muscle aches or weakness" : symptomName;
    const mappedMental = symptomName === "Brain fog" ? "Brain fog / difficulty concentrating" : symptomName;
    return formData.symptomsEnergy.includes(mappedEnergy) || 
           formData.symptomsDigestion.includes(symptomName) || 
           formData.symptomsMental.includes(mappedMental) || 
           formData.symptomsOther.includes(symptomName);
  };

  const nextStep = () => {
    if (currentStep < totalSteps) setCurrentStep(currentStep + 1);
    window.scrollTo(0, 0);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
    window.scrollTo(0, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const baseURL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://127.0.0.1:5000'
        : import.meta.env.VITE_SERVER_URL;

    const activeRegistrationTokenId = localStorage.getItem('allvi_id');

    try {
      const payload = new FormData();
      payload.append('allvi_id', activeRegistrationTokenId);
      payload.append('fullName', formData.fullName);
      payload.append('phone', formData.phone);
      payload.append('dob', formData.dob);
      payload.append('gender', formData.gender);
      payload.append('location', formData.location);
      payload.append('topGoals', formData.topGoals);
      payload.append('topHelp', formData.topHelp);
      payload.append('anythingElse', formData.anythingElse);
      payload.append('conditionOther', formData.conditionOther);
      payload.append('symptomsOtherText', formData.symptomsOtherText);
      payload.append('conditions', JSON.stringify(formData.conditions));
      payload.append('symptomsEnergy', JSON.stringify(formData.symptomsEnergy));
      payload.append('symptomsDigestion', JSON.stringify(formData.symptomsDigestion));
      payload.append('symptomsMental', JSON.stringify(formData.symptomsMental));
      payload.append('symptomsSleep', JSON.stringify(formData.symptomsSleep));
      payload.append('symptomsOther', JSON.stringify(formData.symptomsOther));

      if (formData.labFile) {
        payload.append('labReport', formData.labFile);
      }

      const response = await axios.post(`${baseURL}/api/patient/submit-intake`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        if (formData.labFile && response.data.parsedData) {
          let calcAge = '';
          if (formData.dob) {
            const diff = Date.now() - new Date(formData.dob).getTime();
            calcAge = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
          }
          navigate('/review', { 
            state: {
              parsedData: response.data.parsedData,
              allviId: response.data.allvi_id,
              age: calcAge,
              gender: formData.gender
            }
          });
        } else {
          navigate(`/dashboard/${response.data.allvi_id}`);
        }
      } else {
        alert(`Error submitting form layout data: ${response.data.error}`);
      }
    } catch (error) {
      console.error("Network link issue encountered:", error);
      alert(`Submission sequence aborted: ${error.message || "Connection to API engine failed."}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F1E8] font-sans antialiased text-[#1F2937]">
      {/* Header Banner */}
      <header className="bg-[#0F4C5C] px-8 h-16 flex items-center justify-between sticky top-0 z-50">
        <div style={{ fontFamily: "'Playfair Display', serif" }} className="text-[22px] text-[#F7F1E8]">Allvi</div>
        <div className="text-[12px] text-[#F7F1E8]/70 font-medium">
          Step {currentStep} of 3 — {currentStep === 1 ? 'Your Condition' : currentStep === 2 ? 'Symptoms & Treatment' : 'Lifestyle & Goals'}
        </div>
      </header>

      <div className="max-w-[680px] mx-auto py-10 px-6">
        {/* Progress Track */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[12px] font-semibold text-[#0F4C5C]">Intake Form</span>
            <span className="text-[12px] text-[#6B7280]">Takes 10–15 minutes · Saved automatically</span>
          </div>
          <div className="h-1 bg-[#EDE7DB] rounded-full">
            <div 
              className="h-full bg-[#0F4C5C] rounded-full transition-all duration-300"
              style={{ width: currentStep === 1 ? '33%' : currentStep === 2 ? '66%' : '100%' }}
            />
          </div>
          <div className="flex justify-between mt-2.5">
            <span className={`text-[11px] text-center flex-1 ${currentStep === 1 ? 'font-bold text-[#0F4C5C]' : 'text-[#6B7280]'}`}>Your Condition {currentStep > 1 && '✓'}</span>
            <span className={`text-[11px] text-center flex-1 ${currentStep === 2 ? 'font-bold text-[#0F4C5C]' : 'text-[#6B7280]'}`}>Symptoms & Treatment {currentStep > 2 && '✓'}</span>
            <span className={`text-[11px] text-center flex-1 ${currentStep === 3 ? 'font-bold text-[#0F4C5C]' : 'text-[#6B7280]'}`}>Lifestyle & Goals</span>
          </div>
        </div>

        {/* Central Core Form Container */}
        <div className="bg-white rounded-[16px] p-8 shadow-md border border-[#0F4C5C]/5">
          
          {/* STEP 1: CONDITION PROFILE BRANCHING */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 style={{ fontFamily: "'Playfair Display', serif" }} className="text-[22px] font-semibold text-[#1F2937] mb-1.5">Tell us about your condition</h2>
                <p className="text-[13px] text-[#6B7280] leading-relaxed">This helps us personalise your check-ins, protocol, and monitoring from day one.</p>
              </div>

              <div>
                <label className="block text-[12px] font-bold tracking-[0.06em] uppercase text-[#6B7280] mb-2.5">Primary condition <span className="text-[#DC2626]">*</span></label>
                <div className="flex flex-col gap-2">
                  {[
                    { key: 'thyroid', label: "Thyroid Disease (Hashimoto's, Hypothyroidism, Hyperthyroidism, Graves')" },
                    { key: 'pcos', label: "PCOS" },
                    { key: 'endo', label: "Endometriosis" },
                    { key: 'peri', label: "Perimenopause" },
                    { key: 'meno', label: "Menopause" }
                  ].map((item) => {
                    const isSelected = activeBranch === item.key;
                    return (
                      <div 
                        key={item.key}
                        onClick={() => {
                          setActiveBranch(item.key);
                          handleDirectValue("conditions", [branchConfig[item.key].pills[0]]);
                          handleDirectValue("medicationDetails", branchConfig[item.key].medValue || '');
                        }}
                        className={`flex items-center gap-3 px-4 py-3 border-2 rounded-[10px] cursor-pointer transition-all ${
                          isSelected ? 'border-[#0F4C5C] bg-[#E8F4F7]' : 'border-[#0F4C5C]/15 bg-white'
                        }`}
                      >
                        <div className={`w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-[#0F4C5C] bg-[#0F4C5C]' : 'border-[#0F4C5C]/20'}`}>
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <span className={`text-[14px] ${isSelected ? 'font-semibold text-[#0F4C5C]' : 'text-[#1F2937]'}`}>{item.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-bold tracking-[0.06em] uppercase text-[#6B7280] mb-2.5">{branchConfig[activeBranch].label} <span className="text-[#DC2626]">*</span></label>
                <div className="flex flex-wrap gap-2">
                  {branchConfig[activeBranch].pills.map((pill) => {
                    const isPillSelected = formData.conditions.includes(pill);
                    return (
                      <div 
                        key={pill}
                        onClick={() => handleDirectValue("conditions", [pill])}
                        className={`px-4 py-2 text-[13px] rounded-full cursor-pointer transition-all border ${
                          isPillSelected ? 'border-[#0F4C5C] bg-[#E8F4F7] font-semibold text-[#0F4C5C]' : 'border-[#0F4C5C]/15 text-[#1F2937] hover:border-[#0F4C5C]'
                        }`}
                      >
                        {pill}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-bold tracking-[0.06em] uppercase text-[#6B7280] mb-2.5">When were you diagnosed? <span className="text-[#DC2626]">*</span></label>
                <input 
                  type="month" 
                  name="diagnosedWhen"
                  value={formData.diagnosedWhen}
                  onChange={handleChange}
                  className="w-full p-3 border border-[#0F4C5C]/20 rounded-lg text-[14px] outline-none text-[#1F2937] bg-white" 
                  required
                />
              </div>

              <div>
                <label className="block text-[12px] font-bold tracking-[0.06em] uppercase text-[#6B7280] mb-2.5">
                  {branchConfig[activeBranch].medLabel}
                </label>
                <input 
                  type="text"
                  name="medicationDetails"
                  value={formData.medicationDetails}
                  onChange={handleChange}
                  placeholder={branchConfig[activeBranch].medPlaceholder}
                  className="w-full p-3 border border-[#0F4C5C]/20 rounded-lg text-[14px] outline-none text-[#1F2937] bg-white"
                />
              </div>

              <div className="p-4 bg-[#E8F4F7] rounded-[10px] border-l-3 border-[#0F4C5C]">
                <div className="text-[12px] font-bold text-[#0F4C5C] mb-0.5">{branchConfig[activeBranch].title}</div>
                <div className="text-[12px] text-[#1A6B7C] leading-relaxed">{branchConfig[activeBranch].body}</div>
              </div>
            </div>
          )}

          {/* STEP 2: SYMPTOMS & TREATMENT DATA PIPELINE */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 style={{ fontFamily: "'Playfair Display', serif" }} className="text-[22px] font-semibold text-[#1F2937] mb-1.5">Your symptoms & current treatment</h2>
                <p className="text-[13px] text-[#6B7280] leading-relaxed">Select all that apply. This shapes your daily check-in and what we monitor each week.</p>
              </div>

              <div>
                <label className="block text-[12px] font-bold tracking-[0.06em] uppercase text-[#6B7280] mb-2.5">Symptoms you are currently experiencing <span className="text-[#DC2626]">*</span></label>
                <div className="flex flex-wrap gap-2">
                  {["Fatigue", "Brain fog", "Feeling cold", "Constipation", "Hair loss or thinning", "Joint or muscle pain", "Anxiety", "Depression or low mood", "Mood swings", "Heart palpitations", "Weight changes", "None of the above"].map((smp) => {
                    const active = isSymptomActive(smp);
                    return (
                      <div 
                        key={smp}
                        onClick={() => handleSymptomToggle(smp)}
                        className={`px-3.5 py-1.5 text-[13px] rounded-full cursor-pointer transition-all border ${
                          active ? 'bg-[#E8F4F7] border-[#0F4C5C] text-[#0F4C5C] font-semibold' : 'bg-white border-[#0F4C5C]/15 text-[#1F2937]'
                        }`}
                      >
                        {smp}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-bold tracking-[0.06em] uppercase text-[#6B7280] mb-2">Which 2–3 symptoms bother you the most right now?</label>
                <textarea 
                  name="worstSymptoms"
                  value={formData.worstSymptoms}
                  onChange={handleChange}
                  rows="2"
                  className="w-full p-3 border border-[#0F4C5C]/20 rounded-lg text-[14px] outline-none text-[#1F2937] bg-white leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-[12px] font-bold tracking-[0.06em] uppercase text-[#6B7280] mb-2.5">How long have your symptoms been significantly impacting your daily life? <span className="text-[#DC2626]">*</span></label>
                <div className="flex flex-wrap gap-2">
                  {["Less than 3 months", "3–6 months", "6–12 months", "1–2 years", "More than 2 years"].map((dur) => {
                    const isSel = formData.medicationDuration === dur || (dur === "1–2 years" && formData.medicationDuration === "1-3 months"); 
                    return (
                      <div 
                        key={dur} 
                        onClick={() => handleDirectValue("medicationDuration", dur)}
                        className={`px-4 py-2 text-[13px] rounded-lg cursor-pointer transition-all border ${
                          isSel ? 'bg-[#0F4C5C] border-[#0F4C5C] text-[#F7F1E8]' : 'bg-white border-[#0F4C5C]/15 text-[#1F2937]'
                        }`}
                      >
                        {dur}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-bold tracking-[0.06em] uppercase text-[#6B7280] mb-2">Current supplements (if any)</label>
                <input 
                  type="text"
                  name="supplements"
                  value={formData.supplements}
                  onChange={handleChange}
                  className="w-full p-3 border border-[#0F4C5C]/20 rounded-lg text-[14px] outline-none text-[#1F2937] bg-white"
                />
              </div>

              <div>
                <label className="block text-[12px] font-bold tracking-[0.06em] uppercase text-[#6B7280] mb-2">Any mental health history we should be aware of?<span className="text-[11px] font-normal lowercase normal-case text-[#6B7280]">(used for risk monitoring only — not shared with your employer or insurer)</span></label>
                <div className="flex flex-wrap gap-2">
                  {["Anxiety", "Depression", "PTSD", "Eating disorder (past or present)", "None", "Prefer not to say"].map((mhh) => {
                    const isMhSelected = formData.symptomsMental.includes(mhh) || (mhh === "Depression" && formData.symptomsMental.includes("Depression or low mood"));
                    return (
                      <div 
                        key={mhh}
                        onClick={() => handleArrayToggle("symptomsMental", mhh)}
                        className={`px-4 py-2 text-[13px] rounded-lg cursor-pointer transition-all border ${
                          isMhSelected ? 'bg-[#0F4C5C] border-[#0F4C5C] text-[#F7F1E8]' : 'bg-white border-[#0F4C5C]/15 text-[#1F2937]'
                        }`}
                      >
                        {mhh}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-bold tracking-[0.06em] uppercase text-[#6B7280] mb-2">Most recent lab results (optional — you can upload these later)</label>
                <div className="border-2 border-dashed border-[#0F4C5C]/20 rounded-[10px] p-6 text-center bg-[#F7F1E8]/50 relative hover:border-[#0F4C5C] transition-all">
                  <input 
                    type="file" 
                    onChange={(e) => handleDirectValue("labFile", e.target.files[0])}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="text-[22px] mb-1.5">📎</div>
                  <div className="text-[14px] font-medium text-[#0F4C5C]">
                    {formData.labFile ? formData.labFile.name : "Upload PDF or JPEG"}
                  </div>
                  <div className="text-[12px] text-[#6B7280] mt-1">Or add manually on your dashboard after onboarding</div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: LIFESTYLE & GOALS ARCHITECTURE */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 style={{ fontFamily: "'Playfair Display', serif" }} className="text-[22px] font-semibold text-[#1F2937] mb-1.5">Your lifestyle & goals</h2>
                <p className="text-[13px] text-[#6B7280] leading-relaxed">This shapes your personalised protocol — delivered after your first week of tracking.</p>
              </div>

              <div>
                <label className="block text-[12px] font-bold tracking-[0.06em] uppercase text-[#6B7280] mb-2.5">Current diet <span className="text-[#DC2626]">*</span></label>
                <div className="flex flex-wrap gap-2">
                  {["Standard / no restrictions", "Gluten-free", "Dairy-free", "Soy-free", "Reduced sugar", "Plant-based / vegan", "Mediterranean"].map((dt) => {
                    const isDietSelected = formData.dietaryChanges.includes(dt) || (dt === "Reduced sugar" && formData.dietaryChanges.includes("Sugar-free / reduced sugar"));
                    return (
                      <div 
                        key={dt}
                        onClick={() => handleArrayToggle("dietaryChanges", dt)}
                        className={`px-4 py-2 text-[13px] rounded-lg cursor-pointer transition-all border ${
                          isDietSelected ? 'bg-[#0F4C5C] border-[#0F4C5C] text-[#F7F1E8]' : 'bg-white border-[#0F4C5C]/15 text-[#1F2937]'
                        }`}
                      >
                        {dt}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-bold tracking-[0.06em] uppercase text-[#6B7280] mb-2.5">Do you currently exercise?</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {["Yes, regularly (3+ times/week)", "Yes, occasionally (1–2 times/week)", "Rarely", "No"].map((ex) => {
                    const isExSelected = formData.exercise.includes(ex.split(' ')[0]);
                    return (
                      <div 
                        key={ex}
                        onClick={() => handleDirectValue("exercise", ex)}
                        className={`px-4 py-2 text-[13px] rounded-lg cursor-pointer transition-all border ${
                          isExSelected ? 'bg-[#0F4C5C] border-[#0F4C5C] text-[#F7F1E8]' : 'bg-white border-[#0F4C5C]/15 text-[#1F2937]'
                        }`}
                      >
                        {ex}
                      </div>
                    );
                  })}
                </div>
                <input 
                  type="text"
                  name="exerciseType"
                  value={formData.exerciseType}
                  onChange={handleChange}
                  placeholder="What types of exercise? (e.g. yoga, walking, swimming)"
                  className="w-full p-3 border border-[#0F4C5C]/20 rounded-lg text-[14px] outline-none text-[#1F2937] bg-white"
                />
              </div>

              <div>
                <label className="block text-[12px] font-bold tracking-[0.06em] uppercase text-[#6B7280] mb-2.5">Current stress level <span className="text-[#DC2626]">*</span></label>
                <div className="flex flex-wrap gap-2">
                  {["1 — Very low", "2 — Low", "3 — Moderate", "4 — High", "5 — Very high"].map((str) => {
                    const isStrSelected = formData.stressLevel.includes(str.split(' ')[2] || "Moderate");
                    return (
                      <div 
                        key={str}
                        onClick={() => handleDirectValue("stressLevel", `${str.split(' ')[0]} - ${str.split(' ')[2] || "Moderate"} stress`)}
                        className={`px-4 py-2 text-[13px] rounded-lg cursor-pointer transition-all border ${
                          isStrSelected ? 'bg-[#0F4C5C] border-[#0F4C5C] text-[#F7F1E8]' : 'bg-white border-[#0F4C5C]/15 text-[#1F2937]'
                        }`}
                      >
                        {str}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-bold tracking-[0.06em] uppercase text-[#6B7280] mb-2.5">What's the #1 thing you want help with right now? <span className="text-[#DC2626]">*</span></label>
                <div className="flex flex-col gap-2">
                  {[
                    "Understanding what's happening to my body",
                    "Improving my energy and reducing fatigue",
                    "Improving my sleep",
                    "Lifting my mood and reducing anxiety",
                    "Slowing or stopping the autoimmune attack on my thyroid",
                    "Having someone who understands and tracks my symptoms"
                  ].map((hlp) => {
                    const isHlpSelected = formData.topHelp.includes(hlp.substring(0, 15)) || (hlp.includes("autoimmune") && formData.topHelp.includes("Slowing or stopping"));
                    return (
                      <div 
                        key={hlp}
                        onClick={() => handleDirectValue("topHelp", hlp)}
                        className={`p-3.5 text-[13px] rounded-lg cursor-pointer transition-all border ${
                          isHlpSelected ? 'bg-[#0F4C5C] border-[#0F4C5C] text-[#F7F1E8] font-medium' : 'bg-white border-[#0F4C5C]/15 text-[#1F2937]'
                        }`}
                      >
                        {hlp}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-bold tracking-[0.06em] uppercase text-[#6B7280] mb-2">What are your top 2–3 goals for the next 3 months?</label>
                <textarea 
                  name="topGoals"
                  value={formData.topGoals}
                  onChange={handleChange}
                  rows="3"
                  className="w-full p-3 border border-[#0F4C5C]/20 rounded-lg text-[14px] outline-none text-[#1F2937] bg-white leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-[12px] font-bold tracking-[0.06em] uppercase text-[#6B7280] mb-2.5">Preferred daily check-in time <span className="text-[#DC2626]">*</span></label>
                <div className="flex flex-wrap gap-2">
                  {["Morning (7–9am)", "Midday (11am–1pm)", "Evening (5–7pm)", "No preference"].map((tm) => {
                    const isTmSelected = formData.commTime.startsWith(tm.substring(0, 5));
                    return (
                      <div 
                        key={tm}
                        onClick={() => handleDirectValue("commTime", tm)}
                        className={`px-4 py-2 text-[13px] rounded-lg cursor-pointer transition-all border ${
                          isTmSelected ? 'bg-[#0F4C5C] border-[#0F4C5C] text-[#F7F1E8]' : 'bg-white border-[#0F4C5C]/15 text-[#1F2937]'
                        }`}
                      >
                        {tm}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* INTEGRATED FIELD: Optional structural open-text context block */}
              <div>
                <label className="block text-[12px] font-bold tracking-[0.06em] uppercase text-[#6B7280] mb-2">
                  Is there anything else you'd like us to know? <span className="text-[11px] font-normal lowercase normal-case text-[#6B7280]">(optional)</span>
                </label>
                <textarea 
                  name="anythingElse"
                  value={formData.anythingElse}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Anything about your history, concerns, or how you'd like to be supported…"
                  className="w-full p-3 border border-[#0F4C5C]/20 rounded-lg text-[14px] outline-none text-[#1F2937] bg-white leading-relaxed"
                />
              </div>

              <div className="pt-4 border-t border-[#EDE7DB] space-y-4">
                <h3 className="text-[14px] font-bold uppercase tracking-wider text-[#0F4C5C]">Enrollment Verification Metrics</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-[#6B7280] mb-1">Full Name</label>
                    <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className="w-full p-2.5 border border-[#0F4C5C]/20 rounded-lg text-[13px] outline-none" required />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-[#6B7280] mb-1">Phone Number</label>
                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full p-2.5 border border-[#0F4C5C]/20 rounded-lg text-[13px] outline-none" placeholder="+91 ..." required />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-[#6B7280] mb-1">Date of Birth</label>
                    <input type="date" name="dob" value={formData.dob} onChange={handleChange} className="w-full p-2.5 border border-[#0F4C5C]/20 rounded-lg text-[13px] outline-none" required />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-[#6B7280] mb-1">Location (City, State)</label>
                    <input type="text" name="location" value={formData.location} onChange={handleChange} className="w-full p-2.5 border border-[#0F4C5C]/20 rounded-lg text-[13px] outline-none" placeholder="e.g. Hyderabad, TS" required />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-[#EDE7DB]">
            <button 
              type="button"
              onClick={prevStep}
              className={`px-5 py-2.5 text-[14px] font-semibold border border-[#0F4C5C] text-[#0F4C5C] rounded-lg transition-all hover:bg-[#E8F4F7] ${currentStep === 1 ? 'invisible' : 'visible'}`}
            >
              ← Back
            </button>
            <span className="text-[13px] text-[#6B7280]">Page {currentStep} of 3</span>
            {currentStep < totalSteps ? (
              <button 
                type="button"
                onClick={nextStep}
                className="px-6 py-2.5 text-[14px] font-semibold bg-[#0F4C5C] text-[#F7F1E8] rounded-lg shadow-sm hover:bg-[#1A6B7C] transition-all"
              >
                Continue →
              </button>
            ) : (
              <button 
                type="submit"
                disabled={isSubmitting}
                onClick={handleSubmit}
                className={`px-6 py-2.5 text-[14px] font-semibold text-[#F7F1E8] rounded-lg shadow-sm transition-all ${isSubmitting ? 'bg-[#6B7280] cursor-not-allowed' : 'bg-[#0F4C5C] hover:bg-[#1A6B7C]'}`}
              >
                {isSubmitting ? 'Submitting...' : 'Submit & Start Tracking →'}
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-[11px] text-[#6B7280] mt-5">🔒 HIPAA-compliant · Your data is encrypted and never sold</p>
      </div>
    </div>
  );
};

export default OnboardingPage;