import React, { createContext, useContext, useState, useEffect } from 'react';
import { Journey, JourneyStage, RequirementItem, VaultDocument, ReadinessReport } from '../types/index.js';
import { api } from '../services/api.js';
import { useAuth } from './AuthContext.js';

interface JourneyContextType {
  activeJourney: Journey | null;
  stages: JourneyStage[];
  requirements: RequirementItem[];
  documents: VaultDocument[];
  readiness: ReadinessReport | null;
  loading: boolean;
  refreshJourney: () => Promise<void>;
  createJourney: (fromCountry: string, toCountry: string, purpose: string, notes?: string) => Promise<string>;
  updateStage: (stageNumber: number, status: JourneyStage['status']) => Promise<void>;
  updateRequirementStatus: (userRequirementId: string, status: RequirementItem['status'], notes?: string) => Promise<void>;
  deleteDocument: (docId: string) => Promise<void>;
}

const JourneyContext = createContext<JourneyContextType | undefined>(undefined);

export const JourneyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [activeJourney, setActiveJourney] = useState<Journey | null>(null);
  const [stages, setStages] = useState<JourneyStage[]>([]);
  const [requirements, setRequirements] = useState<RequirementItem[]>([]);
  const [documents, setDocuments] = useState<VaultDocument[]>([]);
  const [readiness, setReadiness] = useState<ReadinessReport | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchActiveJourney = async () => {
    if (!user) {
      setActiveJourney(null);
      setStages([]);
      setRequirements([]);
      setDocuments([]);
      setReadiness(null);
      return;
    }

    try {
      setLoading(true);
      const res = await api.get<{
        journey: Journey | null;
        stages: JourneyStage[];
        requirements: RequirementItem[];
        documents: VaultDocument[];
        readiness: ReadinessReport | null;
      }>('/journeys/active');

      setActiveJourney(res.journey);
      setStages(res.stages || []);
      setRequirements(res.requirements || []);
      setDocuments(res.documents || []);
      setReadiness(res.readiness || null);
    } catch (err) {
      console.error('Failed to fetch active journey:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveJourney();
  }, [user]);

  const createJourney = async (fromCountry: string, toCountry: string, purpose: string, notes?: string): Promise<string> => {
    const res = await api.post<{ journeyId: string; readiness: ReadinessReport }>('/journeys', {
      fromCountry,
      toCountry,
      purpose,
      notes,
    });
    await fetchActiveJourney();
    return res.journeyId;
  };

  const updateStage = async (stageNumber: number, status: JourneyStage['status']) => {
    if (!activeJourney) return;
    await api.put(`/journeys/${activeJourney.id}/stages/${stageNumber}`, { status });
    await fetchActiveJourney();
  };

  const updateRequirementStatus = async (userRequirementId: string, status: RequirementItem['status'], notes?: string) => {
    await api.put(`/journeys/requirements/${userRequirementId}`, { status, notes });
    await fetchActiveJourney();
  };

  const deleteDocument = async (docId: string) => {
    await api.delete(`/documents/${docId}`);
    await fetchActiveJourney();
  };

  return (
    <JourneyContext.Provider
      value={{
        activeJourney,
        stages,
        requirements,
        documents,
        readiness,
        loading,
        refreshJourney: fetchActiveJourney,
        createJourney,
        updateStage,
        updateRequirementStatus,
        deleteDocument,
      }}
    >
      {children}
    </JourneyContext.Provider>
  );
};

export const useJourney = (): JourneyContextType => {
  const context = useContext(JourneyContext);
  if (!context) {
    throw new Error('useJourney must be used within a JourneyProvider');
  }
  return context;
};
