
import React, { useState, useEffect, useLayoutEffect } from 'react';
import { db } from './services/db';
import { DocumentRecord, DocStatus, User } from './types';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import DocumentList from './components/DocumentList';
import DocumentDetails from './components/DocumentDetails';
import AdminPanel from './components/AdminPanel';
import Reports from './components/Reports';
import Auth from './components/Auth';
import Chatbot from './components/Chatbot';
import LandingPage from './components/LandingPage';
import DeveloperPortal from './components/DeveloperPortal';

type View = 'dashboard' | 'documents' | 'details' | 'admin' | 'reports' | 'developers';
type AuthMode = 'LOGIN' | 'REGISTER';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isOnLanding, setIsOnLanding] = useState(true);
  const [authMode, setAuthMode] = useState<AuthMode | null>(null);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [docs, setDocs] = useState<DocumentRecord[]>([]);
  const [isReady, setIsReady] = useState(false);

  useLayoutEffect(() => {
    const user = db.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      setIsOnLanding(false);
    }
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (currentUser) {
      refreshDocs();
    }
  }, [currentUser]);

  const refreshDocs = () => {
    setDocs(db.getDocuments());
  };

  const navigateToDoc = (id: string) => {
    setSelectedDocId(id);
    setCurrentView('details');
  };

  const handleBack = () => {
    setCurrentView('documents');
    setSelectedDocId(null);
    refreshDocs();
  };

  const handleLogout = () => {
    db.logout();
    setCurrentUser(null);
    setIsOnLanding(true);
    setAuthMode(null);
    setCurrentView('dashboard');
    setSelectedDocId(null);
    setDocs([]);
  };

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    setIsOnLanding(false);
    setAuthMode(null);
  };

  if (!isReady) return null;

  if (!currentUser && isOnLanding) {
    return (
      <LandingPage 
        onGetStarted={() => { setIsOnLanding(false); setAuthMode('REGISTER'); }}
        onLogin={() => { setIsOnLanding(false); setAuthMode('LOGIN'); }}
      />
    );
  }

  if (!currentUser && authMode) {
    return (
      <Auth 
        initialMode={authMode}
        onAuthSuccess={handleAuthSuccess} 
        onBackToHome={() => { setIsOnLanding(true); setAuthMode(null); }}
      />
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 relative">
      <Sidebar 
        currentView={currentView} 
        setView={(v: View) => {
          setCurrentView(v);
          setSelectedDocId(null);
        }} 
      />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar user={currentUser!} onLogout={handleLogout} />
        
        <main className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {currentView === 'dashboard' && <Dashboard docs={docs} onViewDocs={() => setCurrentView('documents')} onSelectDoc={navigateToDoc} />}
          
          {currentView === 'documents' && (
            <DocumentList 
              docs={docs} 
              onSelect={navigateToDoc} 
              onRefresh={refreshDocs} 
            />
          )}
          
          {currentView === 'details' && selectedDocId && (
            <DocumentDetails 
              docId={selectedDocId} 
              onBack={handleBack} 
              onNavigate={navigateToDoc}
            />
          )}
          
          {currentView === 'reports' && <Reports />}
          
          {currentView === 'admin' && <AdminPanel />}

          {currentView === 'developers' && <DeveloperPortal />}
        </main>
      </div>

      <Chatbot />
    </div>
  );
};

export default App;
