import React, { createContext, useContext, useState, ReactNode } from 'react';

export type TestStatus = 'pending' | 'pass' | 'fail' | 'warning' | 'skipped';

export interface TestResult {
  status: TestStatus;
  score?: number;
  details?: string;
  data?: Record<string, unknown>;
}

export interface DiagnosticState {
  permissions: TestResult;
  deviceInfo: TestResult;
  display: TestResult;
  touch: TestResult;
  audio: TestResult;
  camera: TestResult;
  connectivity: TestResult;
  sensors: TestResult;
  battery: TestResult;
  buttons: TestResult;
  performance: TestResult;
  security: TestResult;
}

interface DiagnosticContextType {
  results: DiagnosticState;
  setResult: (key: keyof DiagnosticState, result: TestResult) => void;
  resetAll: () => void;
  getOverallScore: () => number;
}

const defaultResults: DiagnosticState = {
  permissions: { status: 'pending' },
  deviceInfo: { status: 'pending' },
  display: { status: 'pending' },
  touch: { status: 'pending' },
  audio: { status: 'pending' },
  camera: { status: 'pending' },
  connectivity: { status: 'pending' },
  sensors: { status: 'pending' },
  battery: { status: 'pending' },
  buttons: { status: 'pending' },
  performance: { status: 'pending' },
  security: { status: 'pending' },
};

const DiagnosticContext = createContext<DiagnosticContextType>({
  results: defaultResults,
  setResult: () => {},
  resetAll: () => {},
  getOverallScore: () => 0,
});

export const DiagnosticProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [results, setResults] = useState<DiagnosticState>(defaultResults);

  const setResult = (key: keyof DiagnosticState, result: TestResult) => {
    setResults(prev => ({ ...prev, [key]: result }));
  };

  const resetAll = () => setResults(defaultResults);

  const getOverallScore = () => {
    const entries = Object.values(results);
    const tested = entries.filter(r => r.status !== 'pending' && r.status !== 'skipped');
    if (tested.length === 0) return 0;
    const passed = tested.filter(r => r.status === 'pass').length;
    const warned = tested.filter(r => r.status === 'warning').length;
    return Math.round(((passed + warned * 0.5) / tested.length) * 100);
  };

  return (
    <DiagnosticContext.Provider value={{ results, setResult, resetAll, getOverallScore }}>
      {children}
    </DiagnosticContext.Provider>
  );
};

export const useDiagnostic = () => useContext(DiagnosticContext);
