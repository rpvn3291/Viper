import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import StartTimeStep from "../components/steps/StartTimeStep";
import PeakTimeStep from "../components/steps/PeakTimeStep";
import PreferenceStep from "../components/steps/PreferenceStep";
import AvailableHoursStep from "../components/steps/AvailableHoursStep";
import BlockedTimeStep from "../components/steps/BlockedTimeStep";

const Questionnaire = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isEditMode = location.state?.edit;

  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    startTime: 9,
    peakTime: 'morning',
    preference: 'hard-first',
    availableHours: 6,
    blockedTime: {
      start: 22,
      end: 7
    }
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const docRef = doc(db, 'users', currentUser.uid, 'profile', 'config');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();

          setFormData({
            startTime: data.startTime || 9,
            peakTime: data.peakTime || 'morning',
            preference: data.preference || 'hard-first',
            availableHours: data.availableHours || 6,
            blockedTime: {
              start: data.blockedTime?.start ?? 22,
              end: data.blockedTime?.end ?? 7
            }
          });

          if (!isEditMode) {
            navigate('/dashboard');
            return;
          }
        }

        setLoading(false);
      } catch (err) {
        console.error("Error loading profile:", err);
        setLoading(false);
      }
    };

    fetchProfile();
  }, [currentUser, isEditMode, navigate]);

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);
  
  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    try {
      const payload = {
        startTime: Number(formData.startTime),
        peakTime: formData.peakTime,
        preference: formData.preference,
        availableHours: Number(formData.availableHours),
        blockedTime: {
          start: Number(formData.blockedTime.start),
          end: Number(formData.blockedTime.end)
        }
      };

      await setDoc(doc(db, 'users', currentUser.uid, 'profile', 'config'), payload);

      navigate('/dashboard');
    } catch (err) {
      console.error("Error saving profile", err);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-on-surface-variant">Loading...</div>
    </div>
  );

  // Render the current step component directly - they now include their own Layout
  return (
    <>
      {step === 1 && (
        <StartTimeStep
          form={formData}
          setForm={setFormData}
          next={nextStep}
          back={null}
        />
      )}

      {step === 2 && (
        <PeakTimeStep
          form={formData}
          setForm={setFormData}
          next={nextStep}
          back={prevStep}
        />
      )}

      {step === 3 && (
        <PreferenceStep
          form={formData}
          setForm={setFormData}
          next={nextStep}
          back={prevStep}
        />
      )}

      {step === 4 && (
        <AvailableHoursStep
          form={formData}
          setForm={setFormData}
          next={nextStep}
          back={prevStep}
        />
      )}

      {step === 5 && (
        <BlockedTimeStep
          form={formData}
          setForm={setFormData}
          next={handleSubmit}
          back={prevStep}
        />
      )}
    </>
  );
};

export default Questionnaire;